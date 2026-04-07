import { describe, it, expect } from 'vitest'
import {
	createInitialState,
	nextState,
	addTask,
	shouldStopAtPitStop,
	buildSyncSnapshots,
	startStepping,
	stepForward,
	stepBack,
	resolveFetch,
	PIT_STOPS,
	EXECUTION_DURATION,
	STOP_PAUSE,
	type SimulationState,
	type SyncFrameOp,
	type Task,
} from '../simulation'
import { SCENARIOS } from '../scenarios'

describe('createInitialState', () => {
	it('returns valid initial state', () => {
		const state = createInitialState()
		expect(state.cursorPosition).toBe(0)
		expect(state.cursorState).toBe('ORBITING')
		expect(state.taskQueue).toEqual([])
		expect(state.microtaskQueue).toEqual([])
		expect(state.rAfCallbacks).toEqual([])
		expect(state.pendingWebAPIs).toEqual([])
		expect(state.isPaused).toBe(false)
		expect(state.currentTask).toBeNull()
		expect(state.executionTimer).toBe(0)
	})
})

describe('nextState', () => {
	it('advances cursor position when orbiting', () => {
		const state = createInitialState()
		const next = nextState(state, 100)
		expect(next.cursorPosition).toBeGreaterThan(0)
	})

	it('does NOT advance cursor when paused', () => {
		const state = { ...createInitialState(), isPaused: true }
		const next = nextState(state, 100)
		expect(next.cursorPosition).toBe(0)
	})

	it('wraps cursor position from 1.0 back to 0.0', () => {
		const state = { ...createInitialState(), cursorPosition: 0.99 }
		const next = nextState(state, 200)
		expect(next.cursorPosition).toBeLessThan(0.99)
		expect(next.cursorPosition).toBeGreaterThanOrEqual(0)
	})

	it('stops at task queue (~0) when queue is non-empty', () => {
		const state: SimulationState = {
			...createInitialState(),
			cursorPosition: 0.995,
			taskQueue: [
				{
					id: '1',
					type: 'setTimeout',
					label: 'setTimeout()',
					color: '#ffbe0b',
				},
			],
		}
		const next = nextState(state, 200)
		expect(next.cursorState).toBe('STOPPED_AT_TASK_QUEUE')
	})

	it('drives through task queue when queue is empty', () => {
		const state: SimulationState = {
			...createInitialState(),
			cursorPosition: 0.995,
		}
		const next = nextState(state, 200)
		expect(next.cursorState).toBe('ORBITING')
		expect(next.cursorPosition).toBeGreaterThanOrEqual(0)
		expect(next.cursorPosition).toBeLessThan(0.99)
	})

	it('stops at microtask queue (~0.333) when queue is non-empty', () => {
		const state: SimulationState = {
			...createInitialState(),
			cursorPosition: PIT_STOPS.microtask - 0.005,
			microtaskQueue: [
				{ id: '1', type: 'fetch', label: 'fetch()', color: '#ffffff' },
			],
		}
		const next = nextState(state, 100)
		expect(next.cursorState).toBe('STOPPED_AT_MICROTASK_QUEUE')
		expect(next.cursorPosition).toBeCloseTo(PIT_STOPS.microtask, 2)
	})

	it('transitions from STOPPED_AT_MICROTASK_QUEUE to EXECUTING_MICROTASK', () => {
		const task = {
			id: '1',
			type: 'fetch' as const,
			label: 'fetch()',
			color: '#06d6a0',
		}
		const state: SimulationState = {
			...createInitialState(),
			cursorPosition: PIT_STOPS.microtask,
			cursorState: 'STOPPED_AT_MICROTASK_QUEUE',
			microtaskQueue: [task],
			executionTimer: 0,
		}
		// Advance enough to pass STOP_PAUSE
		const next = nextState(state, 250)
		expect(next.cursorState).toBe('EXECUTING_MICROTASK')
		expect(next.currentTask).toEqual(task)
		expect(next.microtaskQueue).toEqual([])
	})

	it('drains ALL microtasks before leaving (stays if more in queue)', () => {
		const task1 = {
			id: '1',
			type: 'fetch' as const,
			label: 'fetch1()',
			color: '#06d6a0',
		}
		const task2 = {
			id: '2',
			type: 'fetch' as const,
			label: 'fetch2()',
			color: '#06d6a0',
		}
		const state: SimulationState = {
			...createInitialState(),
			cursorPosition: PIT_STOPS.microtask,
			cursorState: 'EXECUTING_MICROTASK',
			currentTask: task1,
			microtaskQueue: [task2],
			executionTimer: 1, // about to finish
		}
		const next = nextState(state, 10)
		// Should dequeue next microtask, not go to ORBITING
		expect(next.cursorState).toBe('EXECUTING_MICROTASK')
		expect(next.currentTask).toEqual(task2)
		expect(next.microtaskQueue).toEqual([])
	})

	it('executes only ONE task from task queue per lap', () => {
		const task1 = {
			id: '1',
			type: 'setTimeout' as const,
			label: 'cb1()',
			color: '#ffbe0b',
		}
		const task2 = {
			id: '2',
			type: 'setTimeout' as const,
			label: 'cb2()',
			color: '#ffbe0b',
		}
		const state: SimulationState = {
			...createInitialState(),
			cursorPosition: PIT_STOPS.task,
			cursorState: 'EXECUTING_TASK',
			currentTask: task1,
			taskQueue: [task2],
			executionTimer: 1, // about to finish
		}
		const next = nextState(state, 10)
		// Should go to ORBITING, leaving task2 in queue
		expect(next.cursorState).toBe('ORBITING')
		expect(next.taskQueue).toEqual([task2])
		expect(next.currentTask).toBeNull()
	})

	it('skips render stop when rAfCallbacks is empty', () => {
		const state: SimulationState = {
			...createInitialState(),
			cursorPosition: PIT_STOPS.render - 0.005,
			rAfCallbacks: [],
		}
		const next = nextState(state, 100)
		expect(next.cursorState).toBe('ORBITING')
		expect(next.cursorPosition).toBeGreaterThan(PIT_STOPS.render)
	})

	it('stops at render pit stop when rAfCallbacks is non-empty', () => {
		const state: SimulationState = {
			...createInitialState(),
			cursorPosition: PIT_STOPS.render - 0.005,
			rAfCallbacks: [
				{ id: '1', type: 'rAF' as const, label: 'rAF', color: '#ffffff' },
			],
		}
		const next = nextState(state, 100)
		expect(next.cursorState).toBe('STOPPED_AT_RENDER')
		expect(next.cursorPosition).toBeCloseTo(PIT_STOPS.render, 2)
	})

	it('skips render when task queue is non-empty', () => {
		const state: SimulationState = {
			...createInitialState(),
			cursorPosition: PIT_STOPS.render - 0.005,
			rAfCallbacks: [
				{ id: '1', type: 'rAF' as const, label: 'rAF', color: '#ffffff' },
			],
			taskQueue: [
				{
					id: '2',
					type: 'setTimeout',
					label: 'setTimeout()',
					color: '#ffbe0b',
				},
			],
		}
		const next = nextState(state, 100)
		expect(next.cursorState).toBe('ORBITING')
		expect(next.cursorPosition).toBeGreaterThan(PIT_STOPS.render)
	})

	it('skips render when microtask queue is non-empty', () => {
		const state: SimulationState = {
			...createInitialState(),
			cursorPosition: PIT_STOPS.render - 0.005,
			rAfCallbacks: [
				{ id: '1', type: 'rAF' as const, label: 'rAF', color: '#ffffff' },
			],
			microtaskQueue: [
				{ id: '2', type: 'fetch', label: 'fetch()', color: '#ffffff' },
			],
		}
		const next = nextState(state, 100)
		expect(next.cursorState).toBe('ORBITING')
		expect(next.cursorPosition).toBeGreaterThan(PIT_STOPS.render)
	})

	it('after executing a task, cursor reaches microtask station before render', () => {
		// Start with cursor at task position (0), just finished executing a task
		// with microtasks waiting — cursor should reach microtask (1/3) before render (2/3)
		let state: SimulationState = {
			...createInitialState(),
			cursorPosition: PIT_STOPS.task,
			cursorState: 'EXECUTING_TASK',
			currentTask: {
				id: '1',
				type: 'setTimeout',
				label: 'cb()',
				color: '#888888',
			},
			taskQueue: [],
			microtaskQueue: [
				{ id: '2', type: 'fetch', label: 'fetch()', color: '#ffffff' },
			],
			executionTimer: 1, // about to finish
		}
		// Finish task execution → ORBITING
		state = nextState(state, 10)
		expect(state.cursorState).toBe('ORBITING')
		// Advance enough to reach microtask pit stop at 1/3
		for (let i = 0; i < 5000; i++) {
			state = nextState(state, 1)
			if (state.cursorState !== 'ORBITING') break
		}
		expect(state.cursorState).toBe('STOPPED_AT_MICROTASK_QUEUE')
	})

	it('moves setTimeout to taskQueue when delay elapses', () => {
		const state = addTask(createInitialState(), 'setTimeout', 100)
		expect(state.pendingWebAPIs).toHaveLength(1)
		// Advance time past delay
		const next = nextState(state, 150)
		expect(next.pendingWebAPIs).toHaveLength(0)
		expect(next.taskQueue).toHaveLength(1)
	})

	it('moves fetch callback to microtaskQueue when delay elapses', () => {
		const state = addTask(createInitialState(), 'fetch', 100)
		expect(state.pendingWebAPIs).toHaveLength(1)
		const next = nextState(state, 150)
		expect(next.pendingWebAPIs).toHaveLength(0)
		expect(next.microtaskQueue).toHaveLength(1)
	})

	it('setTimeout task in queue carries callbackLabel from scenario', () => {
		const scenario = SCENARIOS['microtask-priority']
		let state = startStepping(
			createInitialState(),
			scenario.syncOps!,
			'microtask-priority',
		)
		// Step through all sync ops to register web APIs
		for (let i = 0; i < scenario.syncOps!.length; i++) {
			state = stepForward(state)
		}
		// setTimeout should be pending with callbackLabel
		const pending = state.pendingWebAPIs.find((a) => a.type === 'setTimeout')
		expect(pending).toBeDefined()
		expect(pending!.label).toBe('setTimeout(2000ms)')
		expect(pending!.callbackLabel).toBe('console.log("Task")')

		// Advance past the 2000ms delay to move it into the task queue
		state = nextState(state, 2100)
		const task = state.taskQueue.find((t) => t.type === 'setTimeout')
		expect(task).toBeDefined()
		expect(task!.callbackLabel).toBe('console.log("Task")')
	})

	it('fetch task in microtask queue carries callbackLabel from scenario', () => {
		const scenario = SCENARIOS['microtask-priority']
		let state = startStepping(
			createInitialState(),
			scenario.syncOps!,
			'microtask-priority',
		)
		for (let i = 0; i < scenario.syncOps!.length; i++) {
			state = stepForward(state)
		}
		// Resolve fetch and advance to move it into microtask queue
		state = resolveFetch(state, 'fetch → "Luke"')
		state = nextState(state, 16)
		const microtask = state.microtaskQueue.find((t) => t.type === 'fetch')
		expect(microtask).toBeDefined()
		expect(microtask!.callbackLabel).toBe('res.json()')
		// Should have a chained microtask for the second .then()
		expect(microtask!.chainedMicrotask).toBeDefined()
		expect(microtask!.chainedMicrotask!.callbackLabel).toBe(
			'console.log(data.name)',
		)
	})
})

