# requestAnimationFrame as Async Effect — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Model `requestAnimationFrame` as an async effect that registers a callback with the browser and delivers it to the render station — just like `setTimeout` delivers to the callback queue and `fetch` delivers to the microtask queue.

**Architecture:** Add `'rAF'` as a new `TaskType`. When called during sync stepping, rAF registers an async effect that places a callback into a new `rAfCallbacks` queue. The render pit stop checks this queue (instead of the boolean `renderNeeded`). When the cursor stops at render, it dequeues and executes rAF callbacks — showing the callback label (e.g., `requestAnimationFrame`) under the Render station, just like other stations show their tasks.

**Tech Stack:** TypeScript, Vitest, Zustand, React/SVG

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/simulation.ts` | Modify | Add `'rAF'` to `TaskType`, add `rAfCallbacks` to state, route rAF through `tickWebAPIs` into `rAfCallbacks`, check `rAfCallbacks` at render pit stop, dequeue during RENDERING |
| `src/lib/scenarios.ts` | Modify | Give the rAF push op an `asyncEffect: { type: 'rAF' }` with a descriptive label |
| `src/components/event-loop/EventLoopViz.tsx` | Modify | Pass `rAfCallbacks` to render Station as its `tasks` prop |
| `src/stores/eventLoopStore.ts` | Modify | Expose `rAfCallbacks` from the store |
| `src/lib/__tests__/simulation.test.ts` | Modify | Update existing tests, add new rAF-specific tests |

---

### Task 1: Add `'rAF'` to TaskType and route it in `tickWebAPIs`

**Files:**
- Modify: `src/lib/simulation.ts`
- Test: `src/lib/__tests__/simulation.test.ts`

- [ ] **Step 1: Write failing test — rAF pending API resolves into rAfCallbacks (not task/microtask queues)**

Add this test to a new `describe('rAF routing')` block in `src/lib/__tests__/simulation.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test`
Expected: FAIL — `'rAF'` is not assignable to type `TaskType`, `rAfCallbacks` does not exist on `SimulationState`

- [ ] **Step 3: Implement — add `'rAF'` type, `rAfCallbacks` state field, and routing**

In `src/lib/simulation.ts`:

1. Change `TaskType`:
```typescript
export type TaskType = 'setTimeout' | 'fetch' | 'rAF'
```

2. Add to `SimulationState`:
```typescript
rAfCallbacks: Task[]
```

3. Add to `createInitialState()`:
```typescript
rAfCallbacks: [],
```

4. Add `'rAF'` to `COLOR_MAP`:
```typescript
const COLOR_MAP: Record<TaskType, string> = {
  setTimeout: '#888888',
  fetch: '#ffffff',
  rAF: '#ffffff',
}
```

5. In `tickWebAPIs`, add rAF routing alongside setTimeout/fetch:
```typescript
const newRAfCallbacks: Task[] = []

// Inside the for loop, change the if/else:
if (api.type === 'setTimeout') {
  newTasks.push(task)
} else if (api.type === 'rAF') {
  newRAfCallbacks.push(task)
} else {
  newMicrotasks.push(task)
}

// In the return:
rAfCallbacks: [...state.rAfCallbacks, ...newRAfCallbacks],
```

6. Add `rAfCallbacks: []` to `stepForward`'s ORBITING transition (line ~174) alongside the other cleared fields.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test`
Expected: The new test passes. Some existing tests may fail due to missing `rAfCallbacks` field — fix those next.

- [ ] **Step 5: Fix existing tests that broke**

The test on line 490 (`expect(state.renderNeeded).toBe(false)`) now fails because we changed `stepForward` to set `renderNeeded: true` when there are pending web APIs. Update this assertion:

```typescript
// OLD:
expect(state.renderNeeded).toBe(false)

// NEW:
expect(state.renderNeeded).toBe(true)
```

Run: `bun run test`
Expected: ALL tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/simulation.ts src/lib/__tests__/simulation.test.ts
git commit -m "feat: add rAF as TaskType, route to rAfCallbacks in simulation"
```

---

### Task 2: Use `rAfCallbacks` to control render pit stop (replace `renderNeeded` boolean)

**Files:**
- Modify: `src/lib/simulation.ts`
- Test: `src/lib/__tests__/simulation.test.ts`

- [ ] **Step 1: Write failing test — cursor stops at render when rAfCallbacks is non-empty**

```typescript
it('stops at render pit stop when rAfCallbacks is non-empty', () => {
  const state: SimulationState = {
    ...createInitialState(),
    cursorPosition: PIT_STOPS.render - 0.005,
    rAfCallbacks: [{ id: '1', type: 'rAF', label: 'requestAnimationFrame', color: '#ffffff' }],
  }
  const next = nextState(state, 100)
  expect(next.cursorState).toBe('STOPPED_AT_RENDER')
  expect(next.cursorPosition).toBeCloseTo(PIT_STOPS.render, 2)
})

