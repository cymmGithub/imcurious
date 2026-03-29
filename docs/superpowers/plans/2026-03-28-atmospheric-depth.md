# Atmospheric Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen the neon/racing aesthetic across the article reading experience and interactive visualization, making the site look outstanding.

**Architecture:** All changes are additive visual polish — no business logic or state machine changes. Article improvements go through MDX component overrides and a new `<Callout>` component. Visualization improvements modify existing components with richer SVG/CSS effects. The only data change is adding `positionHistory` to the simulation hook for the car exhaust trail.

**Tech Stack:** Next.js 15, React 19, Framer Motion 12, Tailwind CSS 4, MDX 3, TypeScript

---

### Task 1: Beacon Ring Keyframes in globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add beacon-ring keyframes and trail-pulse animation**

Add these keyframes at the end of `globals.css`, before the reduced-motion media query:

```css
/* Beacon ring pulse for active pit stops */
@keyframes beacon-ring {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.3;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.8);
    opacity: 0;
  }
}

/* Exhaust trail particle pulse */
@keyframes trail-pulse {
  0%, 100% { opacity: var(--trail-opacity); }
  50% { opacity: calc(var(--trail-opacity) * 0.5); }
}
```

- [ ] **Step 2: Verify dev server shows no errors**

Run: Visit `http://localhost:3000` in browser, open devtools console.
Expected: No CSS parse errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add beacon-ring and trail-pulse CSS keyframes"
```

---

### Task 2: Section Dividers and Fade-In

**Files:**
- Modify: `src/components/mdx/Section.tsx`

The `Section` component is currently a plain `<section>` wrapper. We need to:
1. Add a gradient divider line at the top of every section except stage 1
2. Wrap children in a Framer Motion `motion.div` for scroll-triggered fade-in

- [ ] **Step 1: Update Section.tsx with divider and fade-in**

Replace the entire contents of `src/components/mdx/Section.tsx` with:

```tsx
'use client'

import { motion } from 'framer-motion'

interface SectionProps {
  stage: number
  children: React.ReactNode
}

export function Section({ stage, children }: SectionProps) {
  return (
    <section
      data-stage={stage}
      className="min-h-[60vh] py-12"
    >
      {/* Gradient divider — skip for first section */}
      {stage > 1 && (
        <div className="relative h-px mb-12">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--color-neon-cyan), var(--color-neon-pink), transparent)',
              opacity: 0.6,
            }}
          />
          <div
            className="absolute inset-0 blur-sm"
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--color-neon-cyan), var(--color-neon-pink), transparent)',
              opacity: 0.4,
            }}
          />
        </div>
      )}

      {/* Fade-in on scroll */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 2: Verify in browser**

Visit `http://localhost:3000/the-js-event-loop-works` and scroll through sections.
Expected: Gradient cyan-to-pink divider lines appear between sections. Content fades in as you scroll down.

- [ ] **Step 3: Commit**

```bash
git add src/components/mdx/Section.tsx
git commit -m "feat: section gradient dividers and scroll fade-in animations"
```

---

### Task 3: Callout Component ("Pit Wall Radio")

**Files:**
- Create: `src/components/mdx/Callout.tsx`
- Modify: `src/components/mdx/MDXProvider.tsx`

- [ ] **Step 1: Create the Callout component**

Create `src/components/mdx/Callout.tsx`:

```tsx
interface CalloutProps {
  children: React.ReactNode
}

export function Callout({ children }: CalloutProps) {
  return (
    <div
      className="relative rounded-lg overflow-hidden my-8"
      style={{
        background:
          'linear-gradient(135deg, rgba(0, 245, 255, 0.04), rgba(255, 0, 110, 0.04))',
        border: '1px solid rgba(0, 245, 255, 0.15)',
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          opacity: 0.03,
        }}
      />
      <div className="p-5 relative">
        <div
          className="font-orbitron text-[10px] font-bold tracking-[0.2em] uppercase mb-3 flex items-center gap-2"
          style={{ color: 'var(--color-neon-pink)' }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--color-neon-pink)' }}
          />
          Pit Wall Radio
        </div>
        <div className="text-gray-200 text-sm leading-relaxed italic font-space-mono">
          {children}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Register Callout in MDXProvider**

In `src/components/mdx/MDXProvider.tsx`, add the import and register the component:

Add import at top:
```tsx
import { Callout } from './Callout'
```

Add `Callout` to the `components` object:
```tsx
Callout,
```

Place it right after the `Section` entry in the components object.

- [ ] **Step 3: Verify in browser**

Visit `http://localhost:3000/the-js-event-loop-works`. The `<Callout>` component won't appear yet (it's not used in the MDX), but the page should still load without errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/mdx/Callout.tsx src/components/mdx/MDXProvider.tsx
git commit -m "feat: Pit Wall Radio callout component for key insights"
```

---

### Task 4: MDX Content Styling — Code Blocks, Lists, Inline Code

**Files:**
- Modify: `src/components/mdx/MDXProvider.tsx`

Update the MDX component overrides for `pre`, `code`, `ul`, `li`, and `ol`.

- [ ] **Step 1: Update MDX component overrides**

Replace the `pre`, `code` entries and add `ul`, `li`, `ol` in the `components` object in `src/components/mdx/MDXProvider.tsx`:

Replace the existing `code` override with:
```tsx
  code: (props: ComponentPropsWithoutRef<'code'>) => (
    <code
      className="bg-gray-800 text-[var(--color-neon-cyan)] px-1.5 py-0.5 rounded text-sm font-space-mono"
      style={{
        borderLeft: '2px solid rgba(0, 245, 255, 0.3)',
      }}
      {...props}
    />
  ),
```

Replace the existing `pre` override with:
```tsx
  pre: (props: ComponentPropsWithoutRef<'pre'>) => (
    <div className="rounded-lg overflow-hidden mb-6" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[11px] text-gray-500 font-space-mono ml-2">js</span>
      </div>
      <div className="relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)',
            opacity: 0.02,
          }}
        />
        <pre className="p-4 text-sm overflow-x-auto relative" style={{ background: 'rgba(10, 10, 26, 0.8)' }} {...props} />
      </div>
    </div>
  ),