describe('addTask', () => {
	it('with setTimeout adds a PendingWebAPI entry', () => {
		const state = addTask(createInitialState(), 'setTimeout', 500)
		expect(state.pendingWebAPIs).toHaveLength(1)
		expect(state.pendingWebAPIs[0].type).toBe('setTimeout')
		expect(state.pendingWebAPIs[0].remainingDelay).toBe(500)
	})

	it('with fetch adds a PendingWebAPI entry', () => {
		const state = addTask(createInitialState(), 'fetch', 1000)
		expect(state.pendingWebAPIs).toHaveLength(1)
		expect(state.pendingWebAPIs[0].type).toBe('fetch')
		expect(state.pendingWebAPIs[0].remainingDelay).toBe(1000)
	})
})

describe('shouldStopAtPitStop', () => {
	it('returns true when cursor crosses microtask threshold with non-empty queue', () => {
		const result = shouldStopAtPitStop(
			PIT_STOPS.microtask - 0.01,
			PIT_STOPS.microtask,
			PIT_STOPS.microtask + 0.01,
			[{ id: '1', type: 'fetch', label: 'fetch()', color: '#06d6a0' }],
		)
		expect(result).toBe(true)
	})

	it('returns false when queue is empty', () => {
		const result = shouldStopAtPitStop(
			PIT_STOPS.microtask - 0.01,
			PIT_STOPS.microtask,
			PIT_STOPS.microtask + 0.01,
			[],
		)
		expect(result).toBe(false)
	})

	it('returns false when cursor has not crossed threshold', () => {
		const result = shouldStopAtPitStop(0.2, PIT_STOPS.microtask, 0.22, [
			{ id: '1', type: 'fetch', label: 'fetch()', color: '#06d6a0' },
		])
		expect(result).toBe(false)
	})

	it('returns true when cursor crosses render pit stop threshold with non-empty queue', () => {
		const result = shouldStopAtPitStop(
			PIT_STOPS.render - 0.01,
			PIT_STOPS.render,
			PIT_STOPS.render + 0.01,
			[
				{
					id: '1',
					type: 'rAF',
					label: 'rAF()',
					color: '#ffffff',
				},
			],
		)
		expect(result).toBe(true)
	})
})

