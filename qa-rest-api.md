# REST API Blog Post — Brainstorm Q&A

## Q0 — Seed idea

> What would you like to brainstorm?

**Answer:**
Add a new blog post to the current project — an interactive guide to REST APIs covering:

- REST API best practices
- Deep understanding of **idempotency**
- Differences between **PUT vs PATCH**
- HTTP methods overview (what we have, when to use them)

Structure should mirror the existing JavaScript event loop post:

- Left side: interactive visualization / view of "products" built up from the right side
- Right side: text paragraphs and interactive snippets (scroll-driven)

References to draw best practices from:

- https://cloud.google.com/discover/what-is-rest-api#rest-api-best-practices
- https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design

Stack alignment (from a quick read of the codebase):

- Next.js App Router, MDX posts under `src/posts/`
- Slug routing in `src/app/[slug]/page.tsx` with a manual `posts` registry
- MDX components: `ScrollStage`, `Section stage={N}`, `RunCode`, `StepList`, `DemoCode`, `Callout`
- Per-topic interactive components live in `src/components/<topic>/` (e.g. `event-loop/`)

## Q1 — Core thesis

> What's the single core insight a reader should walk away internalizing? Idempotency-centric, method-semantics-centric, best-practices tour, or other?

**Answer:** A — _"Idempotency is the contract that makes the web survivable."_

The post is built around what happens when a request is retried. GET, PUT, DELETE survive retries; POST and (usually) PATCH don't. Method choice and best practices are explained _through this lens_, not in parallel to it.

## Q2 — Which idempotency misconception is the primary target?

> MC-A safe vs idempotent / MC-B POST-vs-PUT framing / MC-C response-vs-state / MC-D retry-under-failure?

**Answer (with reframing):** _"All of them — I just failed a tech interview and want to improve at REST APIs overall."_

This changes the job-to-be-done. The original framing was "publish a tight focused explainer." The new framing is "learn REST APIs deeply via the act of building a post (or posts)." These overlap but aren't identical — the learning goal is broader than any single tight post can serve.

**Decision deferred to Q3:** whether this becomes one broad post or a series of focused ones.

## Q3 — Series or single post?

> Recommendation: a planned series of 3–5 focused posts, not one big one. First post = idempotency.

**Answer:** **Series**, starting with **idempotency**.

Series outline (working sketch, refinable later):

1. **Idempotency is the contract that makes the web survivable** _(this post)_
2. HTTP methods as promises about safety + idempotency
3. Status codes — the server's vocabulary
4. REST design — resources, not actions
5. _(optional)_ Caching / auth / rate limiting

All posts share the scroll-stage + left-viz pattern. Each has its own focused thesis and its own per-topic component directory (e.g. `src/components/idempotency/`, `src/components/http-methods/`).

## Q4 — Interview fuzziness map

> What specifically tripped you up?

**Answer (verbatim):**

- Froze on **PUT vs PATCH**
- Froze on **idempotency** explanation
- Froze on **REST best practices** (open-ended)
- Struggled on **"how would you model an endpoint for a simple GET collection? what best practices would you follow?"**

**Synthesis — which post each pain point belongs to:**

| Pain point                                                    | Owning post                                         | Notes                                                                                                                                                                          |
| ------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PUT vs PATCH                                                  | **Post 1 (idempotency)**                            | Lives squarely in the idempotency frame: PUT is idempotent by spec, PATCH is _not necessarily_ — depends on patch body semantics. This IS Post 1's killer payoff.              |
| Idempotency definition                                        | **Post 1**                                          | The thesis itself. State-stability vs response-stability is the critical distinction.                                                                                          |
| General "best practices"                                      | **Post 4 (REST design)** + spread across the series | Too broad to live in one post. Each post in the series surfaces _its slice_ of best practices.                                                                                 |
| GET collection design (pagination, filtering, response shape) | **Post 2 (methods)** + **Post 4 (design)**          | Not a Post 1 topic — but Post 1 should briefly establish that GET is _safe AND idempotent_ and explain why both properties matter, which sets up the contrast for later posts. |

**Honest framing for Post 1:** It will fully address pain points #1 and #2 (PUT vs PATCH; idempotency definition). It will only _frame_ the territory of pain points #3 and #4 — the series as a whole is the real fix for those.

## Q5 — Central interactive mechanic

> A: Retry Lab / B: Resource State Diff / C: Side-by-side panels?

**Answer:** **A — Retry Lab.**

Reader sees: client box ↔ animated wire ↔ server box, with a resource state panel and request log below. User fires requests; wire can be cut mid-flight; retries reveal whether the resource state diverges (non-idempotent) or stays stable (idempotent). The "wire" plays the role the orbiting cursor played in the event loop post — a single animated focal point that all the scroll stages evolve around.

