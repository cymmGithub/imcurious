import { blocksAll, type BlocksState, type RenderScenario } from '../types'

const ALL_EMPTY: BlocksState = blocksAll('empty')
const ALL_HYDRATED: BlocksState = blocksAll('hydrated')

// CSR's js-bundle is deliberately the largest packet in the entire post —
// "every byte of UI, data, and behavior travels over the wire as JavaScript".
export const CSR_BUNDLE_SIZE = 1

export const csr: RenderScenario = {
	id: 'csr-blank-then-pop',
	title: 'CSR: Blank, Blank, Blank… Pop',
	steps: [
		{
			description:
				'The browser asks; the server answers with an empty shell — a <div id="root"> and a script tag.',
			packets: [
				{
					id: 'req-1',
					kind: 'request',
					from: 'browser',
					to: 'server',
					position: 0.5,
					size: 0.15,
					label: 'GET /page',
				},
			],
			browser: { blocks: ALL_EMPTY, note: 'blank page' },
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: null, fcp: null, interactive: null },
		},
		{
			description:
				'First byte lands almost instantly — but there is nothing to paint.',
			packets: [
				{
					id: 'shell-1',
					kind: 'html-shell',
					from: 'server',
					to: 'browser',
					position: 0.85,
					size: 0.12,
					label: '<div id="root">',
				},
			],
			browser: { blocks: ALL_EMPTY, note: 'still blank' },
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.08, fcp: null, interactive: null },
		},
		{
			description:
				'The real payload: the JS bundle — UI, data, behavior. The fattest packet in this post.',
			packets: [
				{
					id: 'bundle-1',
					kind: 'js-bundle',
					from: 'server',
					to: 'browser',
					position: 0.35,
					size: CSR_BUNDLE_SIZE,
					label: 'app.js',
				},
			],
			browser: { blocks: ALL_EMPTY, note: 'still blank' },
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.08, fcp: null, interactive: null },
		},
		{
			description:
				'The browser parses and executes the bundle. The page is still blank.',
			packets: [],
			browser: { blocks: ALL_EMPTY, note: 'parsing + executing JS…' },
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.08, fcp: null, interactive: null },
		},
		{
			description:
				'The app mounts, then discovers it needs data — one more round trip.',
			packets: [
				{
					id: 'data-req-1',
					kind: 'request',
					from: 'browser',
					to: 'server',
					position: 0.4,
					size: 0.15,
					label: 'GET /api/data',
				},
				{
					id: 'data-1',
					kind: 'data',
					from: 'server',
					to: 'browser',
					position: 0.0,
					size: 0.3,
					label: 'JSON',
				},
			],
			browser: { blocks: ALL_EMPTY, note: 'waiting for data…' },
			cdn: { entry: 'none' },
			server: { activity: 'rendering', note: 'API' },
			timeline: { ttfb: 0.08, fcp: null, interactive: null },
		},
		{
			description:
				'Data arrives and the whole page pops in at once — already interactive, at the very end.',
			packets: [],
			browser: { blocks: ALL_HYDRATED, note: 'pop — everything at once' },
			cdn: { entry: 'none' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.08, fcp: 0.9, interactive: 0.95 },
		},
	],
}
