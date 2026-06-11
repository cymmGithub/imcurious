// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RenderStepList } from '../RenderStepList'
import { RenderingStageViz } from '../RenderingStageViz'
import { RENDER_SCENARIOS } from '../scenarios'
import { useRenderingStore } from '@/stores/renderingStore'
import { stubMatchMedia } from './testUtils'

// jsdom lacks matchMedia (framer-motion's useReducedMotion needs it).
beforeEach(() => {
	stubMatchMedia()
	useRenderingStore.setState({
		activeScenarioId: null,
		stepIndex: 0,
		raceStatus: 'idle',
		raceRunId: 0,
	})
})

afterEach(() => {
	cleanup()
	vi.useRealTimers()
})

const CSR = RENDER_SCENARIOS['csr-blank-then-pop']

describe('RenderStepList first-run affordance', () => {
	it('activates the scenario from the step control', () => {
		render(<RenderStepList scenarioId="csr-blank-then-pop" />)
		const run = screen.getByRole('button', { name: /^Run CSR/ })

		fireEvent.click(run)
		expect(screen.getByRole('button', { name: 'Next step' })).toBeTruthy()
		expect(screen.queryByRole('button', { name: /^Run CSR/ })).toBeNull()
	})

	it('dims steps after the first before activation', () => {
		render(<RenderStepList scenarioId="csr-blank-then-pop" />)
		const items = screen.getAllByRole('listitem')
		expect(items).toHaveLength(CSR.steps.length)
		expect(items[0].style.opacity).toBe('1')
		for (const item of items.slice(1)) {
			expect(item.style.opacity).toBe('0.35')
		}
	})
})

describe('RenderStepList scenario-priority display', () => {
	it('drives the viz on run even when the scroll stage disagrees', () => {
		// activeStage 1 owns no scenario — under the old guard, running CSR
		// from here produced no visible change at all.
		const { container } = render(
			<>
				<RenderingStageViz activeStage={1} />
				<RenderStepList scenarioId="csr-blank-then-pop" />
			</>,
		)
		fireEvent.click(screen.getByRole('button', { name: /^Run CSR/ }))
		const liveRegion = container.querySelector('[aria-live="polite"]')
		expect(liveRegion?.textContent).toBe(CSR.steps[0].description)
	})
})

describe('RenderStepList auto-play', () => {
	it('advances on a timer and pauses on manual interaction', () => {
		vi.useFakeTimers()
		render(<RenderStepList scenarioId="csr-blank-then-pop" />)

		fireEvent.click(screen.getByRole('button', { name: 'Auto-play steps' }))
		expect(useRenderingStore.getState().activeScenarioId).toBe(
			'csr-blank-then-pop',
		)
		expect(useRenderingStore.getState().stepIndex).toBe(0)

		act(() => {
			vi.advanceTimersByTime(2600)
		})
		expect(useRenderingStore.getState().stepIndex).toBe(1)

		// Manual interaction pauses the timer.
		fireEvent.click(screen.getByRole('button', { name: 'Previous step' }))
		expect(useRenderingStore.getState().stepIndex).toBe(0)
		expect(screen.getByRole('button', { name: 'Auto-play steps' })).toBeTruthy()

		act(() => {
			vi.advanceTimersByTime(10000)
		})
		expect(useRenderingStore.getState().stepIndex).toBe(0)
	})

	it('stops at the last step', () => {
		vi.useFakeTimers()
		render(<RenderStepList scenarioId="csr-blank-then-pop" />)
		fireEvent.click(screen.getByRole('button', { name: 'Auto-play steps' }))

		act(() => {
			vi.advanceTimersByTime(2600 * CSR.steps.length)
		})
		expect(useRenderingStore.getState().stepIndex).toBe(CSR.steps.length - 1)
		// At the last step the auto-play toggle is gone and replay is offered.
		expect(screen.queryByRole('button', { name: /auto-play/i })).toBeNull()
		expect(screen.getByRole('button', { name: 'Replay scenario' })).toBeTruthy()
	})
})