describe('stepping', () => {
	// sync-callstack ops: push welcome, push greet, pop, push console.log, pop, pop
	const syncOps: SyncFrameOp[] = [
		{ action: 'push', name: 'welcome()', line: 1 },
		{ action: 'push', name: 'greet()', line: 2 },
		{ action: 'pop', line: 3 },
		{ action: 'push', name: 'console.log("Hello, world!")', line: 4 },
		{ action: 'pop', line: 5 },
		{ action: 'pop', line: 6 },
	]

	it('buildSyncSnapshots produces correct stack at each step (after applying op)', () => {
		const { snapshots } = buildSyncSnapshots(syncOps, 0)
		expect(snapshots).toHaveLength(6)

		// snapshot[0]: after push welcome
		expect(snapshots[0].callStackFrames).toEqual(['welcome()'])
		expect(snapshots[0].activeLine).toBe(1)

		// snapshot[1]: after push greet
		expect(snapshots[1].callStackFrames).toEqual(['welcome()', 'greet()'])
		expect(snapshots[1].activeLine).toBe(2)

		// snapshot[2]: after pop greet
		expect(snapshots[2].callStackFrames).toEqual(['welcome()'])
		expect(snapshots[2].activeLine).toBe(3)

		// snapshot[3]: after push console.log
		expect(snapshots[3].callStackFrames).toEqual([
			'welcome()',
			'console.log("Hello, world!")',
		])
		expect(snapshots[3].activeLine).toBe(4)

		// snapshot[4]: after pop console.log
		expect(snapshots[4].callStackFrames).toEqual(['welcome()'])
		expect(snapshots[4].activeLine).toBe(5)

		// snapshot[5]: after pop welcome — stack empty
		expect(snapshots[5].callStackFrames).toEqual([])
		expect(snapshots[5].activeLine).toBe(6)
	})

	it('buildSyncSnapshots with no asyncEffects has empty pendingWebAPIs throughout', () => {
		const { snapshots, finalWebAPIs } = buildSyncSnapshots(syncOps, 0)
		for (const snap of snapshots) {
			expect(snap.pendingWebAPIs).toEqual([])
		}
		expect(finalWebAPIs).toEqual([])
	})

	it('startStepping sets cursorState to STEPPING_SYNC and applies first snapshot (after op)', () => {
		const initial = createInitialState()
		const state = startStepping(initial, syncOps, 'test-scenario')

		expect(state.cursorState).toBe('STEPPING_SYNC')
		expect(state.syncFrameIndex).toBe(0)
		expect(state.callStackFrames).toEqual(['welcome()'])
		expect(state.activeLine).toBe(1)
		expect(state.syncStepSnapshots).toHaveLength(6)
		expect(state.activeScenarioId).toBe('test-scenario')
		expect(state.executionTimer).toBe(0)
		expect(state.pendingWebAPIs).toEqual([])
		expect(state.steppingFinalWebAPIs).toEqual([])
	})

	it('stepForward increments index and applies next snapshot', () => {
		const initial = createInitialState()
		const stepping = startStepping(initial, syncOps, 'test-scenario')
		const next = stepForward(stepping)

		expect(next.syncFrameIndex).toBe(1)
		expect(next.callStackFrames).toEqual(['welcome()', 'greet()'])
		expect(next.activeLine).toBe(2)
		expect(next.cursorState).toBe('STEPPING_SYNC')
	})

	it('stepForward at last index transitions to ORBITING and clears sync fields', () => {
		const initial = createInitialState()
		const stepping = startStepping(initial, syncOps, 'test-scenario')

		// Advance to the last index (5)
		let state = stepping
		for (let i = 0; i < syncOps.length; i++) {
			state = stepForward(state)
		}

		expect(state.cursorState).toBe('ORBITING')
		expect(state.callStackFrames).toEqual([])
		expect(state.syncFrameOps).toEqual([])
		expect(state.syncFrameIndex).toBe(0)
		expect(state.syncStepSnapshots).toEqual([])
		expect(state.executionTimer).toBe(0)
		expect(state.activeLine).toBeNull()
		expect(state.activeScenarioId).toBeNull()
	})

	it('stepBack decrements index and restores previous snapshot', () => {
		const initial = createInitialState()
		const stepping = startStepping(initial, syncOps, 'test-scenario')

		// Step forward twice to index 2
		const at2 = stepForward(stepForward(stepping))
		expect(at2.syncFrameIndex).toBe(2)

		// Step back to index 1
		const back = stepBack(at2)
		expect(back.syncFrameIndex).toBe(1)
		expect(back.callStackFrames).toEqual(['welcome()', 'greet()'])
		expect(back.activeLine).toBe(2)
	})

	it('stepBack at index 0 is a no-op', () => {
		const initial = createInitialState()
		const stepping = startStepping(initial, syncOps, 'test-scenario')

		expect(stepping.syncFrameIndex).toBe(0)
		const result = stepBack(stepping)
		expect(result).toBe(stepping) // same reference
	})

	it('nextState with STEPPING_SYNC returns state unchanged (no timer advancement, no tickWebAPIs)', () => {
		const initial = createInitialState()
		const stepping = startStepping(initial, syncOps, 'test-scenario')

		// Manually add a pending web API to verify it's not ticked during stepping
		const steppingWithAPI: SimulationState = {
			...stepping,
			pendingWebAPIs: [
				{
					id: '99',
					type: 'setTimeout',
					label: 'setTimeout(100ms)',
					delay: 100,
					color: '#888888',
					remainingDelay: 100,
				},
			],
		}

		const next = nextState(steppingWithAPI, 150)

		// State should be completely unchanged (same reference behavior: no mutations)
		expect(next).toBe(steppingWithAPI)
		expect(next.cursorState).toBe('STEPPING_SYNC')
		expect(next.pendingWebAPIs).toHaveLength(1)
		expect(next.pendingWebAPIs[0].remainingDelay).toBe(100)
	})
})

