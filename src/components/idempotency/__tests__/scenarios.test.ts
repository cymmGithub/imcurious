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
