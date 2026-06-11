import type { RenderScenario } from '../types'

// RSC answers a different question than SSR: not "when is the HTML made"
// but "which components ship JavaScript at all". Server blocks render once
// on the server and never hydrate; only client blocks need code on the wire.
export const RSC_BUNDLE_SIZE = 0.45

export const rsc: RenderScenario = {
	id: 'rsc-shrinking-bundle',
	title: 'RSC: The Bundle Goes on a Diet',
	steps: [
		{
			description:
				'Same request, but now the components are split: header, nav, and content are Server Components; the sidebar widget and comments form are Client Components. The colors show where each block’s code lives.',
			packets: [
				{
					id: 'req-1',
					kind: 'request',
					from: 'browser',
					to: 'server',
					position: 0.6,
					size: 0.15,
					label: 'GET /page',
				},
			],
			browser: {
				blocks: {
					header: { paint: 'empty', origin: 'server' },
					nav: { paint: 'empty', origin: 'server' },
					content: { paint: 'empty', origin: 'server' },
					sidebar: { paint: 'empty', origin: 'client' },
					comments: { paint: 'empty', origin: 'client' },
				},
			},
			cdn: { entry: 'none' },
			server: { activity: 'rendering', note: 'running server components' },
			timeline: { ttfb: null, fcp: null, interactive: null },
		},
		{
			description:
				'The server components run once, on the server — heavy dependencies, database queries, markdown renderers — and only their *output* travels. The full HTML paints everything, exactly like SSR.',
			packets: [
				{
					id: 'html-1',
					kind: 'html-full',
					from: 'server',
					to: 'browser',
					position: 0.75,
					size: 0.55,
					label: 'HTML + RSC payload',
				},
			],
			browser: {
				blocks: {
					header: { paint: 'painted', origin: 'server' },
					nav: { paint: 'painted', origin: 'server' },
					content: { paint: 'painted', origin: 'server' },
					sidebar: { paint: 'painted', origin: 'client' },
					comments: { paint: 'painted', origin: 'client' },
				},
			},
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.4, fcp: 0.5, interactive: null },
		},
		{
			description:
				'Here is the payoff: the JS bundle contains only the client components’ code. The server blocks shipped zero kilobytes of JavaScript — compare this packet with SSR’s.',
			packets: [
				{
					id: 'bundle-1',
					kind: 'js-bundle',
					from: 'server',
					to: 'browser',
					position: 0.5,
					size: RSC_BUNDLE_SIZE,
					label: 'client components only',
				},
			],
			browser: {
				blocks: {
					header: { paint: 'painted', origin: 'server' },
					nav: { paint: 'painted', origin: 'server' },
					content: { paint: 'painted', origin: 'server' },
					sidebar: { paint: 'painted', origin: 'client' },
					comments: { paint: 'painted', origin: 'client' },
				},
				note: 'smaller bundle, fewer blocks to hydrate',
			},
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.4, fcp: 0.5, interactive: null },
		},
		{
			description:
				'Only the client blocks hydrate — the server blocks have nothing to attach; they are finished output and will never re-render. Less code, less adoption work, interactive sooner.',
			packets: [],
			browser: {
				blocks: {
					header: { paint: 'painted', origin: 'server' },
					nav: { paint: 'painted', origin: 'server' },
					content: { paint: 'painted', origin: 'server' },
					sidebar: { paint: 'hydrated', origin: 'client' },
					comments: { paint: 'hydrated', origin: 'client' },
				},
				note: 'server blocks never hydrate',
			},
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.4, fcp: 0.5, interactive: 0.65 },
		},
		{
			description:
				'The user clicks a link. On a soft navigation no HTML document travels at all — the server sends an RSC payload, a compact description of the new server-rendered tree, and React merges it into the page without losing any client state.',
			packets: [
				{
					id: 'rsc-1',
					kind: 'rsc-payload',
					from: 'server',
					to: 'browser',
					position: 0.65,
					size: 0.3,
					label: 'RSC payload',
				},
			],
			browser: {
				blocks: {
					header: { paint: 'painted', origin: 'server' },
					nav: { paint: 'painted', origin: 'server' },
					content: { paint: 'painted', origin: 'server' },
					sidebar: { paint: 'hydrated', origin: 'client' },
					comments: { paint: 'hydrated', origin: 'client' },
				},
				note: 'content swapped in place — no reload',
			},
			cdn: { entry: 'none' },
			server: { activity: 'rendering', note: 'new tree, output only' },
			timeline: { ttfb: 0.4, fcp: 0.5, interactive: 0.65 },
		},
	],
}
