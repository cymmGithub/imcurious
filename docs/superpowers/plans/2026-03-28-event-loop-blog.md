# Event Loop Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive, F1-themed blog post at `imcurious.how/the-event-loop-works` that teaches the JavaScript event loop through a figure-eight track visualization with pit stops.

**Architecture:** Separated engine + presentation. Pure simulation logic in `simulation.ts` (no React), React hook `useEventLoopSimulation` for the tick loop, Framer Motion `useScroll` for scroll-linked progressive reveal. SVG track with HTML overlay pit stops.

**Tech Stack:** Next.js (App Router), Framer Motion, MDX, Tailwind CSS, Vitest

**Spec:** `docs/superpowers/specs/2026-03-28-event-loop-blog-design.md`

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Initialize Next.js project**

Run from the project root (`/home/cymm/projects/imcurious`):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

Select defaults when prompted. The `--no-git` flag preserves the existing git repo.

- [ ] **Step 2: Install dependencies**

```bash
npm install framer-motion @next/mdx @mdx-js/loader @mdx-js/react
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Add Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: Add test script to package.json**

Add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Configure fonts in layout.tsx**

Replace the default `src/app/layout.tsx` with:

```tsx
import type { Metadata } from 'next'
import { Orbitron, Space_Mono } from 'next/font/google'
import './globals.css'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'imcurious.how',
  description: 'Interactive explorations of how things work',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${orbitron.variable} ${spaceMono.variable}`}>
      <body className="bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Set up base globals.css**

Replace `src/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-neon-cyan: #00f5ff;
  --color-neon-pink: #ff006e;
  --color-neon-yellow: #ffbe0b;
  --color-neon-green: #06d6a0;
  --color-track-surface: #1a1a2e;
  --color-track-line: #4a4a6a;
}

body {
  font-family: var(--font-space-mono), monospace;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-orbitron), sans-serif;
}
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: Next.js dev server starts on `localhost:3000`, shows default page with custom fonts loading.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind, Framer Motion, MDX, Vitest"
```

---

### Task 2: MDX Infrastructure

**Files:**
- Modify: `next.config.mjs`
- Create: `src/components/mdx/MDXProvider.tsx`, `src/components/mdx/Section.tsx`, `src/app/[slug]/page.tsx`, `src/posts/the-event-loop-works.mdx`

- [ ] **Step 1: Configure Next.js for MDX**

Replace `next.config.mjs`:

```js
import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

export default withMDX(nextConfig)
```

- [ ] **Step 2: Create MDX component provider**

Create `src/components/mdx/MDXProvider.tsx`:

```tsx
import { MDXProvider as BaseMDXProvider } from '@mdx-js/react'
import type { ComponentPropsWithoutRef } from 'react'

const components = {
  h1: (props: ComponentPropsWithoutRef<'h1'>) => (
    <h1 className="font-orbitron text-4xl font-bold tracking-tight text-white mb-6" {...props} />
  ),
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="font-orbitron text-2xl font-bold tracking-tight text-white mt-16 mb-4" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="font-orbitron text-xl font-semibold text-gray-200 mt-8 mb-3" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="text-gray-300 leading-relaxed mb-4" {...props} />
  ),
  code: (props: ComponentPropsWithoutRef<'code'>) => (
    <code className="bg-gray-800 text-[var(--color-neon-cyan)] px-1.5 py-0.5 rounded text-sm font-space-mono" {...props} />
  ),
  pre: (props: ComponentPropsWithoutRef<'pre'>) => (
    <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto mb-6" {...props} />
  ),
  strong: (props: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="text-white font-bold" {...props} />
  ),
}

export function MDXProvider({ children }: { children: React.ReactNode }) {
  return <BaseMDXProvider components={components}>{children}</BaseMDXProvider>
}
```

- [ ] **Step 3: Create Section component**

Create `src/components/mdx/Section.tsx`:

```tsx
'use client'

import { useRef } from 'react'

interface SectionProps {
  stage: number
  children: React.ReactNode
}

export function Section({ stage, children }: SectionProps) {
  const ref = useRef<HTMLElement>(null)

  return (
    <section
      ref={ref}
      data-stage={stage}
      className="min-h-[60vh] py-12"
    >
      {children}
    </section>
  )
}
```

- [ ] **Step 4: Create dynamic slug route**

Create `src/app/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { MDXProvider } from '@/components/mdx/MDXProvider'

// Map of valid slugs to their MDX imports
const posts: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  'the-event-loop-works': () => import('@/posts/the-event-loop-works.mdx'),
}

export function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (slug === 'the-event-loop-works') {
    return {
      title: 'How the Event Loop Works | imcurious.how',
      description:
        'An interactive, F1-themed guide to the JavaScript event loop. Watch a race car navigate task queues, microtasks, and rendering.',
    }
  }
  return {}
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const loader = posts[slug]
  if (!loader) notFound()

  const { default: Post } = await loader()

  return (
    <article className="mx-auto">
      <MDXProvider>
        <Post />
      </MDXProvider>
    </article>
  )
}
```

- [ ] **Step 5: Create stub MDX post**

Create `src/posts/the-event-loop-works.mdx`:

```mdx
# How the Event Loop Works

An interactive, F1-themed guide to the JavaScript event loop.

<Section stage={1}>

## The Race Begins

JavaScript has one thread — like an F1 race has one car on one track. Everything happens in sequence: one thing at a time, start to finish. This is both JavaScript's greatest constraint and its most important feature to understand.

</Section>

<Section stage={2}>

## The Call Stack

Every time you call a function, it goes onto the **call stack**. When the function returns, it comes off. The car is always executing whatever is on top of the stack.

</Section>
```

Note: This is a stub — full content comes in Task 12.

- [ ] **Step 6: Add Section import to MDX config**

The Section component needs to be available in MDX without explicit imports. Update `src/components/mdx/MDXProvider.tsx` — add to the `components` object:

```tsx
import { Section } from './Section'

// Add to the components object:
const components = {
  Section,
  // ... existing components
}
```

- [ ] **Step 7: Verify MDX post renders**

```bash
npm run dev
```

Navigate to `http://localhost:3000/the-event-loop-works`. Expected: the post renders with styled headings and body text.

- [ ] **Step 8: Commit**

```bash
git add src/components/mdx/ src/app/\[slug\]/ src/posts/ next.config.mjs
git commit -m "feat: MDX infrastructure with dynamic slug route and styled components"
```

---

### Task 3: Simulation Types and Pure Logic

**Files:**
- Create: `src/lib/simulation.ts`, `src/lib/__tests__/simulation.test.ts`

- [ ] **Step 1: Write failing tests for core simulation**

