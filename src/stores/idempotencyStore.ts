import { create } from 'zustand'
import { SCENARIOS } from '@/components/idempotency/scenarios'
import type { Snapshot } from '@/components/idempotency/types'

type IdempotencyState = {
	activeScenarioId: string | null
	stepIndex: number
}

type IdempotencyActions = {
	runScenario: (id: string) => void
	stepForward: () => void
	stepBack: () => void
	setStep: (i: number) => void
	reset: () => void
}

export type IdempotencyStore = IdempotencyState & IdempotencyActions

export const useIdempotencyStore = create<IdempotencyStore>()((set, get) => ({
	activeScenarioId: null,
	stepIndex: 0,

	runScenario: (id) => {
		const scenario = SCENARIOS[id]
		if (!scenario) return
		set({ activeScenarioId: id, stepIndex: 0 })
	},

	stepForward: () => {
		const { activeScenarioId, stepIndex } = get()
		if (!activeScenarioId) return
		const scenario = SCENARIOS[activeScenarioId]
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
}))

export function selectCurrentSnapshot(s: IdempotencyStore): Snapshot | null {
	if (!s.activeScenarioId) return null
	const scenario = SCENARIOS[s.activeScenarioId]
	if (!scenario) return null
	return scenario.steps[s.stepIndex] ?? null
}