describe('stepping with asyncEffect', () => {
	// Simulates the render-step scenario: rAF (async), setTimeout (async), fetch (async)
	const asyncOps: SyncFrameOp[] = [
		{ action: 'push', name: 'rAF()', line: 0, asyncEffect: { type: 'rAF' } },
		{ action: 'pop', line: 2 },
		{
			action: 'push',
			name: 'setTimeout()',
			line: 4,
			asyncEffect: { type: 'setTimeout', delay: 0 },
		},
		{ action: 'pop', line: 4 },
		{
			action: 'push',
			name: 'fetch()',
			line: 6,
			asyncEffect: { type: 'fetch' },
		},
		{ action: 'pop', line: 7 },
	]

	it('buildSyncSnapshots tracks web APIs at correct steps (after applying op)', () => {
		const { snapshots, finalWebAPIs, nextId } = buildSyncSnapshots(asyncOps, 0)
		expect(snapshots).toHaveLength(6)

		// Step 0: after rAF push (has asyncEffect) — web API appears immediately
		expect(snapshots[0].pendingWebAPIs).toHaveLength(1)
		expect(snapshots[0].pendingWebAPIs[0].type).toBe('rAF')

		// Step 1: after rAF pop — web API persists
		expect(snapshots[1].pendingWebAPIs).toHaveLength(1)

		// Step 2: after setTimeout push (has asyncEffect) — both web APIs visible
		expect(snapshots[2].pendingWebAPIs).toHaveLength(2)
		expect(snapshots[2].pendingWebAPIs[1].type).toBe('setTimeout')
		expect(snapshots[2].pendingWebAPIs[1].remainingDelay).toBe(0)

		// Step 3: after setTimeout pop — both web APIs persist
		expect(snapshots[3].pendingWebAPIs).toHaveLength(2)

		// Step 4: after fetch push (has asyncEffect) — all three web APIs visible
		expect(snapshots[4].pendingWebAPIs).toHaveLength(3)
		expect(snapshots[4].pendingWebAPIs[2].type).toBe('fetch')
		expect(snapshots[4].pendingWebAPIs[2].remainingDelay).toBe(999999)

		// Step 5: after fetch pop — all three still visible
		expect(snapshots[5].pendingWebAPIs).toHaveLength(3)

		// Final state includes all three web APIs
		expect(finalWebAPIs).toHaveLength(3)
		expect(finalWebAPIs[0].type).toBe('rAF')
		expect(finalWebAPIs[1].type).toBe('setTimeout')
		expect(finalWebAPIs[2].type).toBe('fetch')

		// nextId should be incremented by 3 (one for each asyncEffect)
		expect(nextId).toBe(3)
	})

	it('startStepping with asyncEffect ops starts with first snapshot state', () => {
		const initial = createInitialState()
		const state = startStepping(initial, asyncOps, 'render-step')

		// First op is rAF push (has asyncEffect) — web API appears immediately
		expect(state.pendingWebAPIs).toHaveLength(1)
		expect(state.pendingWebAPIs[0].type).toBe('rAF')
		expect(state.callStackFrames).toEqual(['rAF()'])
		expect(state.steppingFinalWebAPIs).toHaveLength(3)
		expect(state.nextId).toBe(3)
	})

	it('stepForward reveals web APIs at the correct step', () => {
		const initial = createInitialState()
		let state = startStepping(initial, asyncOps, 'render-step')

		// Step 0 (initial): after rAF push — rAF web API appears
		expect(state.pendingWebAPIs).toHaveLength(1)
		expect(state.pendingWebAPIs[0].type).toBe('rAF')

		// Step 0 → 1: after rAF pop — rAF web API persists
		state = stepForward(state)
		expect(state.pendingWebAPIs).toHaveLength(1)

		// Step 1 → 2: after setTimeout push (has asyncEffect) — both web APIs visible
		state = stepForward(state)
		expect(state.pendingWebAPIs).toHaveLength(2)
		expect(state.pendingWebAPIs[1].type).toBe('setTimeout')

		// Step 2 → 3: after setTimeout pop — both web APIs persist
		state = stepForward(state)
		expect(state.pendingWebAPIs).toHaveLength(2)

		// Step 3 → 4: after fetch push (has asyncEffect) — all three web APIs visible
		state = stepForward(state)
		expect(state.pendingWebAPIs).toHaveLength(3)
		expect(state.pendingWebAPIs[2].type).toBe('fetch')
	})

	it('stepBack removes web APIs that were not yet registered', () => {
		const initial = createInitialState()
		let state = startStepping(initial, asyncOps, 'render-step')

		// Advance to step 3 (after setTimeout pop — both web APIs visible)
		state = stepForward(state) // 1: after rAF pop
		state = stepForward(state) // 2: after setTimeout push — both web APIs visible
		state = stepForward(state) // 3: after setTimeout pop — both persist
		expect(state.pendingWebAPIs).toHaveLength(2)

		// Step back to step 2 (after setTimeout push — both still visible)
		state = stepBack(state)
		expect(state.pendingWebAPIs).toHaveLength(2)

		// Step back to step 1 (after rAF pop — only rAF web API)
		state = stepBack(state)
		expect(state.pendingWebAPIs).toHaveLength(1)
		expect(state.pendingWebAPIs[0].type).toBe('rAF')

		// Step back to step 0 (after rAF push — rAF web API still present)
		state = stepBack(state)
		expect(state.pendingWebAPIs).toHaveLength(1)
		expect(state.pendingWebAPIs[0].type).toBe('rAF')
	})

	it('final stepForward transitions to ORBITING with accumulated web APIs', () => {
		const initial = createInitialState()
		let state = startStepping(initial, asyncOps, 'render-step')

		// Step through all ops
		for (let i = 0; i < asyncOps.length; i++) {
			state = stepForward(state)
		}

		expect(state.cursorState).toBe('ORBITING')
		expect(state.pendingWebAPIs).toHaveLength(3)
		expect(state.pendingWebAPIs[0].type).toBe('rAF')
		expect(state.pendingWebAPIs[1].type).toBe('setTimeout')
		expect(state.pendingWebAPIs[2].type).toBe('fetch')
		expect(state.steppingFinalWebAPIs).toEqual([])
		// rAfCallbacks is reset to [] when transitioning to ORBITING
		expect(state.rAfCallbacks).toEqual([])
	})

	it('buildSyncSnapshots generates unique IDs starting from startId', () => {
		const { snapshots, nextId } = buildSyncSnapshots(asyncOps, 42)
		// First async effect at step 0 (after rAF push) gets id "42"
		expect(snapshots[0].pendingWebAPIs[0].id).toBe('42')
		// Second async effect at step 2 (after setTimeout push) gets id "43"
		expect(snapshots[2].pendingWebAPIs[1].id).toBe('43')
		// Third async effect at step 4 (after fetch push) gets id "44"
		expect(snapshots[4].pendingWebAPIs[2].id).toBe('44')
		expect(nextId).toBe(45)
	})
})

