import { describe, expect, it } from 'vitest'
import { fitScale } from '../RaceMode'

describe('fitScale — race card must never overflow the sticky viz band', () => {
	it('keeps natural size when the card fits', () => {
		expect(fitScale(800, 600, 448, 330)).toBe(1)
	})

	it('shrinks to fit a band shorter than the card', () => {
		// The regression case: 375×667 phone — the 40vh band leaves ~243px of
		// height for a ~330px-tall card, which used to clip the race button
		// at the top and the ISR lane at the bottom.
		const scale = fitScale(351, 243, 351, 330)
		expect(scale).toBeLessThan(1)
		expect(330 * scale).toBeLessThanOrEqual(243)
	})

	it('shrinks to fit a band narrower than the card', () => {
		const scale = fitScale(300, 600, 448, 330)
		expect(448 * scale).toBeLessThanOrEqual(300)
	})

	it('uses the tighter of the two constraints', () => {
		expect(fitScale(224, 165, 448, 330)).toBe(0.5)
		expect(fitScale(224, 330, 448, 330)).toBe(0.5)
		expect(fitScale(448, 165, 448, 330)).toBe(0.5)
	})

	it('never scales up past natural size', () => {
		expect(fitScale(10000, 10000, 448, 330)).toBe(1)
	})

	it('tolerates degenerate measurements', () => {
		expect(fitScale(351, 243, 0, 0)).toBe(1)
		expect(fitScale(351, 243, -1, 330)).toBe(1)
	})
})
