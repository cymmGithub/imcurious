# Brainstorming Q&A

## Q1: What's the idea?

**Answer:**
An interactive blog post at `imcurious.how/the-event-loop-works` explaining how the JavaScript event loop works. Key points:

- **Domain**: imcurious.how — SEO-friendly when concatenated with the slug (imcurious.how/the-event-loop-works)
- **Inspiration**: Josh Comeau's interactive blog style (React + motion library), and Jake Archibald's conference talk visualization of the event loop as a looping track
- **Core concept**: Map the event loop visualization (from Jake's talk — the looping track with task queue, microtask queue, rendering pipeline) to an **F1 racing track** metaphor
- **Interactivity**: Users can:
  - Add tasks via setTimeout/setInterval (go to callback/task queue)
  - Add fetch calls (promises go to microtask queue)
  - Interact with the rendering pipeline (rAF, Style, Layout, Paint)
  - Watch how the event loop processes them in order
- **Reference materials available**: Will Sentance's Frontend Masters course transcripts and Jake Archibald's presentation summary, all in the project directory
- **Research**: Should also look beyond the provided materials for deeper understanding

## Q2: What "drives" around the track?

**Question:** In Jake's diagram, the event loop has the main loop track, the task queue, the microtask queue, and the rendering pipeline. In your F1 version — what drives around the track? A single F1 car representing the main thread/call stack, or tasks themselves as cars?

**Answer:** A single F1 car representing the main thread / call stack, racing around the circuit and making pit stops at each queue.

## Q3: How should task execution be visualized?

**Question:** When the car pulls into a queue pit stop — does it pick up a task and carry it onto the track to execute, or does execution happen right at the pit stop?

**Answer:** Execution should happen right there at the pit stop. The car pulls in, the task executes at that location, and then the car continues on the track.

## Q4: How to visually differentiate microtask vs task queue behavior?

**Question:** The event loop drains ALL microtasks before moving on, but only picks up ONE task per loop. How should we visually communicate this difference?

**Answer:** Go with the proposed approach:
- **Microtask queue pit stop**: Car stays parked, blocks disappear one by one until all are processed, then car leaves
- **Task queue pit stop**: Car stops, processes just 1 block, then continues the lap
- Visual cues: blocks disappearing sequentially, possibly a counter showing remaining items

## Q5: How detailed should the rendering pit stop be?

**Question:** The rendering pipeline has rAF, Style, Layout, Paint. How detailed should the rendering pit stop be? Full pipeline (4 sub-stops), simplified (one combined stop), or progressive disclosure?

**Answer:** Option 2 — Simplified. One combined "Render" stop with small labels showing the sub-steps happening inside. Keep it clean.

## Q6: What should the user interaction UI look like?

**Question:** Users can add setTimeout, setInterval, and fetch calls. Should the input be a code editor, pre-built buttons with sliders, or a hybrid?

**Answer:** Pre-built buttons like "Add setTimeout (500ms)" / "Add fetch" with maybe a slider for the delay value. Keep it accessible and low-friction.

## Q7: Should the user have playback control?

**Question:** Should users control speed/playback? Options: play/pause, speed slider, step-through debugger mode, or a combination?

**Answer:** A play/pause button so they can freeze the loop and inspect state. Keep it simple — no speed slider or step mode for now.

## Q8: How should the blog content be structured?

**Question:** Should the page be widget-first (track is the hero), scrollytelling (alternating text and widgets), or hybrid (persistent track with scrollable text alongside)?

**Answer:** Hybrid — a persistent track visualization that stays visible while the user scrolls through explanatory text alongside it.

## Q9: How should the layout behave on mobile?

**Question:** On desktop the track sticks to one side with text on the other. What about mobile where both won't fit side by side?

**Answer:** Stick to the top of the viewport on mobile (taking maybe 40-50% of the screen) with text scrolling below.

## Q10: What tech stack?

**Question:** What tech stack do you want? Next.js + Framer Motion, Astro + React islands, plain React/Vite, or something else? And is this a standalone page or part of a larger blog?

**Answer:** Next.js + Framer Motion. This is part of a larger blog platform — more posts will follow on imcurious.how.

## Q11: What visual style for the F1 track?

**Question:** What visual direction? Realistic F1 broadcast, stylized/neon (closer to Jake's gradient), minimal/flat, or a specific team color scheme?

**Answer:** Stylized/neon — closer to Jake's gradient aesthetic but with F1 elements (car shape, pit lane markers), more illustrative than realistic.

## Q12: How should the educational narrative be structured?

**Question:** What sections/chapters should the scrollable text have? Proposed flow: Intro, Call stack, Web APIs/Browser features, Task queue, Microtask queue, Rendering, Interactive sandbox. And should the track visualization evolve as the user scrolls?

**Answer:** The proposed flow feels right. And yes — the track visualization should evolve as the user scrolls. Start simple (just the track and car), then progressively reveal pit stops and features as each concept is introduced in the text.

## Q13: What should the interactive sandbox include?

**Question:** Beyond the buttons and track, should the sandbox include: a log/console panel, pre-built scenarios (e.g., setTimeout(0) vs Promise.resolve()), a "break it" mode (infinite microtasks blocking rendering)?

**Answer:** All of it. The sandbox should include:
- A log/console panel showing execution order
- Pre-built scenarios as guided challenges
- A "break it" mode demonstrating microtask starvation

## Q14: How should blog content be authored?

**Question:** MDX (Markdown + React components), hardcoded React pages, or a CMS?

**Answer:** MDX — write Markdown with React components embedded inline, matching Josh Comeau's approach.

## Q15: What shape should the track be?

**Question:** Should the track stay close to Jake's figure-eight/overlapping oval loop, or use a more traditional F1 circuit layout?

**Answer:** Stay close to Jake's figure-eight loop shape, just styled as an F1 track with F1 visual elements.

## Q16: Deployment and hosting?

**Question:** What's the hosting/deployment plan? Vercel, Cloudflare Pages, self-hosted, or undecided?

**Answer:** Vercel — natural fit for Next.js.

## Q17: Scope — all-in or phased?

**Question:** Ship everything at once, or split into phases?

**Answer:** Phased approach:
- **v1**: Blog text + evolving track with car animation + play/pause + basic buttons (setTimeout, fetch)
- **v2**: Console log panel, pre-built scenarios, "break it" mode, setInterval support