describe('scenario step count alignment', () => {
	// Each scenario's syncOps count must match the number of prose steps in the MDX.
	// These tests guard against drift between code steps and explanatory text.

	it('sync-callstack has 6 ops (push/push/pop/push/pop/pop)', () => {
		const scenario = SCENARIOS['sync-callstack']
		expect(scenario.syncOps).toHaveLength(6)
		const { snapshots } = buildSyncSnapshots(scenario.syncOps!, 0)
		expect(snapshots).toHaveLength(6)

		// Step 0: push welcome → stack has welcome
		expect(snapshots[0].callStackFrames).toEqual(['welcome()'])
		// Step 1: push greet → stack has both
		expect(snapshots[1].callStackFrames).toEqual([
			'welcome()',
			'greet("world")',
		])
		// Step 2: pop greet → back to welcome
		expect(snapshots[2].callStackFrames).toEqual(['welcome()'])
		// Step 3: push console.log
		expect(snapshots[3].callStackFrames).toEqual([
			'welcome()',
			'console.log("Hello, world!")',
		])
		// Step 4: pop console.log
		expect(snapshots[4].callStackFrames).toEqual(['welcome()'])
		// Step 5: pop welcome → empty
		expect(snapshots[5].callStackFrames).toEqual([])
	})

	it('webapi-settimeout has 6 ops (3 push/pop pairs)', () => {
		const scenario = SCENARIOS['webapi-settimeout']
		expect(scenario.syncOps).toHaveLength(6)
		const { snapshots } = buildSyncSnapshots(scenario.syncOps!, 0)

		// Step 0: push console.log("Start")
		expect(snapshots[0].callStackFrames).toEqual(['console.log("Start")'])
		// Step 1: pop → empty
		expect(snapshots[1].callStackFrames).toEqual([])
		// Step 2: push setTimeout → web API appears
		expect(snapshots[2].callStackFrames).toEqual(['setTimeout()'])
		expect(snapshots[2].pendingWebAPIs).toHaveLength(1)
		// Step 3: pop setTimeout → empty, web API persists
		expect(snapshots[3].callStackFrames).toEqual([])
		expect(snapshots[3].pendingWebAPIs).toHaveLength(1)
		// Step 4: push console.log("End")
		expect(snapshots[4].callStackFrames).toEqual(['console.log("End")'])
		// Step 5: pop → empty
		expect(snapshots[5].callStackFrames).toEqual([])
	})

	it('task-queue-ordering has 6 ops (3 push/pop pairs)', () => {
		const scenario = SCENARIOS['task-queue-ordering']
		expect(scenario.syncOps).toHaveLength(6)
		const { snapshots } = buildSyncSnapshots(scenario.syncOps!, 0)

		// Step 0: push setTimeout(A) → web API appears
		expect(snapshots[0].callStackFrames).toEqual(['setTimeout(A)'])
		expect(snapshots[0].pendingWebAPIs).toHaveLength(1)
		// Step 1: pop
		expect(snapshots[1].callStackFrames).toEqual([])
		// Step 2: push setTimeout(B) → second web API
		expect(snapshots[2].callStackFrames).toEqual(['setTimeout(B)'])
		expect(snapshots[2].pendingWebAPIs).toHaveLength(2)
		// Step 3: pop
		expect(snapshots[3].callStackFrames).toEqual([])
		// Step 4: push console.log("C")
		expect(snapshots[4].callStackFrames).toEqual(['console.log("C")'])
		// Step 5: pop → empty
		expect(snapshots[5].callStackFrames).toEqual([])
	})

	it('microtask-priority has 5 ops (fetch uses autoPop)', () => {
		const scenario = SCENARIOS['microtask-priority']
		expect(scenario.syncOps).toHaveLength(5)
		const { snapshots } = buildSyncSnapshots(scenario.syncOps!, 0)

		// Step 0: push setTimeout → web API (callback queue)
		expect(snapshots[0].callStackFrames).toEqual(['setTimeout()'])
		expect(snapshots[0].pendingWebAPIs).toHaveLength(1)
		// Step 1: pop
		expect(snapshots[1].callStackFrames).toEqual([])
		// Step 2: push+autoPop fetch → web API registered, stack empty
		expect(snapshots[2].callStackFrames).toEqual([])
		expect(snapshots[2].pendingWebAPIs).toHaveLength(2)
		// Step 3: push console.log("Sync")
		expect(snapshots[3].callStackFrames).toEqual(['console.log("Sync")'])
		// Step 4: pop → empty
		expect(snapshots[4].callStackFrames).toEqual([])
	})

	it('render-step has 5 ops (fetch push+pop merged into final step)', () => {
		const scenario = SCENARIOS['render-step']
		expect(scenario.syncOps).toHaveLength(5)
		const { snapshots } = buildSyncSnapshots(scenario.syncOps!, 0)

		// Step 0: push rAF (has asyncEffect) — rAF web API appears
		expect(snapshots[0].callStackFrames).toEqual(['rAF()'])
		expect(snapshots[0].pendingWebAPIs).toHaveLength(1)
		expect(snapshots[0].pendingWebAPIs[0].type).toBe('rAF')
		// Step 1: pop
		expect(snapshots[1].callStackFrames).toEqual([])
		// Step 2: push setTimeout → rAF + setTimeout web APIs
		expect(snapshots[2].callStackFrames).toEqual(['setTimeout()'])
		expect(snapshots[2].pendingWebAPIs).toHaveLength(2)
		// Step 3: pop
		expect(snapshots[3].callStackFrames).toEqual([])
		// Step 4: push fetch → all three web APIs (stack cleared on stepping finish)
		expect(snapshots[4].callStackFrames).toEqual(['fetch()'])
		expect(snapshots[4].pendingWebAPIs).toHaveLength(3)
	})
})