Create `src/lib/__tests__/simulation.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  nextState,
  addTask,
  shouldStopAtPitStop,
  PIT_STOPS,
} from '../simulation'
import type { SimulationState } from '../simulation'

describe('createInitialState', () => {
  it('returns a valid initial state', () => {
    const state = createInitialState()
    expect(state.carPosition).toBe(0)
    expect(state.carState).toBe('DRIVING')
    expect(state.taskQueue).toEqual([])
    expect(state.microtaskQueue).toEqual([])
    expect(state.isPaused).toBe(false)
    expect(state.currentTask).toBeNull()
  })
})

describe('nextState', () => {
  it('advances car position when driving', () => {
    const state = createInitialState()
    const next = nextState(state, 16) // ~1 frame at 60fps
    expect(next.carPosition).toBeGreaterThan(0)
    expect(next.carState).toBe('DRIVING')
  })

  it('does not advance car position when paused', () => {
    const state = { ...createInitialState(), isPaused: true }
    const next = nextState(state, 16)
    expect(next.carPosition).toBe(0)
  })

  it('wraps car position from 1.0 back to 0.0', () => {
    const state = { ...createInitialState(), carPosition: 0.999 }
    const next = nextState(state, 16)
    expect(next.carPosition).toBeLessThan(1)
    expect(next.carPosition).toBeGreaterThanOrEqual(0)
  })

  it('stops at microtask queue when queue is non-empty', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.microtask - 0.001,
      microtaskQueue: [
        { id: '1', type: 'fetch', label: 'fetch callback', color: '#06d6a0' },
      ],
    }
    const next = nextState(state, 16)
    expect(next.carState).toBe('STOPPED_AT_MICROTASK_QUEUE')
  })

  it('drives through microtask queue when queue is empty', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.microtask - 0.001,
      microtaskQueue: [],
    }
    const next = nextState(state, 16)
    expect(next.carState).toBe('DRIVING')
  })

  it('stops at task queue when queue is non-empty', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.task - 0.001,
      taskQueue: [
        { id: '1', type: 'setTimeout', label: 'setTimeout cb', delay: 0, color: '#ffbe0b' },
      ],
    }
    const next = nextState(state, 16)
    expect(next.carState).toBe('STOPPED_AT_TASK_QUEUE')
  })

  it('transitions from STOPPED_AT_MICROTASK_QUEUE to EXECUTING_MICROTASK', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.microtask,
      carState: 'STOPPED_AT_MICROTASK_QUEUE',
      microtaskQueue: [
        { id: '1', type: 'fetch', label: 'fetch callback', color: '#06d6a0' },
      ],
    }
    const next = nextState(state, 500) // enough time to start executing
    expect(next.carState).toBe('EXECUTING_MICROTASK')
    expect(next.currentTask).not.toBeNull()
  })

  it('drains all microtasks before leaving microtask pit stop', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.microtask,
      carState: 'EXECUTING_MICROTASK',
      microtaskQueue: [
        { id: '2', type: 'fetch', label: 'fetch callback 2', color: '#06d6a0' },
      ],
      currentTask: { id: '1', type: 'fetch', label: 'fetch callback 1', color: '#06d6a0' },
      executionTimer: 0, // execution complete
    }
    // After finishing current task, should pick up next microtask, not leave
    const next = nextState(state, 500)
    expect(['EXECUTING_MICROTASK', 'STOPPED_AT_MICROTASK_QUEUE']).toContain(next.carState)
  })

  it('executes only ONE task from the task queue per lap', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.task,
      carState: 'EXECUTING_TASK',
      taskQueue: [
        { id: '2', type: 'setTimeout', label: 'cb 2', delay: 0, color: '#ffbe0b' },
      ],
      currentTask: { id: '1', type: 'setTimeout', label: 'cb 1', delay: 0, color: '#ffbe0b' },
      executionTimer: 0,
    }
    const next = nextState(state, 500)
    // Should leave the pit stop, not pick up task 2
    expect(next.carState).toBe('DRIVING')
    expect(next.taskQueue).toHaveLength(1)
  })

  it('skips render stop when renderNeeded is false', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.render - 0.001,
      renderNeeded: false,
    }
    const next = nextState(state, 16)
    expect(next.carState).toBe('DRIVING')
  })

  it('stops at render stop when renderNeeded is true', () => {
    const state: SimulationState = {
      ...createInitialState(),
      carPosition: PIT_STOPS.render - 0.001,
      renderNeeded: true,
    }
    const next = nextState(state, 16)
    expect(next.carState).toBe('STOPPED_AT_RENDER')
  })
})

describe('addTask', () => {
  it('adds a setTimeout task to the web APIs (pending)', () => {
    const state = createInitialState()
    const next = addTask(state, 'setTimeout', 500)
    expect(next.pendingWebAPIs).toHaveLength(1)
    expect(next.pendingWebAPIs[0].type).toBe('setTimeout')
    expect(next.pendingWebAPIs[0].remainingDelay).toBe(500)
  })

  it('adds a fetch task to the web APIs (pending)', () => {
    const state = createInitialState()
    const next = addTask(state, 'fetch')
    expect(next.pendingWebAPIs).toHaveLength(1)
    expect(next.pendingWebAPIs[0].type).toBe('fetch')
  })

  it('moves setTimeout to task queue when delay elapses', () => {
    const state: SimulationState = {
      ...createInitialState(),
      pendingWebAPIs: [
        { id: '1', type: 'setTimeout', label: 'setTimeout(100)', color: '#ffbe0b', remainingDelay: 10 },
      ],
    }
    const next = nextState(state, 20)
    expect(next.pendingWebAPIs).toHaveLength(0)
    expect(next.taskQueue).toHaveLength(1)
  })

  it('moves fetch callback to microtask queue when delay elapses', () => {
    const state: SimulationState = {
      ...createInitialState(),
      pendingWebAPIs: [
        { id: '1', type: 'fetch', label: 'fetch callback', color: '#06d6a0', remainingDelay: 10 },
      ],
    }
    const next = nextState(state, 20)
    expect(next.pendingWebAPIs).toHaveLength(0)
    expect(next.microtaskQueue).toHaveLength(1)
  })
})

describe('shouldStopAtPitStop', () => {
  it('returns true when car crosses pit stop with non-empty queue', () => {
    expect(shouldStopAtPitStop(0.24, 0.25, 0.26, ['task'])).toBe(true)
  })

  it('returns false when queue is empty', () => {
    expect(shouldStopAtPitStop(0.24, 0.25, 0.26, [])).toBe(false)
  })

  it('returns false when car has not crossed pit stop', () => {
    expect(shouldStopAtPitStop(0.20, 0.25, 0.22, ['task'])).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: All tests FAIL — `simulation.ts` doesn't exist yet.

- [ ] **Step 3: Implement simulation.ts**

Create `src/lib/simulation.ts`:

```ts
export type CarState =
  | 'DRIVING'
  | 'STOPPED_AT_TASK_QUEUE'
  | 'EXECUTING_TASK'
  | 'STOPPED_AT_MICROTASK_QUEUE'
  | 'EXECUTING_MICROTASK'
  | 'STOPPED_AT_RENDER'
  | 'RENDERING'

export type TaskType = 'setTimeout' | 'fetch'

export type Task = {
  id: string
  type: TaskType
  label: string
  delay?: number
  color: string
}

export type PendingWebAPI = Task & {
  remainingDelay: number
}

export type SimulationState = {
  carPosition: number
  carState: CarState
  taskQueue: Task[]
  microtaskQueue: Task[]
  pendingWebAPIs: PendingWebAPI[]
  renderNeeded: boolean
  isPaused: boolean
  currentTask: Task | null
  executionTimer: number
}

// Pit stop positions on the path (0–1)
export const PIT_STOPS = {
  microtask: 0.25,
  task: 0.50,
  render: 0.75,
} as const

// How fast the car moves (path units per millisecond)
const CAR_SPEED = 0.0001

