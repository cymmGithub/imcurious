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
  type SimulationState,
  type SyncFrameOp,
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

  it('stops at microtask queue (~0) when queue is non-empty', () => {
    const state: SimulationState = {
      ...createInitialState(),
      cursorPosition: 0.995,
      microtaskQueue: [{ id: '1', type: 'fetch', label: 'fetch()', color: '#ffffff' }],
    }
    const next = nextState(state, 200)
    expect(next.cursorState).toBe('STOPPED_AT_MICROTASK_QUEUE')
  })

  it('drives through microtask queue when queue is empty', () => {
    const state: SimulationState = {
      ...createInitialState(),
      cursorPosition: 0.995,
    }
    const next = nextState(state, 200)
    expect(next.cursorState).toBe('ORBITING')
    expect(next.cursorPosition).toBeGreaterThanOrEqual(0)
    expect(next.cursorPosition).toBeLessThan(0.99)
  })

  it('stops at task queue (~0.333) when queue is non-empty', () => {
    const state: SimulationState = {
      ...createInitialState(),
      cursorPosition: PIT_STOPS.task - 0.005,
      taskQueue: [{ id: '1', type: 'setTimeout', label: 'setTimeout()', color: '#ffbe0b' }],
    }
    const next = nextState(state, 100)
    expect(next.cursorState).toBe('STOPPED_AT_TASK_QUEUE')
    expect(next.cursorPosition).toBeCloseTo(PIT_STOPS.task, 2)
  })

  it('transitions from STOPPED_AT_MICROTASK_QUEUE to EXECUTING_MICROTASK', () => {
    const task = { id: '1', type: 'fetch' as const, label: 'fetch()', color: '#06d6a0' }
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
    const task1 = { id: '1', type: 'fetch' as const, label: 'fetch1()', color: '#06d6a0' }
    const task2 = { id: '2', type: 'fetch' as const, label: 'fetch2()', color: '#06d6a0' }
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
    const task1 = { id: '1', type: 'setTimeout' as const, label: 'cb1()', color: '#ffbe0b' }
    const task2 = { id: '2', type: 'setTimeout' as const, label: 'cb2()', color: '#ffbe0b' }
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
      rAfCallbacks: [{ id: '1', type: 'rAF' as const, label: 'requestAnimationFrame', color: '#ffffff' }],
    }
    const next = nextState(state, 100)
    expect(next.cursorState).toBe('STOPPED_AT_RENDER')
    expect(next.cursorPosition).toBeCloseTo(PIT_STOPS.render, 2)
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
  it('returns true when cursor crosses threshold with non-empty queue', () => {
    const result = shouldStopAtPitStop(0.24, PIT_STOPS.microtask, 0.26, [
      { id: '1', type: 'fetch', label: 'fetch()', color: '#06d6a0' },
    ])
    // Note: microtask is at 0, this tests the helper function directly
    expect(result).toBe(false) // prevPos=0.24 is already past pitStop=0
  })

  it('returns false when queue is empty', () => {
    const result = shouldStopAtPitStop(0.24, PIT_STOPS.microtask, 0.26, [])
    expect(result).toBe(false)
  })

  it('returns false when cursor has not crossed threshold', () => {
    const result = shouldStopAtPitStop(0.20, PIT_STOPS.microtask, 0.22, [
      { id: '1', type: 'fetch', label: 'fetch()', color: '#06d6a0' },
    ])
    expect(result).toBe(false)
  })

  it('returns true when cursor crosses task pit stop threshold with non-empty queue', () => {
    const result = shouldStopAtPitStop(PIT_STOPS.task - 0.01, PIT_STOPS.task, PIT_STOPS.task + 0.01, [
      { id: '1', type: 'setTimeout', label: 'setTimeout()', color: '#888888' },
    ])
    expect(result).toBe(true)
  })
})

