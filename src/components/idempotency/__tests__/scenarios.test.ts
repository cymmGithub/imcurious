import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../scenarios'
import { postDoubleCharge } from '../scenarios/postDoubleCharge'
import type { Scenario, Snapshot } from '../types'

function assertSnapshotIsComplete(snap: Snapshot, label: string) {
	expect(
		snap.description,
		`${label}: description must be non-empty`,
	).toBeTruthy()
	expect(snap.resource, `${label}: resource must be present`).toBeDefined()
	expect(snap.wire, `${label}: wire must be present`).toBeDefined()
	expect(Array.isArray(snap.packets), `${label}: packets must be array`).toBe(
		true,
	)
	expect(Array.isArray(snap.log), `${label}: log must be array`).toBe(true)
}

function assertWireBreakLegal(snap: Snapshot, label: string) {
	if (snap.wire.healthy) return
	expect(
		snap.wire.breakAt,
		`${label}: broken wire must have a breakAt position`,
	).toBeGreaterThanOrEqual(0)
	expect(
		snap.wire.breakAt,
		`${label}: broken wire breakAt must be <= 1`,
	).toBeLessThanOrEqual(1)
}

function assertPacketPositionsLegal(snap: Snapshot, label: string) {
	for (const p of snap.packets) {
		expect(
			p.position,
			`${label}: packet ${p.id} position must be 0..1`,
		).toBeGreaterThanOrEqual(0)
		expect(
			p.position,
			`${label}: packet ${p.id} position must be 0..1`,
		).toBeLessThanOrEqual(1)
	}
}

function assertResponseLostFollowsBrokenWire(scenario: Scenario) {
	const steps = scenario.steps
	for (let i = 0; i < steps.length; i++) {
		const step = steps[i]
		for (const entry of step.log) {
			if (entry.clientOutcome !== 'response-lost') continue
			// Find the most recent broken-wire snapshot at or before this step
			let foundBroken = false
			for (let j = i; j >= 0; j--) {
				if (!steps[j].wire.healthy) {
					foundBroken = true
					break
				}
			}
			expect(
				foundBroken,
				`scenario ${scenario.id} step ${i}: log entry has response-lost but no broken-wire snapshot precedes or matches`,
			).toBe(true)
		}
	}
}

function assertLogMonotonic(scenario: Scenario) {
	for (let i = 1; i < scenario.steps.length; i++) {
		const prev = scenario.steps[i - 1].log.length
		const curr = scenario.steps[i].log.length
		expect(
			curr,
			`scenario ${scenario.id} step ${i}: log shrank from ${prev} to ${curr} entries — a step should never drop history`,
		).toBeGreaterThanOrEqual(prev)
	}
}

function assertAttemptShapeConsistent(scenario: Scenario) {
	// For each attempt number, all instances across steps must share method, path, and body.
	// Catches "I edited attempt N's request in a later step by accident."
	const seen = new Map<
		number,
		{
			method: string
			path: string
			body: string | undefined
			firstStep: number
		}
	>()
	for (let i = 0; i < scenario.steps.length; i++) {
		for (const entry of scenario.steps[i].log) {
			const shape = {
				method: entry.request.method,
				path: entry.request.path,
				body: entry.request.body,
			}
			const existing = seen.get(entry.attempt)
			if (!existing) {
				seen.set(entry.attempt, { ...shape, firstStep: i })
				continue
			}
			expect(
				shape,
				`scenario ${scenario.id} step ${i}: attempt ${entry.attempt} request shape differs from step ${existing.firstStep}`,
			).toEqual({
				method: existing.method,
				path: existing.path,
				body: existing.body,
			})
		}
	}
}

function assertLostPacketImpliesBrokenWire(snap: Snapshot, label: string) {
	const hasLost = snap.packets.some((p) => p.fate === 'lost')
	if (!hasLost) return
	expect(
		snap.wire.healthy,
		`${label}: snapshot has a lost packet but wire.healthy is true — lost packets can only happen on a broken wire`,
	).toBe(false)
}

function assertLostResponseHasLogEntry(snap: Snapshot, label: string) {
	const hasLostResponse = snap.packets.some(
		(p) => p.kind === 'response' && p.fate === 'lost',
	)
	if (!hasLostResponse) return
	const hasLogEntry = snap.log.some((e) => e.clientOutcome === 'response-lost')
	expect(
		hasLogEntry,
		`${label}: snapshot has a lost response packet but no log entry reports clientOutcome 'response-lost'`,
	).toBe(true)
}