describe('render-step rAF asyncEffect', () => {
	it('render-step scenario: rAF push creates a pending web API with type rAF', () => {
		const scenario = SCENARIOS['render-step']
		const { snapshots, finalWebAPIs } = buildSyncSnapshots(scenario.syncOps!, 0)

		// Step 0: after rAF push — web API appears (rAF type)
		expect(snapshots[0].pendingWebAPIs).toHaveLength(1)
		expect(snapshots[0].pendingWebAPIs[0].type).toBe('rAF')
		expect(snapshots[0].pendingWebAPIs[0].label).toBe('rAF')

		// finalWebAPIs should have 3 entries: rAF, setTimeout, fetch
		expect(finalWebAPIs).toHaveLength(3)
		expect(finalWebAPIs[0].type).toBe('rAF')
		expect(finalWebAPIs[1].type).toBe('setTimeout')
		expect(finalWebAPIs[2].type).toBe('fetch')
	})
})

describe('rAF dequeue during RENDERING', () => {
	it('transitions from STOPPED_AT_RENDER to RENDERING with first rAF callback as currentTask', () => {
		const rAfTask = {
			id: '1',
			type: 'rAF' as const,
			label: 'rAF',
			color: '#ffffff',
		}
		const state: SimulationState = {
			...createInitialState(),
			cursorPosition: PIT_STOPS.render,
			cursorState: 'STOPPED_AT_RENDER',
			rAfCallbacks: [rAfTask],
			executionTimer: 0,
		}
		const next = nextState(state, 250)
		expect(next.cursorState).toBe('RENDERING')
		expect(next.currentTask).toEqual(rAfTask)
		expect(next.rAfCallbacks).toEqual([])
	})

	it('RENDERING completes and transitions to ORBITING with empty rAfCallbacks', () => {
		const rAfTask = {
			id: '1',
			type: 'rAF' as const,
			label: 'rAF',
			color: '#ffffff',
		}
		const state: SimulationState = {
			...createInitialState(),
			cursorPosition: PIT_STOPS.render,
			cursorState: 'RENDERING',
			currentTask: rAfTask,
			rAfCallbacks: [],
			executionTimer: 1,
		}
		const next = nextState(state, 10)
		expect(next.cursorState).toBe('ORBITING')
		expect(next.currentTask).toBeNull()
		expect(next.rAfCallbacks).toEqual([])
	})
})

describe('rAF routing', () => {
	it('moves rAF callback to rAfCallbacks when delay elapses (not taskQueue or microtaskQueue)', () => {
		const state: SimulationState = {
			...createInitialState(),
			pendingWebAPIs: [
				{
					id: '1',
					type: 'rAF',
					label: 'rAF',
					delay: 0,
					color: '#ffffff',
					remainingDelay: 0,
				},
			],
		}
		const next = nextState(state, 16)
		expect(next.pendingWebAPIs).toHaveLength(0)
		expect(next.rAfCallbacks).toHaveLength(1)
		expect(next.rAfCallbacks[0].label).toBe('rAF')
		expect(next.taskQueue).toHaveLength(0)
		expect(next.microtaskQueue).toHaveLength(0)
	})
})

