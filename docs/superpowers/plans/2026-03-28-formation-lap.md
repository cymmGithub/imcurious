# Formation Lap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "formation lap" phase to the event loop visualization where global synchronous code executes before the event loop starts, with a dramatic F1 lights-out transition.

**Architecture:** The formation lap is a new car state (`FORMATION_LAP`) in the simulation state machine. During this phase, the car drives one full lap while a scripted sequence of call stack frames push/pop, Web APIs register in the garage, and microtasks queue up. When the lap completes, a `LIGHTS_OUT` state plays the 5-red-lights → GO transition. The formation lap replaces the current stage 1 content. A new `FormationLapOverlay` component renders the lights-out sequence. The `useFormationLap` hook drives the scripted call stack sequence independently of the main simulation.

**Tech Stack:** React 19, Framer Motion 12, TypeScript, Tailwind 4, Vitest

---

### Task 1: Add formation lap states to simulation

**Files:**
- Modify: `src/lib/simulation.ts`
- Test: `src/lib/__tests__/simulation.test.ts`

- [ ] **Step 1: Write failing tests for formation lap states**

```typescript
// Add to src/lib/__tests__/simulation.test.ts

describe('formation lap', () => {
  it('createInitialState starts in FORMATION_LAP', () => {
    const state = createInitialState()
    expect(state.carState).toBe('FORMATION_LAP')
  })

  it('advances car position during FORMATION_LAP', () => {
    const state = createInitialState()
    const next = nextState(state, 100)
    expect(next.carPosition).toBeGreaterThan(0)
    expect(next.carState).toBe('FORMATION_LAP')
  })

  it('does NOT stop at pit stops during FORMATION_LAP even with queued tasks', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carState: 'FORMATION_LAP',
      carPosition: PIT_STOPS.microtask - 0.005,
      microtaskQueue: [{ id: '1', type: 'fetch', label: 'fetch()', color: '#ffffff' }],
    }
    const next = nextState(state, 100)
    expect(next.carState).toBe('FORMATION_LAP')
    expect(next.carPosition).toBeGreaterThan(PIT_STOPS.microtask)
  })

  it('transitions to LIGHTS_OUT when formation lap wraps past 1.0', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carState: 'FORMATION_LAP',
      carPosition: 0.99,
    }
    const next = nextState(state, 200)
    expect(next.carState).toBe('LIGHTS_OUT')
    expect(next.carPosition).toBe(0)
    expect(next.executionTimer).toBe(LIGHTS_OUT_DURATION)
  })

  it('transitions from LIGHTS_OUT to DRIVING when timer elapses', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carState: 'LIGHTS_OUT',
      carPosition: 0,
      executionTimer: 100,
    }
    const next = nextState(state, 150)
    expect(next.carState).toBe('DRIVING')
    expect(next.executionTimer).toBe(0)
  })

  it('does NOT advance car during LIGHTS_OUT', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carState: 'LIGHTS_OUT',
      carPosition: 0,
      executionTimer: 1000,
    }
    const next = nextState(state, 100)
    expect(next.carPosition).toBe(0)
    expect(next.carState).toBe('LIGHTS_OUT')
  })

  it('ticks Web APIs during FORMATION_LAP', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carState: 'FORMATION_LAP',
      pendingWebAPIs: [{
        id: '1', type: 'setTimeout', label: 'setTimeout(100ms)',
        color: '#888888', delay: 100, remainingDelay: 100,
      }],
    }
    const next = nextState(state, 150)
    expect(next.pendingWebAPIs).toHaveLength(0)
    expect(next.taskQueue).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test`
Expected: FAIL — `FORMATION_LAP` and `LIGHTS_OUT` are not valid CarState values

- [ ] **Step 3: Add formation lap states to simulation**

In `src/lib/simulation.ts`:

Add `'FORMATION_LAP'` and `'LIGHTS_OUT'` to the `CarState` type:

```typescript
export type CarState =
  | 'FORMATION_LAP'
  | 'LIGHTS_OUT'
  | 'DRIVING'
  | 'STOPPED_AT_TASK_QUEUE'
  | 'EXECUTING_TASK'
  | 'STOPPED_AT_MICROTASK_QUEUE'
  | 'EXECUTING_MICROTASK'
  | 'STOPPED_AT_RENDER'
  | 'RENDERING'
```

Add the lights-out duration constant:

```typescript
export const LIGHTS_OUT_DURATION = 3000 // 5 lights × 600ms each
```