```

Add new list overrides after `strong`:
```tsx
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="space-y-3 mb-6 list-none pl-0" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="space-y-3 mb-6 list-none pl-0 counter-reset-[item]" {...props} />
  ),
  li: ({ children, ...rest }: ComponentPropsWithoutRef<'li'>) => {
    const colors = ['var(--color-neon-yellow)', 'var(--color-neon-green)', 'var(--color-neon-pink)']
    const text = typeof children === 'string' ? children : ''
    const colorIndex = Math.abs(text.length) % colors.length
    const color = colors[colorIndex]
    return (
      <li className="flex items-start gap-3 text-gray-300 text-sm leading-relaxed" {...rest}>
        <span
          className="mt-[7px] flex-shrink-0 w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
          }}
          aria-hidden="true"
        />
        <span>{children}</span>
      </li>
    )
  },
```

Note: The `li` override destructures `children` from props and wraps them, so it passes `{...props}` to `<li>` but renders children separately inside the `<span>`.

- [ ] **Step 2: Verify in browser**

Visit `http://localhost:3000/the-js-event-loop-works` and scroll to sections with code blocks and lists.
Expected: Code blocks have traffic light header chrome and scanline overlay. Lists have glowing colored dots instead of default bullets. Inline `code` has a cyan left border.

- [ ] **Step 3: Commit**

```bash
git add src/components/mdx/MDXProvider.tsx
git commit -m "feat: styled code blocks with chrome, glowing list markers, inline code border"
```

---

### Task 5: Add Callout Blocks to MDX Content

**Files:**
- Modify: `src/posts/the-js-event-loop-works.mdx`

Wrap the key quotes and insights with the `<Callout>` component.

- [ ] **Step 1: Add Callout blocks to the MDX file**

In Section 3 (Web APIs), wrap the key insight after the numbered list:

Find:
```
The JavaScript engine is just the car. The browser is the entire racing organization: the garage, the pit wall, the tire warmers, the telemetry. JavaScript gets to use all of it through these facade functions, but the work happens elsewhere.
```

Wrap it:
```mdx
<Callout>
The JavaScript engine is just the car. The browser is the entire racing organization: the garage, the pit wall, the tire warmers, the telemetry. JavaScript gets to use all of it through these facade functions, but the work happens elsewhere.
</Callout>
```

