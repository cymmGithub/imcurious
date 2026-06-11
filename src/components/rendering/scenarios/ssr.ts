import { blocksAll, type BlocksState, type RenderScenario } from '../types'

const ALL_EMPTY: BlocksState = blocksAll('empty')
const ALL_PAINTED: BlocksState = blocksAll('painted')
const ALL_HYDRATED: BlocksState = blocksAll('hydrated')

// SSR ships the full HTML *and* the JS app that re-creates it client-side —
// "one app for the price of two". Bundle nearly as fat as CSR's.
export const SSR_BUNDLE_SIZE = 0.8

export const ssr: RenderScenario = {
	id: 'ssr-painted-then-frozen',
	title: 'SSR: Painted, Then Frozen',
	steps: [
		{
			description:
				'The browser asks; this time the server fetches data and renders full HTML per request.',
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
			browser: { blocks: ALL_EMPTY, note: 'waiting…' },
			cdn: { entry: 'none' },
			server: { activity: 'rendering', note: 'fetch + render' },
			timeline: { ttfb: null, fcp: null, interactive: null },
		},
		{
			description:
				'A blank tab while the server renders — SSR’s TTFB cost, paid up front.',
			packets: [],
			browser: { blocks: ALL_EMPTY, note: 'blank tab — server is busy' },
			cdn: { entry: 'none' },
			server: { activity: 'rendering', note: 'still rendering…' },
			timeline: { ttfb: null, fcp: null, interactive: null },
		},
		{
			description:
				'The response is a complete HTML document — compare it with CSR’s near-empty shell.',
			packets: [
				{
					id: 'html-1',
					kind: 'html-full',
					from: 'server',
					to: 'browser',
					position: 0.55,
					size: 0.55,
					label: 'full HTML',
				},
			],
			browser: { blocks: ALL_EMPTY, note: 'response incoming' },
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.45, fcp: null, interactive: null },
		},
		{
			description:
				'The HTML paints. The page looks done — but click anything: silence.',
			packets: [
				{
					id: 'bundle-1',
					kind: 'js-bundle',
					from: 'server',
					to: 'browser',
					position: 0.2,
					size: SSR_BUNDLE_SIZE,
					label: 'app.js',
				},
			],
			browser: { blocks: ALL_PAINTED, note: 'visible, inert' },
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.45, fcp: 0.55, interactive: null },
		},
		{
			description:
				'The bundle (nearly CSR-fat) arrives and hydration finally makes the page interactive.',
			packets: [],
			browser: { blocks: ALL_HYDRATED, note: 'hydrated — alive' },
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.45, fcp: 0.55, interactive: 0.85 },
		},
	],
}
