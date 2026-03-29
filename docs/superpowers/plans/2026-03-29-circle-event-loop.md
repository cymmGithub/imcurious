# Circle Event Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the F1 race car / oval track metaphor with a circle + cursor visualization, keeping the same simulation logic and scroll-driven behavior.

**Architecture:** Swap the visual layer (Track, Car, PitStop, Garage) with new circle-based components (CirclePath, Cursor, Station, WebApiBox). The simulation state machine (`simulation.ts`) only needs pit stop positions updated from 0.25/0.50/0.75 to 0/0.333/0.667 and "car" terminology renamed to "cursor". Everything else (scenarios, scroll stages, context, hooks) stays the same.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Framer Motion, SVG

---

### File Structure

**Create:**
- `src/lib/circlePath.ts` — Circle geometry, station positions, viewBox constants
- `src/components/event-loop/CircleTrack.tsx` — SVG circle + cursor + anchor dots
- `src/components/event-loop/Station.tsx` — Pill label + detail panel for queue stations
- `src/components/event-loop/WebApiBox.tsx` — External box for pending Web APIs

**Modify:**
- `src/lib/simulation.ts` — Update PIT_STOPS values, rename car→cursor terminology
- `src/lib/__tests__/simulation.test.ts` — Update to match new PIT_STOPS values and field names
- `src/hooks/useEventLoopSimulation.ts` — Rename positionHistory→cursorHistory, car references
- `src/contexts/EventLoopContext.tsx` — Rename positionHistory field
- `src/components/event-loop/EventLoopViz.tsx` — Rewrite to use new circle components
- `src/components/event-loop/CallStack.tsx` — Move inside circle, remove sticky positioning
- `src/components/event-loop/ScrollStage.tsx` — No changes needed (layout stays the same)
- `src/posts/the-js-event-loop-works.mdx` — Remove race/car metaphor language

**Delete (after all new code works):**
- `src/lib/trackPath.ts`
- `src/components/event-loop/Track.tsx`
- `src/components/event-loop/Car.tsx`
- `src/components/event-loop/PitStop.tsx`
- `src/components/event-loop/Garage.tsx`
- `src/components/event-loop/TaskBlock.tsx`

**Unchanged:**
- `src/lib/scenarios.ts`
- `src/components/event-loop/RunCode.tsx`
- `src/hooks/useScrollStage.ts`

---

### Task 1: Create `circlePath.ts`

**Files:**
- Create: `src/lib/circlePath.ts`

- [ ] **Step 1: Create the circle geometry module**

```typescript
// src/lib/circlePath.ts

export const CIRCLE = {
  cx: 300,
  cy: 300,
  r: 180,
} as const

export const VIEWBOX = '-60 30 720 500'

// Station positions at 120° intervals (0°, 120°, 240°)
// 0° = top (12 o'clock), clockwise
function stationAnchor(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: CIRCLE.cx + CIRCLE.r * Math.sin(rad),
    y: CIRCLE.cy - CIRCLE.r * Math.cos(rad),
  }
}

export const STATION_POSITIONS = {
  microtask: {
    pathT: 0,
    label: 'Microtask Queue',
    anchor: stationAnchor(0),     // (300, 120) — 12 o'clock
    color: '#ffffff',
  },
  task: {
    pathT: 1 / 3,
    label: 'Task Queue',
    anchor: stationAnchor(120),   // (456, 390) — ~5 o'clock
    color: '#888888',
  },
  render: {
    pathT: 2 / 3,
    label: 'Render',
    anchor: stationAnchor(240),   // (144, 390) — ~7 o'clock
    color: '#c0b8a8',
  },
} as const

// SVG path for animateMotion (starts at top, clockwise)
export const ORBIT_PATH = `M ${CIRCLE.cx} ${CIRCLE.cy - CIRCLE.r} A ${CIRCLE.r} ${CIRCLE.r} 0 1 1 ${CIRCLE.cx - 0.01} ${CIRCLE.cy - CIRCLE.r} Z`

// Web APIs box position (outside circle, right side)
export const WEB_API_POSITION = {
  x: 500,
  y: 230,
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/circlePath.ts
git commit -m "feat: add circle geometry module (circlePath.ts)"
```