In Section 4 (Task Queue), wrap:
```
This is the rule that trips everyone up: **the callback queue does not run until all global code has finished**. You could have a million `console.log` statements after `setTimeout(fn, 0)`, and every single one would execute before that callback gets its chance. The event loop is strict. Predictable. No exceptions.
```

Wrap it:
```mdx
<Callout>
The callback queue does not run until all global code has finished. You could have a million console.log statements after setTimeout(fn, 0), and every single one would execute before that callback gets its chance. The event loop is strict. Predictable. No exceptions.
</Callout>
```

In Section 5 (Microtask Queue), wrap:
```
This is what Jake Archibald emphasizes: microtasks run whenever the JavaScript stack empties. Not just between tasks — after every task, after every callback, after every event handler. The engine clears the entire microtask queue before moving on.
```

Wrap it:
```mdx
<Callout>
Microtasks run whenever the JavaScript stack empties. Not just between tasks — after every task, after every callback, after every event handler. The engine clears the entire microtask queue before moving on.
</Callout>
```

In Section 6 (Rendering), wrap:
```
Jake Archibald makes an important point here: `requestAnimationFrame` is synchronized with the display's refresh rate, while `setTimeout` is not. A `setTimeout` loop might fire too often (wasting CPU) or not often enough (causing visual stutters). For animations, always use `requestAnimationFrame` — it is the browser telling you "now is a good time to update visuals."
```

Wrap it:
```mdx
<Callout>
requestAnimationFrame is synchronized with the display's refresh rate, while setTimeout is not. A setTimeout loop might fire too often (wasting CPU) or not often enough (causing visual stutters). For animations, always use requestAnimationFrame — it is the browser telling you "now is a good time to update visuals."
</Callout>
```

- [ ] **Step 2: Verify in browser**

Visit `http://localhost:3000/the-js-event-loop-works` and scroll to sections 3-6.
Expected: Key insights appear in styled Pit Wall Radio callout cards with gradient background, scanlines, pink label, and italic text.

- [ ] **Step 3: Commit**

```bash
git add src/posts/the-js-event-loop-works.mdx
git commit -m "feat: add Pit Wall Radio callout blocks to key article insights"
```

---

### Task 6: Track Edge Glow and Start/Finish Line

**Files:**
- Modify: `src/components/event-loop/Track.tsx`

- [ ] **Step 1: Enhance track glow and add checkered line**

In `src/components/event-loop/Track.tsx`, make these changes:

1. Increase the track glow opacity from `0.04` to `0.06`. Find:
```tsx
        <path
          d={TRACK_D}
          fill="none"
          stroke="var(--color-neon-cyan)"
          strokeWidth={64}
          opacity={0.04}
          filter="url(#neon-glow)"
        />
```
Change `opacity={0.04}` to `opacity={0.06}`.

2. Add a second pulsing path after the existing animated pulse path (the one inside the `!prefersReducedMotion` check). Add this right after the closing `</path>` of the existing pulse, still inside the `!prefersReducedMotion` conditional:

```tsx
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
              begin="1.5s"
            />
          </path>
```

3. Add the start/finish checkered line. Place this before the closing `</svg>` tag, after the animated pulse section:

```tsx
        {/* Start/finish checkered line at center crossing */}
        <rect
          x={395}
          y={270}
          width={10}
          height={60}
          fill="url(#checker)"
          opacity={0.4}
        />
```

- [ ] **Step 2: Verify in browser**

Visit `http://localhost:3000/the-js-event-loop-works`.
Expected: Track has a richer, double-pulse glow effect. A small checkered pattern is visible at the center crossing point of the figure-eight.

- [ ] **Step 3: Commit**

```bash
git add src/components/event-loop/Track.tsx
git commit -m "feat: enhanced track glow and start/finish checkered line"
```

---

### Task 7: Car Shadow and Exhaust Trail

**Files:**
- Modify: `src/hooks/useEventLoopSimulation.ts`
- Modify: `src/components/event-loop/Car.tsx`
- Modify: `src/components/event-loop/EventLoopViz.tsx`

This task adds position history tracking to the simulation hook, then renders trail particles and a shadow beneath the car.