// How long a task "executes" visually (ms)
const EXECUTION_DURATION = 600

// How long the car pauses at a pit stop before starting (ms)
const STOP_PAUSE = 200

// How close the car needs to be to trigger a pit stop
const PIT_STOP_THRESHOLD = 0.02

let nextId = 1
function generateId(): string {
  return String(nextId++)
}

const TASK_COLORS: Record<TaskType, string> = {
  setTimeout: '#ffbe0b',
  fetch: '#06d6a0',
}

export function createInitialState(): SimulationState {
  return {
    carPosition: 0,
    carState: 'DRIVING',
    taskQueue: [],
    microtaskQueue: [],
    pendingWebAPIs: [],
    renderNeeded: false,
    isPaused: false,
    currentTask: null,
    executionTimer: 0,
  }
}

export function shouldStopAtPitStop(
  prevPosition: number,
  pitStopPosition: number,
  newPosition: number,
  queue: unknown[],
): boolean {
  if (queue.length === 0) return false
  return prevPosition < pitStopPosition && newPosition >= pitStopPosition
}

export function addTask(
  state: SimulationState,
  type: TaskType,
  delay?: number,
): SimulationState {
  const id = generateId()
  const actualDelay =
    type === 'fetch'
      ? delay ?? 500 + Math.random() * 1000 // 500–1500ms for fetch
      : delay ?? 0

  const label =
    type === 'setTimeout'
      ? `setTimeout(${actualDelay}ms)`
      : 'fetch callback'

  const pending: PendingWebAPI = {
    id,
    type,
    label,
    color: TASK_COLORS[type],
    remainingDelay: actualDelay,
  }

  return {
    ...state,
    pendingWebAPIs: [...state.pendingWebAPIs, pending],
    renderNeeded: true,
  }
}

function tickWebAPIs(state: SimulationState, dt: number): SimulationState {
  const stillPending: PendingWebAPI[] = []
  const newTasks: Task[] = []
  const newMicrotasks: Task[] = []

  for (const api of state.pendingWebAPIs) {
    const remaining = api.remainingDelay - dt
    if (remaining <= 0) {
      const task: Task = {
        id: api.id,
        type: api.type,
        label: api.label,
        color: api.color,
      }
      if (api.type === 'fetch') {
        newMicrotasks.push(task)
      } else {
        newTasks.push(task)
      }
    } else {
      stillPending.push({ ...api, remainingDelay: remaining })
    }
  }

  return {
    ...state,
    pendingWebAPIs: stillPending,
    taskQueue: [...state.taskQueue, ...newTasks],
    microtaskQueue: [...state.microtaskQueue, ...newMicrotasks],
  }
}

export function nextState(
  state: SimulationState,
  dt: number,
): SimulationState {
  if (state.isPaused) return state

  // Always tick web APIs regardless of car state
  let s = tickWebAPIs(state, dt)

  switch (s.carState) {
    case 'DRIVING': {
      const prevPosition = s.carPosition
      let newPosition = prevPosition + CAR_SPEED * dt
      const wrapped = newPosition >= 1 ? newPosition - 1 : newPosition

      // Check pit stops in order: microtask → task → render
      if (shouldStopAtPitStop(prevPosition, PIT_STOPS.microtask, newPosition, s.microtaskQueue)) {
        return {
          ...s,
          carPosition: PIT_STOPS.microtask,
          carState: 'STOPPED_AT_MICROTASK_QUEUE',
          executionTimer: STOP_PAUSE,
        }
      }

      if (shouldStopAtPitStop(prevPosition, PIT_STOPS.task, newPosition, s.taskQueue)) {
        return {
          ...s,
          carPosition: PIT_STOPS.task,
          carState: 'STOPPED_AT_TASK_QUEUE',
          executionTimer: STOP_PAUSE,
        }
      }

      if (prevPosition < PIT_STOPS.render && newPosition >= PIT_STOPS.render) {
        if (s.renderNeeded) {
          return {
            ...s,
            carPosition: PIT_STOPS.render,
            carState: 'STOPPED_AT_RENDER',
            executionTimer: STOP_PAUSE,
          }
        }
        // Drive through — render not needed
      }

      return { ...s, carPosition: wrapped }
    }

    case 'STOPPED_AT_MICROTASK_QUEUE': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        // Start executing first microtask
        const [task, ...rest] = s.microtaskQueue
        return {
          ...s,
          carState: 'EXECUTING_MICROTASK',
          currentTask: task,
          microtaskQueue: rest,
          executionTimer: EXECUTION_DURATION,
        }
      }
      return { ...s, executionTimer: timer }
    }

    case 'EXECUTING_MICROTASK': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        // Finished executing — drain more or leave
        if (s.microtaskQueue.length > 0) {
          const [task, ...rest] = s.microtaskQueue
          return {
            ...s,
            carState: 'EXECUTING_MICROTASK',
            currentTask: task,
            microtaskQueue: rest,
            executionTimer: EXECUTION_DURATION,
          }
        }
        // All drained — resume driving
        return {
          ...s,
          carState: 'DRIVING',
          currentTask: null,
          executionTimer: 0,
        }
      }
      return { ...s, executionTimer: timer }
    }

    case 'STOPPED_AT_TASK_QUEUE': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        const [task, ...rest] = s.taskQueue
        return {
          ...s,
          carState: 'EXECUTING_TASK',
          currentTask: task,
          taskQueue: rest,
          executionTimer: EXECUTION_DURATION,
        }
      }
      return { ...s, executionTimer: timer }
    }

    case 'EXECUTING_TASK': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        // Only ONE task per lap — leave immediately
        return {
          ...s,
          carState: 'DRIVING',
          currentTask: null,
          executionTimer: 0,
        }
      }
      return { ...s, executionTimer: timer }
    }

    case 'STOPPED_AT_RENDER': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        return {
          ...s,
          carState: 'RENDERING',
          executionTimer: EXECUTION_DURATION,
        }
      }
      return { ...s, executionTimer: timer }
    }

    case 'RENDERING': {
      const timer = s.executionTimer - dt
      if (timer <= 0) {
        return {
          ...s,
          carState: 'DRIVING',
          renderNeeded: false,
          executionTimer: 0,
        }
      }
      return { ...s, executionTimer: timer }
    }

    default:
      return s
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/simulation.ts src/lib/__tests__/simulation.test.ts
git commit -m "feat: pure simulation engine with state machine and tests"
```

---

### Task 4: Track Path Geometry

**Files:**
- Create: `src/lib/trackPath.ts`

- [ ] **Step 1: Define the figure-eight SVG path and pit stop coordinates**

Create `src/lib/trackPath.ts`:

```ts
// Figure-eight track path for a 800x600 viewBox.
// The path forms two loops crossing at the center.
// Top loop goes clockwise, bottom loop goes counter-clockwise.
export const VIEWBOX = { width: 800, height: 600 }

// Figure-eight path: starts at top center, loops right-down through center,
// loops left-down through center, back to top.
export const TRACK_PATH =
  'M 400 80 ' +
  'C 580 80 700 200 700 300 ' +   // top-right curve
  'C 700 400 580 480 400 480 ' +   // bottom-right curve (approach center from right)
  'C 220 480 100 400 100 300 ' +   // bottom-left curve
  'C 100 200 220 80 400 80 Z'      // top-left curve back to start

