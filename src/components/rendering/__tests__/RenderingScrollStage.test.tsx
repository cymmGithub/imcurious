// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRenderingStore } from '@/stores/renderingStore'

// Control the scroll-detected stage directly; the hook's DOM measurement is
// covered by useSectionStage.test.ts and the Playwright walkthrough.
let mockStage = 1
vi.mock('@/hooks/useSectionStage', () => ({
	useSectionStage: () => ({
		contentRef: { current: null },
		activeStage: mockStage,
	}),
}))

import { RenderingScrollStage } from '../RenderingScrollStage'
import { stubMatchMedia } from './testUtils'

beforeEach(() => {
	stubMatchMedia()
	useRenderingStore.setState({
		activeScenarioId: null,
		stepIndex: 0,
		raceStatus: 'idle',
		raceRunId: 0,
	})
	mockStage = 1
})

afterEach(() => {
	cleanup()
})

describe('RenderingScrollStage scenario release', () => {
	it('keeps a scenario alive within its own section', () => {
		mockStage = 2
		const { rerender } = render(
			<RenderingScrollStage>
				<div />
			</RenderingScrollStage>,
		)
		useRenderingStore.getState().runScenario('csr-blank-then-pop')
		rerender(
			<RenderingScrollStage>
				<div />
			</RenderingScrollStage>,
		)
		expect(useRenderingStore.getState().activeScenarioId).toBe(
			'csr-blank-then-pop',
		)
	})

	it('does not reset a scenario started while the stage briefly disagrees', () => {
		// The stage stays where it is; only a stage *transition* may release.
		mockStage = 1
		const { rerender } = render(
			<RenderingScrollStage>
				<div />
			</RenderingScrollStage>,
		)
		useRenderingStore.getState().runScenario('csr-blank-then-pop')
		rerender(
			<RenderingScrollStage>
				<div />
			</RenderingScrollStage>,
		)
		expect(useRenderingStore.getState().activeScenarioId).toBe(
			'csr-blank-then-pop',
		)
	})

	it('releases the scenario when scrolling to a section it does not own', () => {
		mockStage = 2
		const { rerender } = render(
			<RenderingScrollStage>
				<div />
			</RenderingScrollStage>,
		)
		useRenderingStore.getState().runScenario('csr-blank-then-pop')

		mockStage = 3
		rerender(
			<RenderingScrollStage>
				<div />
			</RenderingScrollStage>,
		)
		expect(useRenderingStore.getState().activeScenarioId).toBeNull()
	})

	it('releases a stale scenario when reaching the recap stage', () => {
		mockStage = 10
		const { rerender } = render(
			<RenderingScrollStage>
				<div />
			</RenderingScrollStage>,
		)
		useRenderingStore.getState().runScenario('ppr-static-frame-streamed-holes')

		mockStage = 11
		rerender(
			<RenderingScrollStage>
				<div />
			</RenderingScrollStage>,
		)
		expect(useRenderingStore.getState().activeScenarioId).toBeNull()
	})
})
