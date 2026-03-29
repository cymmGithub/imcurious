# Section-Driven Scenarios for Event Loop Blog Post

## Problem

The current blog post has a free-form interactive interface (Add setTimeout, Add fetch, delay slider, Play/Pause, Reset) that disconnects the visualization from the content. Readers must figure out what to add and when. The new approach ties predefined code directly to each section, building concepts gradually as the reader scrolls.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Trigger mechanism | Explicit ▶ Run button per code block |
| Reset behavior on new Run | Queue on top (additive) — tasks stack on running sim |
| Progressive complexity | Strict — each snippet only uses concepts introduced so far |
| Sync task support | Yes — new `sync` task type for Call Stack section |
| Car during sync execution | Stops in place (blocking metaphor) |
| Call stack frame names | Custom names matching the code snippet |
| Section 7 ("Your Turn") | Removed — article ends at section 6 (Rendering) |
| Global Play/Pause/Reset | None — each Run button is self-contained |
| Initial car state | Driving on load (event loop always runs) |
| Run block design | Code block + slim bottom action bar with ▶ Run |
| Section 1 | Purely text — first Run button appears in section 2 |

## Section → Scenario Mapping

### Section 1: Intro (no scenario)
Text only. Car driving on track with no pit stops visible yet.

### Section 2: Call Stack → `sync-callstack`
```js
function greet(name) {
  return `Hello, ${name}!`;
}

function welcome() {
  const message = greet("world");
  console.log(message);
}

welcome();
```
**Simulation behavior:** Car stops in place. Call stack shows frames pushing/popping sequentially:
1. Push `welcome()`
2. Push `greet("world")`
3. Pop `greet("world")` (returns)
4. Push `console.log()`
5. Pop `console.log()`
6. Pop `welcome()` (returns)
7. Car resumes driving

**Only visible:** Track + Car + Call Stack dashboard

### Section 3: Web APIs → `webapi-settimeout`
```js
console.log("Start");

setTimeout(() => {
  console.log("Timer done");
}, 1000);

console.log("End");
```
**Simulation behavior:**
- Sync frames push/pop for `console.log("Start")` and `console.log("End")`
- `setTimeout` enters the Garage (Web APIs zone) with 1000ms countdown
- After countdown, callback moves to task queue (but task queue pit stop not yet visible at this stage)

**Newly visible:** Garage / Web APIs zone

### Section 4: Task Queue → `task-queue-ordering`
```js
setTimeout(() => console.log("A"), 0);
setTimeout(() => console.log("B"), 0);
console.log("C");
```
**Simulation behavior:**
- Sync frame for `console.log("C")` runs immediately
- Both setTimeout callbacks enter Garage → immediately move to task queue (0ms delay)
- Car picks up "A" first (one per lap), then "B" on next lap

**Newly visible:** Task Queue pit stop

### Section 5: Microtask Queue → `microtask-priority`
```js
setTimeout(() => console.log("Task"), 0);

Promise.resolve().then(() => console.log("Microtask"));

console.log("Sync");
```
**Simulation behavior:**
- `console.log("Sync")` runs as sync frame
- setTimeout callback → task queue
- Promise `.then()` → microtask queue
- Car hits microtask pit stop first (position 0.25) → drains it
- Then task pit stop (position 0.50) → picks up the setTimeout callback

**Newly visible:** Microtask Queue pit stop

### Section 6: Rendering → `render-step`
```js
requestAnimationFrame(() => {
  document.body.style.background = "blue";
});

setTimeout(() => console.log("Task"), 0);

Promise.resolve().then(() => console.log("Microtask"));
```
**Simulation behavior:**
- `renderNeeded` flag set
- setTimeout callback → task queue
- Promise → microtask queue
- Car processes microtask queue first, then task queue, then stops at render pit stop
- Render sub-steps animate: rAF → Style → Layout → Paint

**Newly visible:** Render pit stop with sub-steps

## Architecture

### React Context for Cross-Pane Communication

The simulation state lives in the sticky left pane (`EventLoopViz`), but Run buttons live in the scrollable right pane (MDX content). These are sibling trees under `ScrollStage`.

**Solution:** Create `EventLoopContext` that wraps both panes.

```
ScrollStage
  └─ EventLoopProvider (owns useEventLoopSimulation)
       ├─ EventLoopViz (consumes state, renders visualization)
       └─ MDX Content (RunCode components consume runScenario)
```

### New Simulation Concepts

#### Sync Task Type
Extend `TaskType` to include `'sync'`. A sync task:
- Does NOT go through Web APIs / Garage
- Goes directly to call stack execution
- Car stops at current position
- Requires a `frames` array for sequential push/pop display

#### Scenario Data Model
```ts
type SyncStep = {
  type: 'sync'
  frames: string[]  // e.g. ['welcome()', 'greet("world")']
}

type AsyncStep = {
  type: 'setTimeout' | 'fetch'
  delay?: number
  label?: string
}

type Scenario = {
  id: string
  steps: (SyncStep | AsyncStep)[]
}
```

### New Components

#### `RunCode` (MDX component)
- Receives `scenarioId` prop
- Renders syntax-highlighted code block (hardcoded in scenario data)
- Slim bottom bar with ▶ Run button
- On click: calls `runScenario(id)` from context
- Matches existing code block styling (`--color-surface-card` background, `--color-chalk-faint` border)

### Removed Components

- `Controls.tsx` — delete entirely (no global controls)
- Controls section in `EventLoopViz.tsx` — remove the bottom `<div>` that renders `<Controls>`

### Modified Components

- `ScrollStage.tsx` — wrap children in `EventLoopProvider`
- `EventLoopViz.tsx` — consume from context instead of direct hook, remove Controls
- `useScrollStage.ts` — change `TOTAL_STAGES` from 7 to 6
- `simulation.ts` — add sync task type, frames-based execution
- `useEventLoopSimulation.ts` — add `runScenario()` method
- `CallStack.tsx` — support displaying custom frame names from sync scenarios
- `mdx-components.tsx` + `MDXProvider.tsx` — register `RunCode` component

### MDX Content Changes

- Replace static code blocks in sections 2-6 with `<RunCode scenarioId="...">` components
- Remove section 7 entirely
- Keep all other content (text, callouts, non-runnable code blocks in section 1)

## Verification

1. `bun run build` — no build errors
2. `bun run dev` — navigate to the blog post
3. Scroll through all 6 sections — verify progressive disclosure still works
4. Click Run on each section's code block — verify correct tasks appear in the simulation
5. Click Run on section 5 while section 4's tasks are still processing — verify additive behavior
6. Verify the call stack shows custom function names for section 2's sync demo
7. Verify no Controls component renders anywhere
8. Check mobile responsiveness (stacked layout)
