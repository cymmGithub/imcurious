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
    expect(state.carPosition).toBe(0)
    expect(state.carState).toBe('DRIVING')
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
  it('advances car position when driving', () => {
    const state = createInitialState()
    const next = nextState(state, 100)
    expect(next.carPosition).toBeGreaterThan(0)
  })

  it('does NOT advance car when paused', () => {
    const state = { ...createInitialState(), isPaused: true }
    const next = nextState(state, 100)
    expect(next.carPosition).toBe(0)
  })

  it('wraps car position from 1.0 back to 0.0', () => {
    const state = { ...createInitialState(), carPosition: 0.99 }
    const next = nextState(state, 200)
    expect(next.carPosition).toBeLessThan(0.99)
    expect(next.carPosition).toBeGreaterThanOrEqual(0)
  })

  it('stops at microtask queue (~0.25) when queue is non-empty', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.microtask - 0.005,
      microtaskQueue: [{ id: '1', type: 'fetch', label: 'fetch()', color: '#06d6a0' }],
    }
    const next = nextState(state, 100)
    expect(next.carState).toBe('STOPPED_AT_MICROTASK_QUEUE')
    expect(next.carPosition).toBeCloseTo(PIT_STOPS.microtask, 2)
  })

  it('drives through microtask queue when queue is empty', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.microtask - 0.005,
    }
    const next = nextState(state, 100)
    expect(next.carState).toBe('DRIVING')
    expect(next.carPosition).toBeGreaterThan(PIT_STOPS.microtask)
  })

  it('stops at task queue (~0.50) when queue is non-empty', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.task - 0.005,
      taskQueue: [{ id: '1', type: 'setTimeout', label: 'setTimeout()', color: '#ffbe0b' }],
    }
    const next = nextState(state, 100)
    expect(next.carState).toBe('STOPPED_AT_TASK_QUEUE')
    expect(next.carPosition).toBeCloseTo(PIT_STOPS.task, 2)
  })

  it('transitions from STOPPED_AT_MICROTASK_QUEUE to EXECUTING_MICROTASK', () => {
    const task = { id: '1', type: 'fetch' as const, label: 'fetch()', color: '#06d6a0' }
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.microtask,
      carState: 'STOPPED_AT_MICROTASK_QUEUE',
      microtaskQueue: [task],
      executionTimer: 0,
    }
    // Advance enough to pass STOP_PAUSE
    const next = nextState(state, 250)
    expect(next.carState).toBe('EXECUTING_MICROTASK')
    expect(next.currentTask).toEqual(task)
    expect(next.microtaskQueue).toEqual([])
  })

  it('drains ALL microtasks before leaving (stays if more in queue)', () => {
    const task1 = { id: '1', type: 'fetch' as const, label: 'fetch1()', color: '#06d6a0' }
    const task2 = { id: '2', type: 'fetch' as const, label: 'fetch2()', color: '#06d6a0' }
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.microtask,
      carState: 'EXECUTING_MICROTASK',
      currentTask: task1,
      microtaskQueue: [task2],
      executionTimer: 1, // about to finish
    }
    const next = nextState(state, 10)
    // Should dequeue next microtask, not go to DRIVING
    expect(next.carState).toBe('EXECUTING_MICROTASK')
    expect(next.currentTask).toEqual(task2)
    expect(next.microtaskQueue).toEqual([])
  })

  it('executes only ONE task from task queue per lap', () => {
    const task1 = { id: '1', type: 'setTimeout' as const, label: 'cb1()', color: '#ffbe0b' }
    const task2 = { id: '2', type: 'setTimeout' as const, label: 'cb2()', color: '#ffbe0b' }
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.task,
      carState: 'EXECUTING_TASK',
      currentTask: task1,
      taskQueue: [task2],
      executionTimer: 1, // about to finish
    }
    const next = nextState(state, 10)
    // Should go to DRIVING, leaving task2 in queue
    expect(next.carState).toBe('DRIVING')
    expect(next.taskQueue).toEqual([task2])
    expect(next.currentTask).toBeNull()
  })

  it('skips render stop when renderNeeded is false', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.render - 0.005,
      renderNeeded: false,
    }
    const next = nextState(state, 100)
    expect(next.carState).toBe('DRIVING')
    expect(next.carPosition).toBeGreaterThan(PIT_STOPS.render)
  })

  it('stops at render stop when renderNeeded is true', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.render - 0.005,
      renderNeeded: true,
    }
    const next = nextState(state, 100)
    expect(next.carState).toBe('STOPPED_AT_RENDER')
    expect(next.carPosition).toBeCloseTo(PIT_STOPS.render, 2)
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
  it('returns true when car crosses threshold with non-empty queue', () => {
    const result = shouldStopAtPitStop(0.24, PIT_STOPS.microtask, 0.26, [
      { id: '1', type: 'fetch', label: 'fetch()', color: '#06d6a0' },
    ])
    expect(result).toBe(true)
  })

  it('returns false when queue is empty', () => {
    const result = shouldStopAtPitStop(0.24, PIT_STOPS.microtask, 0.26, [])
    expect(result).toBe(false)
  })

  it('returns false when car has not crossed threshold', () => {
    const result = shouldStopAtPitStop(0.20, PIT_STOPS.microtask, 0.22, [
      { id: '1', type: 'fetch', label: 'fetch()', color: '#06d6a0' },
    ])
    expect(result).toBe(false)
  })
})
