# Project Guidelines

## Session Learnings (2026-03-29)

### What worked well
- **Brainstorming with visual companion**: Using the browser-based mockup server to iterate on circle layout designs before writing any React code — user could see and tweak positioning in real-time
- **User-driven design corrections**: User correctly identified that Web APIs and Call Stack don't belong ON the event loop circle — they're external/internal to it. This made the design more technically accurate
- **Subagent parallelism**: Dispatching 5 independent component tasks simultaneously (CircleTrack, Station, WebApiBox, CallStack rewrite, hooks/context) saved significant time
- **SVG-based circle + cursor**: Using a single SVG coordinate system for circle, cursor, stations, and call stack eliminated the positioning drift issues that plagued the CSS-based approach
- **Step-by-step execution**: Precomputed snapshots via `buildSyncSnapshots()` made forward/backward stepping instant — no need to replay from scratch

### What went wrong
- **CSS offset-path drift**: First cursor implementation used CSS `offset-path: circle()` with hardcoded pixel values that didn't match the responsive circle div — two separate coordinate systems that drifted apart. Should have used SVG from the start
- **foreignObject xmlns attribute**: Included `xmlns="http://www.w3.org/1999/xhtml"` on divs inside foreignObject — valid in raw SVG but TypeScript/React rejects it. Had to strip it from 3 files after build failed
- **Hydration mismatch from trig**: `Math.sin()`/`Math.cos()` produced slightly different floating point results between Node.js (SSR) and browser (hydration). Fixed by rounding anchor coordinates to integers
- **foreignObject clipping**: Initial foreignObject dimensions were too narrow, cutting off station detail boxes. Required multiple iterations to get the widths and positions right
- **Arrow positioning**: The dashed arrows connecting Web APIs to stations were poorly positioned — endpoint coordinates calculated by hand were wrong. User had to point this out via screenshot
- **Always verify visually**: User had to explicitly tell me to check my work with Playwright before reporting results. Should always screenshot after visual changes — now saved as a memory/feedback item

## Package Manager

Use `bun` for all commands — not `npm`, `npx`, or `yarn`.

- Dev server: `bun run dev`
- Build: `bun run build`
- Tests: `bun run test`
- Lint: `bun run lint`

## Verification

Always run `bun run test` after completing changes, in addition to visual verification with Playwright screenshots.