---

### Task 2: Update simulation pit stop positions and rename car→cursor

**Files:**
- Modify: `src/lib/simulation.ts`
- Modify: `src/lib/__tests__/simulation.test.ts`

- [ ] **Step 1: Update simulation.ts**

In `src/lib/simulation.ts`, make these changes:

1. Rename `CarState` type to `CursorState` and update all state names:

```typescript
export type CursorState =
  | 'ORBITING'
  | 'STOPPED_AT_TASK_QUEUE'
  | 'EXECUTING_TASK'
  | 'STOPPED_AT_MICROTASK_QUEUE'
  | 'EXECUTING_MICROTASK'
  | 'STOPPED_AT_RENDER'
  | 'RENDERING'
  | 'EXECUTING_SYNC'
```

2. Rename fields in `SimulationState`:

```typescript
export type SimulationState = {
  cursorPosition: number        // was: carPosition
  cursorState: CursorState      // was: carState
  taskQueue: Task[]
  microtaskQueue: Task[]
  pendingWebAPIs: PendingWebAPI[]
  renderNeeded: boolean
  isPaused: boolean
  currentTask: Task | null
  executionTimer: number
  nextId: number
  syncFrameOps: SyncFrameOp[]
  syncFrameIndex: number
  callStackFrames: string[]
  activeLine: number | null
  activeScenarioId: string | null
}
```

3. Update `PIT_STOPS` to 120° spacing:

```typescript
export const PIT_STOPS = { microtask: 0, task: 1/3, render: 2/3 } as const
```

4. Rename `CAR_SPEED` to `CURSOR_SPEED`:

```typescript
const CURSOR_SPEED = 0.0001
```

5. Update `createInitialState()`:

```typescript
export function createInitialState(): SimulationState {
  return {
    cursorPosition: 0,
    cursorState: 'ORBITING',
    taskQueue: [],
    microtaskQueue: [],
    pendingWebAPIs: [],
    renderNeeded: false,
    isPaused: false,
    currentTask: null,
    executionTimer: 0,
    nextId: 0,
    syncFrameOps: [],
    syncFrameIndex: 0,
    callStackFrames: [],
    activeLine: null,
    activeScenarioId: null,
  }
}
```

6. Update `startSyncExecution()` — change `carState` to `cursorState`, `'EXECUTING_SYNC'` stays the same.