Change `createInitialState` to start in `FORMATION_LAP`:

```typescript
export function createInitialState(): SimulationState {
  return {
    carPosition: 0,
    carState: 'FORMATION_LAP',
    // ... rest stays the same
  }
}
```

Add two cases to the `switch` in `nextState`, before `'DRIVING'`:

```typescript
case 'FORMATION_LAP': {
  const newPos = s.carPosition + CAR_SPEED * dt
  if (newPos >= 1.0) {
    return {
      ...s,
      carPosition: 0,
      carState: 'LIGHTS_OUT',
      executionTimer: LIGHTS_OUT_DURATION,
    }
  }
  return { ...s, carPosition: newPos }
}

case 'LIGHTS_OUT': {
  const timer = s.executionTimer - dt
  if (timer <= 0) {
    return { ...s, carState: 'DRIVING', executionTimer: 0 }
  }
  return { ...s, executionTimer: timer }
}
```

- [ ] **Step 4: Fix existing tests that expect initial state to be DRIVING**

Update the existing test in `createInitialState` describe block:

```typescript
it('returns valid initial state', () => {
  const state = createInitialState()
  expect(state.carPosition).toBe(0)
  expect(state.carState).toBe('FORMATION_LAP') // changed from 'DRIVING'
  // ... rest stays the same
})
```

Update tests that create states with `...createInitialState()` and expect `DRIVING` behavior — they should explicitly set `carState: 'DRIVING'`:

In `'advances car position when driving'`:
```typescript
const state = { ...createInitialState(), carState: 'DRIVING' as const }
```

In `'does NOT advance car when paused'`:
```typescript
const state = { ...createInitialState(), isPaused: true, carState: 'DRIVING' as const }
```

In `'wraps car position from 1.0 back to 0.0'`:
```typescript
const state = { ...createInitialState(), carPosition: 0.99, carState: 'DRIVING' as const }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun run test`
Expected: ALL PASS (19 existing + 6 new = 25 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/simulation.ts src/lib/__tests__/simulation.test.ts
git commit -m "feat: add FORMATION_LAP and LIGHTS_OUT states to simulation"
```

---

### Task 2: Formation lap scripted call stack sequence

**Files:**
- Create: `src/lib/formationLapScript.ts`
- Test: `src/lib/__tests__/formationLapScript.test.ts`

The formation lap shows a scripted sequence of call stack frames pushing and popping as the car completes its lap. This is driven by car position (0→1), not by time.

- [ ] **Step 1: Write failing tests for the script**

Create `src/lib/__tests__/formationLapScript.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getFormationLapState, type FormationLapFrame } from '../formationLapScript'