it('skips render pit stop when rAfCallbacks is empty', () => {
  const state: SimulationState = {
    ...createInitialState(),
    cursorPosition: PIT_STOPS.render - 0.005,
    rAfCallbacks: [],
  }
  const next = nextState(state, 100)
  expect(next.cursorState).toBe('ORBITING')
  expect(next.cursorPosition).toBeGreaterThan(PIT_STOPS.render)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test`
Expected: FAIL — the render pit stop still checks `renderNeeded` boolean, not `rAfCallbacks`

- [ ] **Step 3: Implement — replace `renderNeeded` check with `rAfCallbacks.length`**

In `src/lib/simulation.ts`, in the `ORBITING` case of `nextState`:

```typescript
// OLD:
if (prevPos < PIT_STOPS.render && newPos >= PIT_STOPS.render) {
  if (s.renderNeeded) {

// NEW:
if (prevPos < PIT_STOPS.render && newPos >= PIT_STOPS.render) {
  if (s.rAfCallbacks.length > 0) {
```

Remove the `renderNeeded` field from `SimulationState`, `createInitialState()`, `addTask()`, the RENDERING case's completion transition, and `stepForward`'s transition. Remove it everywhere — it's fully replaced by `rAfCallbacks.length > 0`.

- [ ] **Step 4: Update all existing tests that reference `renderNeeded`**

Search for `renderNeeded` in the test file and update:

- `expect(state.renderNeeded).toBe(false)` → remove these assertions
- `expect(state.renderNeeded).toBe(true)` → remove these assertions
- `renderNeeded: false` in test state setup → remove (no longer exists)
- `renderNeeded: true` in test state setup → replace with `rAfCallbacks: [{ id: 'r1', type: 'rAF', label: 'rAF', color: '#fff' }]`
- The "stops at render stop when renderNeeded is true" test → replaced by our new test above
- The "skips render stop when renderNeeded is false" test → replaced by our new test above

- [ ] **Step 5: Run test to verify all pass**

Run: `bun run test`
Expected: ALL tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/simulation.ts src/lib/__tests__/simulation.test.ts
git commit -m "feat: replace renderNeeded boolean with rAfCallbacks queue"
```

---

### Task 3: Dequeue rAF callbacks during RENDERING state

**Files:**
- Modify: `src/lib/simulation.ts`
- Test: `src/lib/__tests__/simulation.test.ts`

- [ ] **Step 1: Write failing test — STOPPED_AT_RENDER transitions to RENDERING and dequeues first rAF callback as currentTask**

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test`
Expected: FAIL — STOPPED_AT_RENDER currently creates a hardcoded currentTask instead of dequeuing from rAfCallbacks

- [ ] **Step 3: Implement — dequeue from rAfCallbacks in STOPPED_AT_RENDER and RENDERING transitions**

In `src/lib/simulation.ts`, update the `STOPPED_AT_RENDER` case:

```typescript
case 'STOPPED_AT_RENDER': {
  const timer = s.executionTimer - dt
  if (timer <= 0) {
    const [first, ...rest] = s.rAfCallbacks
    return {
      ...s,
      cursorState: 'RENDERING',
      executionTimer: EXECUTION_DURATION,
      currentTask: first ?? null,
      rAfCallbacks: rest,
    }
  }
  return { ...s, executionTimer: timer }
}
```

The `RENDERING` case stays the same (already transitions to ORBITING and clears currentTask).

- [ ] **Step 4: Run test to verify all pass**

Run: `bun run test`
Expected: ALL tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/simulation.ts src/lib/__tests__/simulation.test.ts
git commit -m "feat: dequeue rAF callbacks during render step"
```

---

### Task 4: Give rAF an `asyncEffect` in the render-step scenario

**Files:**
- Modify: `src/lib/scenarios.ts`
- Modify: `src/lib/simulation.ts` (label generation in `buildSyncSnapshots`)
- Test: `src/lib/__tests__/simulation.test.ts`

- [ ] **Step 1: Write failing test — rAF push creates a pending web API that routes to rAfCallbacks**

```typescript
it('render-step scenario: rAF push creates a pending web API with type rAF', () => {
  const scenario = SCENARIOS['render-step']
  const { snapshots, finalWebAPIs } = buildSyncSnapshots(scenario.syncOps!, 0)

  // Step 0: after rAF push — web API appears (rAF type)
  expect(snapshots[0].pendingWebAPIs).toHaveLength(1)
  expect(snapshots[0].pendingWebAPIs[0].type).toBe('rAF')
  expect(snapshots[0].pendingWebAPIs[0].label).toBe('requestAnimationFrame')

  // finalWebAPIs should have 3 entries: rAF, setTimeout, fetch
  expect(finalWebAPIs).toHaveLength(3)
  expect(finalWebAPIs[0].type).toBe('rAF')
  expect(finalWebAPIs[1].type).toBe('setTimeout')
  expect(finalWebAPIs[2].type).toBe('fetch')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test`
Expected: FAIL — rAF push op has no `asyncEffect`, so no web API is created at step 0

- [ ] **Step 3: Implement — add asyncEffect to rAF in scenario and label generation**

In `src/lib/scenarios.ts`, update the render-step scenario's first syncOp:

```typescript
// OLD:
{ action: 'push', name: 'requestAnimationFrame()', line: 0 },

// NEW:
{ action: 'push', name: 'requestAnimationFrame()', line: 0, asyncEffect: { type: 'rAF' } },
```

In `src/lib/simulation.ts`, update `buildSyncSnapshots` label generation to handle rAF:

```typescript
// OLD:
label: type === 'setTimeout' ? `setTimeout(${resolvedDelay}ms)` : 'fetch()',

// NEW:
label: type === 'rAF' ? 'requestAnimationFrame' : type === 'setTimeout' ? `setTimeout(${resolvedDelay}ms)` : 'fetch()',
```

Also update the delay resolution to treat rAF like setTimeout (immediate, delay 0):

```typescript
// OLD:
const resolvedDelay = type === 'fetch' ? 999999 : (d ?? 0)

// NEW:
const resolvedDelay = type === 'fetch' ? 999999 : (d ?? 0)
```

(No change needed — rAF with no delay defaults to 0, which is correct.)

- [ ] **Step 4: Update existing render-step tests that expect no web API at step 0**

Several existing tests in `describe('stepping with asyncEffect')` and `describe('scenario step count alignment')` assert that step 0 (rAF push) has no pending web APIs. Update them:

In `stepping with asyncEffect`:
```typescript
// OLD assertions for steps 0-1:
expect(snapshots[0].pendingWebAPIs).toEqual([])
expect(snapshots[1].pendingWebAPIs).toEqual([])

// NEW:
expect(snapshots[0].pendingWebAPIs).toHaveLength(1)
expect(snapshots[0].pendingWebAPIs[0].type).toBe('rAF')
expect(snapshots[1].pendingWebAPIs).toHaveLength(1) // rAF persists after pop
```

Update `finalWebAPIs` count: `expect(finalWebAPIs).toHaveLength(3)` (was 2).

Update the `startStepping` test: `expect(state.pendingWebAPIs).toHaveLength(1)` (was 0) and `expect(state.steppingFinalWebAPIs).toHaveLength(3)` (was 2).

Update the `stepForward reveals web APIs` test: step 0 now has 1 API (rAF), step 2 has 2 APIs, step 4 has 3 APIs.

Update the `stepBack removes web APIs` test: stepping back to step 1 has 1 API (rAF), stepping back to step 0 has 1 API (rAF).

Update the `final stepForward` test: `expect(state.pendingWebAPIs).toHaveLength(3)` (was 2).

Update the `render-step has 6 ops` scenario test: step 0 has 1 web API (rAF), step 2 has 2, step 4 has 3.

Update the `buildSyncSnapshots generates unique IDs` test: the IDs shift because rAF is now the first async effect.

- [ ] **Step 5: Run test to verify all pass**

Run: `bun run test`
Expected: ALL tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/scenarios.ts src/lib/simulation.ts src/lib/__tests__/simulation.test.ts
git commit -m "feat: rAF push registers async effect that routes to render station"
```

---

### Task 5: Wire rAfCallbacks to the UI

**Files:**
- Modify: `src/stores/eventLoopStore.ts`
- Modify: `src/components/event-loop/EventLoopViz.tsx`

- [ ] **Step 1: Expose `rAfCallbacks` from the store**

In `src/stores/eventLoopStore.ts`, add `rAfCallbacks` to the `useShallow` selector in any component that needs it. No changes needed to the store definition itself since `SimulationState` already includes `rAfCallbacks` and the store spreads `createInitialState()`.

- [ ] **Step 2: Pass `rAfCallbacks` to the Render station in EventLoopViz**

In `src/components/event-loop/EventLoopViz.tsx`:

1. Add `rAfCallbacks` to the destructured store values:
```typescript
const { currentTask, taskQueue, microtaskQueue, pendingWebAPIs, callStackFrames, rAfCallbacks } =
  useEventLoopStore(useShallow((s) => ({
    currentTask: s.currentTask,
    taskQueue: s.taskQueue,
    microtaskQueue: s.microtaskQueue,
    pendingWebAPIs: s.pendingWebAPIs,
    callStackFrames: s.callStackFrames,
    rAfCallbacks: s.rAfCallbacks,
  })))
```

2. Update the Render station to pass `rAfCallbacks` as its `tasks` prop:
```typescript
<Station
  label={STATION_POSITIONS.render.label}
  color={STATION_POSITIONS.render.color}
  tasks={rAfCallbacks}
  currentTask={isAtRender ? currentTask : null}
  ...
/>
```

- [ ] **Step 3: Verify visually**

Run: `bun run dev`
Navigate to `http://localhost:3000/the-js-event-loop-works`, scroll to the render-step scenario, run it, and step through. Verify:
- Step 0: `requestAnimationFrame()` appears on call stack AND a web API entry appears in the Web APIs box
- After finishing stepping: the cursor orbits, stops at the callback queue (setTimeout), then stops at the render station showing `requestAnimationFrame` task, then wraps to microtask queue (fetch)
- The Render station shows the `requestAnimationFrame` label when the cursor is there

Take a screenshot to confirm.

- [ ] **Step 4: Commit**

```bash
git add src/stores/eventLoopStore.ts src/components/event-loop/EventLoopViz.tsx
git commit -m "feat: wire rAfCallbacks to render station UI"
```

---

### Task 6: End-to-end simulation test for the render-step scenario

**Files:**
- Test: `src/lib/__tests__/simulation.test.ts`

- [ ] **Step 1: Write test — full render-step scenario orbit hits all three stations in correct order**

```typescript
describe('render-step end-to-end', () => {
  it('cursor visits callback queue, render station, then microtask queue in order', () => {
    const scenario = SCENARIOS['render-step']
    let state = startStepping(createInitialState(), scenario.syncOps!, 'render-step')

    // Step through all 6 sync ops
    for (let i = 0; i < scenario.syncOps!.length; i++) {
      state = stepForward(state)
    }
    expect(state.cursorState).toBe('ORBITING')
    // Should have 3 pending web APIs: rAF, setTimeout(0ms), fetch(placeholder)
    expect(state.pendingWebAPIs).toHaveLength(3)

    // Simulate fetch resolving (like the store does)
    state = resolveFetch(state, 'fetch → "Luke"')

    // Tick once to resolve pending APIs (rAF and setTimeout have 0ms delay)
    state = nextState(state, 16)
    // rAF(0ms) → rAfCallbacks, setTimeout(0ms) → taskQueue, fetch still ticking
    expect(state.rAfCallbacks).toHaveLength(1)
    expect(state.taskQueue).toHaveLength(1)

    // Advance cursor to task queue pit stop (0.333)
    // Cursor starts at 0, needs to reach 0.333. At speed 0.0001/ms, need ~3333ms
    let statesVisited: string[] = []
    for (let i = 0; i < 500; i++) {
      state = nextState(state, 20)
      if (!statesVisited.includes(state.cursorState)) {
        statesVisited.push(state.cursorState)
      }
      // If we've visited enough states, break early
      if (statesVisited.length >= 7) break
    }

    // Should have visited these states (in order of first appearance):
    expect(statesVisited).toContain('STOPPED_AT_TASK_QUEUE')
    expect(statesVisited).toContain('EXECUTING_TASK')
    expect(statesVisited).toContain('STOPPED_AT_RENDER')
    expect(statesVisited).toContain('RENDERING')
  })
})
```

- [ ] **Step 2: Run test to verify it passes**

Run: `bun run test`
Expected: PASS — the full scenario correctly routes through all stations.

- [ ] **Step 3: Commit**

```bash
git add src/lib/__tests__/simulation.test.ts
git commit -m "test: add end-to-end test for render-step scenario orbit"
```

---

### Task 7: Clean up — update Web API box display for rAF entries

**Files:**
- Modify: `src/components/event-loop/WebApiBox.tsx`

- [ ] **Step 1: Read and check WebApiBox display**

Read `src/components/event-loop/WebApiBox.tsx` to see how pending APIs are displayed. The rAF entry should show appropriately (e.g., "rAF" or "requestAnimationFrame" with a timer). Since rAF has delay 0, it will resolve almost instantly — verify the display label from `buildSyncSnapshots` is `'requestAnimationFrame'` and looks correct in the Web APIs box.

- [ ] **Step 2: Verify visually with Playwright**

Run the render-step scenario and take a screenshot at step 0 (after rAF push). The Web APIs box should show the `requestAnimationFrame` entry. Since it resolves at delay 0, it will flash briefly before moving to rAfCallbacks.

- [ ] **Step 3: Commit if changes were needed**

```bash
git add src/components/event-loop/WebApiBox.tsx
git commit -m "fix: display rAF entries correctly in Web APIs box"
```
