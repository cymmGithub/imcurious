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
				'The browser asks for the page. This time the server does real work per request: it fetches data and renders the full HTML before answering.',
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
				'The user stares at a blank tab while the server renders. The work happens up front — that is the TTFB cost of SSR.',
			packets: [],
			browser: { blocks: ALL_EMPTY, note: 'blank tab — server is busy' },
			cdn: { entry: 'none' },
			server: { activity: 'rendering', note: 'still rendering…' },
			timeline: { ttfb: null, fcp: null, interactive: null },
		},
		{
			description:
				'The response is a complete HTML document — every block has real markup in it. Compare this packet with the near-empty CSR shell.',
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
				'The HTML lands and the browser paints everything. The page looks done. It is not: nothing has event listeners yet. Click anything — silence.',
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
				'The JS bundle arrives — nearly as fat as CSR’s, because the whole app ships again as code — and hydration attaches the event handlers. Only now is the page actually interactive.',
			packets: [],
			browser: { blocks: ALL_HYDRATED, note: 'hydrated — alive' },
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.45, fcp: 0.55, interactive: 0.85 },
		},
	],
}