function assertIdempotencyKeyStable(scenario: Scenario) {
	// Within a scenario, the same attempt number must carry the same idempotency
	// key whenever the field is present. A retry by definition reuses the key.
	const keys = new Map<number, { key: string; firstStep: number }>()
	for (let i = 0; i < scenario.steps.length; i++) {
		for (const entry of scenario.steps[i].log) {
			if (!entry.idempotencyKey) continue
			const existing = keys.get(entry.attempt)
			if (!existing) {
				keys.set(entry.attempt, { key: entry.idempotencyKey, firstStep: i })
				continue
			}
			expect(
				entry.idempotencyKey,
				`scenario ${scenario.id} step ${i}: attempt ${entry.attempt} key drifted from step ${existing.firstStep} — retries must reuse the same key`,
			).toBe(existing.key)
		}
	}
}

describe('idempotency scenarios — registry', () => {
	it('every imported scenario is registered under its declared id', () => {
		for (const [registryId, scenario] of Object.entries(SCENARIOS)) {
			expect(scenario.id, `registry mismatch for ${registryId}`).toBe(
				registryId,
			)
		}
	})

	it('every scenario has at least one snapshot', () => {
		for (const scenario of Object.values(SCENARIOS)) {
			expect(
				scenario.steps.length,
				`scenario ${scenario.id} must have at least one step`,
			).toBeGreaterThan(0)
		}
	})

	it('every snapshot in every scenario is structurally complete', () => {
		for (const scenario of Object.values(SCENARIOS)) {
			scenario.steps.forEach((snap, i) => {
				assertSnapshotIsComplete(snap, `${scenario.id} step ${i}`)
				assertWireBreakLegal(snap, `${scenario.id} step ${i}`)
				assertPacketPositionsLegal(snap, `${scenario.id} step ${i}`)
			})
		}
	})

	it('response-lost log entries are preceded by a broken-wire snapshot', () => {
		for (const scenario of Object.values(SCENARIOS)) {
			assertResponseLostFollowsBrokenWire(scenario)
		}
	})

	it('log history never shrinks across consecutive steps', () => {
		for (const scenario of Object.values(SCENARIOS)) {
			assertLogMonotonic(scenario)
		}
	})

	it('the same attempt number carries the same request shape across all steps', () => {
		for (const scenario of Object.values(SCENARIOS)) {
			assertAttemptShapeConsistent(scenario)
		}
	})

	it('lost packets only appear in steps where the wire is broken', () => {
		for (const scenario of Object.values(SCENARIOS)) {
			scenario.steps.forEach((snap, i) => {
				assertLostPacketImpliesBrokenWire(snap, `${scenario.id} step ${i}`)
			})
		}
	})

	it('a lost response packet is reflected in the log within the same step', () => {
		for (const scenario of Object.values(SCENARIOS)) {
			scenario.steps.forEach((snap, i) => {
				assertLostResponseHasLogEntry(snap, `${scenario.id} step ${i}`)
			})
		}
	})

	it('idempotency keys are stable across retries (same attempt → same key)', () => {
		for (const scenario of Object.values(SCENARIOS)) {
			assertIdempotencyKeyStable(scenario)
		}
	})
})

describe('post-double-charge — canonical scenario', () => {
	it('has 6 steps', () => {
		expect(postDoubleCharge.steps.length).toBe(6)
	})

	it('starts with no resource', () => {
		expect(postDoubleCharge.steps[0].resource.kind).toBe('none')
	})

	it('has a broken wire in step 3 (response lost moment)', () => {
		expect(postDoubleCharge.steps[2].wire.healthy).toBe(false)
	})

	it('shows a collection of two accounts by step 5 (the "two Alices")', () => {
		const step5Resource = postDoubleCharge.steps[4].resource
		expect(step5Resource.kind).toBe('collection')
		if (step5Resource.kind === 'collection') {
			expect(step5Resource.items.length).toBe(2)
			// Both should be Alice
			expect(step5Resource.items.every((a) => a.owner === 'Alice')).toBe(true)
		}
	})

	it('final step shows successful client outcome despite server-side duplicate', () => {
		const final = postDoubleCharge.steps[5]
		expect(final.log.length).toBe(2)
		expect(final.log[0].clientOutcome).toBe('response-lost')
		expect(final.log[1].clientOutcome).toBe('success')
		expect(final.log[1].statusCode).toBe(201)
		// Resource is still a collection with two items (the pedagogical gap)
		expect(final.resource.kind).toBe('collection')
	})
})