- [ ] **Step 1: Add positionHistory to the simulation hook**

In `src/hooks/useEventLoopSimulation.ts`, the state is `SimulationState` from `simulation.ts`. We don't modify the pure state machine — instead, track position history in the hook's own state.

Add a ref to track position history. After the existing `lastTimeRef`:

```tsx
const positionHistoryRef = useRef<number[]>([])
```

Inside the `tick` function, after `setState((prev) => nextState(prev, dt))`, add position history sampling. Since `setState` is async, we need to read from a ref. Restructure the tick:

Replace the tick function content:
```tsx
    function tick(timestamp: number) {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp
      }

      const dt = Math.min(timestamp - lastTimeRef.current, 50)
      lastTimeRef.current = timestamp

      setState((prev) => {
        const next = nextState(prev, dt)
        // Sample position history for exhaust trail (every other frame to keep it sparse)
        if (next.carState === 'DRIVING') {
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
```

Update the `reset` callback to also clear history:
```tsx
  const reset = useCallback(() => {
    setState(createInitialState)
    lastTimeRef.current = 0
    positionHistoryRef.current = []
  }, [])
```

Update the return to expose positionHistory:
```tsx
  return { state, positionHistory: positionHistoryRef, togglePause, addTask, reset }
```

- [ ] **Step 2: Pass positionHistory through EventLoopViz to Car**

In `src/components/event-loop/EventLoopViz.tsx`, update the destructuring of the hook return:

Change:
```tsx
  const { state, togglePause, addTask, reset } = useEventLoopSimulation()
```
To:
```tsx
  const { state, positionHistory, togglePause, addTask, reset } = useEventLoopSimulation()
```

Add `positionHistory` prop to the `Car` component:
```tsx
        <Car
          pathRef={pathRef}
          position={state.carPosition}
          isExecuting={isExecuting}
          positionHistory={positionHistory}
        />
```

- [ ] **Step 3: Update Car.tsx with shadow and exhaust trail**

Replace the entire contents of `src/components/event-loop/Car.tsx`:

