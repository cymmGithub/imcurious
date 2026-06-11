import type { RenderScenario } from '../types'

// Streaming SSR: the shell flushes first, Suspense holes fill out of order
// as their data resolves, and selective hydration lets a clicked block jump
// the hydration queue. The work is reordered, not reduced.
export const streaming: RenderScenario = {
	id: 'streaming-out-of-order',
	title: 'Streaming SSR: The Page Arrives in Pieces',
	steps: [
		{
			description:
				'The browser asks for the page. The server doesn’t wait for the slow data — it immediately flushes the shell: everything outside the Suspense boundaries.',
			packets: [
				{
					id: 'shell-1',
					kind: 'html-shell',
					from: 'server',
					to: 'browser',
					position: 0.7,
					size: 0.25,
					label: 'shell + fallbacks',
				},
			],
			browser: {
				blocks: {
					header: { paint: 'empty' },
					nav: { paint: 'empty' },
					content: { paint: 'empty' },
					sidebar: { paint: 'empty' },
					comments: { paint: 'empty' },
				},
			},
			cdn: { entry: 'none' },
			server: { activity: 'streaming', note: 'response stays open' },
			timeline: { ttfb: 0.05, fcp: null, interactive: null },
		},
		{
			description:
				'The shell paints: header and nav are real content, and each Suspense hole shows its fallback skeleton. First paint happened while the server is still working.',
			packets: [],
			browser: {
				blocks: {
					header: { paint: 'painted' },
					nav: { paint: 'painted' },
					content: { paint: 'fallback' },
					sidebar: { paint: 'fallback' },
					comments: { paint: 'fallback' },
				},
				note: 'shell painted, holes loading',
			},
			cdn: { entry: 'none' },
			server: { activity: 'streaming', note: 'fetching hole data…' },
			timeline: { ttfb: 0.05, fcp: 0.18, interactive: null },
		},
		{
			description:
				'The comments data resolves first — so its HTML chunk arrives first, even though comments sit at the bottom of the layout. A tiny inline script slots it into place; React hasn’t even loaded yet.',
			packets: [
				{
					id: 'chunk-comments',
					kind: 'html-chunk',
					from: 'server',
					to: 'browser',
					position: 0.8,
					size: 0.22,
					label: 'comments chunk',
				},
			],
			browser: {
				blocks: {
					header: { paint: 'painted' },
					nav: { paint: 'painted' },
					content: { paint: 'fallback' },
					sidebar: { paint: 'fallback' },
					comments: { paint: 'painted' },
				},
				note: 'bottom filled before middle',
			},
			cdn: { entry: 'none' },
			server: { activity: 'streaming' },
			timeline: { ttfb: 0.05, fcp: 0.18, interactive: null },
		},
		{
			description:
				'The content chunk lands next, then the sidebar. Same open response the whole time. Meanwhile the JS bundle has started downloading in parallel.',
			packets: [
				{
					id: 'chunk-sidebar',
					kind: 'html-chunk',
					from: 'server',
					to: 'browser',
					position: 0.55,
					size: 0.2,
					label: 'sidebar chunk',
				},
				{
					id: 'bundle-1',
					kind: 'js-bundle',
					from: 'server',
					to: 'browser',
					position: 0.3,
					size: 0.8,
					label: 'app.js',
				},
			],
			browser: {
				blocks: {
					header: { paint: 'painted' },
					nav: { paint: 'painted' },
					content: { paint: 'painted' },
					sidebar: { paint: 'fallback' },
					comments: { paint: 'painted' },
				},
			},
			cdn: { entry: 'none' },
			server: { activity: 'streaming' },
			timeline: { ttfb: 0.05, fcp: 0.18, interactive: null },
		},
		{
			description:
				'The bundle arrives and hydration begins in tree order: header first, then nav. The lower boundaries are still inert.',
			packets: [],
			browser: {
				blocks: {
					header: { paint: 'hydrated' },
					nav: { paint: 'hydrated' },
					content: { paint: 'painted' },
					sidebar: { paint: 'painted' },
					comments: { paint: 'painted' },
				},
				note: 'hydrating in tree order…',
			},
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.05, fcp: 0.18, interactive: null },
		},
		{
			description:
				'The user clicks inside the comments. React notices, hydrates that boundary first — jumping the queue — and replays the click. Selective hydration: urgency decided by the user, automatically.',
			packets: [],
			browser: {
				blocks: {
					header: { paint: 'hydrated' },
					nav: { paint: 'hydrated' },
					content: { paint: 'painted' },
					sidebar: { paint: 'painted' },
					comments: { paint: 'hydrated' },
				},
				note: 'clicked → hydrated first',
			},
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.05, fcp: 0.18, interactive: null },
		},
		{
			description:
				'The remaining boundaries hydrate and the page is fully alive. Note what streaming did NOT do: the same data was fetched, the same JS shipped, the same hydration ran. It reordered the work so the user never stared at a blank page.',
			packets: [],
			browser: {
				blocks: {
					header: { paint: 'hydrated' },
					nav: { paint: 'hydrated' },
					content: { paint: 'hydrated' },
					sidebar: { paint: 'hydrated' },
					comments: { paint: 'hydrated' },
				},
			},
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.05, fcp: 0.18, interactive: 0.7 },
		},
	],
}
