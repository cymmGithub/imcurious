import { create } from 'zustand'
import { RENDER_SCENARIOS } from '@/components/rendering/scenarios'
import type { RenderSnapshot } from '@/components/rendering/types'

export type RaceStatus = 'idle' | 'running' | 'finished'

type RenderingState = {
	activeScenarioId: string | null
	stepIndex: number
	raceStatus: RaceStatus
	// Incremented on every (re)start so the race lanes can restart their
	// animations by keying off it.
	raceRunId: number
}

type RenderingActions = {
	runScenario: (id: string) => void
	stepForward: () => void
	stepBack: () => void
	setStep: (i: number) => void
	reset: () => void
	startRace: () => void
	finishRace: () => void
}

export type RenderingStore = RenderingState & RenderingActions

export const useRenderingStore = create<RenderingStore>()((set, get) => ({
	activeScenarioId: null,
	stepIndex: 0,
	raceStatus: 'idle',
	raceRunId: 0,

	runScenario: (id) => {
		const scenario = RENDER_SCENARIOS[id]
		if (!scenario) return
		set({ activeScenarioId: id, stepIndex: 0 })
	},

	stepForward: () => {
		const { activeScenarioId, stepIndex } = get()
		if (!activeScenarioId) return
		const scenario = RENDER_SCENARIOS[activeScenarioId]
		if (!scenario) return
		if (stepIndex < scenario.steps.length - 1) {
			set({ stepIndex: stepIndex + 1 })
		}
	},

	stepBack: () => {
		const { activeScenarioId, stepIndex } = get()
		if (!activeScenarioId) return
		if (stepIndex > 0) {
			set({ stepIndex: stepIndex - 1 })
		}
	},

	setStep: (i) => set({ stepIndex: Math.max(0, i) }),

	reset: () => set({ activeScenarioId: null, stepIndex: 0 }),

	startRace: () =>
		set((s) => ({ raceStatus: 'running', raceRunId: s.raceRunId + 1 })),

	finishRace: () => set({ raceStatus: 'finished' }),
}))

export function selectCurrentRenderSnapshot(
	s: RenderingStore,
): RenderSnapshot | null {
	if (!s.activeScenarioId) return null
	const scenario = RENDER_SCENARIOS[s.activeScenarioId]
	if (!scenario) return null
	return scenario.steps[s.stepIndex] ?? null
}