// This creates an oval. For a true figure-eight, we need two loops that cross.
// Using two separate sub-paths that share a crossing point:
export const TRACK_PATH_EIGHT =
  // Upper loop (clockwise): starts top-center, goes right, crosses center, goes left, back to top
  'M 400 100 ' +
  'C 600 100 700 180 700 260 ' +   // to right
  'C 700 340 600 400 470 340 ' +   // curve down toward center-right
  'L 330 260 ' +                    // cross through center (going to lower-left)
  'C 200 180 100 180 100 260 ' +   // lower-left curve
  'C 100 340 200 420 400 500 ' +   // bottom
  'C 600 420 700 340 700 260 ' +   // THIS DOESN'T WORK for figure-8

// Better approach: define as a single continuous path that actually crosses itself.
// Using cubic beziers to create the lemniscate (figure-eight / infinity) shape.
export const FIGURE_EIGHT_PATH = [
  'M 400 300',           // center crossing point
  'C 400 180 600 80 700 180',    // up-right to top-right curve
  'C 800 280 680 420 400 300',   // back down to center (right loop complete)
  'C 120 180 200 80 300 180',    // FROM center, up-left to top-left curve — BUT this doesn't trace correctly
].join(' ')

// Final approach: a well-tested lemniscate approximation with beziers.
// Two lobes, crossing at center. Trace: center → right lobe (clockwise) → center → left lobe (clockwise) → center.
export const TRACK_D = [
  // Start at center crossing
  'M 400 300',
  // Right lobe: go up-right, around right side, back to center
  'C 500 200, 700 120, 700 300',  // up and out to right
  'C 700 480, 500 400, 400 300',  // back down to center
  // Left lobe: go up-left, around left side, back to center
  'C 300 200, 100 120, 100 300',  // up and out to left
  'C 100 480, 300 400, 400 300',  // back down to center
].join(' ')

// Pit stop positions as approximate (x, y) coordinates on the track
// and their corresponding path position (0–1 along the total path length).
// These will be refined once we can measure the actual path in the browser.
export const PIT_STOP_POSITIONS = {
  microtask: {
    pathT: 0.25,
    label: 'Microtask Queue',
    // Right lobe, top-right area
    anchor: { x: 700, y: 200 },
    labelOffset: { x: 40, y: -30 },
    color: 'var(--color-neon-green)',
  },
  task: {
    pathT: 0.50,
    label: 'Task Queue',
    // Center-bottom (between the two lobes)
    anchor: { x: 400, y: 420 },
    labelOffset: { x: 0, y: 40 },
    color: 'var(--color-neon-yellow)',
  },
  render: {
    pathT: 0.75,
    label: 'Render',
    // Left lobe, top-left area
    anchor: { x: 100, y: 200 },
    labelOffset: { x: -40, y: -30 },
    color: 'var(--color-neon-pink)',
  },
} as const

// Web API "garage" area position (off-track)
export const GARAGE_POSITION = {
  x: 400,
  y: 40,
  label: 'Web APIs',
}

// Start/finish line position
export const START_FINISH = {
  pathT: 0,
  anchor: { x: 400, y: 300 },
}
```

Note: The exact bezier values for the figure-eight will need visual tuning once the Track component renders. The path positions (`pathT`) correspond to the `PIT_STOPS` constants in `simulation.ts`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/trackPath.ts
git commit -m "feat: track path geometry with figure-eight beziers and pit stop positions"
```

---

### Task 5: Track and Car SVG Components

**Files:**
- Create: `src/components/event-loop/Track.tsx`, `src/components/event-loop/Car.tsx`

- [ ] **Step 1: Create the Track SVG component**

Create `src/components/event-loop/Track.tsx`:

```tsx
'use client'

import { forwardRef } from 'react'
import { TRACK_D, VIEWBOX } from '@/lib/trackPath'

interface TrackProps {
  className?: string
}

export const Track = forwardRef<SVGPathElement, TrackProps>(
  function Track({ className }, ref) {
    return (
      <svg
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        className={className}
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          {/* Neon glow filter */}
          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Checkered pattern for start/finish */}
          <pattern id="checker" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" fill="white" />
            <rect x="5" y="5" width="5" height="5" fill="white" />
            <rect x="5" width="5" height="5" fill="#333" />
            <rect y="5" width="5" height="5" fill="#333" />
          </pattern>

          {/* Kerb stripe pattern */}
          <pattern id="kerb" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="12" fill="#e63946" />
            <rect x="6" width="6" height="12" fill="white" />
          </pattern>
        </defs>

        {/* Track surface — wide dark stroke */}
        <path
          d={TRACK_D}
          fill="none"
          stroke="var(--color-track-surface)"
          strokeWidth={60}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Track edge lines */}
        <path
          d={TRACK_D}
          fill="none"
          stroke="var(--color-track-line)"
          strokeWidth={62}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.5}
        />

        {/* Center dashed line */}
        <path
          d={TRACK_D}
          fill="none"
          stroke="var(--color-track-line)"
          strokeWidth={2}
          strokeDasharray="8 12"
          opacity={0.4}
        />

        {/* The actual path (invisible) for car to follow — this gets the ref */}
        <path
          ref={ref}
          d={TRACK_D}
          fill="none"
          stroke="transparent"
          strokeWidth={1}
        />

        {/* Track glow */}
        <path
          d={TRACK_D}
          fill="none"
          stroke="var(--color-neon-cyan)"
          strokeWidth={64}
          opacity={0.04}
          filter="url(#neon-glow)"
        />
      </svg>
    )
  },
)
```

- [ ] **Step 2: Create the Car SVG component**

Create `src/components/event-loop/Car.tsx`:

```tsx
'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface CarProps {
  pathRef: React.RefObject<SVGPathElement | null>
  position: number // 0–1 along the path
  isExecuting: boolean
}

export function Car({ pathRef, position, isExecuting }: CarProps) {
  const carRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const path = pathRef.current
    const car = carRef.current
    if (!path || !car) return

    const totalLength = path.getTotalLength()
    const point = path.getPointAtLength(position * totalLength)

    // Get next point for rotation
    const epsilon = 0.001
    const nextPos = Math.min(position + epsilon, 0.999)
    const nextPoint = path.getPointAtLength(nextPos * totalLength)
    const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x)
    const degrees = (angle * 180) / Math.PI

    // Get the SVG's bounding rect to convert SVG coords to screen coords
    const svg = path.ownerSVGElement
    if (!svg) return

    const svgRect = svg.getBoundingClientRect()
    const viewBox = svg.viewBox.baseVal

    const scaleX = svgRect.width / viewBox.width
    const scaleY = svgRect.height / viewBox.height

    const screenX = point.x * scaleX
    const screenY = point.y * scaleY

    car.style.transform = `translate(${screenX}px, ${screenY}px) rotate(${degrees}deg)`
  }, [pathRef, position])

  return (
    <div
      ref={carRef}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ willChange: 'transform' }}
    >
      {/* F1 car shape */}
      <svg
        width="32"
        height="16"
        viewBox="0 0 32 16"
        className="block -translate-x-1/2 -translate-y-1/2"
      >
        {/* Car body */}
        <rect x="4" y="4" width="24" height="8" rx="2" fill="var(--color-neon-cyan)" />
        {/* Nose */}
        <polygon points="28,6 32,8 28,10" fill="var(--color-neon-cyan)" />
        {/* Rear wing */}
        <rect x="2" y="2" width="3" height="12" rx="1" fill="var(--color-neon-cyan)" opacity="0.8" />
        {/* Wheels */}
        <rect x="8" y="2" width="4" height="3" rx="1" fill="#333" />
        <rect x="8" y="11" width="4" height="3" rx="1" fill="#333" />
        <rect x="22" y="2" width="4" height="3" rx="1" fill="#333" />
        <rect x="22" y="11" width="4" height="3" rx="1" fill="#333" />

        {/* Glow effect when executing */}
        {isExecuting && (
          <rect
            x="4" y="4" width="24" height="8" rx="2"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.6"
          >
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="0.5s"
              repeatCount="indefinite"
            />
          </rect>
        )}
      </svg>
    </div>
  )
}
```

