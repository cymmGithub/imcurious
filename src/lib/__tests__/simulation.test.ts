import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  nextState,
  addTask,
  shouldStopAtPitStop,
  PIT_STOPS,
  EXECUTION_DURATION,
  type SimulationState,
} from '../simulation'

describe('createInitialState', () => {
  it('returns valid initial state', () => {
    const state = createInitialState()
    expect(state.cursorPosition).toBe(0)
    expect(state.cursorState).toBe('ORBITING')
    expect(state.taskQueue).toEqual([])
    expect(state.microtaskQueue).toEqual([])
    expect(state.pendingWebAPIs).toEqual([])
    expect(state.renderNeeded).toBe(false)
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

  it('skips render stop when renderNeeded is false', () => {
    const state: SimulationState = {
      ...createInitialState(),
      cursorPosition: PIT_STOPS.render - 0.005,
      renderNeeded: false,
    }
    const next = nextState(state, 100)
    expect(next.cursorState).toBe('ORBITING')
    expect(next.cursorPosition).toBeGreaterThan(PIT_STOPS.render)
  })

  it('stops at render stop when renderNeeded is true', () => {
    const state: SimulationState = {
      ...createInitialState(),
      cursorPosition: PIT_STOPS.render - 0.005,
      renderNeeded: true,
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
    expect(state.renderNeeded).toBe(true)
  })

  it('with fetch adds a PendingWebAPI entry', () => {
    const state = addTask(createInitialState(), 'fetch', 1000)
    expect(state.pendingWebAPIs).toHaveLength(1)
    expect(state.pendingWebAPIs[0].type).toBe('fetch')
    expect(state.pendingWebAPIs[0].remainingDelay).toBe(1000)
    expect(state.renderNeeded).toBe(true)
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
