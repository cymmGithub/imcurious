# Spec — Post 1: _How Idempotency Saves the Web?_

This spec covers **Post 1 of a planned REST APIs series**. It is the artifact a developer (or future you) picks up to implement the post. It consolidates every decision from `qa-rest-api.md` and adds the implementation detail not surfaced during the Q&A.

---

## 1. Thesis & framing

**Thesis:** _Idempotency is the contract that makes the web survivable._

Everything in the post serves this single insight. Best practices, method choice, status codes, and design patterns are introduced _through this lens_, not in parallel to it.

**Audience:** Engineers preparing for backend / system-design interviews who already know HTTP basics but have a fuzzy depth-model of idempotency, PUT vs PATCH, and "best practices." Specifically the author, who froze on these exact topics in a recent interview.

**Job-to-be-done:** Replace fuzzy beliefs with precise, defensible mental models. The interactive Retry Lab makes the contract observable; the prose anchors each observation in interview-relevant language.

---

## 2. The series this post belongs to

| #     | Working title                                                                      | Status                   |
| ----- | ---------------------------------------------------------------------------------- | ------------------------ |
| **1** | **How Idempotency Saves the Web?** _(this post)_                                   | Specced — implement next |
| 2     | HTTP Methods as Promises (deep dive on each method's contract)                     | Future                   |
| 3     | Status Codes — the Server's Vocabulary                                             | Future                   |
| 4     | REST Design — Resources, Not Actions (URL design, versioning, collection modeling) | Future                   |
| 5     | _(optional)_ Caching, Auth, Rate Limiting                                          | Future                   |

All posts share the same scroll-stage left-viz pattern. Sidebar category: `REST APIs`.

**Critical scope reminder:** Post 1 will not fully cure the "general best practices" and "GET collection design" interview pain points — those belong to Posts 2 and 4. Post 1 fully addresses **PUT vs PATCH** and **idempotency definition**, the two top-priority gaps.

---

## 3. Real-world hook & references

### Opening hook: Uber Eats India glitch (March 2022)

For one weekend in March 2022, users across ~100 cities (heavily India) could order food and the retry-charge response made it look paid. Root cause: a PSP (payment service provider) updated its API with a new status type for retry-charge requests, which Uber Eats' integration mis-interpreted as success. Reports vary on totals; "approximately $14k per heavy user" / "$15k/day" are the figures repeated across credible writeups. The fix: a proper idempotency-key contract that disambiguates retries from new requests, regardless of what status code the PSP returns.

The Uber story bookends the post:

- **§1 (opening hook):** scale and emotional weight via the receipts-tape teaser.
- **§7 (closing callback):** mechanism-level explanation once the reader has the vocabulary.

### Source links (cited from Callouts in the prose, not a bibliography)

- HN primary: https://news.ycombinator.com/item?id=30692406
- HN secondary: https://news.ycombinator.com/item?id=30668183
- Gergely Orosz writeup: https://twitter.com/gergelyorosz/status/1502947315279187979
- Medium analysis: https://medium.com/@icis.sabyasachi/the-uber-eats-india-glitch-a-real-world-lesson-in-idempotency-and-api-design-06e3b3aeaded
- Bug Bytes #163: https://blog.intigriti.com/2022/03/16/bug-bytes-163-uber-eats-payment-bypass-mystery-lab-challenge-1337up-livestream/

### Authoritative references (cite 2–3 times across the post)

- Microsoft Azure — API design best practices: https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design — used for the idempotency definition + safe-vs-idempotent distinction in §3.
- Google Cloud — What is a REST API: https://cloud.google.com/discover/what-is-rest-api#rest-api-best-practices — used for REST principles and method semantics framing in §6.

---

## 4. Section outline (7 sections)

| #   | Section title (working)                                              | Thesis-payload                                                                                                                                                                                                          | Central scenario                                |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | **The Weekend Uber Eats Went Free**                                  | Hook with the March 2022 incident. State the survivable thesis.                                                                                                                                                         | `UberReceiptsTeaser` (not a Retry Lab scenario) |
| 2   | **A Bank, a Wire, and a Lab**                                        | Introduce the Retry Lab UI. Fire a `GET` — wire animates, response returns, resource panel unchanged. Establishes the visual grammar.                                                                                   | `get-baseline`                                  |
| 3   | **What "Idempotent" Actually Means**                                 | Demolish (a) idempotency-is-about-state-not-response and (b) safe ≠ idempotent. Show the matrix. Cite Microsoft.                                                                                                        | `delete-twice`                                  |
| 4   | **The Wire Breaks → POST: The Double-Charge Trap**                   | Introduce failure modes 1 & 2. Show the client can't tell them apart. Run the canonical POST-retry scenario.                                                                                                            | `post-double-charge`                            |
| 5   | **PUT: Same Failure, Different Outcome**                             | Re-run the failure-mode-2 scenario with PUT. Server state unchanged. The thesis crystallized.                                                                                                                           | `put-retry-safe`                                |
| 6   | **PATCH: The Trap Inside the Trap**                                  | Two PATCH scenarios in sequence (single lab, scenario swap): `{balance: 200}` (idempotent) vs `{credit: 50}` (non-idempotent). The PUT-vs-PATCH interview answer the reader wishes they'd had. Cite Microsoft + Google. | `patch-balance-set` then `patch-credit-runaway` |
| 7   | **Idempotency Keys: Making POST Survivable** + **Back to Uber Eats** | The fix. Show a POST with an idempotency-key header; server dedupes retries. Return to Uber, explain how a proper key would have neutralized the PSP API change. Bridge to Post 2.                                      | `post-with-idempotency-key`                     |

**Bundling rationale** (locked in Q10):

- §4 bundles "wire breaks" with "POST double-charge" so the failure modes get introduced _in service of_ the climactic scenario, not in a separate dramatically-empty section.
- §7 bundles keys + Uber callback + bridge so the resolution lands unified, mirroring the event loop post's outro.

**Explicit non-goals (do NOT cover in Post 1):**

- HEAD, OPTIONS, TRACE methods
- Status code semantics beyond what each scenario needs (Post 3)
- Auth retry semantics (Post 5)
- Database-level idempotency, two-phase commit, event sourcing
- Pagination, filtering, response shaping for GET collections (Post 2 / Post 4)
- HATEOAS (Post 4)
- General REST best practices grab-bag

---

## 5. Central interactive mechanic: the Retry Lab

### 5.1 Visual layout

- **Left column (sticky, always visible):** `RetryLabViz` — the lab itself.
- **Right column (scrolling prose):** MDX with `<Section stage={N}>` blocks. Each section pins the lab to a specific scenario; the `StepList` inside the section advances the lab's snapshot index.

### 5.2 Lab anatomy

```
 ┌──────────────────────────────────────────────────────────┐
 │  RetryLabViz                                             │
 │                                                          │
 │   ┌─────────┐                              ┌─────────┐   │
 │   │ Client  │ ===wire==packets==wire====== │ Server  │   │
 │   └─────────┘                              └─────────┘   │
 │                                                          │
 │   ┌───────────────────────┐  ┌─────────────────────────┐ │
 │   │  ResourcePanel        │  │  RequestLog             │ │
 │   │  (server-side truth)  │  │  (client-perceived view)│ │
 │   └───────────────────────┘  └─────────────────────────┘ │
 └──────────────────────────────────────────────────────────┘
```

### 5.3 Resource domain — bank account

```ts
type Account = { id: string; owner: string; balance: number }
type ResourceState =
	| null
	| { kind: 'single'; account: Account }
	| { kind: 'collection'; items: Account[] }
```

- Keep money minimal — no currency formatting, no transactions table. Bank account is for _drama_, not fintech accuracy.
- Endpoints used across scenarios:
  - `GET /accounts/:id` — safe + idempotent
  - `POST /accounts` — creates a new account, **non-idempotent**
  - `PUT /accounts/:id` — replaces full doc, **idempotent**
  - `PATCH /accounts/:id` with `{ balance: N }` — **idempotent**
  - `PATCH /accounts/:id` with `{ credit: N }` — **non-idempotent** (the killer demo)
  - `DELETE /accounts/:id` — **idempotent** (state-wise, not response-wise)

### 5.4 The wire

- Single horizontal SVG path between Client (left) and Server (right).
- Solid when healthy; visible gap with dashed/frayed segments when broken.
- One animated focal point analogous to the event loop's orbiting cursor.

### 5.5 Packets

- **Request packets:** travel left → right, labeled with method (`POST`, `PUT`, etc.), colored by method.
- **Response packets:** travel right → left, labeled with status code (`200`, `201`, `204`, `404`, etc.), colored by status family (2xx green, 4xx amber, 5xx red).
- Default packet colors (sketch — refine during implementation):
  - GET: teal
  - POST: orange
  - PUT: blue
  - PATCH: purple
  - DELETE: red
- Each packet has a `fate`: `in-flight`, `arrived`, `lost`.

### 5.6 Failure modes (visually distinct — required)

1. **Request lost** — wire breaks before request reaches server. Resource panel **unchanged**.
2. **Server processed, response lost** — request reaches server, resource panel **mutates**, response packet starts return trip and is lost mid-wire. **Climactic moment of the post.**
3. **Success** — full round trip.

The reader cannot tell #1 from #2 from the client side. The resource panel exposes the truth the client doesn't have — and that gap is itself a teaching device.

### 5.7 Resource panel

- Shows server-side truth (JSON-styled view of the resource).
- Highlights changed fields on transitions.
- Supports both `single` and `collection` shapes (collection lights up when the duplicate-create scenarios fire).

### 5.8 Request log

- Records what the **client** perceived per attempt:
  - Method + path + body summary
  - Outcome: `success`, `request-lost`, `response-lost`, `in-flight`
  - Status code (if a response arrived)
- The split between resource panel (server reality) and log (client perception) is load-bearing pedagogy.

---

## 6. Snapshot & scenario data model

### 6.1 Types

```ts
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type PacketState = {
	id: string
	kind: 'request' | 'response'
	method?: HttpMethod
	statusCode?: number
	position: number // 0..1; 0 = at client, 1 = at server
	fate: 'in-flight' | 'arrived' | 'lost'
	label: string // e.g. "POST /accounts" or "201 Created"
	payloadPreview?: string // optional body excerpt
}

type LogEntry = {
	attempt: number
	request: { method: HttpMethod; path: string; body?: string }
	serverOutcome: 'processed' | 'request-lost' | 'not-yet'
	clientOutcome: 'success' | 'request-lost' | 'response-lost' | 'in-flight'
	statusCode?: number
	idempotencyKey?: string // surfaces in §7
}

type WireState = { healthy: true } | { healthy: false; breakAt: number } // 0..1 along the wire

type Snapshot = {
	description: string // prose shown in the StepList for this step
	resource: ResourceState // server-side truth
	wire: WireState
	packets: PacketState[]
	log: LogEntry[]
}

type Scenario = {
	id: string
	title: string // shown above the StepList
	steps: Snapshot[] // step 0 is the pre-state
}
```

### 6.2 Invariants (enforce via vitest tests)

- Every `Snapshot` is a **complete state**. No deltas — trivially correct under rewind/scrub.
- If a snapshot's `log[i].clientOutcome === 'response-lost'`, an earlier snapshot must have shown `wire.healthy === false`.
- Step count per scenario: 3 (for `get-baseline`) to ~8 (for `post-with-idempotency-key`). No artificial uniformity.
- `description` is written in the post's voice — second-person, no jargon the reader hasn't met yet.

---

## 7. Scenarios

Each scenario lives in `src/components/idempotency/scenarios/<id>.ts` and exports a `Scenario`. Below are **intent-level specs** for all 7. The first one (`post-double-charge`) is fully specced as the canonical pattern; you encode the snapshots for the rest during implementation.

### 7.1 `get-baseline` — §2 (Retry Lab debut)

**Intent:** Establish the visual grammar. Show a happy-path GET. Reader sees: request goes out, response comes back, nothing on the server changes. **No drama** — this is the "before" picture against which everything else contrasts.

- Pre-state: `resource = { kind: 'single', account: { id: 'acc_42', owner: 'Alice', balance: 100 } }`
- ~3 steps: send GET, server responds 200 with body, response arrives.
- Final log: `attempt 1 — GET /accounts/acc_42 — 200 OK`.

### 7.2 `delete-twice` — §3 (idempotent ≠ same response)

**Intent:** Demolish the misconception that idempotency means response stability. Reader sees: first DELETE returns 204 No Content; second DELETE returns 404 Not Found. Server state is _gone_ both times. Same end state, different responses — _that_ is idempotent.

- Pre-state: account exists.
- ~5 steps: DELETE #1 → 204, account becomes `null`. DELETE #2 → 404, account stays `null`.
- Surface a Callout in the prose explaining the state-vs-response distinction.

### 7.3 `post-double-charge` — §4 (CLIMACTIC — fully specced)

**Intent:** The killer scenario. Reader sees POST cause a duplicate when retried after a lost response.

**Pre-state:**

- `resource = null` (account doesn't exist yet)
- `wire = { healthy: true }`
- `packets = []`
- `log = []`

**Step 1 — Client sends `POST /accounts`.**

| Channel     | State                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| description | `Client sends POST /accounts with {owner: 'Alice', balance: 100} to create the account.`                                 |
| resource    | `null`                                                                                                                   |
| wire        | healthy                                                                                                                  |
| packets     | `[{ id: 'req-1', kind: 'request', method: 'POST', position: 0.1, fate: 'in-flight', label: 'POST /accounts' }]`          |
| log         | `[{ attempt: 1, request: { method: 'POST', path: '/accounts' }, serverOutcome: 'not-yet', clientOutcome: 'in-flight' }]` |

**Step 2 — Server processes; response begins return trip.**

| Channel     | State                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| description | `Server receives the POST, creates acc_42, sends back 201 Created.`                                            |
| resource    | `{ kind: 'single', account: { id: 'acc_42', owner: 'Alice', balance: 100 } }`                                  |
| wire        | healthy                                                                                                        |
| packets     | `[{ id: 'res-1', kind: 'response', statusCode: 201, position: 0.5, fate: 'in-flight', label: '201 Created' }]` |
| log         | `[{ attempt: 1, ..., serverOutcome: 'processed', clientOutcome: 'in-flight', statusCode: 201 }]`               |

**Step 3 — Wire breaks during return trip. Response is lost.**

| Channel     | State                                                                                                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| description | `The wire breaks. The 201 response never reaches the client. From the client's side: silence. From the server's side: the account exists, and the server thinks the job is done.` |
| resource    | `{ kind: 'single', account: { id: 'acc_42', ... } }` (unchanged — the dramatic split)                                                                                             |
| wire        | `{ healthy: false, breakAt: 0.4 }`                                                                                                                                                |
| packets     | `[{ ...res-1, position: 0.4, fate: 'lost' }]`                                                                                                                                     |
| log         | `[{ attempt: 1, ..., serverOutcome: 'processed', clientOutcome: 'response-lost' }]`                                                                                               |

**Step 4 — Client retries.**

| Channel     | State                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| description | `Client gives up waiting and retries. From the client's perspective, maybe the request never landed. From the server's perspective, this looks like a brand-new request.` |
| resource    | (unchanged from step 3)                                                                                                                                                   |
| wire        | healthy again                                                                                                                                                             |
| packets     | `[{ id: 'req-2', kind: 'request', method: 'POST', position: 0.1, fate: 'in-flight', label: 'POST /accounts' }]`                                                           |
| log         | `[ {attempt 1 as above}, { attempt: 2, ..., serverOutcome: 'not-yet', clientOutcome: 'in-flight' } ]`                                                                     |

**Step 5 — Server processes retry as fresh POST. Creates SECOND account.**

| Channel     | State                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| description | `The server has no way to know this is a retry. It does what POST does: creates a new account. There are now two Alices.` |
| resource    | `{ kind: 'collection', items: [{acc_42, Alice, 100}, {acc_43, Alice, 100}] }` — visual emphasis on the new row            |
| wire        | healthy                                                                                                                   |
| packets     | `[{ id: 'res-2', kind: 'response', statusCode: 201, position: 0.5, fate: 'in-flight', label: '201 Created' }]`            |
| log         | `[ {...}, { attempt: 2, ..., serverOutcome: 'processed', clientOutcome: 'in-flight', statusCode: 201 } ]`                 |

**Step 6 — Response arrives at client. Client celebrates.**

| Channel     | State                                                                                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| description | `Client gets a clean 201. From its point of view: success. From the server's reality: it processed Alice's signup twice. The duplicate is invisible to the side that thinks it's done.` |
| resource    | `{ kind: 'collection', items: [acc_42, acc_43] }` (frozen resting state)                                                                                                                |
| wire        | healthy                                                                                                                                                                                 |
| packets     | `[]` (response arrived, faded)                                                                                                                                                          |
| log         | `[ {...}, { attempt: 2, ..., serverOutcome: 'processed', clientOutcome: 'success', statusCode: 201 } ]`                                                                                 |

### 7.4 `put-retry-safe` — §5 (PUT is survivable)

**Intent:** Replay the failure-mode-2 scenario, but with PUT instead of POST. Wire breaks on return, client retries, server applies the same PUT, no change to state. _This is what "idempotent" buys you._

- ~6 steps, structurally parallel to `post-double-charge` so the visual rhyme lands.
- Pre-state: `acc_42` exists with `balance: 100`.
- Request body: `{ owner: 'Alice', balance: 200 }`.
- Final resource state: `{ id: 'acc_42', owner: 'Alice', balance: 200 }` — exactly one update applied even though two PUTs landed.
- Prose lean: "compare this to the previous scenario — same failure, same retry, completely different outcome. Welcome to idempotency."

### 7.5 `patch-balance-set` — §6a (idempotent PATCH)

**Intent:** First half of the PUT-vs-PATCH interview gauntlet. PATCH with a _set-style_ body (`{balance: 200}`) is idempotent — retries are safe.

- ~5 steps.
- Mirror the structure of `put-retry-safe`. Wire breaks on return, client retries, server applies the same balance set. End state: `balance === 200`, applied once or twice, same result.
- Surface in prose: "the body matters. A PATCH that _sets_ a value is idempotent — just like PUT."

### 7.6 `patch-credit-runaway` — §6b (non-idempotent PATCH, THE KILLER)

**Intent:** Second half of the PUT-vs-PATCH gauntlet. PATCH with a _delta-style_ body (`{credit: 50}`) is **not** idempotent — retries accumulate.

- ~6 steps. Same failure-mode-2 structure as before.
- Pre-state: `balance: 100`. After first credit: `balance: 150`. After retry: `balance: 200`. The runaway is the climax.
- Prose lean: "This is why 'is PATCH idempotent?' is a trick question. The answer depends on what your patch body _does_. `{balance: 200}` is idempotent. `{credit: 50}` is not. Same method, opposite contracts." → This sentence IS the interview answer.
- Add a Callout citing Microsoft + Google guidance on this point.

### 7.7 `post-with-idempotency-key` — §7 (the fix + Uber callback)

**Intent:** Show the escape hatch. POST + an `Idempotency-Key` header lets the server dedupe retries safely. Connect back to Uber.

- ~7–8 steps.
- Pre-state: `resource = null`.
- Step sequence:
  1. Client generates a UUID idempotency key.
  2. POST with header `Idempotency-Key: 9b3f...` sent.
  3. Server processes, stores `key → response` mapping, creates account, sends 201.
  4. Wire breaks on return — response lost (familiar pattern).
  5. Client retries — _same_ idempotency key.
  6. Server looks up the key, finds the cached response, **doesn't create a new account**, replays the original 201.
  7. Response arrives at client.
- Final state: ONE account (`acc_42`), client got a `201`. The server's `idempotency_keys` table (visualized somehow — small inset?) shows the cached entry.
- Prose lean: this is exactly what Uber Eats lacked. The PSP changed its status type; without a key-based contract, Uber's retries hit fresh server-side handling. With keys, the second hit would have been recognized as a duplicate regardless of the PSP's status flavor.

---

## 8. §1 Uber teaser — Receipts Tape

**Component:** `src/components/idempotency/UberReceiptsTeaser.tsx` (self-contained, not part of the Retry Lab).

**Behavior:**

| Aspect         | Detail                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| Trigger        | `IntersectionObserver` — plays once when scrolled into view, freezes at final state                                  |
| Pacing         | Entries fade/slide in every ~250ms; counter increments in sync; ~3–4s total                                          |
| Final state    | Three-line totals card: `Free meals served: ~147` / `Across ~100 cities` / `One weekend, March 2022`                 |
| Phrasing       | Literal: `PAY FAILED` and `ORDER DELIVERED` (NOT API-flavored like `402 PAYMENT REQUIRED`)                           |
| Styling        | Muted greyscale background; single accent color on `DELIVERED`; monospace font (foreshadows §2's `RequestLog` motif) |
| Reduced motion | `prefers-reduced-motion: reduce` → show frozen final state immediately, skip the animation                           |
| Accessibility  | `aria-label` summarizing the incident; no flashing                                                                   |
| Branding       | Words "Uber Eats" appear once in the prose. No logo / Uber color reuse.                                              |

---

## 9. Component architecture

```
src/components/idempotency/
├── RetryLabViz.tsx          # Top-level orchestrator (analog: EventLoopViz)
├── Client.tsx               # Left-side client box
├── Server.tsx               # Right-side server box
├── Wire.tsx                 # Animated SVG path; healthy/broken states
├── Packet.tsx               # Single request/response pill on the wire
├── ResourcePanel.tsx        # Server-side resource state display
├── RequestLog.tsx           # Client-perceived attempt log
├── RetryLab.tsx             # Scenario runner (analog: RunCode)
├── UberReceiptsTeaser.tsx   # §1-only standalone teaser
├── types.ts                 # Snapshot/Scenario/PacketState etc.
└── scenarios/
    ├── index.ts
    ├── getBaseline.ts
    ├── deleteTwice.ts
    ├── postDoubleCharge.ts
    ├── putRetrySafe.ts
    ├── patchBalanceSet.ts
    ├── patchCreditRunaway.ts
    └── postWithIdempotencyKey.ts
```

**Reused from the existing codebase:**

- `ScrollStage`, `Section stage={N}`, `StepList`, `Callout`, `DemoCode` — already-in-place MDX components in `src/components/mdx/`
- The "section stage → viz state" pattern from `EventLoopViz`
- The same step-by-step navigation UI / keyboard bindings used by `RunCode`

**Key architectural decisions (locked in Q11):**

- The Retry Lab is the **single, persistent left-column viz** for §2–§7. §1 swaps it out for `UberReceiptsTeaser` only.
- **§6 single-lab scenario swap:** the lab pins to `patch-balance-set` for the first part of §6, then re-pins to `patch-credit-runaway` for the second part. No side-by-side rendering.
- All scenarios are **precomputed** — no sandbox in v1. (Sandbox is a viable v2 once shipped.)

---

## 10. Routing & metadata

### 10.1 Posts registry (`src/app/[slug]/page.tsx`)

```ts
const posts = {
	'the-js-event-loop-works': {
		loader: () => import('@/posts/the-js-event-loop-works.mdx'),
		meta: { category: 'JS Fundamentals', date: '30/03/26' },
	},
	'how-idempotency-saves-the-web': {
		loader: () => import('@/posts/how-idempotency-saves-the-web.mdx'),
		meta: { category: 'REST APIs', date: '12/05/26' },
	},
}
```

### 10.2 `generateMetadata`

```ts
if (slug === 'how-idempotency-saves-the-web') {
	return {
		title: 'How Idempotency Saves the Web? | imcurious.how',
		description:
			'An interactive guide to REST API idempotency. Watch retries, failures, and the contract that decides whether your API survives them.',
	}
}
```

### 10.3 Sidebar category

`REST APIs` — new category, shared with future series posts.

### 10.4 MDX H1 (top of the post)

```mdx
# How Idempotency Saves the Web?
```

(Optionally with a small "runtime tag" in the same monospace style the event-loop post uses, e.g. `// protocol: http`. Not load-bearing.)

---

## 11. Tone, voice, and prose conventions

Match the event-loop post:

- **Second person.** "You fire a POST. The wire breaks. _You_ don't know what happened."
- **Conversational, short paragraphs.** No 8-line walls of text.
- **Playful where it lands.** "Two Alices." "The server has no idea this is a retry." Avoid forced jokes.
- **Metaphors over jargon.** "The wire breaks" before "the response is lost in transit." Introduce jargon _after_ the reader has felt the concept.
- **Callouts for tangents and citations.** The two Microsoft + Google references both live in Callouts.
- **No comments-as-explanations in code samples.** If a sample needs explanation, put it in prose.
- **First-time terms in bold.** `**idempotent**`, `**safe**`, `**idempotency key**`, etc.

---

## 12. Testing & verification

### 12.1 Unit (`bun run test`, vitest)

- `src/components/idempotency/__tests__/scenarios.test.ts` — validate each scenario's snapshot sequence is internally consistent:
  - Step 0 is a valid pre-state.
  - Wire-state transitions are legal (a `response-lost` log entry must have a preceding broken-wire snapshot).
  - Packet IDs are stable across steps (no remounting).
  - Resource state transitions are consistent with HTTP method semantics.
- `src/components/idempotency/__tests__/types.test.ts` (if needed) — type-level smoke checks.

### 12.2 Visual (Playwright)

Screenshots required at:

1. §1 frozen Receipts Tape final state.
2. §2 happy-path GET baseline (response just arriving).
3. §4 step 5 — the "two Alices" duplicate moment.
4. §6 the contrast point — last snapshot of `patch-balance-set` immediately before swap to `patch-credit-runaway`, and the runaway's final step.
5. §7 the idempotency-key dedupe moment — server returning cached response.

Compare by hand for v1; can be wired to a screenshot harness in a follow-up.

### 12.3 Pre-commit

- `bun run format:check` — required per project memory.
- `bun run lint`.
- `bun run test`.
- `bun run build` (catch type and MDX errors).

### 12.4 SSR/hydration

- Per CLAUDE.md project lessons: round any trig used for packet positioning to integers to avoid Node vs browser float drift. (Probably not needed since the wire is linear, but worth checking if any animated curves are introduced.)
- Avoid `xmlns="http://www.w3.org/1999/xhtml"` on divs inside `<foreignObject>` — TS/React reject it.

---

## 13. Suggested implementation order

A sequence designed so the author (you) learns the material in the order it gets taught in the post — i.e., the implementation order _is_ the study order.

1. **Routing & stub.** Add the post entry to `src/app/[slug]/page.tsx`; create `src/posts/how-idempotency-saves-the-web.mdx` with a single `<ScrollStage>` and one empty section.
2. **Types.** Create `src/components/idempotency/types.ts`. Lock in `PacketState`, `LogEntry`, `WireState`, `Snapshot`, `Scenario`.
3. **Scaffolding components.** Build `Client`, `Server`, `Wire`, `Packet`, `ResourcePanel`, `RequestLog` as dumb presentational components that take a `Snapshot` slice as props.
4. **`RetryLabViz`.** Wire up the scrolling-stage → scenario mapping. Initially pin to a hardcoded "hello world" snapshot to verify rendering.
5. **`RetryLab` (scenario runner).** Step controls, keyboard bindings, animation transitions between snapshots. Borrow heavily from `RunCode`.
6. **Author `get-baseline`.** Simplest scenario. Validates the whole pipeline end-to-end. Write §2 prose around it.
7. **Author `delete-twice`.** First "real" idempotency lesson. Write §3 prose. **This is where your interview-prep starts to compound.**
8. **Author `post-double-charge`.** Snapshot sequence already specced in §7.3 of this doc — use it as a checklist. Write §4 prose. **The climactic scenario.**
9. **Author `put-retry-safe`.** Structurally mirrors §7.3. Write §5 prose.
10. **Author `patch-balance-set` and `patch-credit-runaway`.** Write §6 prose. **The PUT-vs-PATCH interview answer crystallizes here.**
11. **Author `post-with-idempotency-key`.** Write §7 prose. **The Uber callback closes the loop.**
12. **Build `UberReceiptsTeaser`.** Write §1 prose. Could be done earlier — independent of the lab — but doing it after the lab means you're authoring the hook with full knowledge of what the reader is about to see.
13. **Sidebar category update.** Wherever the sidebar pulls categories from, add `REST APIs`.
14. **Tests.** Snapshot-consistency vitest tests for each scenario.
15. **Visual verification.** Playwright screenshots at the 5 key frames.
16. **Format / lint / build / final test pass.**
17. **Commit.**

---

## 14. Acceptance criteria

The post is ready to publish when:

- [ ] All 7 scenarios are encoded and pass scenario-consistency tests.
- [ ] Manual scroll-through in browser: each section pins the correct scenario, stepping advances snapshots smoothly, no hydration warnings in the console.
- [ ] Playwright screenshots taken at the 5 key frames and reviewed by hand.
- [ ] `bun run test`, `bun run lint`, `bun run format:check`, and `bun run build` all pass.
- [ ] The MDX prose is in the event-loop post's voice (re-read both side-by-side to verify continuity).
- [ ] The §6 PATCH contrast (`{balance: 200}` vs `{credit: 50}`) makes the PUT-vs-PATCH distinction unmistakable on first read.
- [ ] The §7 Uber callback explicitly connects the idempotency-key mechanism to the March 2022 PSP-status incident.
- [ ] Citations to Microsoft and Google Cloud appear at least once each, in Callouts.

---

## 15. Open items deferred to implementation

- Exact color palette for methods, statuses, wire-break state.
- Exact animation curves and durations for packet movement, wire-break transition, response fade.
- Exact phrasing of `description` fields per snapshot (the canonical scenario gives the voice; the rest you author).
- Visual treatment of the `idempotency_keys` table inset in §7's `post-with-idempotency-key` scenario.
- Mobile responsiveness — defer to a follow-up pass after the desktop layout is stable.

---

## 16. Definitions (for prose use)

These are the precise definitions the post will defend. Internalize them — they're what your future interviewer is checking.

- **Safe method:** one whose execution does not change resource state. GET, HEAD, OPTIONS are safe.
- **Idempotent method:** one whose effect on resource state is the same after N successful executions as after 1. **Same state, not same response.** GET, HEAD, OPTIONS, PUT, DELETE are idempotent. POST is not. PATCH is _conditionally_ idempotent — depends on body semantics.
- **Idempotency key:** a client-generated identifier (typically UUID) sent in a request header, used by the server to deduplicate retries of the same logical operation.
- **PUT vs PATCH:** PUT replaces a resource with a full representation; PATCH applies a partial modification. PUT is idempotent by spec; PATCH may or may not be — it depends on whether the patch body is _declarative_ (set values) or _imperative_ (apply deltas).

---

_Generated from `qa-rest-api.md`. Brainstorm complete._
