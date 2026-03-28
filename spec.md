# Spec: imcurious.how/the-event-loop-works

## Overview

An interactive, F1-themed blog post explaining how the JavaScript event loop works. The event loop visualization is mapped to an F1 racing track, where a single car (representing the main thread / call stack) races around a circuit, making pit stops at queues and the rendering pipeline. The post combines rich educational content with hands-on interactivity, inspired by Josh Comeau's interactive blog style and Jake Archibald's iconic event loop conference talk.

**URL**: `imcurious.how/the-event-loop-works`

---

## Core Metaphor: F1 Racing Track = Event Loop

### The Car
- A **single F1 car** represents the **main thread / call stack**
- Reinforces JavaScript's single-threaded nature: one car, one track, one thing at a time
- The car continuously laps the track (the event loop)

### The Track Shape
- Stays close to **Jake Archibald's figure-eight / overlapping oval** loop shape
- Styled with F1 visual elements (car shape, pit lane markers, kerb details)
- **Visual style**: Stylized/neon — gradient aesthetic similar to Jake's original diagram, with F1 elements layered on. Illustrative, not realistic

### Pit Stops (Queues & Rendering)

#### Task Queue Pit Stop
- Where `setTimeout` and `setInterval` callbacks wait
- Car pulls in, **executes one task**, then leaves and continues the lap
- Tasks are visualized as colored blocks; the executed block disappears

#### Microtask Queue Pit Stop
- Where promise callbacks (`.then()`, `fetch` responses) wait
- Car pulls in and **stays until ALL microtasks are drained** — blocks disappear one by one
- Visually distinct from task queue to emphasize the "drain all" behavior

#### Render Stop
- **Simplified**: One combined "Render" stop (not 4 separate sub-stops)
- Small labels inside show the sub-steps (rAF, Style, Layout, Paint) happening
- Browser can skip this stop (to show the optimization of not rendering when nothing changed)

### Execution Model
- Tasks execute **right at the pit stop** — the car stops, work happens there, then it continues
- No carrying tasks around the track

---

## Layout & Responsiveness

### Desktop (Hybrid Layout)
- **Sticky track visualization** on one side of the viewport
- **Scrollable educational text** on the other side
- Track stays visible at all times as the user reads — context is never lost

### Mobile
- Track **sticks to the top** of the viewport, taking ~40-50% of the screen
- Text scrolls below the track

---

## Content Structure (Progressive Reveal)

The track visualization **evolves** as the user scrolls through sections. Complexity builds alongside the reader's understanding.

### Sections

1. **Intro**
   - "JavaScript has one thread, like an F1 race has one car on one track"
   - Track appears with just the car and the empty loop

2. **The Call Stack**
   - Synchronous code execution
   - Car drives the main loop — no pit stops yet

3. **Web APIs / Browser Features**
   - What happens when you call `setTimeout` or `fetch`
   - Work happens off-track (like pit crew working in the garage)
   - Visual: "garage" area appears off the track

4. **Task Queue**
   - `setTimeout`/`setInterval` callbacks waiting at their pit stop
   - Task queue pit stop appears on the track
   - Car starts stopping there to pick up tasks

5. **Microtask Queue**
   - Promise callbacks and their priority over tasks
   - Microtask queue pit stop appears
   - Car demonstrates draining all microtasks before moving on

6. **Rendering**
   - When and why the browser paints
   - Render stop appears on the track
   - Car sometimes skips it (browser optimization)

7. **Interactive Sandbox** (v1: basic / v2: full)
   - All pieces visible, user plays freely

---

## User Interaction

### Controls

#### Playback
- **Play/Pause button** to freeze the loop and inspect state

#### Adding Tasks (Pre-built Buttons)
- **"Add setTimeout"** button with a **delay slider** (e.g., 0ms–2000ms)
- **"Add fetch"** button (queues a microtask when the "response" arrives)
- Buttons are accessible, low-friction — no code typing required

### v2 Additions
- **"Add setInterval"** button with interval slider
- **Console/Log panel** showing execution order ("Task 1 executed", "Microtask 2 executed")
- **Pre-built scenarios** — guided challenges like "setTimeout(0) vs Promise.resolve() — predict the order"
- **"Break it" mode** — queue infinite microtasks to demonstrate rendering starvation

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js** (App Router) |
| Animation | **Framer Motion** |
| Content | **MDX** — Markdown with embedded React components |
| Styling | TBD (Tailwind CSS recommended for utility-first approach) |
| Deployment | **Vercel** |

### Architecture Notes
- Blog post lives as an `.mdx` file with interactive React components imported inline (e.g., `<EventLoopTrack />`, `<TaskButton />`)
- Part of a **larger blog platform** — structure should support future posts at other routes
- SSR for SEO — critical for the `imcurious.how` domain strategy

---

## Phasing

### v1 (Ship first)
- Next.js + MDX blog scaffold with the event loop post
- Evolving F1 track visualization (progressive reveal as user scrolls)
- Car animating around the figure-eight loop
- Play/pause control
- Basic interaction buttons: "Add setTimeout" (with delay slider) + "Add fetch"
- Task queue and microtask queue pit stops with correct execution behavior
- Simplified render stop
- Hybrid sticky layout (desktop: side-by-side, mobile: top-sticky)
- Full educational text across all 7 sections
- Deployed to Vercel at `imcurious.how/the-event-loop-works`

### v2
- Console/log panel showing execution order
- Pre-built scenarios with guided challenges
- "Break it" mode (microtask starvation demo)
- setInterval support with interval slider
- Potential enhancements: step-through mode, speed slider

---

## Content Sources

- Will Sentance's Frontend Masters course transcripts (in project directory)
- Jake Archibald's "In The Loop" conference talk summary (in project directory)
- Additional research from web as needed for accuracy and depth

---

## Key Technical Behaviors to Demonstrate

These are the core event loop rules the visualization must correctly show:

1. **Single-threaded**: Only one thing executes at a time (one car on the track)
2. **Run-to-completion**: Each task/function runs fully before anything else
3. **Task queue — one per loop**: Event loop picks up ONE task per iteration
4. **Microtask queue — drain all**: Event loop drains ALL microtasks before moving on
5. **Microtasks before tasks**: If both queues have items, microtasks always go first
6. **Rendering is optional**: Browser may skip rendering if nothing changed
7. **Web APIs run in parallel**: setTimeout timers and fetch requests happen outside the main thread (off-track), their callbacks queue up when ready
8. **Microtask starvation** (v2): Infinite microtasks block rendering indefinitely
