# Design: imcurious.how/the-event-loop-works

An interactive, F1-themed blog post explaining the JavaScript event loop. A single F1 car (the main thread) races around a figure-eight track, making pit stops at task/microtask queues and the rendering pipeline. Built with Next.js, MDX, Framer Motion, and Tailwind CSS.

---

## Core Decisions

| Decision | Choice |
|----------|--------|
| Track rendering | SVG path for track + car, HTML overlays for pit stop UIs |
| Scroll mechanism | Framer Motion `useScroll` / `useTransform` (continuous scroll-linked) |
| Simulation engine | Tick-based state machine via `requestAnimationFrame` |
| Track shape | Stylized figure-eight faithful to Jake Archibald's shape, with F1 visual details (kerbs, pit lane markers) |
| Architecture | Separated engine + presentation (hooks for logic, components for UI) |
| Visual style | Neon/gradient aesthetic — illustrative, not realistic |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) |
| Animation | Framer Motion |
| Content | MDX (Markdown + React components) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## Project Structure

```
imcurious/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout (fonts, metadata)
│   │   ├── page.tsx                  # Homepage (future: post index)
│   │   └── [slug]/
│   │       └── page.tsx              # MDX post renderer
│   ├── posts/
│   │   └── the-event-loop-works.mdx  # Blog post content
│   ├── components/
│   │   ├── mdx/                      # MDX provider + custom elements
│   │   └── event-loop/               # Event loop visualization
│   │       ├── Track.tsx             # SVG figure-eight track
│   │       ├── Car.tsx               # F1 car on the path
│   │       ├── PitStop.tsx           # HTML overlay for queue/render stops
│   │       ├── TaskBlock.tsx         # Individual task block in a queue
│   │       ├── Controls.tsx          # Play/pause + task buttons + delay slider
│   │       ├── EventLoopViz.tsx      # Orchestrator: composes all viz components
│   │       └── ScrollStage.tsx       # Sticky layout wrapper
│   ├── hooks/
│   │   ├── useEventLoopSimulation.ts # State machine + tick loop
│   │   └── useScrollStage.ts         # Scroll position → stage + animation values
│   └── lib/
│       ├── trackPath.ts              # SVG path data + pit stop positions
│       └── simulation.ts             # Pure simulation logic (no React)
├── public/
├── next.config.mjs
├── tailwind.config.ts
└── package.json
```

---

## Simulation Engine

### State Machine

The car cycles through states as it laps the track:

```
DRIVING → STOPPED_AT_MICROTASK_QUEUE → EXECUTING_MICROTASK → (loop until drained) → DRIVING →
STOPPED_AT_TASK_QUEUE → EXECUTING_TASK → DRIVING →
STOPPED_AT_RENDER → RENDERING → DRIVING → (back to start)
```

Note: Microtask queue comes before task queue in the lap order, matching the real event loop's priority rule (microtasks always drain before the next task runs).

### State Shape

```ts
type CarState =
  | 'DRIVING'
  | 'STOPPED_AT_TASK_QUEUE'
  | 'EXECUTING_TASK'
  | 'STOPPED_AT_MICROTASK_QUEUE'
  | 'EXECUTING_MICROTASK'
  | 'STOPPED_AT_RENDER'
  | 'RENDERING'

type Task = {
  id: string
  type: 'setTimeout' | 'fetch'   // v2: 'setInterval'
  label: string
  delay?: number
  color: string
}

type SimulationState = {
  carPosition: number            // 0–1 on the SVG path
  carState: CarState
  taskQueue: Task[]
  microtaskQueue: Task[]
  renderNeeded: boolean
  isPaused: boolean
  currentTask: Task | null
}
```

### Tick Loop (requestAnimationFrame)

Each frame:
1. If paused or executing → don't advance car position
2. Advance `carPosition` by a fixed increment
3. Check pit stop thresholds:
   - **Microtask queue (~0.25)**: If queue non-empty, stop, drain ALL (one-by-one with visual pauses), resume
   - **Task queue (~0.50)**: If queue non-empty, stop, dequeue ONE task, execute (visual pause), resume
   - **Render (~0.75)**: If `renderNeeded`, stop briefly (show sub-step labels lighting up), resume. Otherwise drive through.
4. Wrap at 1.0 → 0.0

### Adding Tasks

**"Add setTimeout(Xms)":**
1. Task appears in the "garage" (Web API area) with a countdown
2. After delay elapses → task moves to task queue
3. Car picks it up next time it reaches the task queue pit stop

**"Add fetch":**
1. "Request" appears in the garage
2. After simulated network delay (random 500–1500ms) → callback moves to microtask queue
3. Car drains it when reaching the microtask pit stop

### Pure Logic (simulation.ts)

```ts
nextState(state: SimulationState, deltaTime: number): SimulationState
addTask(state: SimulationState, type: TaskType, delay?: number): SimulationState
shouldStopAtPitStop(carPosition: number, stopPosition: number, queue: Task[]): boolean
```

No React dependencies. Testable independently.

---

## Track Geometry & Rendering

### SVG Path