describe('render-step end-to-end', () => {
	it('cursor visits microtask queue, render station, then task queue in spec order', () => {
		const scenario = SCENARIOS['render-step']
		let state = startStepping(
			createInitialState(),
			scenario.syncOps!,
			'render-step',
		)

		// Step through all 6 sync ops
		for (let i = 0; i < scenario.syncOps!.length; i++) {
			state = stepForward(state)
		}
		expect(state.cursorState).toBe('ORBITING')
		// Should have 3 pending web APIs: rAF, setTimeout(0ms), fetch(placeholder)
		expect(state.pendingWebAPIs).toHaveLength(3)

		// Simulate fetch resolving (like the store does)
		state = resolveFetch(state, 'fetch → "Luke"')

		// Tick to resolve pending APIs (rAF is instant, setTimeout is 1000ms, fetch is resolved)
		state = nextState(state, 1100)
		// rAF(0ms) → rAfCallbacks, setTimeout(1000ms) → taskQueue, fetch resolved → microtaskQueue
		expect(state.rAfCallbacks).toHaveLength(1)
		expect(state.taskQueue).toHaveLength(1)

		// Advance cursor to visit all stations
		// justFinishedStepping=true means render is skipped on first orbit
		// First orbit: microtask (0.333), skip render (0.667), task (0 on wrap)
		// Second orbit: render (0.667) — flag cleared after wrap
		let statesVisited: string[] = []
		for (let i = 0; i < 1600; i++) {
			state = nextState(state, 20)
			if (!statesVisited.includes(state.cursorState)) {
				statesVisited.push(state.cursorState)
			}
			if (statesVisited.length >= 7) break
		}

		// Should have visited all station states
		expect(statesVisited).toContain('STOPPED_AT_MICROTASK_QUEUE')
		expect(statesVisited).toContain('EXECUTING_MICROTASK')
		expect(statesVisited).toContain('STOPPED_AT_RENDER')
		expect(statesVisited).toContain('RENDERING')
		expect(statesVisited).toContain('STOPPED_AT_TASK_QUEUE')
		expect(statesVisited).toContain('EXECUTING_TASK')

		// Verify ordering: microtask visited before task (both on first orbit)
		const microtaskIdx = statesVisited.indexOf('STOPPED_AT_MICROTASK_QUEUE')
		const taskIdx = statesVisited.indexOf('STOPPED_AT_TASK_QUEUE')
		expect(microtaskIdx).toBeLessThan(taskIdx)
	})
})

describe('resolveFetch callbackLabel', () => {
	it('updates callbackLabel with resolved value on microtask-priority scenario', () => {
		const scenario = SCENARIOS['microtask-priority']
		let state = startStepping(
			createInitialState(),
			scenario.syncOps!,
			'microtask-priority',
		)

		// Step through all sync ops
		for (let i = 0; i < scenario.syncOps!.length; i++) {
			state = stepForward(state)
		}

		// Fetch should be pending with static callbackLabel (first .then)
		const pendingFetch = state.pendingWebAPIs.find((a) => a.type === 'fetch')
		expect(pendingFetch).toBeDefined()
		expect(pendingFetch!.callbackLabel).toBe('res.json()')
		expect(pendingFetch!.chainedCallbackLabel).toBe('console.log(data.name)')

		// Resolve with actual data (like the store does)
		state = resolveFetch(
			state,
			'fetch → "Luke Skywalker"',
			'res.json()',
			'console.log("Luke Skywalker")',
		)

		// callbackLabel should be res.json() (first microtask), chained should have resolved name
		const resolvedFetch = state.pendingWebAPIs.find((a) => a.type === 'fetch')
		expect(resolvedFetch!.callbackLabel).toBe('res.json()')
		expect(resolvedFetch!.chainedCallbackLabel).toBe(
			'console.log("Luke Skywalker")',
		)
		expect(resolvedFetch!.label).toBe('fetch → "Luke Skywalker"')
	})

	it('carries resolved callbackLabel through to microtask queue task', () => {
		const scenario = SCENARIOS['microtask-priority']
		let state = startStepping(
			createInitialState(),
			scenario.syncOps!,
			'microtask-priority',
		)

		for (let i = 0; i < scenario.syncOps!.length; i++) {
			state = stepForward(state)
		}

		state = resolveFetch(
			state,
			'fetch → "Yoda"',
			'res.json()',
			'console.log("Yoda")',
		)

		// Tick to move resolved fetch from pendingWebAPIs into microtaskQueue
		state = nextState(state, 16)

		const microtask = state.microtaskQueue.find((t) => t.type === 'fetch')
		expect(microtask).toBeDefined()
		expect(microtask!.callbackLabel).toBe('res.json()')
		// Chained microtask should carry the resolved name
		expect(microtask!.chainedMicrotask).toBeDefined()
		expect(microtask!.chainedMicrotask!.callbackLabel).toBe(
			'console.log("Yoda")',
		)
	})

	it('preserves existing callbackLabel when resolvedCallbackLabel is not provided', () => {
		const scenario = SCENARIOS['microtask-priority']
		let state = startStepping(
			createInitialState(),
			scenario.syncOps!,
			'microtask-priority',
		)

		for (let i = 0; i < scenario.syncOps!.length; i++) {
			state = stepForward(state)
		}

		// Resolve without providing callbackLabel overrides
		state = resolveFetch(state, 'fetch → "Han Solo"')

		const resolvedFetch = state.pendingWebAPIs.find((a) => a.type === 'fetch')
		expect(resolvedFetch!.callbackLabel).toBe('res.json()')
		// chainedCallbackLabel preserved from scenario definition
		expect(resolvedFetch!.chainedCallbackLabel).toBe('console.log(data.name)')
	})
})