- [ ] **Step 3: Verify track renders in browser**

Temporarily add to `src/app/page.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { Track } from '@/components/event-loop/Track'
import { Car } from '@/components/event-loop/Car'

export default function Home() {
  const pathRef = useRef<SVGPathElement>(null)
  return (
    <div className="relative w-full max-w-3xl mx-auto aspect-[4/3] bg-gray-900">
      <Track ref={pathRef} />
      <Car pathRef={pathRef} position={0.25} isExecuting={false} />
    </div>
  )
}
```

Run `npm run dev` and check `localhost:3000`. Expected: figure-eight track visible with a cyan car positioned at ~0.25 on the path.

- [ ] **Step 4: Revert homepage to clean state**

Replace `src/app/page.tsx` with:

```tsx
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="font-orbitron text-4xl font-bold mb-4">imcurious.how</h1>
      <p className="text-gray-400 mb-8">Interactive explorations of how things work.</p>
      <Link
        href="/the-event-loop-works"
        className="text-[var(--color-neon-cyan)] hover:underline"
      >
        How the Event Loop Works →
      </Link>
    </main>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/event-loop/Track.tsx src/components/event-loop/Car.tsx src/app/page.tsx
git commit -m "feat: SVG track and car components with figure-eight path"
```

---

### Task 6: PitStop and TaskBlock Components

**Files:**
- Create: `src/components/event-loop/TaskBlock.tsx`, `src/components/event-loop/PitStop.tsx`

- [ ] **Step 1: Create TaskBlock component**

Create `src/components/event-loop/TaskBlock.tsx`:

```tsx
'use client'

import { motion } from 'framer-motion'

interface TaskBlockProps {
  id: string
  label: string
  color: string
  isExecuting?: boolean
}

export function TaskBlock({ id, label, color, isExecuting }: TaskBlockProps) {
  return (
    <motion.div
      layoutId={`task-${id}`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: 1,
        boxShadow: isExecuting
          ? `0 0 20px ${color}, 0 0 40px ${color}40`
          : `0 0 8px ${color}60`,
      }}
      exit={{ opacity: 0, scale: 0.5, y: -10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="px-2 py-1 rounded text-xs font-space-mono font-bold whitespace-nowrap"
      style={{
        backgroundColor: `${color}20`,
        border: `1px solid ${color}`,
        color: color,
      }}
    >
      {label}
    </motion.div>
  )
}
```

- [ ] **Step 2: Create PitStop component**

Create `src/components/event-loop/PitStop.tsx`:

```tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { TaskBlock } from './TaskBlock'
import type { Task } from '@/lib/simulation'

interface PitStopProps {
  label: string
  color: string
  tasks: Task[]
  currentTask: Task | null
  isActive: boolean
  position: { x: number; y: number }
  labelOffset: { x: number; y: number }
  visibility: number // 0–1 for progressive reveal
  renderSubSteps?: boolean // Only for render pit stop
  renderProgress?: number // 0–1 through the render sub-steps
}

const RENDER_SUB_STEPS = ['rAF', 'Style', 'Layout', 'Paint']

export function PitStop({
  label,
  color,
  tasks,
  currentTask,
  isActive,
  position,
  labelOffset,
  visibility,
  renderSubSteps,
  renderProgress,
}: PitStopProps) {
  if (visibility <= 0) return null

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: visibility, scale: 0.8 + visibility * 0.2, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Pit stop zone glow */}
      <div
        className="absolute inset-0 rounded-xl -m-4"
        style={{
          background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
          width: 120,
          height: 80,
          transform: 'translate(-50%, -50%)',
          left: '50%',
          top: '50%',
        }}
      />

      {/* Label */}
      <div
        className="absolute font-orbitron text-xs font-bold tracking-wider uppercase whitespace-nowrap"
        style={{
          color: color,
          left: `calc(50% + ${labelOffset.x}px)`,
          top: `calc(50% + ${labelOffset.y}px)`,
          transform: 'translate(-50%, -50%)',
          textShadow: `0 0 10px ${color}80`,
        }}
      >
        {label}
      </div>

      {/* Task blocks */}
      <div className="flex gap-1 mt-6 justify-center min-h-[28px]">
        <AnimatePresence mode="popLayout">
          {currentTask && isActive && (
            <TaskBlock
              key={`current-${currentTask.id}`}
              id={currentTask.id}
              label={currentTask.label}
              color={currentTask.color}
              isExecuting
            />
          )}
          {tasks.map((task) => (
            <TaskBlock
              key={task.id}
              id={task.id}
              label={task.label}
              color={task.color}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Render sub-steps (only for render pit stop) */}
      {renderSubSteps && isActive && (
        <div className="flex gap-2 mt-2 justify-center">
          {RENDER_SUB_STEPS.map((step, i) => {
            const stepProgress = renderProgress ?? 0
            const isStepActive = stepProgress > i / RENDER_SUB_STEPS.length
            return (
              <span
                key={step}
                className="text-[10px] font-space-mono font-bold uppercase tracking-wide transition-all duration-300"
                style={{
                  color: isStepActive ? color : `${color}40`,
                  textShadow: isStepActive ? `0 0 8px ${color}` : 'none',
                }}
              >
                {step}
              </span>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/event-loop/TaskBlock.tsx src/components/event-loop/PitStop.tsx
git commit -m "feat: PitStop and TaskBlock components with animations"
```

---

### Task 7: useEventLoopSimulation Hook

**Files:**
- Create: `src/hooks/useEventLoopSimulation.ts`

- [ ] **Step 1: Implement the simulation hook**

Create `src/hooks/useEventLoopSimulation.ts`:

```tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createInitialState,
  nextState,
  addTask as addTaskPure,
  type SimulationState,
  type TaskType,
} from '@/lib/simulation'

export function useEventLoopSimulation() {
  const [state, setState] = useState<SimulationState>(createInitialState)
  const stateRef = useRef(state)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Animation loop
  useEffect(() => {
    function tick(timestamp: number) {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp
      }

      const dt = Math.min(timestamp - lastTimeRef.current, 50) // cap at 50ms to avoid huge jumps
      lastTimeRef.current = timestamp

      setState((prev) => nextState(prev, dt))
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const togglePause = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: !prev.isPaused }))
  }, [])

  const addTask = useCallback((type: TaskType, delay?: number) => {
    setState((prev) => addTaskPure(prev, type, delay))
  }, [])

  const reset = useCallback(() => {
    setState(createInitialState())
    lastTimeRef.current = 0
  }, [])

  return {
    state,
    togglePause,
    addTask,
    reset,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useEventLoopSimulation.ts
git commit -m "feat: useEventLoopSimulation hook with rAF tick loop"
```

