// src/stores/eventLoopStore.ts
import { create } from 'zustand'
import {
	createInitialState,
	nextState,
	addTask as addTaskPure,
	resolveFetch,
	startStepping,
	stepForward as stepForwardFn,
	stepBack as stepBackFn,
	type SimulationState,
	type TaskType,
} from '@/lib/simulation'
import { SCENARIOS } from '@/lib/scenarios'

type EventLoopActions = {
	tick: (dt: number) => void
	togglePause: () => void
	addTask: (type: TaskType, delay?: number) => void
	reset: () => void
	runScenario: (scenarioId: string) => void
	stepForward: () => void
	stepBack: () => void
}

export type EventLoopStore = SimulationState & EventLoopActions

export const useEventLoopStore = create<EventLoopStore>()((set, get) => ({
	...createInitialState(),

	tick: (dt) => set((s) => nextState(s, dt)),

	togglePause: () => set((s) => ({ isPaused: !s.isPaused })),

	addTask: (type, delay) => set((s) => addTaskPure(s, type, delay)),

	reset: () => set(createInitialState()),

	runScenario: (scenarioId) => {
		const scenario = SCENARIOS[scenarioId]
		if (!scenario) return

		set((prev) => {
			let s: SimulationState = prev
			if (s.isPaused) s = { ...s, isPaused: false }

			if (scenario.syncOps && scenario.syncOps.length > 0) {
				s = startStepping(s, scenario.syncOps, scenarioId)
			}

			return s
		})
	},

	stepForward: () => {
		const prev = get()
		set((s) => stepForwardFn(s))

		// Fire real fetches when stepping completes
		if (prev.cursorState === 'STEPPING_SYNC' && prev.activeScenarioId) {
			const next = get()
			if (next.cursorState === 'ORBITING') {
				const scenario = SCENARIOS[prev.activeScenarioId]
				if (scenario?.asyncSteps) {
					for (const step of scenario.asyncSteps) {
						if (step.type === 'fetch') {
							fetch('/api/starwars')
								.then((res) => res.json())
								.then((data: { name: string }) => {
									set((s) => resolveFetch(s, `fetch → "${data.name}"`))
								})
						}
					}
				}
			}
		}
	},

	stepBack: () => set((s) => stepBackFn(s)),
}))