**Sub-decisions deferred:** Q6 (resource domain), Q7 (wire visual treatment), Q8 (sandbox vs precomputed scenarios). User wants these taken one at a time.

## Q6 (sub-decision A.1) — Resource domain

> Bank account, user profile, shopping cart, todo, or other?

**Answer:** **Bank account.**

Resource shape (keep it minimal):

```json
{ "id": "acc_42", "owner": "Alice", "balance": 100 }
```

Endpoints used in demos:

- `GET /accounts/acc_42` → safe + idempotent baseline
- `POST /accounts` → creates new account, **non-idempotent**
- `PUT /accounts/acc_42` → replaces full document, **idempotent**
- `PATCH /accounts/acc_42` with `{ "balance": 200 }` → **idempotent** patch
- `PATCH /accounts/acc_42` with `{ "credit": 50 }` → **non-idempotent** patch (the killer demo)
- `DELETE /accounts/acc_42` → **idempotent**

Tone guideline: keep money minimal (no currency formatting, no transactions table). Bank account is for _drama_, not for _fintech accuracy_. Reader feels the "double-charge" fear without us having to teach them double-entry bookkeeping.

## Q7 (sub-decision A.2) — Wire visual treatment

> Single SVG wire with bidirectional animated packets and three explicit failure modes?

**Answer:** **Locked in as proposed.**

Specification:

- **One** horizontal SVG path between `Client` (left) and `Server` (right). Solid when healthy, gapped/dashed when broken.
- **Request packets** travel left→right, labeled with the HTTP method, colored by method.
- **Response packets** travel right→left, labeled with status code, colored by status family (2xx green, 4xx yellow, 5xx red).
- **Three failure modes**, all visually distinct:
  1. _Request lost_ — wire breaks before packet reaches server; resource panel unchanged.
  2. _Server processed, response lost_ — packet reaches server; resource panel **mutates**; response packet starts back but wire breaks on return. **This is the climactic moment of the post.**
  3. _Success_ — full round trip.
- Reader cannot tell #1 from #2 from the client side alone (just like in reality). The resource panel shows the truth the client doesn't have access to.

## Q8 (sub-decision A.3) — Sandbox vs precomputed scenarios

> Precomputed scenarios only?

**Answer:** **Precomputed only.** No sandbox in v1.

Each section has a named scenario (e.g. `post-double-charge`, `put-retry-safe`, `patch-credit-divergence`). Reader steps forward/back. Snapshots precomputed at build time. Mirrors event-loop's `RunCode scenarioId="..."` + `StepList` + `ScrollStage` pattern.

A sandbox is a viable v2 once the post is shipped and we have reader feedback.

## Q9 — Real-world hook + reference materials

> Find the Uber free-food bug and keep Microsoft Azure + Google Cloud REST best-practices in mind.

**Found incident: Uber Eats India glitch, March 2019** _(corrected from initial misread — March 2022 is the date Gergely Orosz tweeted the public retrospective, ~3 years after the bug)_