---

### Task 8: Controls Component

**Files:**
- Create: `src/components/event-loop/Controls.tsx`

- [ ] **Step 1: Implement controls with play/pause, task buttons, and delay slider**

Create `src/components/event-loop/Controls.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { TaskType } from '@/lib/simulation'

interface ControlsProps {
  isPaused: boolean
  onTogglePause: () => void
  onAddTask: (type: TaskType, delay?: number) => void
  onReset: () => void
  visibility: number // 0–1 for progressive reveal
}

export function Controls({
  isPaused,
  onTogglePause,
  onAddTask,
  onReset,
  visibility,
}: ControlsProps) {
  const [timeoutDelay, setTimeoutDelay] = useState(500)

  if (visibility <= 0) return null

  return (
    <motion.div
      className="flex flex-wrap items-center gap-2 p-3 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: visibility, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Play/Pause */}
      <button
        onClick={onTogglePause}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold font-orbitron tracking-wide transition-colors"
        style={{
          backgroundColor: isPaused ? 'var(--color-neon-cyan)' : '#333',
          color: isPaused ? '#000' : 'var(--color-neon-cyan)',
          boxShadow: isPaused ? '0 0 12px var(--color-neon-cyan)40' : 'none',
        }}
      >
        {isPaused ? '▶ Play' : '⏸ Pause'}
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-700" />

      {/* Add setTimeout */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onAddTask('setTimeout', timeoutDelay)}
          className="px-3 py-1.5 rounded-md text-sm font-bold font-space-mono transition-all hover:brightness-110"
          style={{
            backgroundColor: '#ffbe0b20',
            border: '1px solid var(--color-neon-yellow)',
            color: 'var(--color-neon-yellow)',
          }}
        >
          + setTimeout
        </button>
        <div className="flex items-center gap-1.5">
          <input
            type="range"
            min={0}
            max={2000}
            step={100}
            value={timeoutDelay}
            onChange={(e) => setTimeoutDelay(Number(e.target.value))}
            className="w-20 accent-[var(--color-neon-yellow)]"
          />
          <span className="text-xs text-gray-400 font-space-mono w-12">
            {timeoutDelay}ms
          </span>
        </div>
      </div>

      {/* Add fetch */}
      <button
        onClick={() => onAddTask('fetch')}
        className="px-3 py-1.5 rounded-md text-sm font-bold font-space-mono transition-all hover:brightness-110"
        style={{
          backgroundColor: '#06d6a020',
          border: '1px solid var(--color-neon-green)',
          color: 'var(--color-neon-green)',
        }}
      >
        + fetch
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-700" />

      {/* Reset */}
      <button
        onClick={onReset}
        className="px-2 py-1.5 rounded-md text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Reset
      </button>
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/event-loop/Controls.tsx
git commit -m "feat: Controls component with play/pause, setTimeout slider, fetch button"
```

---

### Task 9: Garage (Web API Area) Component

**Files:**
- Create: `src/components/event-loop/Garage.tsx`

- [ ] **Step 1: Create Garage component for pending Web API tasks**

Create `src/components/event-loop/Garage.tsx`:

```tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { PendingWebAPI } from '@/lib/simulation'

interface GarageProps {
  pendingAPIs: PendingWebAPI[]
  position: { x: number; y: number }
  visibility: number
}

export function Garage({ pendingAPIs, position, visibility }: GarageProps) {
  if (visibility <= 0) return null

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: visibility, scale: 0.8 + visibility * 0.2 }}
      transition={{ duration: 0.4 }}
    >
      {/* Label */}
      <div
        className="font-orbitron text-xs font-bold tracking-wider uppercase text-center mb-2"
        style={{
          color: 'var(--color-neon-cyan)',
          textShadow: '0 0 10px var(--color-neon-cyan)40',
        }}
      >
        Web APIs
      </div>

      {/* Background */}
      <div
        className="relative rounded-lg border border-dashed p-2 min-w-[120px] min-h-[40px]"
        style={{
          borderColor: 'var(--color-neon-cyan)30',
          backgroundColor: 'var(--color-neon-cyan)08',
        }}
      >
        <div className="flex flex-col gap-1">
          <AnimatePresence mode="popLayout">
            {pendingAPIs.map((api) => (
              <motion.div
                key={api.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 px-2 py-1 rounded text-xs font-space-mono"
                style={{
                  backgroundColor: `${api.color}15`,
                  border: `1px solid ${api.color}40`,
                  color: api.color,
                }}
              >
                <span className="font-bold">{api.label}</span>
                <span className="text-[10px] opacity-60">
                  {Math.max(0, Math.round(api.remainingDelay))}ms
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {pendingAPIs.length === 0 && (
            <span className="text-[10px] text-gray-600 text-center">idle</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/event-loop/Garage.tsx
git commit -m "feat: Garage component for Web API pending tasks"
```

---

### Task 10: EventLoopViz Orchestrator

**Files:**
- Create: `src/components/event-loop/EventLoopViz.tsx`

- [ ] **Step 1: Compose all visualization components**

