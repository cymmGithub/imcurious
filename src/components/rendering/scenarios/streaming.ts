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
				'The server doesn’t wait for slow data — it immediately flushes the shell.',
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
				'The shell paints, fallback skeletons in the holes — the server is still working.',
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
				'Comments data resolves first, so its chunk lands first — out of layout order.',
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
				'Content, then sidebar — same open response. The JS downloads in parallel.',
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
				'Hydration begins in tree order; the lower boundaries are still inert.',
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
				'A click in the comments — that boundary hydrates first and replays the click.',
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
				'Fully alive. Same data, same JS, same hydration — streaming only reordered the work.',
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