7. Update `shouldStopAtPitStop()` — no changes needed (it's generic).

8. Update `nextState()` — replace all `carPosition` with `cursorPosition`, `carState` with `cursorState`, `'DRIVING'` with `'ORBITING'`, `CAR_SPEED` with `CURSOR_SPEED`.

- [ ] **Step 2: Update tests**

In `src/lib/__tests__/simulation.test.ts`, update all references:
- `state.carPosition` → `state.cursorPosition`
- `state.carState` → `state.cursorState`
- `'DRIVING'` → `'ORBITING'`

Also update the PIT_STOPS values used in test setup. Since microtask is now at position 0, the test for "stops at microtask queue" needs to set `cursorPosition` near 0 (e.g., 0.995 so it wraps around to cross 0):

```typescript
it('stops at microtask queue (~0) when queue is non-empty', () => {
  const state: SimulationState = {
    ...createInitialState(),
    cursorPosition: PIT_STOPS.microtask + 0.99, // just before wrapping to 0
    microtaskQueue: [{ id: '1', type: 'fetch', label: 'fetch()', color: '#ffffff' }],
  }
  // Need enough dt to wrap past 1.0 and hit 0
  const next = nextState(state, 200)
  expect(next.cursorState).toBe('STOPPED_AT_MICROTASK_QUEUE')
})
```

**Note:** With microtask at position 0, the pit stop check needs special handling for wrapping. Update the DRIVING case in `nextState` to check microtask AFTER wrapping:

```typescript
case 'ORBITING': {
  const prevPos = s.cursorPosition
  let newPos = prevPos + CURSOR_SPEED * dt

  // Check task and render pit stops (these are at 0.333 and 0.667 — no wrap issues)
  if (prevPos < PIT_STOPS.task && newPos >= PIT_STOPS.task - PIT_STOP_THRESHOLD) {
    if (s.taskQueue.length > 0) {
      return { ...s, cursorPosition: PIT_STOPS.task, cursorState: 'STOPPED_AT_TASK_QUEUE', executionTimer: STOP_PAUSE }
    }
  }

  if (prevPos < PIT_STOPS.render && newPos >= PIT_STOPS.render - PIT_STOP_THRESHOLD) {
    if (s.renderNeeded) {
      return { ...s, cursorPosition: PIT_STOPS.render, cursorState: 'STOPPED_AT_RENDER', executionTimer: STOP_PAUSE }
    }
  }

  // Wrap position
  if (newPos >= 1.0) {
    newPos = newPos - 1.0
    // Check microtask stop after wrap (position 0)
    if (s.microtaskQueue.length > 0) {
      return { ...s, cursorPosition: 0, cursorState: 'STOPPED_AT_MICROTASK_QUEUE', executionTimer: STOP_PAUSE }
    }
  }

  return { ...s, cursorPosition: newPos }
}
```

- [ ] **Step 3: Run tests**

Run: `bun run test`
Expected: All tests pass with the renamed fields and updated positions.

- [ ] **Step 4: Commit**

```bash
git add src/lib/simulation.ts src/lib/__tests__/simulation.test.ts
git commit -m "refactor: rename car→cursor, update pit stop positions to 120° spacing"
```

---

### Task 3: Update hooks and context

**Files:**
- Modify: `src/hooks/useEventLoopSimulation.ts`
- Modify: `src/contexts/EventLoopContext.tsx`

- [ ] **Step 1: Update useEventLoopSimulation.ts**

Rename all `carPosition` → `cursorPosition`, `positionHistory` → `cursorHistory` in the hook. The returned object should expose `cursorHistory` instead of `positionHistory`:

```typescript
export function useEventLoopSimulation() {
  const [state, setState] = useState<SimulationState>(createInitialState)
  const cursorHistory = useRef<number[]>([])
  // ... rest stays the same but references cursorPosition instead of carPosition

  return {
    state,
    cursorHistory,  // was: positionHistory
    togglePause,
    addTask: addTaskAction,
    reset,
    runScenario,
  }
}
```

- [ ] **Step 2: Update EventLoopContext.tsx**

Rename the context value type:

```typescript
type EventLoopContextValue = {
  state: SimulationState
  cursorHistory: React.RefObject<number[]>  // was: positionHistory
  runScenario: (scenarioId: string) => void
}
```

Update the provider to pass `cursorHistory` and the hook `useEventLoop` accordingly.

- [ ] **Step 3: Run tests**

Run: `bun run test`
Expected: All tests still pass (hook/context changes don't affect simulation tests).

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useEventLoopSimulation.ts src/contexts/EventLoopContext.tsx
git commit -m "refactor: rename positionHistory→cursorHistory in hooks and context"
```

---

### Task 4: Create `CircleTrack.tsx`

**Files:**
- Create: `src/components/event-loop/CircleTrack.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/event-loop/CircleTrack.tsx
'use client'

import { CIRCLE, ORBIT_PATH, STATION_POSITIONS } from '@/lib/circlePath'

interface CircleTrackProps {
  cursorPosition: number
  isExecuting: boolean
}

export function CircleTrack({ cursorPosition, isExecuting }: CircleTrackProps) {
  // For the static mockup we use SVG animateMotion.
  // In the real component, cursor position is driven by simulation state.
  // We compute cursor x,y from cursorPosition (0-1) on the circle.
  const angle = cursorPosition * 2 * Math.PI
  const cx = CIRCLE.cx + CIRCLE.r * Math.sin(angle)
  const cy = CIRCLE.cy - CIRCLE.r * Math.cos(angle)

  return (
    <>
      {/* Main circle */}
      <circle
        cx={CIRCLE.cx}
        cy={CIRCLE.cy}
        r={CIRCLE.r}
        fill="none"
        stroke="var(--color-chalk-faint)"
        strokeWidth={2}
      />

      {/* Anchor dots on the circle */}
      {Object.values(STATION_POSITIONS).map((station) => (
        <circle
          key={station.label}
          cx={station.anchor.x}
          cy={station.anchor.y}
          r={3}
          fill={station.color}
          opacity={0.4}
        />
      ))}

      {/* Cursor */}
      <rect
        x={cx - 7}
        y={cy - 7}
        width={14}
        height={14}
        rx={3}
        fill="var(--color-chalk)"
        opacity={0.9}
        style={{
          filter: isExecuting
            ? 'drop-shadow(0 0 6px rgba(232, 228, 220, 0.5))'
            : 'none',
        }}
      />
      {/* Cursor glow ring */}
      <rect
        x={cx - 11}
        y={cy - 11}
        width={22}
        height={22}
        rx={5}
        fill="none"
        stroke="var(--color-chalk)"
        strokeWidth={0.5}
        opacity={isExecuting ? 0.3 : 0.1}
      />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/event-loop/CircleTrack.tsx
git commit -m "feat: add CircleTrack component with cursor positioning"
```

---

### Task 5: Create `Station.tsx`

**Files:**
- Create: `src/components/event-loop/Station.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/event-loop/Station.tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { Task } from '@/lib/simulation'

interface StationProps {
  label: string
  color: string
  tasks: Task[]
  currentTask: Task | null
  isActive: boolean
  visibility: number
  // Positioning in SVG coordinates
  foreignObjectX: number
  foreignObjectY: number
  foreignObjectWidth: number
  foreignObjectHeight: number
  align?: 'left' | 'center' | 'right'
  // Render-specific
  renderSubSteps?: boolean
  renderProgress?: number
}

const RENDER_STEPS = ['rAF', 'Style', 'Layout', 'Paint']

export function Station({
  label,
  color,
  tasks,
  currentTask,
  isActive,
  visibility,
  foreignObjectX,
  foreignObjectY,
  foreignObjectWidth,
  foreignObjectHeight,
  align = 'left',
  renderSubSteps,
  renderProgress = 0,
}: StationProps) {
  const allTasks = currentTask ? [currentTask, ...tasks] : tasks
  const activeStep = renderSubSteps ? Math.floor(renderProgress * RENDER_STEPS.length) : -1

  return (
    <foreignObject
      x={foreignObjectX}
      y={foreignObjectY}
      width={foreignObjectWidth}
      height={foreignObjectHeight}
      overflow="visible"
      style={{
        opacity: 0.3 + visibility * 0.7,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        style={{ textAlign: align }}
      >
        {/* Station pill label */}
        <div
          className="font-mono text-[10px] font-bold tracking-wider uppercase inline-block"
          style={{
            padding: '5px 14px',
            borderRadius: '20px',
            background: `${color}0d`,
            border: `1px ${isActive ? 'solid' : 'dashed'} ${color}4d`,
            color,
            marginBottom: '6px',
          }}
        >
          {label}
        </div>

        {/* Detail panel */}
        {(allTasks.length > 0 || renderSubSteps) && (
          <div
            className="font-mono text-[9px] rounded-md"
            style={{
              padding: '6px 10px',
              background: 'var(--color-surface-card)',
              border: `1px solid ${color}33`,
              width: 'fit-content',
              ...(align === 'right' ? { marginLeft: 'auto' } : {}),
              ...(align === 'center' ? { margin: '0 auto' } : {}),
            }}
          >
            <AnimatePresence mode="popLayout">
              {renderSubSteps
                ? RENDER_STEPS.map((step, i) => (
                    <div
                      key={step}
                      className="font-mono text-[9px] rounded-sm"
                      style={{
                        padding: '2px 6px',
                        marginTop: i > 0 ? '3px' : 0,
                        background: `${color}12`,
                        color,
                        border: `1px solid ${color}1f`,
                        opacity: i <= activeStep ? 1 : 0.4,
                      }}
                    >
                      {step}
                    </div>
                  ))
                : allTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="font-mono text-[9px] rounded-sm"
                      style={{
                        padding: '2px 6px',
                        marginTop: '3px',
                        background: `${color}12`,
                        color,
                        border: `1px solid ${color}1f`,
                      }}
                    >
                      {task.label}
                    </motion.div>
                  ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </foreignObject>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/event-loop/Station.tsx
git commit -m "feat: add Station component for circle queue visualization"
```

---

### Task 6: Create `WebApiBox.tsx`

**Files:**
- Create: `src/components/event-loop/WebApiBox.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/event-loop/WebApiBox.tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { PendingWebAPI } from '@/lib/simulation'
import { WEB_API_POSITION } from '@/lib/circlePath'

interface WebApiBoxProps {
  pendingAPIs: PendingWebAPI[]
  visibility: number
}

export function WebApiBox({ pendingAPIs, visibility }: WebApiBoxProps) {
  return (
    <foreignObject
      x={WEB_API_POSITION.x}
      y={WEB_API_POSITION.y}
      width={170}
      height={120}
      overflow="visible"
      style={{
        opacity: 0.3 + visibility * 0.7,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div xmlns="http://www.w3.org/1999/xhtml">
        <div
          className="font-mono text-[9px] rounded-md"
          style={{
            padding: '8px 12px',
            background: 'var(--color-surface-card)',
            border: '1px dashed var(--color-chalk-dim)',
            textAlign: 'center',
          }}
        >
          <div
            className="font-display text-[9px] font-bold tracking-[0.15em] uppercase"
            style={{ color: 'var(--color-chalk-dim)', marginBottom: '5px' }}
          >
            Web APIs
          </div>
          <AnimatePresence mode="popLayout">
            {pendingAPIs.length === 0 ? (
              <div style={{ color: 'var(--color-chalk-faint)' }}>idle</div>
            ) : (
              pendingAPIs.map((api) => (
                <motion.div
                  key={api.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="font-mono text-[9px] rounded-sm"
                  style={{
                    padding: '2px 6px',
                    marginTop: '3px',
                    background: 'rgba(160, 154, 142, 0.07)',
                    color: 'var(--color-chalk-dim)',
                    border: '1px solid rgba(160, 154, 142, 0.12)',
                  }}
                >
                  {api.type === 'setTimeout' ? '⏱' : '↗'}{' '}
                  {(api.remainingDelay / 1000).toFixed(1)}s
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </foreignObject>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/event-loop/WebApiBox.tsx
git commit -m "feat: add WebApiBox component for external Web APIs display"
```

---

### Task 7: Rewrite `CallStack.tsx` for circle center

**Files:**
- Modify: `src/components/event-loop/CallStack.tsx`

- [ ] **Step 1: Rewrite CallStack to render inside SVG via foreignObject**

The call stack now lives inside the circle center instead of being a sticky side panel. It renders as a `foreignObject` in the SVG:

```typescript
// src/components/event-loop/CallStack.tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { CursorState, Task } from '@/lib/simulation'
import { CIRCLE } from '@/lib/circlePath'

interface CallStackProps {
  cursorState: CursorState
  currentTask: Task | null
  callStackFrames: string[]
  visibility: number
}

export function CallStack({
  cursorState,
  currentTask,
  callStackFrames,
  visibility,
}: CallStackProps) {
  // Derive display frames from state
  let frames: string[] = []
  if (cursorState === 'EXECUTING_SYNC') {
    frames = callStackFrames
  } else if (
    cursorState === 'EXECUTING_TASK' ||
    cursorState === 'EXECUTING_MICROTASK'
  ) {
    frames = currentTask ? ['global()', currentTask.label] : ['global()']
  } else if (cursorState === 'RENDERING') {
    frames = ['requestAnimationFrame()']
  }

  return (
    <foreignObject
      x={CIRCLE.cx - 80}
      y={CIRCLE.cy - 50}
      width={160}
      height={120}
      overflow="visible"
      style={{
        opacity: 0.3 + visibility * 0.7,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        style={{ textAlign: 'center' }}
      >
        <div
          className="font-display text-[9px] font-bold tracking-[0.15em] uppercase"
          style={{ color: 'var(--color-chalk)', marginBottom: '6px' }}
        >
          Call Stack
        </div>
        <div
          className="font-mono text-[9px] rounded-md"
          style={{
            padding: '6px 10px',
            margin: '0 auto',
            width: 'fit-content',
            minWidth: '80px',
            minHeight: '24px',
            background: 'var(--color-surface-card)',
            border: `1px ${frames.length > 0 ? 'solid' : 'dashed'} rgba(232, 228, 220, 0.2)`,
          }}
          role="list"
          aria-label="Call stack frames"
        >
          <AnimatePresence mode="popLayout">
            {frames.length === 0 ? (
              <div style={{ color: 'var(--color-chalk-faint)', fontSize: '8px' }}>
                (empty)
              </div>
            ) : (
              [...frames].reverse().map((frame, i) => (
                <motion.div
                  key={`${frame}-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  style={{
                    padding: '2px 6px',
                    marginTop: i > 0 ? '3px' : 0,
                    borderRadius: '3px',
                    background: 'rgba(232, 228, 220, 0.07)',
                    color: 'var(--color-chalk)',
                    border: '1px solid rgba(232, 228, 220, 0.12)',
                  }}
                >
                  {frame}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </foreignObject>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/event-loop/CallStack.tsx
git commit -m "refactor: move CallStack inside circle center as SVG foreignObject"
```

---

### Task 8: Rewrite `EventLoopViz.tsx`

**Files:**
- Modify: `src/components/event-loop/EventLoopViz.tsx`

- [ ] **Step 1: Rewrite to compose circle components**

```typescript
// src/components/event-loop/EventLoopViz.tsx
'use client'

import { CircleTrack } from './CircleTrack'
import { Station } from './Station'
import { WebApiBox } from './WebApiBox'
import { CallStack } from './CallStack'
import { useEventLoop } from '@/contexts/EventLoopContext'
import { VIEWBOX, STATION_POSITIONS } from '@/lib/circlePath'
import { EXECUTION_DURATION } from '@/lib/simulation'

interface EventLoopVizProps {
  getStageVisibility: (stage: number) => number
}

const CURSOR_STATE_LABELS: Record<string, string> = {
  ORBITING: 'Cursor orbiting the event loop',
  STOPPED_AT_MICROTASK_QUEUE: 'Stopped at microtask queue',
  EXECUTING_MICROTASK: 'Executing microtask',
  STOPPED_AT_TASK_QUEUE: 'Stopped at task queue',
  EXECUTING_TASK: 'Executing task',
  STOPPED_AT_RENDER: 'Stopped at render step',
  RENDERING: 'Rendering in progress',
  EXECUTING_SYNC: 'Executing synchronous code',
}

export function EventLoopViz({ getStageVisibility }: EventLoopVizProps) {
  const { state } = useEventLoop()

  const isAtMicrotask =
    state.cursorState === 'STOPPED_AT_MICROTASK_QUEUE' ||
    state.cursorState === 'EXECUTING_MICROTASK'
  const isAtTask =
    state.cursorState === 'STOPPED_AT_TASK_QUEUE' ||
    state.cursorState === 'EXECUTING_TASK'
  const isAtRender =
    state.cursorState === 'STOPPED_AT_RENDER' ||
    state.cursorState === 'RENDERING'
  const isExecuting =
    state.cursorState === 'EXECUTING_TASK' ||
    state.cursorState === 'EXECUTING_MICROTASK' ||
    state.cursorState === 'RENDERING' ||
    state.cursorState === 'EXECUTING_SYNC'

  const renderProgress =
    state.cursorState === 'RENDERING'
      ? 1 - state.executionTimer / EXECUTION_DURATION
      : 0

  const statusLabel = CURSOR_STATE_LABELS[state.cursorState] ?? 'Simulation running'
  const taskDetail = state.currentTask ? `: ${state.currentTask.label}` : ''

  return (
    <div className="relative w-full h-full flex flex-col" role="application" aria-label="Event loop visualization">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {statusLabel}{taskDetail}
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center">
        <svg viewBox={VIEWBOX} className="w-full h-full max-h-full">
          <CircleTrack
            cursorPosition={state.cursorPosition}
            isExecuting={isExecuting}
          />

          {/* Call Stack — center of circle */}
          <CallStack
            cursorState={state.cursorState}
            currentTask={state.currentTask}
            callStackFrames={state.callStackFrames}
            visibility={getStageVisibility(2)}
          />

          {/* Microtask Queue — 12 o'clock */}
          <Station
            label={STATION_POSITIONS.microtask.label}
            color={STATION_POSITIONS.microtask.color}
            tasks={state.microtaskQueue}
            currentTask={isAtMicrotask ? state.currentTask : null}
            isActive={isAtMicrotask}
            visibility={getStageVisibility(5)}
            foreignObjectX={190}
            foreignObjectY={35}
            foreignObjectWidth={220}
            foreignObjectHeight={90}
            align="center"
          />

          {/* Task Queue — ~5 o'clock */}
          <Station
            label={STATION_POSITIONS.task.label}
            color={STATION_POSITIONS.task.color}
            tasks={state.taskQueue}
            currentTask={isAtTask ? state.currentTask : null}
            isActive={isAtTask}
            visibility={getStageVisibility(4)}
            foreignObjectX={460}
            foreignObjectY={370}
            foreignObjectWidth={180}
            foreignObjectHeight={100}
          />

          {/* Render — ~7 o'clock */}
          <Station
            label={STATION_POSITIONS.render.label}
            color={STATION_POSITIONS.render.color}
            tasks={[]}
            currentTask={null}
            isActive={isAtRender}
            visibility={getStageVisibility(6)}
            foreignObjectX={-40}
            foreignObjectY={370}
            foreignObjectWidth={180}
            foreignObjectHeight={130}
            align="right"
            renderSubSteps
            renderProgress={renderProgress}
          />

          {/* Web APIs — external box, right side */}
          <WebApiBox
            pendingAPIs={state.pendingWebAPIs}
            visibility={getStageVisibility(3)}
          />

          {/* Annotation */}
          <text
            x={300}
            y={525}
            textAnchor="middle"
            fontFamily="'Playfair Display', serif"
            fontStyle="italic"
            fontSize={10}
            fill="var(--color-chalk-faint)"
          >
            one task per lap — all microtasks drain first
          </text>
        </svg>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/event-loop/EventLoopViz.tsx
git commit -m "feat: rewrite EventLoopViz with circle layout"
```

---

### Task 9: Update MDX content

**Files:**
- Modify: `src/posts/the-js-event-loop-works.mdx`

- [ ] **Step 1: Remove race/car metaphor language**

Go through the MDX and replace car/race/track analogies with circle/cursor language. Key changes:
- "F1 car" → "cursor" or "JS thread"
- "race track" → "event loop circle"
- "pit stop" → "station"
- "lap" → "loop iteration" or "cycle"
- "driving" → "orbiting"
- Keep the educational content and structure identical

- [ ] **Step 2: Commit**

```bash
git add src/posts/the-js-event-loop-works.mdx
git commit -m "docs: update MDX content to use circle/cursor metaphor"
```

---

### Task 10: Delete old track components

**Files:**
- Delete: `src/lib/trackPath.ts`
- Delete: `src/components/event-loop/Track.tsx`
- Delete: `src/components/event-loop/Car.tsx`
- Delete: `src/components/event-loop/PitStop.tsx`
- Delete: `src/components/event-loop/Garage.tsx`
- Delete: `src/components/event-loop/TaskBlock.tsx`

- [ ] **Step 1: Verify no remaining imports**

Run: `bun run build`

If build passes, the old files are safe to delete. If there are import errors, fix them first.

- [ ] **Step 2: Delete old files**

```bash
git rm src/lib/trackPath.ts
git rm src/components/event-loop/Track.tsx
git rm src/components/event-loop/Car.tsx
git rm src/components/event-loop/PitStop.tsx
git rm src/components/event-loop/Garage.tsx
git rm src/components/event-loop/TaskBlock.tsx
```

- [ ] **Step 3: Final build check**

Run: `bun run build`
Expected: Clean build with no errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old track/car/pitstop components"
```

---

### Task 11: Visual verification

- [ ] **Step 1: Run dev server and verify**

Run: `bun run dev`

Open in browser and scroll through all 6 sections. Verify:
1. Circle renders with cursor orbiting
2. Call stack shows inside the circle
3. Web APIs box appears at stage 3
4. Task Queue station appears at stage 4
5. Microtask Queue station appears at stage 5
6. Render station appears at stage 6
7. All RunCode scenarios still work (click Run on each)
8. Cursor stops at correct stations when queues have items
