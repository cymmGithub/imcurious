import { describe, expect, it } from 'vitest'
import { RENDER_SCENARIOS, RACE_LANE_SCENARIOS } from '../scenarios'
import { csr } from '../scenarios/csr'
import { ssr } from '../scenarios/ssr'
import { hydration } from '../scenarios/hydration'
import { isr } from '../scenarios/isr'
import { streaming } from '../scenarios/streaming'
import { rsc } from '../scenarios/rsc'
import { ppr } from '../scenarios/ppr'
import { BLOCK_IDS, type RenderScenario, type RenderSnapshot } from '../types'

function maxPacketSize(scenario: RenderScenario, kind: string): number | null {
	let max: number | null = null
	for (const step of scenario.steps) {
		for (const p of step.packets) {
			if (p.kind !== kind) continue
			if (max === null || p.size > max) max = p.size
		}
	}
	return max
}

function assertSnapshotIsComplete(snap: RenderSnapshot, label: string) {
	expect(
		snap.description,
		`${label}: description must be non-empty`,
	).toBeTruthy()
	expect(Array.isArray(snap.packets), `${label}: packets must be array`).toBe(
		true,
	)
	expect(snap.browser?.blocks, `${label}: blocks must be present`).toBeDefined()
	for (const id of BLOCK_IDS) {
		expect(
			snap.browser.blocks[id],
			`${label}: block '${id}' must be present`,
		).toBeDefined()
	}
	expect(snap.cdn, `${label}: cdn state must be present`).toBeDefined()
	expect(snap.server, `${label}: server state must be present`).toBeDefined()
	expect(snap.timeline, `${label}: timeline must be present`).toBeDefined()
}

function assertPacketsLegal(snap: RenderSnapshot, label: string) {
	for (const p of snap.packets) {
		expect(
			p.position,
			`${label}: packet ${p.id} position must be 0..1`,
		).toBeGreaterThanOrEqual(0)
		expect(
			p.position,
			`${label}: packet ${p.id} position must be 0..1`,
		).toBeLessThanOrEqual(1)
		expect(
			p.size,
			`${label}: packet ${p.id} size must be 0..1`,
		).toBeGreaterThan(0)
		expect(
			p.size,
			`${label}: packet ${p.id} size must be 0..1`,
		).toBeLessThanOrEqual(1)
		expect(
			p.from,
			`${label}: packet ${p.id} must not travel to itself`,
		).not.toBe(p.to)
	}
}

function assertTimelineMonotonicAcrossSteps(scenario: RenderScenario) {
	// Once a metric is reached, later steps must not unset it or move it.
	const metrics = ['ttfb', 'fcp', 'interactive'] as const
	for (const metric of metrics) {
		let reached: number | null = null
		scenario.steps.forEach((step, i) => {
			const value = step.timeline[metric]
			if (reached !== null) {
				expect(
					value,
					`scenario ${scenario.id} step ${i}: ${metric} was ${reached}, then changed to ${value} — metrics must stay once reached`,
				).toBe(reached)
			} else if (value !== null) {
				reached = value
			}
		})
	}
}

function assertMetricOrderWithinStep(snap: RenderSnapshot, label: string) {
	const { ttfb, fcp, interactive } = snap.timeline
	if (fcp !== null) {
		expect(ttfb, `${label}: fcp reached before ttfb`).not.toBeNull()
		expect(fcp, `${label}: fcp must be >= ttfb`).toBeGreaterThanOrEqual(ttfb!)
	}
	if (interactive !== null) {
		expect(fcp, `${label}: interactive reached before fcp`).not.toBeNull()
		expect(
			interactive,
			`${label}: interactive must be >= fcp`,
		).toBeGreaterThanOrEqual(fcp!)
	}
}

describe('rendering scenarios — registry', () => {
	it('every scenario is registered under its declared id', () => {
		for (const [registryId, scenario] of Object.entries(RENDER_SCENARIOS)) {
			expect(scenario.id, `registry mismatch for ${registryId}`).toBe(
				registryId,
			)
		}
	})

	it('every snapshot in every scenario is structurally complete and legal', () => {
		for (const scenario of Object.values(RENDER_SCENARIOS)) {
			scenario.steps.forEach((snap, i) => {
				assertSnapshotIsComplete(snap, `${scenario.id} step ${i}`)
				assertPacketsLegal(snap, `${scenario.id} step ${i}`)
				assertMetricOrderWithinStep(snap, `${scenario.id} step ${i}`)
			})
		}
	})

	it('timeline metrics never move or reset once reached', () => {
		for (const scenario of Object.values(RENDER_SCENARIOS)) {
			assertTimelineMonotonicAcrossSteps(scenario)
		}
	})

	it('every race lane scenario ends with all three metrics reached', () => {
		for (const [lane, scenario] of Object.entries(RACE_LANE_SCENARIOS)) {
			const final = scenario.steps[scenario.steps.length - 1]
			expect(final.timeline.ttfb, `${lane}: final ttfb`).not.toBeNull()
			expect(final.timeline.fcp, `${lane}: final fcp`).not.toBeNull()
			expect(
				final.timeline.interactive,
				`${lane}: final interactive`,
			).not.toBeNull()
		}
	})
})

