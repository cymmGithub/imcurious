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
				'Where SSR left us: everything painted, nothing alive — the uncanny valley.',
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
				'React adopts the existing DOM node by node, attaching handlers — it re-creates nothing.',
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
				'Adoption continues down the tree: same pixels, new behavior.',
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
				'The sidebar’s timestamp differs between server and client — a hydration mismatch.',
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
				'React client-renders the mismatched subtree, finishes adopting the rest — fully alive.',
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