describe('chainedMicrotask', () => {
	it('enqueues chained microtask when the parent microtask finishes executing', () => {
		let state = createInitialState()

		const chained: Task = {
			id: '2',
			type: 'fetch',
			label: 'chained',
			callbackLabel: 'console.log("Luke")',
			color: '#ffffff',
		}

		// Manually place a microtask with a chain into the queue
		state = {
			...state,
			cursorPosition: PIT_STOPS.microtask,
			cursorState: 'STOPPED_AT_MICROTASK_QUEUE',
			microtaskQueue: [
				{
					id: '1',
					type: 'fetch',
					label: 'res.json()',
					color: '#ffffff',
					chainedMicrotask: chained,
				},
			],
			executionTimer: STOP_PAUSE,
		}

		// Tick past the stop pause to start executing the first microtask
		state = nextState(state, STOP_PAUSE + 1)
		expect(state.cursorState).toBe('EXECUTING_MICROTASK')
		expect(state.currentTask!.label).toBe('res.json()')

		// Tick past execution duration — should enqueue chained and start executing it
		state = nextState(state, EXECUTION_DURATION + 1)
		expect(state.cursorState).toBe('EXECUTING_MICROTASK')
		expect(state.currentTask!.label).toBe('chained')
		expect(state.currentTask!.callbackLabel).toBe('console.log("Luke")')
		expect(state.microtaskQueue).toHaveLength(0)
	})

	it('resumes orbiting after both parent and chained microtasks are drained', () => {
		let state = createInitialState()

		const chained: Task = {
			id: '2',
			type: 'fetch',
			label: 'chained',
			color: '#ffffff',
		}

		state = {
			...state,
			cursorPosition: PIT_STOPS.microtask,
			cursorState: 'STOPPED_AT_MICROTASK_QUEUE',
			microtaskQueue: [
				{
					id: '1',
					type: 'fetch',
					label: 'first',
					color: '#ffffff',
					chainedMicrotask: chained,
				},
			],
			executionTimer: STOP_PAUSE,
		}

		// Tick past stop pause → executing first microtask
		state = nextState(state, STOP_PAUSE + 1)
		// Tick past execution → executing chained microtask
		state = nextState(state, EXECUTION_DURATION + 1)
		expect(state.cursorState).toBe('EXECUTING_MICROTASK')
		// Tick past execution → no more microtasks, resume orbiting
		state = nextState(state, EXECUTION_DURATION + 1)
		expect(state.cursorState).toBe('ORBITING')
		expect(state.currentTask).toBeNull()
	})

	it('drains chained microtask before any task in the task queue', () => {
		let state = createInitialState()

		const chained: Task = {
			id: '2',
			type: 'fetch',
			label: 'chained',
			color: '#ffffff',
		}

		state = {
			...state,
			cursorPosition: PIT_STOPS.microtask,
			cursorState: 'STOPPED_AT_MICROTASK_QUEUE',
			microtaskQueue: [
				{
					id: '1',
					type: 'fetch',
					label: 'first',
					color: '#ffffff',
					chainedMicrotask: chained,
				},
			],
			taskQueue: [
				{
					id: '3',
					type: 'setTimeout',
					label: 'setTimeout(1000ms)',
					color: '#888888',
				},
			],
			executionTimer: STOP_PAUSE,
		}

		// Tick past stop pause → executing first microtask
		state = nextState(state, STOP_PAUSE + 1)
		// Tick past execution → executing chained, NOT the setTimeout task
		state = nextState(state, EXECUTION_DURATION + 1)
		expect(state.cursorState).toBe('EXECUTING_MICROTASK')
		expect(state.currentTask!.label).toBe('chained')
		// Task queue untouched
		expect(state.taskQueue).toHaveLength(1)
	})
})

describe('justFinishedStepping', () => {
	it('skips render station on first orbit after stepping finishes', () => {
		const scenario = SCENARIOS['render-step']
		let state = startStepping(
			createInitialState(),
			scenario.syncOps!,
			'render-step',
		)

		// Step through all ops
		for (let i = 0; i < scenario.syncOps!.length; i++) {
			state = stepForward(state)
		}
		expect(state.cursorState).toBe('ORBITING')
		expect(state.justFinishedStepping).toBe(true)

		// Add an rAF callback to the queue so render station would normally stop
		state = {
			...state,
			rAfCallbacks: [{ id: '99', type: 'rAF', label: 'rAF', color: '#ffffff' }],
			// Position cursor just before render station
			cursorPosition: PIT_STOPS.render - 0.01,
		}

		// Advance past render station — should NOT stop
		state = nextState(state, 200)
		expect(state.cursorState).toBe('ORBITING')
		expect(state.cursorPosition).toBeGreaterThan(PIT_STOPS.render)
	})

	it('clears flag after cursor wraps past position 0', () => {
		let state = createInitialState()
		state = {
			...state,
			justFinishedStepping: true,
			cursorPosition: 0.99,
		}

		// Advance past wrap point
		state = nextState(state, 200)
		expect(state.justFinishedStepping).toBe(false)
	})

	it('stops at render station normally when flag is false', () => {
		let state = createInitialState()
		state = {
			...state,
			rAfCallbacks: [{ id: '99', type: 'rAF', label: 'rAF', color: '#ffffff' }],
			cursorPosition: PIT_STOPS.render - 0.01,
			justFinishedStepping: false,
		}

		state = nextState(state, 200)
		expect(state.cursorState).toBe('STOPPED_AT_RENDER')
	})

	it('skips task queue on first orbit after stepping finishes', () => {
		let state: SimulationState = {
			...createInitialState(),
			justFinishedStepping: true,
			cursorPosition: 0.99,
			taskQueue: [
				{
					id: '99',
					type: 'setTimeout',
					label: 'setTimeout()',
					color: '#ffbe0b',
				},
			],
		}

		// Advance past wrap point — should NOT stop at task queue
		state = nextState(state, 200)
		expect(state.cursorState).toBe('ORBITING')
		expect(state.justFinishedStepping).toBe(false)
		expect(state.taskQueue).toHaveLength(1) // task not consumed
	})

	it('stops at task queue normally when justFinishedStepping is false', () => {
		let state: SimulationState = {
			...createInitialState(),
			justFinishedStepping: false,
			cursorPosition: 0.99,
			taskQueue: [
				{
					id: '99',
					type: 'setTimeout',
					label: 'setTimeout()',
					color: '#ffbe0b',
				},
			],
		}

		state = nextState(state, 200)
		expect(state.cursorState).toBe('STOPPED_AT_TASK_QUEUE')
		expect(state.cursorPosition).toBe(0)
	})
})