Create `src/components/event-loop/EventLoopViz.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { Track } from './Track'
import { Car } from './Car'
import { PitStop } from './PitStop'
import { Garage } from './Garage'
import { Controls } from './Controls'
import { useEventLoopSimulation } from '@/hooks/useEventLoopSimulation'
import { PIT_STOP_POSITIONS, GARAGE_POSITION, VIEWBOX } from '@/lib/trackPath'
import { PIT_STOPS, EXECUTION_DURATION } from '@/lib/simulation'

interface EventLoopVizProps {
  getStageVisibility: (stage: number) => number
}

export function EventLoopViz({ getStageVisibility }: EventLoopVizProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { state, togglePause, addTask, reset } = useEventLoopSimulation()

  const isAtMicrotask =
    state.carState === 'STOPPED_AT_MICROTASK_QUEUE' ||
    state.carState === 'EXECUTING_MICROTASK'
  const isAtTask =
    state.carState === 'STOPPED_AT_TASK_QUEUE' ||
    state.carState === 'EXECUTING_TASK'
  const isAtRender =
    state.carState === 'STOPPED_AT_RENDER' ||
    state.carState === 'RENDERING'
  const isExecuting =
    state.carState === 'EXECUTING_TASK' ||
    state.carState === 'EXECUTING_MICROTASK' ||
    state.carState === 'RENDERING'

  // Calculate render sub-step progress (0–1)
  const renderProgress =
    state.carState === 'RENDERING'
      ? 1 - state.executionTimer / EXECUTION_DURATION
      : 0

  // Convert SVG coordinates to percentage positions for overlays
  const toPercent = (x: number, y: number) => ({
    x: (x / VIEWBOX.width) * 100 + '%',
    y: (y / VIEWBOX.height) * 100 + '%',
  })

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col">
      {/* Track area */}
      <div className="relative flex-1 min-h-0">
        <Track ref={pathRef} className="w-full h-full" />

        {/* Car */}
        <Car
          pathRef={pathRef}
          position={state.carPosition}
          isExecuting={isExecuting}
        />

        {/* Garage / Web APIs */}
        <Garage
          pendingAPIs={state.pendingWebAPIs}
          position={{ x: GARAGE_POSITION.x, y: GARAGE_POSITION.y }}
          visibility={getStageVisibility(3)}
        />

        {/* Microtask Queue Pit Stop */}
        <PitStop
          label={PIT_STOP_POSITIONS.microtask.label}
          color={PIT_STOP_POSITIONS.microtask.color}
          tasks={state.microtaskQueue}
          currentTask={isAtMicrotask ? state.currentTask : null}
          isActive={isAtMicrotask}
          position={PIT_STOP_POSITIONS.microtask.anchor}
          labelOffset={PIT_STOP_POSITIONS.microtask.labelOffset}
          visibility={getStageVisibility(5)}
        />

        {/* Task Queue Pit Stop */}
        <PitStop
          label={PIT_STOP_POSITIONS.task.label}
          color={PIT_STOP_POSITIONS.task.color}
          tasks={state.taskQueue}
          currentTask={isAtTask ? state.currentTask : null}
          isActive={isAtTask}
          position={PIT_STOP_POSITIONS.task.anchor}
          labelOffset={PIT_STOP_POSITIONS.task.labelOffset}
          visibility={getStageVisibility(4)}
        />

        {/* Render Pit Stop */}
        <PitStop
          label={PIT_STOP_POSITIONS.render.label}
          color={PIT_STOP_POSITIONS.render.color}
          tasks={[]}
          currentTask={null}
          isActive={isAtRender}
          position={PIT_STOP_POSITIONS.render.anchor}
          labelOffset={PIT_STOP_POSITIONS.render.labelOffset}
          visibility={getStageVisibility(6)}
          renderSubSteps
          renderProgress={renderProgress}
        />
      </div>

      {/* Controls — pinned to bottom */}
      <div className="flex-shrink-0 p-3">
        <Controls
          isPaused={state.isPaused}
          onTogglePause={togglePause}
          onAddTask={addTask}
          onReset={reset}
          visibility={getStageVisibility(4)}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Export EXECUTION_DURATION from simulation.ts**

The `EventLoopViz` imports `EXECUTION_DURATION` — make sure it's exported in `src/lib/simulation.ts`. Find the line:

```ts
const EXECUTION_DURATION = 600
```

Change to:

```ts
export const EXECUTION_DURATION = 600
```

- [ ] **Step 3: Commit**

```bash
git add src/components/event-loop/EventLoopViz.tsx src/lib/simulation.ts
git commit -m "feat: EventLoopViz orchestrator wiring simulation to visual components"
```

---

### Task 11: useScrollStage Hook

**Files:**
- Create: `src/hooks/useScrollStage.ts`

- [ ] **Step 1: Implement the scroll stage hook**

Create `src/hooks/useScrollStage.ts`:

```tsx
'use client'

import { useRef, useCallback } from 'react'
import { useScroll, useTransform, useMotionValueEvent, type MotionValue } from 'framer-motion'
import { useState } from 'react'

const TOTAL_STAGES = 7

export interface ScrollStageResult {
  contentRef: React.RefObject<HTMLDivElement | null>
  activeStage: number
  stageProgress: number
  getStageVisibility: (stage: number) => number
  scrollYProgress: MotionValue<number>
}

