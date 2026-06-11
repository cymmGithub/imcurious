import type { RenderScenario } from '../types'

// PPR: one page, two speeds, one response. The static frame is served from
// the CDN like SSG; the dynamic holes stream from the server into the same
// open response — not a second request.
export const ppr: RenderScenario = {
	id: 'ppr-static-frame-streamed-holes',
	title: 'PPR: A Static Frame With Live Holes',
	steps: [
		{
			description:
				'At build time the page was split: header, nav, and sidebar don’t depend on the request, so they were prerendered into a static shell — including the fallback skeletons for the dynamic holes. That shell lives on the CDN.',
			packets: [],
			browser: {
				blocks: {
					header: { paint: 'empty', origin: 'static' },
					nav: { paint: 'empty', origin: 'static' },
					content: { paint: 'empty', origin: 'server' },
					sidebar: { paint: 'empty', origin: 'static' },
					comments: { paint: 'empty', origin: 'server' },
				},
			},
			cdn: { entry: 'fresh', note: 'static shell cached' },
			server: { activity: 'idle' },
			timeline: { ttfb: null, fcp: null, interactive: null },
		},
		{
			description:
				'A visitor requests the page. The CDN answers instantly with the static frame — SSG speed — while the same request continues on to the server for the dynamic parts.',
			packets: [
				{
					id: 'shell-1',
					kind: 'html-shell',
					from: 'cdn',
					to: 'browser',
					position: 0.8,
					size: 0.3,
					label: 'static frame',
				},
			],
			browser: {
				blocks: {
					header: { paint: 'empty', origin: 'static' },
					nav: { paint: 'empty', origin: 'static' },
					content: { paint: 'empty', origin: 'server' },
					sidebar: { paint: 'empty', origin: 'static' },
					comments: { paint: 'empty', origin: 'server' },
				},
			},
			cdn: { entry: 'fresh', note: 'serving shell' },
			server: { activity: 'rendering', note: 'rendering the holes' },
			timeline: { ttfb: 0.05, fcp: null, interactive: null },
		},
		{
			description:
				'The frame paints immediately: real header, nav, and sidebar; skeleton fallbacks where the personalized content will go. The visitor sees a page, not a spinner.',
			packets: [],
			browser: {
				blocks: {
					header: { paint: 'painted', origin: 'static' },
					nav: { paint: 'painted', origin: 'static' },
					content: { paint: 'fallback', origin: 'server' },
					sidebar: { paint: 'painted', origin: 'static' },
					comments: { paint: 'fallback', origin: 'server' },
				},
				note: 'static frame painted',
			},
			cdn: { entry: 'fresh' },
			server: { activity: 'streaming', note: 'same response, still open' },
			timeline: { ttfb: 0.05, fcp: 0.12, interactive: null },
		},
		{
			description:
				'The dynamic holes stream in from the server — inside the same HTTP response that delivered the shell. No second request, no client-side refetch: the response simply hasn’t ended yet.',
			packets: [
				{
					id: 'chunk-content',
					kind: 'html-chunk',
					from: 'server',
					to: 'browser',
					position: 0.7,
					size: 0.22,
					label: 'content chunk',
				},
			],
			browser: {
				blocks: {
					header: { paint: 'painted', origin: 'static' },
					nav: { paint: 'painted', origin: 'static' },
					content: { paint: 'painted', origin: 'server' },
					sidebar: { paint: 'painted', origin: 'static' },
					comments: { paint: 'fallback', origin: 'server' },
				},
			},
			cdn: { entry: 'fresh' },
			server: { activity: 'streaming' },
			timeline: { ttfb: 0.05, fcp: 0.12, interactive: null },
		},
		{
			description:
				'The last hole fills, the JS arrives, and the page hydrates. Static speed for the frame, request-time freshness for the holes — the middle ground that used to require choosing per page, now chosen per component.',
			packets: [
				{
					id: 'chunk-comments',
					kind: 'html-chunk',
					from: 'server',
					to: 'browser',
					position: 0.85,
					size: 0.22,
					label: 'comments chunk',
				},
			],
			browser: {
				blocks: {
					header: { paint: 'hydrated', origin: 'static' },
					nav: { paint: 'hydrated', origin: 'static' },
					content: { paint: 'hydrated', origin: 'server' },
					sidebar: { paint: 'hydrated', origin: 'static' },
					comments: { paint: 'painted', origin: 'server' },
				},
			},
			cdn: { entry: 'fresh' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.05, fcp: 0.12, interactive: 0.5 },
		},
	],
}