describe('packet size ordering — the wire tells the story', () => {
	it("csr's js-bundle is the single largest packet in the post", () => {
		const csrBundle = maxPacketSize(csr, 'js-bundle')
		expect(csrBundle).not.toBeNull()
		for (const scenario of Object.values(RENDER_SCENARIOS)) {
			for (const step of scenario.steps) {
				for (const p of step.packets) {
					if (scenario.id === csr.id && p.kind === 'js-bundle') continue
					expect(
						p.size,
						`${scenario.id}: packet ${p.id} (${p.kind}) must not outweigh CSR's bundle`,
					).toBeLessThanOrEqual(csrBundle!)
				}
			}
		}
	})

	it("rsc's js-bundle is smaller than ssr's", () => {
		const rscBundle = maxPacketSize(rsc, 'js-bundle')
		const ssrBundle = maxPacketSize(ssr, 'js-bundle')
		expect(rscBundle).not.toBeNull()
		expect(ssrBundle).not.toBeNull()
		expect(rscBundle!).toBeLessThan(ssrBundle!)
	})

	it('html-shell packets are smaller than html-full packets everywhere', () => {
		let maxShell = 0
		let minFull = Infinity
		for (const scenario of Object.values(RENDER_SCENARIOS)) {
			for (const step of scenario.steps) {
				for (const p of step.packets) {
					if (p.kind === 'html-shell') maxShell = Math.max(maxShell, p.size)
					if (p.kind === 'html-full') minFull = Math.min(minFull, p.size)
				}
			}
		}
		expect(maxShell).toBeGreaterThan(0)
		expect(minFull).toBeLessThan(Infinity)
		expect(maxShell).toBeLessThan(minFull)
	})
})

describe('csr — blank then pop', () => {
	it('all blocks stay empty until the final step, then all are hydrated', () => {
		const steps = csr.steps
		for (let i = 0; i < steps.length - 1; i++) {
			for (const id of BLOCK_IDS) {
				expect(
					steps[i].browser.blocks[id].paint,
					`csr step ${i}: block ${id} must still be empty`,
				).toBe('empty')
			}
		}
		const final = steps[steps.length - 1]
		for (const id of BLOCK_IDS) {
			expect(
				final.browser.blocks[id].paint,
				`csr final step: block ${id} must be hydrated`,
			).toBe('hydrated')
		}
	})

	it('never touches the CDN', () => {
		for (const step of csr.steps) {
			expect(step.cdn.entry).toBe('none')
		}
	})
})

describe('ssr + hydration — painted is not interactive', () => {
	it('ssr has a step where every block is painted and none hydrated', () => {
		const inert = ssr.steps.some((step) =>
			BLOCK_IDS.every((id) => step.browser.blocks[id].paint === 'painted'),
		)
		expect(inert, 'ssr must contain the uncanny-valley step').toBe(true)
	})

	it('hydration starts fully painted-not-hydrated and ends fully hydrated', () => {
		const first = hydration.steps[0]
		for (const id of BLOCK_IDS) {
			expect(first.browser.blocks[id].paint).toBe('painted')
		}
		const final = hydration.steps[hydration.steps.length - 1]
		for (const id of BLOCK_IDS) {
			expect(final.browser.blocks[id].paint).toBe('hydrated')
		}
	})

	it('hydration contains the mismatch beat (a block falls back mid-walk)', () => {
		const hasMismatch = hydration.steps.some((step) =>
			BLOCK_IDS.some((id) => step.browser.blocks[id].paint === 'fallback'),
		)
		expect(hasMismatch).toBe(true)
	})
})

describe('isr — stale-while-revalidate', () => {
	it('cdn entry is never none after first generation', () => {
		let generated = false
		isr.steps.forEach((step, i) => {
			if (step.cdn.entry !== 'none') generated = true
			if (generated) {
				expect(
					step.cdn.entry,
					`isr step ${i}: entry must never disappear once generated`,
				).not.toBe('none')
			}
		})
		expect(generated, 'isr must generate an entry at some point').toBe(true)
	})

	it('serves stale to the browser while the server regenerates in the background', () => {
		const staleServe = isr.steps.some(
			(step) =>
				step.cdn.entry === 'stale' &&
				step.server.activity === 'regenerating' &&
				step.packets.some(
					(p) => p.from === 'cdn' && p.to === 'browser' && p.kind !== 'request',
				),
		)
		expect(staleServe).toBe(true)
	})
})