- Paytm silently changed an API endpoint from idempotent to non-idempotent (per Orosz's thread: "It silently changed an API endpoint from behaving idempotent to non-idempotent.").
- Uber Eats' integration code had no mapping for the new response shape, and the silent default treated unknown responses as success.
- Verified specific impact: one college in India ran up roughly **$14,000 in free orders in a single day**. Uber discovered the bug when restaurants started going offline under the order volume.
- The widely-circulated "~100 cities" and "~147 meals" figures came from secondary writeups and are NOT confirmed in Orosz's original thread.
- **Root cause:** weak idempotency contract between Uber and the PSP — a third-party API change wasn't safely absorbed because there was no idempotency key disambiguating retries from new requests. Classic distributed-systems idempotency failure.

**Sources confirmed:**

- HN discussion (primary): https://news.ycombinator.com/item?id=30692406
- HN discussion (secondary): https://news.ycombinator.com/item?id=30668183
- Original Twitter writeup (Gergely Orosz): https://twitter.com/gergelyorosz/status/1502947315279187979
- Medium analysis: https://medium.com/@icis.sabyasachi/the-uber-eats-india-glitch-a-real-world-lesson-in-idempotency-and-api-design-06e3b3aeaded
- Bug Bytes #163 writeup: https://blog.intigriti.com/2022/03/16/bug-bytes-163-uber-eats-payment-bypass-mystery-lab-challenge-1337up-livestream/

**How the Uber story will be used in the post (tentative):**

- **Opening hook:** "Students ordered $14k of free food because of a missing idempotency safeguard." Set up survivable thesis.
- **Closing callback:** When the reader meets idempotency keys in the final section, return to Uber: explain how a proper key would have absorbed the PSP's API change without granting free meals.

**Authoritative reference materials to cite throughout:**

- **Microsoft Azure — API design best practices:** https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design — used for idempotency definition rigor, safe vs idempotent distinction, status codes.
- **Google Cloud — What is a REST API:** https://cloud.google.com/discover/what-is-rest-api#rest-api-best-practices — used for REST principles overview, method semantics.

Citation style: short inline links inside Callouts ("📖 Microsoft's API design guidance defines idempotency as…") rather than a bibliography. Two or three citations per post — enough for credibility, not so many it feels like a research paper.

## Q10 — Section breakdown for Post 1

> 7-section structure as proposed (Uber hook → lab intro → idempotency definition → POST trap → PUT safe → PATCH gauntlet → idempotency keys + outro)?

**Answer:** **Locked in as proposed.**

Section bundling kept as-is:

- §4 bundles "wire breaks" + "POST double-charge" (failure modes serve the climactic POST scenario)
- §7 bundles idempotency keys + Uber callback + bridge to Post 2
- §1 was no-interactive in the proposal — overridden in Q11 (see below)

## Q11 — Component architecture

> Directory layout, snapshot shape, §6 single-lab-swap, §1 text-only?

**Locked:**

- Directory layout `src/components/idempotency/` with `RetryLabViz`, `Client`, `Server`, `Wire`, `Packet`, `ResourcePanel`, `RequestLog`, `RetryLab` and `scenarios/` subfolder — accepted.
- Snapshot/Scenario types (sketched) — accepted as starting point; refine during implementation.
- §6 layout — single lab, scenario swaps as the reader steps. Side-by-side rejected (cost > value at this width).

**Overridden:** §1 will have a small visual teaser of the Uber incident (was: text-only). See Q12.

## Q12 — §1 Uber teaser ("Receipts Tape")

**Locked:**

- Concept: receipts-tape accumulator showing repeated `PAY FAILED → ORDER DELIVERED` entries, ending with a frozen totals card.
- Phrasing: **literal** (`PAY FAILED`, `ORDER DELIVERED`), not API-flavored. Emotional hook first; vocabulary delivery starts in §2.
- Behavior:
  - Plays once on scroll-into-view (IntersectionObserver), freezes at the final state.
  - Entries appear every ~250ms; total runtime ~3–4 seconds.
  - Counter increments in sync with entries.
  - Respect `prefers-reduced-motion` → skip animation, show frozen state immediately.
- Final frozen state: "one college, one day: ~$14,000 / in free food, until restaurants went offline" (badge `Uber Eats · India · March 2019`).
- Styling: muted greyscale background, single accent color on `DELIVERED`, monospace font (foreshadows §2's `RequestLog`).
- No Uber branding (no logo/color reuse).
- Component: `src/components/idempotency/UberReceiptsTeaser.tsx`.

## Q13 — Scenario step pattern (walked through `post-double-charge`)

> 5–7 steps per scenario, full-state snapshots, resource panel = server truth, log = client view, wire-break as its own step?

**Locked.** Snapshot pattern accepted as walked through. Full `post-double-charge` worked example serves as the canonical reference in `spec-rest-api.md`. The other 6 scenarios get **intent-level specs only** — author encodes them during implementation as the primary interview-prep learning activity.

## Q14 — Final batch: routing, metadata, tone, testing

> Lock in title, slug, category, date, tone, testing approach as recommended?

**Locked.**

- **Title (H1):** _How Idempotency Saves the Web?_
- **Slug:** `how-idempotency-saves-the-web`
- **Filename:** `src/posts/how-idempotency-saves-the-web.mdx`
- **Sidebar category:** `REST APIs` (new — future posts in the series share it)
- **Metadata date:** `12/05/26` (DD/MM/YY)
- **Page `<title>`:** `How Idempotency Saves the Web? | imcurious.how`
- **Meta description:** `An interactive guide to REST API idempotency. Watch retries, failures, and the contract that decides whether your API survives them.`
- **Tone:** match event-loop post — second person, conversational, playful where it lands, short paragraphs, metaphors over jargon.
- **Testing:**
  - Unit: `bun run test` (vitest) on snapshot-builder + scenario data consistency
  - Visual: Playwright screenshots at the 5 key frames listed in Q14
  - `bun run format:check` before every commit
- **Color palette:** sketched as defaults; iterate during implementation.

---

**End of brainstorm.** Spec to be generated as `spec-rest-api.md`.