The figure-eight is a single SVG `<path>` defined in `trackPath.ts`:
- `0.0` = top of the loop (start/finish line)
- Path crosses over itself at center (figure-eight intersection)
- Pit stops at fixed positions: ~0.25 (microtask queue), ~0.50 (task queue), ~0.75 (render)

### Visual Layers (bottom to top)

1. **Track surface** — dark asphalt path with wide stroke, subtle CSS noise texture
2. **Track lines** — dashed center line, outer boundary lines
3. **Kerb stripes** — red/white at curves (SVG patterns)
4. **Pit stop zones** — colored glow regions where path widens (CSS `filter: drop-shadow`)
5. **Start/finish line** — checkered pattern at position 0.0
6. **Car** — F1 car SVG group, positioned via `getPointAtLength()`, rotated to path tangent

### Car Positioning

```ts
const point = pathEl.getPointAtLength(carPosition * totalLength)
const next = pathEl.getPointAtLength((carPosition + 0.001) * totalLength)
const angle = Math.atan2(next.y - point.y, next.x - point.x)
```

### Pit Stop HTML Overlays

Absolutely-positioned `<div>`s anchored to SVG path coordinates. Each contains:
- Label ("Task Queue" / "Microtask Queue" / "Render")
- Row of `<TaskBlock />` components (colored blocks)
- Framer Motion `AnimatePresence` for block entry/exit

### Progressive Reveal

Elements have a `visibleFromStage` prop controlled by `useScrollStage`:
- Stages 1–2: Track + car only
- Stage 3: "Garage" / Web API area fades in
- Stage 4: Task queue pit stop appears
- Stage 5: Microtask queue pit stop appears
- Stage 6: Render stop appears
- Stage 7: Everything visible, controls fully active

Entry animation: opacity 0→1, scale 0.8→1, subtle y-shift, via Framer Motion.

---

## Scroll Orchestration & Layout

### useScrollStage Hook

```ts
type ScrollStage = {
  activeStage: number                              // 1–7
  stageProgress: number                            // 0–1 within current stage
  getStageVisibility: (stage: number) => number    // 0–1 for progressive reveal
}
```

Uses `useScroll({ target: contentRef })` to get scroll progress, maps ranges to stages. `getStageVisibility(n)` returns 0 before stage n, transitions 0→1 during entry, stays at 1 after (elements don't disappear on scroll-past).

### Layout

**Desktop (≥1024px):** Side-by-side sticky layout
- Left: Track pane (`position: sticky; top: 0; height: 100vh; width: ~50%`)
- Right: Scrollable MDX text (`width: ~50%`)

**Mobile (<1024px):** Stacked sticky layout
- Top: Track pane (`position: sticky; top: 0; height: 45vh`)
- Below: Scrollable MDX text

### Controls Placement

Play/pause and task buttons live inside the track pane, pinned to the bottom. Always accessible regardless of scroll. Compressed to a compact row on mobile.

---

## MDX Blog Infrastructure

### Dynamic Route

`src/app/[slug]/page.tsx` imports MDX files from `src/posts/` by slug. New posts = new `.mdx` files.

### Post Structure

```mdx
export const metadata = { title: '...', description: '...', slug: 'the-event-loop-works' }

<ScrollStage>
  <EventLoopViz slot="visualization" />

  <Section stage={1}>
  ## The Race Begins
  JavaScript has one thread...
  </Section>

  <Section stage={2}>
  ## The Call Stack
  Every time you call a function...
  </Section>

  <!-- sections 3–7 -->
</ScrollStage>
```

`<ScrollStage>` receives the visualization via a named slot and sections as children. Handles sticky layout and scroll tracking.

### SEO

- `generateMetadata()` pulls from MDX exports (title, description, Open Graph)
- Semantic HTML (article, section, heading hierarchy)

---

## Phasing

### v1 (Ship first)
- Next.js + MDX blog scaffold
- Evolving F1 track visualization (progressive reveal via scroll)
- Car animating around figure-eight loop
- Play/pause control
- "Add setTimeout" button with delay slider + "Add fetch" button
- Task queue pit stop: car stops, executes one task
- Microtask queue pit stop: car stops, drains all
- Simplified render stop (one stop, sub-step labels)
- Hybrid sticky layout (desktop side-by-side, mobile top-sticky)
- Full educational text across 7 sections
- Deployed to Vercel at imcurious.how/the-event-loop-works

### v2
- Console/log panel showing execution order
- Pre-built scenarios with guided challenges
- "Break it" mode (microtask starvation demo)
- setInterval support with interval slider
- Potential: step-through mode, speed slider

---

## Key Behaviors the Visualization Must Demonstrate

1. **Single-threaded**: One car, one track, one thing at a time
2. **Run-to-completion**: Each task runs fully before anything else
3. **Task queue — one per loop**: Car picks up ONE task per lap
4. **Microtask queue — drain all**: Car stays until ALL microtasks are processed
5. **Microtasks before tasks**: If both queues have items, microtasks go first
6. **Rendering is optional**: Car can skip the render stop
7. **Web APIs run in parallel**: Timers and fetch happen off-track (garage), callbacks queue when ready
8. **Microtask starvation** (v2): Infinite microtasks block rendering indefinitely