describe('streaming — reordered, not reduced', () => {
	it('fills a later-in-layout block before an earlier one', () => {
		const outOfOrder = streaming.steps.some((step) => {
			const blocks = step.browser.blocks
			return BLOCK_IDS.some((later, li) =>
				BLOCK_IDS.some(
					(earlier, ei) =>
						ei < li &&
						blocks[later].paint === 'painted' &&
						blocks[earlier].paint === 'fallback',
				),
			)
		})
		expect(outOfOrder).toBe(true)
	})

	it('contains a selective-hydration step (a painted block hydrates ahead of earlier painted ones)', () => {
		const selective = streaming.steps.some((step) => {
			const blocks = step.browser.blocks
			return BLOCK_IDS.some((later, li) =>
				BLOCK_IDS.some(
					(earlier, ei) =>
						ei < li &&
						blocks[later].paint === 'hydrated' &&
						blocks[earlier].paint === 'painted',
				),
			)
		})
		expect(selective).toBe(true)
	})
})

describe('rsc — origin colors and the payload packet', () => {
	it('every block carries an origin in every step', () => {
		for (const step of rsc.steps) {
			for (const id of BLOCK_IDS) {
				expect(
					step.browser.blocks[id].origin,
					`rsc: block ${id} must have an origin`,
				).toBeDefined()
			}
		}
	})

	it('the soft navigation ships an rsc-payload, not html', () => {
		const final = rsc.steps[rsc.steps.length - 1]
		expect(final.packets.some((p) => p.kind === 'rsc-payload')).toBe(true)
		expect(final.packets.some((p) => p.kind.startsWith('html'))).toBe(false)
	})
})

describe('ppr — static frame, streamed holes, one response', () => {
	it('serves the shell from the cdn and the chunks from the server', () => {
		const shellFromCdn = ppr.steps.some((step) =>
			step.packets.some(
				(p) =>
					p.kind === 'html-shell' && p.from === 'cdn' && p.to === 'browser',
			),
		)
		const chunksFromServer = ppr.steps.some((step) =>
			step.packets.some(
				(p) =>
					p.kind === 'html-chunk' && p.from === 'server' && p.to === 'browser',
			),
		)
		expect(shellFromCdn).toBe(true)
		expect(chunksFromServer).toBe(true)
	})

	it('the browser never issues a second request after the first', () => {
		// "Same response" invariant: at most one request packet in the whole
		// scenario originates from the browser.
		let browserRequests = 0
		const seen = new Set<string>()
		for (const step of ppr.steps) {
			for (const p of step.packets) {
				if (p.kind === 'request' && p.from === 'browser' && !seen.has(p.id)) {
					seen.add(p.id)
					browserRequests++
				}
			}
		}
		expect(browserRequests).toBeLessThanOrEqual(1)
	})

	it('static blocks paint before server holes fill', () => {
		const framePainted = ppr.steps.findIndex((step) =>
			BLOCK_IDS.some(
				(id) =>
					step.browser.blocks[id].origin === 'static' &&
					step.browser.blocks[id].paint === 'painted',
			),
		)
		const holesPainted = ppr.steps.findIndex((step) =>
			BLOCK_IDS.every(
				(id) =>
					step.browser.blocks[id].origin !== 'server' ||
					step.browser.blocks[id].paint === 'painted' ||
					step.browser.blocks[id].paint === 'hydrated',
			),
		)
		expect(framePainted).toBeGreaterThanOrEqual(0)
		expect(
			framePainted,
			'static frame must paint strictly before all holes are filled',
		).toBeLessThan(holesPainted === -1 ? ppr.steps.length : holesPainted)
	})
})

describe('race lanes — expected relative ordering', () => {
	it('ssg/isr have the fastest fcp; csr ties fastest ttfb but slowest fcp; ssr beats csr on fcp but pays on ttfb', () => {
		const final = (id: keyof typeof RACE_LANE_SCENARIOS) => {
			const steps = RACE_LANE_SCENARIOS[id].steps
			return steps[steps.length - 1].timeline
		}
		const csrT = final('csr')
		const ssrT = final('ssr')
		const ssgT = final('ssg')
		const isrT = final('isr')

		// SSG/ISR fastest TTFB + FCP
		expect(ssgT.fcp!).toBeLessThan(ssrT.fcp!)
		expect(ssgT.fcp!).toBeLessThan(csrT.fcp!)
		expect(isrT.fcp!).toBeLessThan(ssrT.fcp!)
		expect(ssgT.ttfb!).toBeLessThanOrEqual(csrT.ttfb!)

		// CSR: fast TTFB, slowest FCP
		expect(csrT.ttfb!).toBeLessThan(ssrT.ttfb!)
		expect(csrT.fcp!).toBeGreaterThan(ssrT.fcp!)

		// FCP ≈ Interactive for CSR (they pop together at the end)
		expect(csrT.interactive! - csrT.fcp!).toBeLessThan(0.1)
	})
})
