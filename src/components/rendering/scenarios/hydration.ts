import type { RenderScenario } from '../types'

// Zoom on the gap SSR leaves behind: the page is painted but inert until
// React adopts the server DOM. Hydration is adoption, not a render — and it
// assumes the DOM matches what the server sent.
export const hydration: RenderScenario = {
	id: 'hydration-inert-gap',
	title: 'Hydration: Adopting a Painted Page',
	steps: [
		{
			description:
				'Where SSR left us: every block painted, zero blocks alive. The HTML came from the server; React hasn’t even loaded yet. This is the uncanny valley.',
			packets: [
				{
					id: 'bundle-1',
					kind: 'js-bundle',
					from: 'server',
					to: 'browser',
					position: 0.45,
					size: 0.8,
					label: 'app.js',
				},
			],
			browser: {
				blocks: {
					header: { paint: 'painted' },
					nav: { paint: 'painted' },
					content: { paint: 'painted' },
					sidebar: { paint: 'painted' },
					comments: { paint: 'painted' },
				},
				note: 'looks done — clicks do nothing',
			},
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.45, fcp: 0.55, interactive: null },
		},
		{
			description:
				'The bundle lands and React starts hydrating: it walks the existing DOM and adopts it node by node, attaching event handlers as it goes. It does not re-create the markup — it trusts what the server sent.',
			packets: [],
			browser: {
				blocks: {
					header: { paint: 'hydrated' },
					nav: { paint: 'hydrated' },
					content: { paint: 'painted' },
					sidebar: { paint: 'painted' },
					comments: { paint: 'painted' },
				},
				note: 'hydrating top-down…',
			},
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.45, fcp: 0.55, interactive: null },
		},
		{
			description:
				'Adoption continues down the tree. Each adopted block flips from inert to alive — same pixels, new behavior.',
			packets: [],
			browser: {
				blocks: {
					header: { paint: 'hydrated' },
					nav: { paint: 'hydrated' },
					content: { paint: 'hydrated' },
					sidebar: { paint: 'painted' },
					comments: { paint: 'painted' },
				},
				note: 'hydrating…',
			},
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.45, fcp: 0.55, interactive: null },
		},
		{
			description:
				'The mismatch beat: the sidebar renders a “last seen” timestamp. The server computed one value; the client, seconds later, computes another. React notices the markup doesn’t match what it expected — hydration is optimized to be fast, not to fix mismatches.',
			packets: [],
			browser: {
				blocks: {
					header: { paint: 'hydrated' },
					nav: { paint: 'hydrated' },
					content: { paint: 'hydrated' },
					sidebar: { paint: 'fallback' },
					comments: { paint: 'painted' },
				},
				note: 'hydration mismatch — sidebar discarded',
			},
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.45, fcp: 0.55, interactive: null },
		},
		{
			description:
				'React falls back to a client render for the mismatched subtree — throwing away the server’s work for that block — then finishes adoption everywhere else. The page is finally, fully alive.',
			packets: [],
			browser: {
				blocks: {
					header: { paint: 'hydrated' },
					nav: { paint: 'hydrated' },
					content: { paint: 'hydrated' },
					sidebar: { paint: 'hydrated' },
					comments: { paint: 'hydrated' },
				},
				note: 'interactive at last',
			},
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.45, fcp: 0.55, interactive: 0.85 },
		},
	],
}
