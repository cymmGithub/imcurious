# Atmospheric Depth — Visual Polish Design

Deepen the neon/racing aesthetic across the article reading experience and interactive visualization components. All changes are additive — no existing functionality is modified.

## Scope

- **Article reading experience**: MDX content styling, section transitions, callout blocks, code blocks, lists
- **Visualization polish**: Car exhaust trail, track glow, pit stop beacons, start/finish line, car shadow, controls bar

The home page is out of scope.

---

## Article Reading Experience

### Section Dividers

Add an animated gradient line between each `<Section>` component.

- 1px line with `linear-gradient(90deg, transparent, neon-cyan, neon-pink, transparent)` at 60% opacity
- A second blurred copy underneath at 40% opacity for glow halo
- Placed at the top of each `<Section>` (except the first)

### Callout Blocks — "Pit Wall Radio"

New `<Callout>` MDX component for key insights, quotes from Jake Archibald / Will Sentance, and important takeaways.

- Container: `rounded-lg`, gradient background (`rgba(neon-cyan, 0.04)` to `rgba(neon-pink, 0.04)` at 135deg), border `1px solid rgba(neon-cyan, 0.15)`
- Scanline overlay: `repeating-linear-gradient` at 2px intervals, `opacity: 0.03`
- Header: Pink pulsing dot (CSS `animate-pulse`) + "PIT WALL RADIO" in Orbitron, 10px, `tracking-[0.2em]`, uppercase, neon-pink
- Body: Gray-200 italic text in Space Mono, wrapped in curly quotes

Usage in MDX:
```mdx
<Callout>
Microtasks run whenever the JavaScript stack empties.
</Callout>
```

### Code Blocks

Replace the current plain `<pre>` with a styled container:

- **Header bar**: Traffic light dots (3 circles: red/yellow/green at 60% opacity), filename label in gray-500 Space Mono 11px, separated by `border-bottom: 1px solid rgba(255,255,255,0.06)`
- **Background**: `rgba(10, 10, 26, 0.8)`
- **Scanline overlay**: Same pattern as callout blocks, `opacity: 0.02`
- **Code text**: Keep existing gray-300 monospace text. Full syntax highlighting with neon palette colors would require a syntax highlighter library (e.g., `rehype-pretty-code`) which is out of scope for this pass. The visual upgrade here is the container chrome (header bar, scanlines, background), not token-level coloring.

### Lists

- Replace default disc markers with small glowing circles (1.5px radius)
- Color-coded by position: yellow (index 0), green (index 1), pink (index 2), cycling
- Each dot gets a matching `box-shadow: 0 0 8px {color}` glow
- Spacing: `space-y-3`, `gap-3` between marker and text

### Inline Code

Keep current `bg-gray-800 text-neon-cyan` styling. Add a `2px solid neon-cyan` left border at 30% opacity for subtle visual weight.

### Section Fade-In

Each `<Section>` content animates on scroll entry:
- `opacity: 0 -> 1`, `translateY: 12px -> 0`
- Duration: 0.5s ease-out
- Triggered by Framer Motion `whileInView` with `once: true`
- Wrap Section children in a `motion.div`

---

## Visualization Polish

### Car Exhaust Trail

Store the last 10 car positions in `useEventLoopSimulation` as a `positionHistory: number[]` array. On each tick, push the current position and shift if length > 10.

In `Car.tsx`, render trail circles:
- Map over `positionHistory`, compute screen coordinates for each via `path.getPointAtLength()`
- Each circle: `r = 2.5 - i * 0.2`, `opacity = 0.5 - i * 0.04`
- Fill: `neon-cyan`
- Gentle opacity pulse via CSS animation (not per-frame JS)
- Only render when car is in DRIVING state (no trail when stopped)

### Track Edge Glow

Enhance existing Track.tsx glow:
- Keep existing pulse (`0.1 → 0.3 → 0.1`, 3s)
- Add a second pulsing `<path>` offset by 1.5s (`begin="1.5s"`)
- Increase track glow stroke opacity from 0.04 to 0.06

### Active Pit Stop Beacon

When `isActive` is true on a PitStop, render two expanding ring animations:
- Ring 1: `stroke={color}`, strokeWidth 1, animates `r` from 18 to 28 and `opacity` from 0.2 to 0 over 2s, infinite
- Ring 2: Same but begins at 0.5s offset for staggered pulse
- Uses SVG `<circle>` with `<animate>` elements (not Framer Motion, to stay in SVG)

Since pit stops are positioned via HTML overlay divs (not inside the SVG), implement the beacon as CSS rings:
- Two `<span>` elements with `border: 1px solid {color}`, `rounded-full`, absolute positioned
- CSS `@keyframes beacon-ring` animating `scale(1) -> scale(1.8)` and `opacity(0.3) -> opacity(0)`
- Second ring delayed by 0.5s

### Pit Stop Zone

Replace the current radial gradient div with a more structured container:
- Rounded container with `border: 1px solid {color}` at 15% opacity
- Background: `{color}` at 5% opacity
- Subtle inner glow via `box-shadow: inset 0 0 20px {color}10`

### Start/Finish Line

Render the existing `#checker` pattern at the center crossing point (400, 300):
- Small `<rect>` at the crossing: width 10, height 60 (spanning track width), fill `url(#checker)`, opacity 0.5
- Positioned via the SVG coordinate system in Track.tsx

### Car Shadow

Add `<ellipse>` beneath the car SVG:
- `cx=0, cy=6, rx=14, ry=3`
- `fill="rgba(0,0,0,0.25)"`
- Rendered inside the car's transform group, before the body shapes

### Controls Bar

Add a top-edge glow to the controls container:
- `box-shadow: 0 -1px 12px rgba(0, 245, 255, 0.06)` on the controls wrapper
- Replace current `border-gray-800` with `border-color: rgba(0, 245, 255, 0.1)`

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/mdx/Section.tsx` | Add gradient divider, wrap children in motion.div for fade-in |
| `src/components/mdx/Callout.tsx` | **New file** — Pit Wall Radio callout component |
| `src/components/mdx/MDXProvider.tsx` | Register Callout, update `pre`/`code`/`ul`/`li`/`strong` styles |
| `src/posts/the-event-loop-works.mdx` | Add `<Callout>` blocks around key quotes/insights |
| `src/hooks/useEventLoopSimulation.ts` | Add `positionHistory` to state, update on tick |
| `src/components/event-loop/Car.tsx` | Render exhaust trail circles, add car shadow |
| `src/components/event-loop/Track.tsx` | Enhance glow, add start/finish checkered line |
| `src/components/event-loop/PitStop.tsx` | Add beacon rings when active, structured zone container |
| `src/components/event-loop/Controls.tsx` | Add top-edge glow, update border color |
| `src/app/globals.css` | Add `@keyframes beacon-ring` animation |

## Files NOT Modified

- `src/lib/simulation.ts` — Pure state machine, no visual concerns
- `src/lib/trackPath.ts` — Coordinates unchanged
- `src/app/page.tsx` — Home page out of scope
- `src/app/layout.tsx` — No layout changes needed