```tsx
'use client'

import { useRef, useEffect, type RefObject } from 'react'
import { useReducedMotion } from 'framer-motion'

interface CarProps {
  pathRef: RefObject<SVGPathElement | null>
  position: number
  isExecuting: boolean
  positionHistory: RefObject<number[]>
}

export function Car({ pathRef, position, isExecuting, positionHistory }: CarProps) {
  const carRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)
  const layoutCache = useRef<{ scaleX: number; scaleY: number; totalLength: number } | null>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    function updateCache() {
      const p = pathRef.current
      if (!p) return
      const svg = p.ownerSVGElement
      if (!svg) return
      const svgRect = svg.getBoundingClientRect()
      const viewBox = svg.viewBox.baseVal
      layoutCache.current = {
        scaleX: svgRect.width / viewBox.width,
        scaleY: svgRect.height / viewBox.height,
        totalLength: p.getTotalLength(),
      }
    }

    updateCache()

    const observer = new ResizeObserver(updateCache)
    const svg = path.ownerSVGElement
    if (svg) observer.observe(svg)

    return () => observer.disconnect()
  }, [pathRef])

  useEffect(() => {
    const path = pathRef.current
    const car = carRef.current
    const cache = layoutCache.current
    if (!path || !car || !cache) return

    const point = path.getPointAtLength(position * cache.totalLength)

    const epsilon = 0.001
    const nextPos = Math.min(position + epsilon, 0.999)
    const nextPoint = path.getPointAtLength(nextPos * cache.totalLength)
    const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x)
    const degrees = (angle * 180) / Math.PI

    const screenX = point.x * cache.scaleX
    const screenY = point.y * cache.scaleY

    car.style.transform = `translate(${screenX}px, ${screenY}px) rotate(${degrees}deg)`

    // Update trail positions
    const trail = trailRef.current
    const history = positionHistory.current
    if (trail && cache && history.length > 0) {
      const dots = trail.children
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i] as HTMLElement
        const historyIndex = history.length - 1 - i
        if (historyIndex < 0) {
          dot.style.opacity = '0'
          continue
        }
        const pos = history[historyIndex]
        const pt = path.getPointAtLength(pos * cache.totalLength)
        const sx = pt.x * cache.scaleX
        const sy = pt.y * cache.scaleY
        const opacity = 0.5 - i * 0.05
        const scale = 1 - i * 0.08
        dot.style.transform = `translate(${sx}px, ${sy}px) scale(${scale})`
        dot.style.opacity = String(Math.max(0, opacity))
      }
    }
  }, [pathRef, position, positionHistory])

  return (
    <>
      {/* Exhaust trail */}
      {!prefersReducedMotion && (
        <div ref={trailRef} className="absolute top-0 left-0 pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-[5px] h-[5px] rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{
                backgroundColor: 'var(--color-neon-cyan)',
                boxShadow: '0 0 4px var(--color-neon-cyan)',
                willChange: 'transform, opacity',
                opacity: 0,
                ['--trail-opacity' as string]: `${0.5 - i * 0.05}`,
                animation: 'trail-pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Car */}
      <div
        ref={carRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ willChange: 'transform' }}
      >
        <svg
          width="32"
          height="16"
          viewBox="0 0 32 16"
          className="block -translate-x-1/2 -translate-y-1/2"
          role="img"
          aria-label="F1 car on track"
        >
          {/* Shadow */}
          <ellipse cx="16" cy="14" rx="14" ry="3" fill="rgba(0,0,0,0.25)" />

          {/* Car body */}
          <rect x="4" y="4" width="24" height="8" rx="2" fill="var(--color-neon-cyan)" />
          {/* Nose */}
          <polygon points="28,6 32,8 28,10" fill="var(--color-neon-cyan)" />
          {/* Rear wing */}
          <rect x="2" y="2" width="3" height="12" rx="1" fill="var(--color-neon-cyan)" opacity="0.8" />
          {/* Wheels */}
          <rect x="8" y="2" width="4" height="3" rx="1" fill="var(--color-surface-muted)" />
          <rect x="8" y="11" width="4" height="3" rx="1" fill="var(--color-surface-muted)" />
          <rect x="22" y="2" width="4" height="3" rx="1" fill="var(--color-surface-muted)" />
          <rect x="22" y="11" width="4" height="3" rx="1" fill="var(--color-surface-muted)" />

          {/* Glow effect when executing */}
          {isExecuting && !prefersReducedMotion && (
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
    </>
  )
}
```

- [ ] **Step 4: Verify in browser**

Visit `http://localhost:3000/the-js-event-loop-works` and scroll to stage 1 (where the car is visible).
Expected: The car has a subtle shadow underneath it. When driving, small cyan dots trail behind the car and pulse gently. When the car stops at a pit stop, the trail disappears.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useEventLoopSimulation.ts src/components/event-loop/Car.tsx src/components/event-loop/EventLoopViz.tsx
git commit -m "feat: car exhaust trail particles and shadow"
```

---

### Task 8: Active Pit Stop Beacon and Zone Styling

**Files:**
- Modify: `src/components/event-loop/PitStop.tsx`

- [ ] **Step 1: Update PitStop with beacon rings and structured zone**

Replace the entire contents of `src/components/event-loop/PitStop.tsx`:

```tsx
'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { TaskBlock } from './TaskBlock'
import type { Task } from '@/lib/simulation'
import { VIEWBOX } from '@/lib/trackPath'

interface PitStopProps {
  label: string
  color: string
  tasks: Task[]
  currentTask: Task | null
  isActive: boolean
  position: { x: number; y: number }
  labelOffset: { x: number; y: number }
  visibility: number
  renderSubSteps?: boolean
  renderProgress?: number
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
  const prefersReducedMotion = useReducedMotion()

  if (visibility <= 0) return null

