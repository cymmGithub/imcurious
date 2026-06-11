import { describe, expect, it } from 'vitest'
import { resolveStage, type SectionOffset } from '../useSectionStage'

// Mirrors the rendering post: 11 sections of very different heights.
const SECTIONS: SectionOffset[] = [
	{ stage: 1, top: 0 },
	{ stage: 2, top: 1039 },
	{ stage: 3, top: 2379 },
	{ stage: 4, top: 3549 },
	{ stage: 5, top: 5184 },
	{ stage: 6, top: 6482 },
	{ stage: 7, top: 8118 },
	{ stage: 8, top: 9199 },
	{ stage: 9, top: 10745 },
	{ stage: 10, top: 12377 },
	{ stage: 11, top: 13628 },
]

describe('resolveStage', () => {
	it('returns the first stage before any section top is crossed', () => {
		expect(resolveStage(SECTIONS, 500)).toBe(1)
	})

	it('activates a section exactly when the line reaches its top', () => {
		expect(resolveStage(SECTIONS, 1038)).toBe(1)
		expect(resolveStage(SECTIONS, 1039)).toBe(2)
	})

	it('keeps a long section active until the next top is crossed', () => {
		// Section 4 (hydration) spans 3549..5183 — much longer than uniform
		// division would allot it.
		expect(resolveStage(SECTIONS, 3549)).toBe(4)
		expect(resolveStage(SECTIONS, 5183)).toBe(4)
		expect(resolveStage(SECTIONS, 5184)).toBe(5)
	})

	it('activates the race section while reading it, not a section later', () => {
		// The uniform-progress bug: stage 7 needed scroll progress beyond the
		// race section's own extent. Section-based resolution activates it
		// anywhere inside 8118..9198.
		expect(resolveStage(SECTIONS, 8200)).toBe(7)
		expect(resolveStage(SECTIONS, 9198)).toBe(7)
	})

	it('returns the last stage past the final section top', () => {
		expect(resolveStage(SECTIONS, 99999)).toBe(11)
	})

	it('falls back to stage 1 with no sections', () => {
		expect(resolveStage([], 500)).toBe(1)
	})
})