export function useScrollStage(): ScrollStageResult {
  const contentRef = useRef<HTMLDivElement>(null)
  const [activeStage, setActiveStage] = useState(1)
  const [stageProgress, setStageProgress] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  const { scrollYProgress } = useScroll({
    target: contentRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    setScrollProgress(latest)

    // Map 0–1 scroll progress to stages 1–7
    const stageFloat = latest * (TOTAL_STAGES - 1) + 1 // 1–7
    const currentStage = Math.min(Math.floor(stageFloat), TOTAL_STAGES)
    const progress = stageFloat - Math.floor(stageFloat)

    setActiveStage(Math.max(1, currentStage))
    setStageProgress(progress)
  })

  const getStageVisibility = useCallback(
    (stage: number): number => {
      // Map scroll progress to when this stage becomes visible
      const stageStart = (stage - 1) / (TOTAL_STAGES - 1)
      const transitionWidth = 0.5 / (TOTAL_STAGES - 1) // fade in over half a stage

      if (scrollProgress >= stageStart) return 1
      if (scrollProgress >= stageStart - transitionWidth) {
        return (scrollProgress - (stageStart - transitionWidth)) / transitionWidth
      }
      return 0
    },
    [scrollProgress],
  )

  return {
    contentRef,
    activeStage,
    stageProgress,
    getStageVisibility,
    scrollYProgress,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useScrollStage.ts
git commit -m "feat: useScrollStage hook mapping scroll position to stage visibility"
```

---

### Task 12: ScrollStage Layout Component

**Files:**
- Create: `src/components/event-loop/ScrollStage.tsx`

- [ ] **Step 1: Implement the sticky split layout**

Create `src/components/event-loop/ScrollStage.tsx`:

```tsx
'use client'

import { useScrollStage } from '@/hooks/useScrollStage'
import { EventLoopViz } from './EventLoopViz'

interface ScrollStageProps {
  children: React.ReactNode
}

export function ScrollStage({ children }: ScrollStageProps) {
  const { contentRef, getStageVisibility } = useScrollStage()

  return (
    <div ref={contentRef} className="relative">
      {/* Desktop: side-by-side */}
      <div className="flex flex-col lg:flex-row">
        {/* Visualization pane — sticky */}
        <div className="lg:w-1/2 lg:h-screen lg:sticky lg:top-0 h-[45vh] sticky top-0 z-10 bg-gray-950">
          <EventLoopViz getStageVisibility={getStageVisibility} />
        </div>

        {/* Content pane — scrollable */}
        <div className="lg:w-1/2 px-6 lg:px-12 py-8 lg:py-16 relative z-0">
          {children}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Export ScrollStage from the MDX provider**

Update `src/components/mdx/MDXProvider.tsx` to include `ScrollStage`:

```tsx
import { ScrollStage } from '@/components/event-loop/ScrollStage'

// Add to the components object:
const components = {
  Section,
  ScrollStage,
  // ... existing components
}
```

- [ ] **Step 3: Update the MDX post stub to use ScrollStage**

Update `src/posts/the-event-loop-works.mdx`:

```mdx
<ScrollStage>

<Section stage={1}>

## The Race Begins

JavaScript has one thread — like an F1 race has one car on one track. Everything happens in sequence: one thing at a time, start to finish.

</Section>

<Section stage={2}>

## The Call Stack

Every time you call a function, it goes onto the **call stack**. When the function returns, it comes off. The car is always executing whatever is on top of the stack.

</Section>

<Section stage={3}>

## Web APIs

When you call `setTimeout` or `fetch`, you're not running JavaScript — you're asking the **browser** to do something in the background.

</Section>

<Section stage={4}>

## The Task Queue

When a `setTimeout` timer finishes, its callback goes into the **task queue**. The event loop picks up **one task per lap**.

</Section>

<Section stage={5}>

## The Microtask Queue

Promise callbacks (`.then()`) go into the **microtask queue**. Unlike the task queue, the event loop **drains all microtasks** before moving on.

</Section>

<Section stage={6}>

## Rendering

After processing tasks, the browser may repaint the screen. It can **skip this step** if nothing visual changed.

</Section>

<Section stage={7}>

## Your Turn

All pieces are on the track. Add tasks, watch them flow through the queues, and see the event loop in action.

</Section>

</ScrollStage>
```

- [ ] **Step 4: Verify end-to-end in browser**

```bash
npm run dev
```

Navigate to `http://localhost:3000/the-event-loop-works`. Expected:
- Desktop: track sticky on the left, text scrolling on the right
- Mobile: track sticky at top, text scrolling below
- Scrolling reveals pit stops progressively
- Car animates around the track
- Controls appear and work (play/pause, add setTimeout, add fetch)

- [ ] **Step 5: Commit**

```bash
git add src/components/event-loop/ScrollStage.tsx src/components/mdx/MDXProvider.tsx src/posts/the-event-loop-works.mdx
git commit -m "feat: ScrollStage layout with sticky visualization and progressive reveal"
```

---

### Task 13: Full Blog Post Content

**Files:**
- Modify: `src/posts/the-event-loop-works.mdx`

- [ ] **Step 1: Write full educational content for all 7 sections**

Replace `src/posts/the-event-loop-works.mdx` with the full post. The content should draw from the research materials in the project root (`jake-archibald-video-summary.md`, `event-loop-will-sentance.md`, `callback-queue.md`, `microtask-queue.md`, `promises-and-fetch-api.md`, etc.).

Read these source files for educational accuracy:
- `jake-archibald-video-summary.md` — event loop mechanics, rendering, microtask behavior
- `event-loop-will-sentance.md` — Will Sentance's explanation of the event loop
- `callback-queue.md` — task queue behavior
- `microtask-queue.md` — microtask queue behavior
- `promises-and-fetch-api.md` — promises and fetch
- `browser-apis.md` — Web APIs
- `async-code-overview.md` — async code patterns

Each section should:
- Use the F1 metaphor consistently
- Include inline code examples showing real JavaScript
- Build on the previous section
- Be 150–300 words (enough to create scroll distance for the sticky viz)
- Use conversational tone inspired by Josh Comeau

The 7 sections:
1. **The Race Begins** — JS is single-threaded, one car metaphor
2. **The Call Stack** — synchronous execution, functions push/pop
3. **Web APIs** — browser features that run in parallel (the "garage")
4. **The Task Queue** — setTimeout callbacks, one-per-lap rule
5. **The Microtask Queue** — promise callbacks, drain-all rule, priority over tasks
6. **Rendering** — when/why the browser paints, optional skip
7. **Your Turn** — sandbox intro, encourage experimentation

- [ ] **Step 2: Verify content renders and scroll stages work**

```bash
npm run dev
```

Scroll through the entire post. Each section should trigger the corresponding pit stop to appear on the track.

- [ ] **Step 3: Commit**

```bash
git add src/posts/the-event-loop-works.mdx
git commit -m "feat: full educational blog post content across 7 sections"
```

---

### Task 14: Visual Polish — Neon Aesthetic

**Files:**
- Modify: `src/app/globals.css`, `src/components/event-loop/Track.tsx`, `tailwind.config.ts`

- [ ] **Step 1: Extend Tailwind config with custom colors and fonts**

Update `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/posts/**/*.{mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
        'space-mono': ['var(--font-space-mono)', 'monospace'],
      },
      colors: {
        neon: {
          cyan: '#00f5ff',
          pink: '#ff006e',
          yellow: '#ffbe0b',
          green: '#06d6a0',
        },
        track: {
          surface: '#1a1a2e',
          line: '#4a4a6a',
        },
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 2: Add noise texture and glow utilities to globals.css**

Append to `src/app/globals.css`:

```css
/* Noise texture overlay */
.noise-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 1;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #0a0a1a;
}

::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Selection color */
::selection {
  background: #00f5ff30;
  color: white;
}
```

- [ ] **Step 3: Add glow effects to Track component**

Update `src/components/event-loop/Track.tsx` — add a subtle animated glow pulse to the track outline. After the existing track glow `<path>`, add:

```tsx
{/* Animated pulse on track edge */}
<path
  d={TRACK_D}
  fill="none"
  stroke="var(--color-neon-cyan)"
  strokeWidth={1}
  opacity={0.3}
>
  <animate
    attributeName="opacity"
    values="0.1;0.3;0.1"
    dur="3s"
    repeatCount="indefinite"
  />
</path>
```

- [ ] **Step 4: Verify visual polish in browser**

```bash
npm run dev
```

Expected: dark background with subtle noise, neon glow on track edges, custom scrollbar, cyan selection highlight. The overall aesthetic should feel like a neon racing dashboard.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css tailwind.config.ts src/components/event-loop/Track.tsx
git commit -m "feat: neon aesthetic polish — noise texture, glow effects, custom scrollbar"
```

---

### Task 15: Integration Testing and Bug Fixes

**Files:**
- Possibly modify any component based on bugs found

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: All simulation tests pass.

- [ ] **Step 2: Run the dev server and test the full flow**

```bash
npm run dev
```

Test checklist:
1. Navigate to `/the-event-loop-works`
2. Scroll through all 7 sections — pit stops appear progressively
3. Car animates continuously around the figure-eight
4. Click "Pause" — car stops, click "Play" — car resumes
5. Click "+ setTimeout" with 500ms delay — task appears in garage, countdown, moves to task queue, car picks it up
6. Click "+ fetch" — request appears in garage, moves to microtask queue, car drains it
7. Add multiple fetch calls — car stays at microtask pit stop until ALL are drained
8. Add multiple setTimeouts — car only picks up ONE per lap
9. Render stop lights up sub-step labels when car arrives (after adding tasks)
10. Render stop is skipped when nothing changed
11. Mobile layout: track at top, text below (use browser dev tools responsive mode)
12. Desktop layout: track left, text right

- [ ] **Step 3: Fix any bugs found during testing**

Address any issues discovered in step 2. Common issues to watch for:
- Car position not mapping correctly to SVG coordinates (check `getPointAtLength` conversion)
- Pit stop overlays not aligned with track positions (adjust `anchor` coordinates in `trackPath.ts`)
- Scroll stage thresholds not triggering at the right time (adjust `useScrollStage` math)
- Mobile layout overflow or sticky positioning issues

- [ ] **Step 4: Run final test suite**

```bash
npm test && npm run build
```

Expected: Tests pass, Next.js build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: integration testing fixes and build verification"
```

---

### Task 16: Gitignore and Cleanup

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Ensure .gitignore covers all generated files**

Check if `.gitignore` exists and add:

```
# dependencies
node_modules/

# next.js
.next/
out/

# production
build/

# env
.env*.local

# debug
npm-debug.log*

# superpowers
.superpowers/

# misc
.DS_Store
*.tsbuildinfo
```

- [ ] **Step 2: Remove research markdown files from src**

The research files (`jake-archibald-video-summary.md`, `event-loop-will-sentance.md`, etc.) should stay in the project root as reference but not be part of the Next.js build. Verify they are NOT inside `src/` — they should already be in the project root.

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore and project cleanup"
```