describe('stepping', () => {
  // sync-callstack ops: push welcome, push greet, pop, push console.log, pop, pop
  const syncOps: SyncFrameOp[] = [
    { action: 'push', name: 'welcome()', line: 1 },
    { action: 'push', name: 'greet()', line: 2 },
    { action: 'pop', line: 3 },
    { action: 'push', name: 'console.log()', line: 4 },
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
    expect(snapshots[3].callStackFrames).toEqual(['welcome()', 'console.log()'])
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
  // Simulates the render-step scenario: rAF (no async), setTimeout (async), fetch (async)
  const asyncOps: SyncFrameOp[] = [
    { action: 'push', name: 'requestAnimationFrame()', line: 0 },
    { action: 'pop', line: 2 },
    { action: 'push', name: 'setTimeout()', line: 4, asyncEffect: { type: 'setTimeout', delay: 0 } },
    { action: 'pop', line: 4 },
    { action: 'push', name: 'fetch()', line: 6, asyncEffect: { type: 'fetch' } },
    { action: 'pop', line: 7 },
  ]

  it('buildSyncSnapshots tracks web APIs at correct steps (after applying op)', () => {
    const { snapshots, finalWebAPIs, nextId } = buildSyncSnapshots(asyncOps, 0)
    expect(snapshots).toHaveLength(6)

    // Steps 0-1: rAF push/pop — no asyncEffect
    expect(snapshots[0].pendingWebAPIs).toEqual([])
    expect(snapshots[1].pendingWebAPIs).toEqual([])

    // Step 2: after setTimeout push (has asyncEffect) — web API appears immediately
    expect(snapshots[2].pendingWebAPIs).toHaveLength(1)
    expect(snapshots[2].pendingWebAPIs[0].type).toBe('setTimeout')
    expect(snapshots[2].pendingWebAPIs[0].remainingDelay).toBe(0)

    // Step 3: after setTimeout pop — web API persists
    expect(snapshots[3].pendingWebAPIs).toHaveLength(1)

    // Step 4: after fetch push (has asyncEffect) — both web APIs visible
    expect(snapshots[4].pendingWebAPIs).toHaveLength(2)
    expect(snapshots[4].pendingWebAPIs[1].type).toBe('fetch')
    expect(snapshots[4].pendingWebAPIs[1].remainingDelay).toBe(999999)

    // Step 5: after fetch pop — both still visible
    expect(snapshots[5].pendingWebAPIs).toHaveLength(2)

    // Final state includes both web APIs
    expect(finalWebAPIs).toHaveLength(2)
    expect(finalWebAPIs[0].type).toBe('setTimeout')
    expect(finalWebAPIs[1].type).toBe('fetch')

    // nextId should be incremented by 2 (one for each asyncEffect)
    expect(nextId).toBe(2)
  })

  it('startStepping with asyncEffect ops starts with first snapshot state', () => {
    const initial = createInitialState()
    const state = startStepping(initial, asyncOps, 'render-step')

    // First op is rAF push (no asyncEffect) — no web APIs yet
    expect(state.pendingWebAPIs).toEqual([])
    expect(state.callStackFrames).toEqual(['requestAnimationFrame()'])
    expect(state.steppingFinalWebAPIs).toHaveLength(2)
    expect(state.nextId).toBe(2)
  })

  it('stepForward reveals web APIs at the correct step', () => {
    const initial = createInitialState()
    let state = startStepping(initial, asyncOps, 'render-step')

    // Step 0 (initial): after rAF push — no async effect
    expect(state.pendingWebAPIs).toEqual([])

    // Step 0 → 1: after rAF pop — no async effect
    state = stepForward(state)
    expect(state.pendingWebAPIs).toEqual([])

    // Step 1 → 2: after setTimeout push (has asyncEffect) — web API appears
    state = stepForward(state)
    expect(state.pendingWebAPIs).toHaveLength(1)
    expect(state.pendingWebAPIs[0].type).toBe('setTimeout')

    // Step 2 → 3: after setTimeout pop — web API persists
    state = stepForward(state)
    expect(state.pendingWebAPIs).toHaveLength(1)

    // Step 3 → 4: after fetch push (has asyncEffect) — both web APIs visible
    state = stepForward(state)
    expect(state.pendingWebAPIs).toHaveLength(2)
    expect(state.pendingWebAPIs[1].type).toBe('fetch')
  })

  it('stepBack removes web APIs that were not yet registered', () => {
    const initial = createInitialState()
    let state = startStepping(initial, asyncOps, 'render-step')

    // Advance to step 3 (after setTimeout pop — web API visible)
    state = stepForward(state) // 1: after rAF pop
    state = stepForward(state) // 2: after setTimeout push — web API appears
    state = stepForward(state) // 3: after setTimeout pop — web API persists
    expect(state.pendingWebAPIs).toHaveLength(1)

    // Step back to step 2 (after setTimeout push — web API still visible)
    state = stepBack(state)
    expect(state.pendingWebAPIs).toHaveLength(1)

    // Step back to step 1 (after rAF pop — no web APIs)
    state = stepBack(state)
    expect(state.pendingWebAPIs).toEqual([])

    // Step back to step 0 (after rAF push — no web APIs)
    state = stepBack(state)
    expect(state.pendingWebAPIs).toEqual([])
  })

  it('final stepForward transitions to ORBITING with accumulated web APIs', () => {
    const initial = createInitialState()
    let state = startStepping(initial, asyncOps, 'render-step')

    // Step through all ops
    for (let i = 0; i < asyncOps.length; i++) {
      state = stepForward(state)
    }

    expect(state.cursorState).toBe('ORBITING')
    expect(state.pendingWebAPIs).toHaveLength(2)
    expect(state.pendingWebAPIs[0].type).toBe('setTimeout')
    expect(state.pendingWebAPIs[1].type).toBe('fetch')
    expect(state.steppingFinalWebAPIs).toEqual([])
    // rAfCallbacks is reset to [] when transitioning to ORBITING
    expect(state.rAfCallbacks).toEqual([])
  })

  it('buildSyncSnapshots generates unique IDs starting from startId', () => {
    const { snapshots, nextId } = buildSyncSnapshots(asyncOps, 42)
    // First async effect at step 2 (after setTimeout push) gets id "42"
    expect(snapshots[2].pendingWebAPIs[0].id).toBe('42')
    // Second async effect at step 4 (after fetch push) gets id "43"
    expect(snapshots[4].pendingWebAPIs[1].id).toBe('43')
    expect(nextId).toBe(44)
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
    expect(snapshots[1].callStackFrames).toEqual(['welcome()', 'greet("world")'])
    // Step 2: pop greet → back to welcome
    expect(snapshots[2].callStackFrames).toEqual(['welcome()'])
    // Step 3: push console.log
    expect(snapshots[3].callStackFrames).toEqual(['welcome()', 'console.log()'])
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

  it('microtask-priority has 6 ops (3 push/pop pairs)', () => {
    const scenario = SCENARIOS['microtask-priority']
    expect(scenario.syncOps).toHaveLength(6)
    const { snapshots } = buildSyncSnapshots(scenario.syncOps!, 0)

    // Step 0: push setTimeout → web API (callback queue)
    expect(snapshots[0].callStackFrames).toEqual(['setTimeout()'])
    expect(snapshots[0].pendingWebAPIs).toHaveLength(1)
    // Step 1: pop
    expect(snapshots[1].callStackFrames).toEqual([])
    // Step 2: push fetch → web API (microtask queue)
    expect(snapshots[2].callStackFrames).toEqual(['fetch()'])
    expect(snapshots[2].pendingWebAPIs).toHaveLength(2)
    // Step 3: pop
    expect(snapshots[3].callStackFrames).toEqual([])
    // Step 4: push console.log("Sync")
    expect(snapshots[4].callStackFrames).toEqual(['console.log("Sync")'])
    // Step 5: pop → empty
    expect(snapshots[5].callStackFrames).toEqual([])
  })

  it('render-step has 6 ops (3 push/pop pairs)', () => {
    const scenario = SCENARIOS['render-step']
    expect(scenario.syncOps).toHaveLength(6)
    const { snapshots } = buildSyncSnapshots(scenario.syncOps!, 0)

    // Step 0: push rAF (no asyncEffect)
    expect(snapshots[0].callStackFrames).toEqual(['requestAnimationFrame()'])
    expect(snapshots[0].pendingWebAPIs).toEqual([])
    // Step 1: pop
    expect(snapshots[1].callStackFrames).toEqual([])
    // Step 2: push setTimeout → web API
    expect(snapshots[2].callStackFrames).toEqual(['setTimeout()'])
    expect(snapshots[2].pendingWebAPIs).toHaveLength(1)
    // Step 3: pop
    expect(snapshots[3].callStackFrames).toEqual([])
    // Step 4: push fetch → web API
    expect(snapshots[4].callStackFrames).toEqual(['fetch()'])
    expect(snapshots[4].pendingWebAPIs).toHaveLength(2)
    // Step 5: pop → empty
    expect(snapshots[5].callStackFrames).toEqual([])
  })
})

describe('rAF dequeue during RENDERING', () => {
  it('transitions from STOPPED_AT_RENDER to RENDERING with first rAF callback as currentTask', () => {
    const rAfTask = { id: '1', type: 'rAF' as const, label: 'requestAnimationFrame', color: '#ffffff' }
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
    const rAfTask = { id: '1', type: 'rAF' as const, label: 'requestAnimationFrame', color: '#ffffff' }
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
      pendingWebAPIs: [{
        id: '1',
        type: 'rAF',
        label: 'requestAnimationFrame',
        delay: 0,
        color: '#ffffff',
        remainingDelay: 0,
      }],
    }
    const next = nextState(state, 16)
    expect(next.pendingWebAPIs).toHaveLength(0)
    expect(next.rAfCallbacks).toHaveLength(1)
    expect(next.rAfCallbacks[0].label).toBe('requestAnimationFrame')
    expect(next.taskQueue).toHaveLength(0)
    expect(next.microtaskQueue).toHaveLength(0)
  })
})