  const leftPct = (position.x / VIEWBOX.width) * 100
  const topPct = (position.y / VIEWBOX.height) * 100

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: 'translate(-50%, -50%)',
      }}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: visibility, scale: 0.8 + visibility * 0.2, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
      role="region"
      aria-label={`${label} pit stop`}
    >
      {/* Beacon rings — only when active */}
      {isActive && !prefersReducedMotion && (
        <>
          <span
            className="absolute left-1/2 top-1/2 w-16 h-16 rounded-full pointer-events-none"
            style={{
              border: `1px solid ${color}`,
              animation: 'beacon-ring 2s ease-out infinite',
            }}
          />
          <span
            className="absolute left-1/2 top-1/2 w-16 h-16 rounded-full pointer-events-none"
            style={{
              border: `1px solid ${color}`,
              animation: 'beacon-ring 2s ease-out infinite 0.5s',
            }}
          />
        </>
      )}

      {/* Pit stop zone — structured container */}
      <div
        className="absolute rounded-xl"
        style={{
          background: `${color}0D`,
          border: `1px solid ${color}26`,
          boxShadow: isActive ? `inset 0 0 20px ${color}1A, 0 0 20px ${color}0D` : `inset 0 0 20px ${color}0A`,
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
      <div className="flex gap-1 mt-6 justify-center min-h-[28px]" aria-label={`${tasks.length} tasks queued`}>
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

      {/* Render sub-steps */}
      {renderSubSteps && isActive && (
        <div className="flex gap-2 mt-2 justify-center" role="list" aria-label="Render pipeline steps">
          {RENDER_SUB_STEPS.map((step, i) => {
            const stepProgress = renderProgress ?? 0
            const isStepActive = stepProgress > i / RENDER_SUB_STEPS.length
            return (
              <span
                key={step}
                role="listitem"
                className="text-[10px] font-space-mono font-bold uppercase tracking-wide transition-all duration-300"
                style={{
                  color: isStepActive ? color : `${color}40`,
                  textShadow: isStepActive ? `0 0 8px ${color}` : 'none',
                }}
                aria-current={isStepActive ? 'step' : undefined}
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

- [ ] **Step 2: Verify in browser**

Visit `http://localhost:3000/the-js-event-loop-works`, scroll to see pit stops, and add tasks.
Expected: Pit stops have a subtle bordered container instead of just a radial gradient. When the car stops at a pit stop, two beacon rings pulse outward from the center.

- [ ] **Step 3: Commit**

```bash
git add src/components/event-loop/PitStop.tsx
git commit -m "feat: active pit stop beacon rings and structured zone container"
```

---

### Task 9: Controls Bar Glow

**Files:**
- Modify: `src/components/event-loop/Controls.tsx`

- [ ] **Step 1: Update controls container styling**

In `src/components/event-loop/Controls.tsx`, update the `motion.div` className and add style:

Find:
```tsx
      className="flex flex-wrap items-center gap-2 p-3 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-800"
```

Replace with:
```tsx
      className="flex flex-wrap items-center gap-2 p-3 bg-gray-900/80 backdrop-blur-sm rounded-lg"
      style={{
        border: '1px solid rgba(0, 245, 255, 0.1)',
        boxShadow: '0 -1px 12px rgba(0, 245, 255, 0.06)',
      }}
```

Note: The existing `animate` and `transition` props on the `motion.div` should remain unchanged. Only the `className` and inline `style` are modified.

- [ ] **Step 2: Verify in browser**

Expected: Controls bar has a subtle cyan border and upward glow, integrating it with the track aesthetic.

- [ ] **Step 3: Commit**

```bash
git add src/components/event-loop/Controls.tsx
git commit -m "feat: controls bar with neon edge glow"
```

---

### Task 10: Clean Up Sampler Page

**Files:**
- Delete: `src/app/sampler/page.tsx`

The sampler page was a temporary design comparison tool.

- [ ] **Step 1: Remove the sampler**

```bash
rm -rf src/app/sampler
```

- [ ] **Step 2: Final visual verification**

Visit `http://localhost:3000/the-js-event-loop-works` and scroll through the entire article. Verify:
- Gradient dividers appear between sections (not before section 1)
- Content fades in on scroll
- Pit Wall Radio callouts appear in sections 3, 4, 5, and 6
- Code blocks have traffic light chrome and scanline overlay
- Lists have colored glowing dot markers
- Inline code has cyan left border
- Track has enhanced dual-pulse glow and checkered start/finish line
- Car has shadow underneath and cyan exhaust trail when driving
- Pit stops have bordered zones and beacon ring pulses when active
- Controls bar has cyan edge glow

- [ ] **Step 3: Commit**

```bash
git rm -rf src/app/sampler
git add -A
git commit -m "chore: remove temporary design sampler page"
```