describe('getFormationLapState', () => {
  it('returns script() frame at position 0', () => {
    const state = getFormationLapState(0)
    expect(state.callStack).toEqual([{ id: 'script', label: 'script()' }])
    expect(state.activeLine).toBe(0)
  })

  it('shows console.log("Start") pushed during its range', () => {
    const state = getFormationLapState(0.08)
    const labels = state.callStack.map((f: FormationLapFrame) => f.label)
    expect(labels).toContain('script()')
    expect(labels).toContain('console.log("Start")')
  })

  it('shows setTimeout registering a Web API', () => {
    const state = getFormationLapState(0.25)
    expect(state.webAPIRegistrations.length).toBeGreaterThanOrEqual(1)
    expect(state.webAPIRegistrations[0].label).toBe('setTimeout(1000ms)')
  })

  it('shows Promise.then queuing a microtask', () => {
    const state = getFormationLapState(0.50)
    expect(state.microtaskRegistrations.length).toBeGreaterThanOrEqual(1)
  })

  it('returns empty stack at position ~0.95 (all done)', () => {
    const state = getFormationLapState(0.95)
    expect(state.callStack).toEqual([])
  })

  it('returns the code snippet', () => {
    const state = getFormationLapState(0)
    expect(state.codeLines).toHaveLength(4)
    expect(state.codeLines[0]).toBe('console.log("Start")')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the formation lap script**

Create `src/lib/formationLapScript.ts`:

```typescript
export type FormationLapFrame = {
  id: string
  label: string
}

export type FormationLapState = {
  callStack: FormationLapFrame[]
  activeLine: number // which code line is highlighted (0-indexed, -1 = none)
  webAPIRegistrations: { label: string; delay: number }[]
  microtaskRegistrations: { label: string }[]
  codeLines: string[]
}

const CODE_LINES = [
  'console.log("Start")',
  'setTimeout(() => console.log("Later"), 1000)',
  'Promise.resolve().then(() => console.log("Micro"))',
  'console.log("End")',
]

// Each event occupies a range of car position (0→1).
// Events: push script, push/pop console.log("Start"), push/pop setTimeout (+ register),
//         push/pop Promise.resolve().then (+ queue microtask), push/pop console.log("End"),
//         pop script.
type ScriptEvent = {
  start: number // car position start
  end: number   // car position end
  frame: FormationLapFrame | null // null = pop
  pushOrPop: 'push' | 'pop'
  activeLine: number
  sideEffect?: {
    type: 'webAPI' | 'microtask'
    label: string
    delay?: number
  }
}

const SCRIPT: ScriptEvent[] = [
  // script() frame — stays for the full ride
  { start: 0.00, end: 0.05, frame: { id: 'script', label: 'script()' }, pushOrPop: 'push', activeLine: -1 },

  // console.log("Start")
  { start: 0.05, end: 0.15, frame: { id: 'log-start', label: 'console.log("Start")' }, pushOrPop: 'push', activeLine: 0 },
  { start: 0.15, end: 0.20, frame: { id: 'log-start', label: 'console.log("Start")' }, pushOrPop: 'pop', activeLine: 0 },

  // setTimeout — registers Web API
  { start: 0.20, end: 0.35, frame: { id: 'set-timeout', label: 'setTimeout()' }, pushOrPop: 'push', activeLine: 1,
    sideEffect: { type: 'webAPI', label: 'setTimeout(1000ms)', delay: 1000 } },
  { start: 0.35, end: 0.40, frame: { id: 'set-timeout', label: 'setTimeout()' }, pushOrPop: 'pop', activeLine: 1 },

  // Promise.resolve().then — queues microtask
  { start: 0.40, end: 0.55, frame: { id: 'promise', label: 'Promise.resolve().then()' }, pushOrPop: 'push', activeLine: 2,
    sideEffect: { type: 'microtask', label: '.then(cb)' } },
  { start: 0.55, end: 0.60, frame: { id: 'promise', label: 'Promise.resolve().then()' }, pushOrPop: 'pop', activeLine: 2 },

  // console.log("End")
  { start: 0.60, end: 0.75, frame: { id: 'log-end', label: 'console.log("End")' }, pushOrPop: 'push', activeLine: 3 },
  { start: 0.75, end: 0.80, frame: { id: 'log-end', label: 'console.log("End")' }, pushOrPop: 'pop', activeLine: 3 },

  // script() pops
  { start: 0.80, end: 0.85, frame: { id: 'script', label: 'script()' }, pushOrPop: 'pop', activeLine: -1 },
]

export function getFormationLapState(carPosition: number): FormationLapState {
  const callStack: FormationLapFrame[] = []
  const webAPIRegistrations: { label: string; delay: number }[] = []
  const microtaskRegistrations: { label: string }[] = []
  let activeLine = -1

  for (const event of SCRIPT) {
    if (carPosition < event.start) break

    if (event.pushOrPop === 'push' && event.frame) {
      // If we haven't reached the pop yet, frame is on the stack
      const popEvent = SCRIPT.find(
        (e) => e.frame?.id === event.frame!.id && e.pushOrPop === 'pop'
      )
      if (!popEvent || carPosition < popEvent.start) {
        callStack.push(event.frame)
      }
    }

    if (carPosition >= event.start) {
      activeLine = event.activeLine
    }

    // Side effects trigger once when the push event starts
    if (event.sideEffect && carPosition >= event.start) {
      if (event.sideEffect.type === 'webAPI') {
        webAPIRegistrations.push({
          label: event.sideEffect.label,
          delay: event.sideEffect.delay ?? 0,
        })
      } else {
        microtaskRegistrations.push({ label: event.sideEffect.label })
      }
    }
  }

  return { callStack, activeLine, webAPIRegistrations, microtaskRegistrations, codeLines: CODE_LINES }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/formationLapScript.ts src/lib/__tests__/formationLapScript.test.ts
git commit -m "feat: add formation lap scripted call stack sequence"
```

---

### Task 3: useFormationLap hook

**Files:**
- Create: `src/hooks/useFormationLap.ts`

This hook reads the simulation state and derives formation-lap-specific display data using the script from Task 2.

- [ ] **Step 1: Create the hook**

Create `src/hooks/useFormationLap.ts`:

```typescript
'use client'

import { useMemo } from 'react'
import { getFormationLapState } from '@/lib/formationLapScript'
import type { SimulationState } from '@/lib/simulation'

export function useFormationLap(state: SimulationState) {
  const isFormationLap = state.carState === 'FORMATION_LAP'
  const isLightsOut = state.carState === 'LIGHTS_OUT'
  const isPreRace = isFormationLap || isLightsOut

  const scriptState = useMemo(
    () => (isFormationLap ? getFormationLapState(state.carPosition) : null),
    [isFormationLap, state.carPosition],
  )

  // Number of lights lit (0-5), based on how much time has elapsed in LIGHTS_OUT
  // Each light takes 600ms. Total LIGHTS_OUT_DURATION = 3000ms
  const lightsLit = useMemo(() => {
    if (!isLightsOut) return 0
    const elapsed = 3000 - state.executionTimer
    return Math.min(5, Math.floor(elapsed / 600) + 1)
  }, [isLightsOut, state.executionTimer])

  // Lights go out (all off) in the final moment
  const lightsOut = isLightsOut && state.executionTimer <= 0

  return { isFormationLap, isLightsOut, isPreRace, scriptState, lightsLit, lightsOut }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useFormationLap.ts
git commit -m "feat: add useFormationLap hook"
```

---

### Task 4: FormationLapOverlay component (lights + code panel)

**Files:**
- Create: `src/components/event-loop/FormationLapOverlay.tsx`

- [ ] **Step 1: Create the overlay component**

This component renders on top of the track visualization during the formation lap and lights-out phases. It shows:
- The code snippet with active line highlighting
- The 5-light panel during LIGHTS_OUT

Create `src/components/event-loop/FormationLapOverlay.tsx`:

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { FormationLapState } from '@/lib/formationLapScript'

interface FormationLapOverlayProps {
  isFormationLap: boolean
  isLightsOut: boolean
  scriptState: FormationLapState | null
  lightsLit: number
}

function CodePanel({ scriptState }: { scriptState: FormationLapState }) {
  return (
    <div
      className="absolute top-3 left-3 rounded-lg p-3 min-w-[260px] font-mono text-xs"
      style={{
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-chalk-faint)',
      }}
    >
      <div
        className="font-display text-[9px] font-bold tracking-[0.15em] uppercase mb-2"
        style={{ color: 'var(--color-chalk-dim)' }}
      >
        Global Code
      </div>
      {scriptState.codeLines.map((line, i) => (
        <div
          key={i}
          className="py-0.5 px-1.5 rounded transition-colors duration-200"
          style={{
            color: i === scriptState.activeLine ? 'var(--color-chalk)' : 'var(--color-chalk-faint)',
            background: i === scriptState.activeLine ? 'rgba(255,255,255,0.05)' : 'transparent',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  )
}

function LightsPanel({ lightsLit }: { lightsLit: number }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-6 h-6 rounded-full"
            initial={{ scale: 0.8, opacity: 0.3 }}
            animate={{
              scale: i < lightsLit ? 1 : 0.8,
              opacity: i < lightsLit ? 1 : 0.3,
              backgroundColor: i < lightsLit ? '#dc2626' : '#333333',
              boxShadow: i < lightsLit ? '0 0 12px #dc2626' : 'none',
            }}
            transition={{ duration: 0.15, delay: i < lightsLit ? 0 : 0 }}
          />
        ))}
      </div>
    </motion.div>
  )
}

export function FormationLapOverlay({
  isFormationLap,
  isLightsOut,
  scriptState,
  lightsLit,
}: FormationLapOverlayProps) {
  return (
    <>
      <AnimatePresence>
        {isFormationLap && scriptState && (
          <motion.div
            key="code-panel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CodePanel scriptState={scriptState} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLightsOut && (
          <LightsPanel lightsLit={lightsLit} />
        )}
      </AnimatePresence>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/event-loop/FormationLapOverlay.tsx
git commit -m "feat: add FormationLapOverlay with code panel and lights"
```

---

### Task 5: Wire formation lap into EventLoopViz

**Files:**
- Modify: `src/components/event-loop/EventLoopViz.tsx`
- Modify: `src/components/event-loop/CallStack.tsx`

The EventLoopViz needs to:
1. Use `useFormationLap` to get script state
2. Render `FormationLapOverlay` during pre-race
3. Feed scripted call stack frames to `CallStack` during formation lap
4. Update status labels for new car states

- [ ] **Step 1: Update CallStack to accept override frames**

In `src/components/event-loop/CallStack.tsx`, add an `overrideFrames` prop so formation lap can inject scripted frames:

Change the interface:
```typescript
interface CallStackProps {
  carState: CarState
  currentTask: Task | null
  visibility: number
  overrideFrames?: { id: string; label: string; color: string }[]
}
```

Update the component to use overrideFrames when provided:
```typescript
export function CallStack({ carState, currentTask, visibility, overrideFrames }: CallStackProps) {
  // ... existing code ...

  const frames = overrideFrames ?? deriveFrames(carState, currentTask)
  // ... rest stays the same
```

- [ ] **Step 2: Update EventLoopViz**

In `src/components/event-loop/EventLoopViz.tsx`:

Add imports:
```typescript
import { useFormationLap } from '@/hooks/useFormationLap'
import { FormationLapOverlay } from './FormationLapOverlay'
import { LIGHTS_OUT_DURATION } from '@/lib/simulation'
```

Add to the component body, after `const { state, ... } = useEventLoopSimulation()`:
```typescript
const { isFormationLap, isLightsOut, isPreRace, scriptState, lightsLit } = useFormationLap(state)
```

Add status labels for new states:
```typescript
const CAR_STATE_LABELS: Record<string, string> = {
  FORMATION_LAP: 'Formation lap — global code executing',
  LIGHTS_OUT: 'Lights out — event loop starting',
  DRIVING: 'Car is driving around the track',
  // ... existing labels
}
```

Add the overlay inside the track area div (after `<Car ... />`):
```typescript
<FormationLapOverlay
  isFormationLap={isFormationLap}
  isLightsOut={isLightsOut}
  scriptState={scriptState}
  lightsLit={lightsLit}
/>
```

Pass scripted frames to CallStack during formation lap:
```typescript
<CallStack
  carState={state.carState}
  currentTask={state.currentTask}
  visibility={getStageVisibility(2)}
  overrideFrames={
    isFormationLap && scriptState
      ? scriptState.callStack.map((f) => ({ ...f, color: '#ffffff' }))
      : undefined
  }
/>
```

During formation lap, make CallStack visible from stage 1 (not stage 2):
```typescript
visibility={isPreRace ? 1 : getStageVisibility(2)}
```

- [ ] **Step 3: Run build to verify**

Run: `bun run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/event-loop/EventLoopViz.tsx src/components/event-loop/CallStack.tsx
git commit -m "feat: wire formation lap into EventLoopViz"
```

---

### Task 6: Seed Web API and microtask during formation lap

**Files:**
- Modify: `src/hooks/useEventLoopSimulation.ts`

During the formation lap, the scripted sequence should register a real Web API (setTimeout) and a real microtask into the simulation state so the garage and queues populate visually.

- [ ] **Step 1: Update useEventLoopSimulation to seed tasks during formation lap**

In `src/hooks/useEventLoopSimulation.ts`, track which side effects have been triggered:

```typescript
import {
  createInitialState,
  nextState,
  addTask as addTaskPure,
  type SimulationState,
  type TaskType,
} from '@/lib/simulation'
import { getFormationLapState } from '@/lib/formationLapScript'

export function useEventLoopSimulation() {
  const [state, setState] = useState<SimulationState>(createInitialState)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const positionHistoryRef = useRef<number[]>([])
  const seededEffectsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    function tick(timestamp: number) {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp
      }

      const dt = Math.min(timestamp - lastTimeRef.current, 50)
      lastTimeRef.current = timestamp

      setState((prev) => {
        let next = nextState(prev, dt)

        // Seed side effects from formation lap script
        if (next.carState === 'FORMATION_LAP') {
          const scriptState = getFormationLapState(next.carPosition)
          const seeded = seededEffectsRef.current

          for (const reg of scriptState.webAPIRegistrations) {
            if (!seeded.has(reg.label)) {
              seeded.add(reg.label)
              next = addTaskPure(next, 'setTimeout', reg.delay)
            }
          }
          for (const reg of scriptState.microtaskRegistrations) {
            if (!seeded.has(reg.label)) {
              seeded.add(reg.label)
              // Add a microtask directly to the queue (Promise.resolve is synchronous)
              next = {
                ...next,
                microtaskQueue: [
                  ...next.microtaskQueue,
                  {
                    id: String(next.nextId),
                    type: 'fetch',
                    label: '.then(cb)',
                    color: '#ffffff',
                  },
                ],
                nextId: next.nextId + 1,
              }
            }
          }
        }

        // Sample position history for trail
        if (next.carState === 'DRIVING' || next.carState === 'FORMATION_LAP') {
          const history = positionHistoryRef.current
          const last = history[history.length - 1]
          if (last === undefined || Math.abs(next.carPosition - last) > 0.005) {
            history.push(next.carPosition)
            if (history.length > 10) history.shift()
          }
        } else {
          positionHistoryRef.current = []
        }
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ... existing togglePause, addTask ...

  const reset = useCallback(() => {
    setState(createInitialState)
    lastTimeRef.current = 0
    positionHistoryRef.current = []
    seededEffectsRef.current = new Set()
  }, [])

  return { state, positionHistory: positionHistoryRef, togglePause, addTask, reset }
}
```

- [ ] **Step 2: Run build and tests**

Run: `bun run build && bun run test`
Expected: Both pass

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useEventLoopSimulation.ts
git commit -m "feat: seed Web API and microtask during formation lap script"
```

---

### Task 7: Update MDX content — replace stage 1

**Files:**
- Modify: `src/posts/the-js-event-loop-works.mdx`

- [ ] **Step 1: Replace stage 1 content**

Replace the current stage 1 section with formation lap content:

```mdx
<Section stage={1}>

## Formation Lap

Before the race begins, every F1 car does a **formation lap** — a slow, controlled drive around the entire track. No pit stops, no racing, no overtaking. The driver methodically completes the circuit, and the pit crew takes their positions.

JavaScript works the same way. Before the event loop starts cycling, your browser executes all **global synchronous code** from top to bottom. Line by line, one statement at a time, all the way through.

```js
console.log("Start")
setTimeout(() => console.log("Later"), 1000)
Promise.resolve().then(() => console.log("Micro"))
console.log("End")
```

Watch the call stack on the right. Each function pushes on, does its work, and pops off:

- `console.log("Start")` runs immediately — it is synchronous
- `setTimeout` hands its callback to the **browser's timer** (the garage) and returns immediately — the timer starts counting in the background
- `Promise.resolve().then()` queues its callback into the **microtask queue** — it will wait there
- `console.log("End")` runs immediately

The critical point: even though we called `setTimeout` and created a Promise, **nothing from the queues runs yet**. The formation lap must finish first. All global code runs to completion before the event loop checks a single queue.

<Callout>
The five red lights are about to go out. When they do, the event loop takes over: checking queues, executing callbacks, and rendering the screen. But not a moment before all synchronous code has finished.
</Callout>

</Section>
```

- [ ] **Step 2: Run build to verify**

Run: `bun run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/posts/the-js-event-loop-works.mdx
git commit -m "feat: replace stage 1 with formation lap content"
```

---

### Task 8: Handle formation lap in Car exhaust trail and Garage visibility

**Files:**
- Modify: `src/components/event-loop/EventLoopViz.tsx`

During the formation lap, the garage should be visible (to show the setTimeout timer registering) and the car should leave a trail.

- [ ] **Step 1: Make garage visible during formation lap**

In `EventLoopViz.tsx`, update the Garage visibility:

```typescript
<Garage
  pendingAPIs={state.pendingWebAPIs}
  position={{ x: GARAGE_POSITION.x, y: GARAGE_POSITION.y }}
  visibility={isPreRace ? (scriptState?.webAPIRegistrations.length ? 1 : 0) : getStageVisibility(3)}
/>
```

This makes the garage fade in when the setTimeout is registered during the formation lap.

- [ ] **Step 2: Run build**

Run: `bun run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/event-loop/EventLoopViz.tsx
git commit -m "feat: show garage during formation lap when Web API registers"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run full test suite**

Run: `bun run test`
Expected: ALL PASS

- [ ] **Step 2: Run build**

Run: `bun run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Manual verification**

Run: `bun run dev`

Verify in browser at `http://localhost:3000/the-js-event-loop-works`:
1. Page loads → car starts a slow formation lap around the track
2. Call stack shows frames pushing/popping as car moves (script → console.log → setTimeout → Promise.then → console.log → script pops)
3. When setTimeout frame is active, a timer appears in the garage
4. When Promise.then frame is active, a microtask appears in the queue area
5. Car completes the lap → 5 red lights appear one by one
6. All lights lit → they all go out → car starts racing (DRIVING state)
7. Event loop now cycles normally with the seeded tasks
8. Scrolling through subsequent sections still works correctly
9. Reset button resets back to formation lap

- [ ] **Step 4: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: formation lap with scripted call stack and lights-out transition"
```
