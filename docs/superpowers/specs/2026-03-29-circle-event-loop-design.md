# Circle Event Loop Visualization Design

**Date:** 2026-03-29
**Branch:** New branch off `feat/blueprint-aesthetic`
**Mockup:** `.superpowers/brainstorm/261711-1774792281/content/orbital-v5.html`

## Overview

Replace the F1 race car / oval track metaphor with a simple circle and a small cursor box representing the single JS thread. The circle is the event loop. The cursor orbits it, stopping at stations.

## Layout

### The Circle
- SVG circle, center `(300, 300)`, radius `180`
- Stroke: `#5a554d` (chalk-faint), 2px
- Cursor: 14x14 rect with 3px border-radius, `#e8e4dc` fill, subtle glow. Orbits the circle clockwise using `<animateMotion>` on the SVG path (guarantees no drift).

### 3 Stations ON the Circle (120 degrees apart)
Each station is a pill-shaped label sitting at an anchor dot on the circle perimeter, with a detail panel that shows queued items.

| Station | Position | Anchor | Color |
|---------|----------|--------|-------|
| Microtask Queue | 12 o'clock (0 degrees) | (300, 120) | `#ffffff` |
| Task Queue | ~5 o'clock (120 degrees) | (456, 390) | `#888888` |
| Render | ~7 o'clock (240 degrees) | (144, 390) | `#c0b8a8` |

- Station pills: `JetBrains Mono`, 10px, uppercase, dashed border (solid when active)
- Detail panels: `#0a0a0a` background, 6px border-radius, show queued frames
- Microtask detail sits ABOVE the pill; Task Queue and Render details sit BELOW their pills

### Call Stack INSIDE the Circle
- Replaces the old "EVENT LOOP / SINGLE-THREADED" center label
- Shows current execution frames (push/pop)
- Styled as ext-label + detail-box, centered in the circle
- When the cursor stops at a station, the callback visually moves from the queue into the call stack

### Web APIs OUTSIDE the Circle (right side)
- Single external box, vertically centered with the circle
- Dashed border, `#a09a8e` color (chalk-dim)
- Shows pending timers/fetches with countdown
- Dashed arrow from Web APIs to Task Queue showing callback delivery

## What Changes from Current Implementation

### Removed
- `Track.tsx` (oval SVG path with bezier curves)
- `Car.tsx` (F1 car image with trail dots)
- `PitStop.tsx` (pit stop zones)
- `Garage.tsx` (Web API area above track)
- `trackPath.ts` (oval path definition, pit stop positions)
- Race/car metaphors from MDX content

### Modified
- `EventLoopViz.tsx` — new circle layout, renders stations on circle perimeter + call stack center + web apis external box
- `simulation.ts` — pit stop positions change from `{microtask: 0.25, task: 0.50, render: 0.75}` to `{microtask: 0, task: 0.333, render: 0.667}` (120 degree spacing). Car states renamed (no more "car" terminology).
- `CallStack.tsx` — moves inside the circle instead of being a side panel
- `useEventLoopSimulation.ts` — cursor position instead of car position
- `ScrollStage.tsx` — same scroll-driven reveal behavior, no layout changes needed
- `scenarios.ts` — no changes needed (scenarios are data, not visual)
- MDX content — update metaphor language (remove race/car references)

### New
- `CirclePath.ts` — circle geometry, station positions at 120 degree intervals, replaces `trackPath.ts`
- Station component — pill label + detail panel, replaces PitStop
- WebApiBox component — external box for pending Web APIs, replaces Garage
- Cursor component — simple rect that follows the circle path, replaces Car

## Aesthetic

Unchanged — chalk-on-blackboard blueprint style:
- Background: `#000` with 80px grid
- Fonts: Playfair Display (headings), JetBrains Mono (labels/code), DM Sans (body)
- Colors: chalk palette (`#e8e4dc`, `#a09a8e`, `#5a554d`, `#c0b8a8`)
- Borders: dashed when inactive, solid when active
- Low-opacity fills (5% bg, 30% borders)

## Scroll-driven Behavior

Same as current — 6 stages, progressive reveal:
- Stage 1: Circle + cursor visible, call stack center
- Stage 2: Call stack interaction
- Stage 3: Web APIs box fades in
- Stage 4: Task Queue station fades in
- Stage 5: Microtask Queue station fades in
- Stage 6: Render station fades in

## Interactive Scenarios

All 5 existing scenarios preserved, same RunCode component. The simulation logic is the same — only the visual representation changes from car-on-track to cursor-on-circle.
