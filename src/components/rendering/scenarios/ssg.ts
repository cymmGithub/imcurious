import { blocksAll, type BlocksState, type RenderScenario } from '../types'

const ALL_EMPTY: BlocksState = blocksAll('empty')
const ALL_PAINTED: BlocksState = blocksAll('painted')
const ALL_HYDRATED: BlocksState = blocksAll('hydrated')

export const ssg: RenderScenario = {
	id: 'ssg-build-once',
	title: 'SSG: Render Once, Serve Forever',
	steps: [
		{
			description:
				'No visitor yet. At build time the server renders every route to plain HTML files.',
			packets: [],
			browser: { blocks: ALL_EMPTY, note: 'nobody here yet' },
			cdn: { entry: 'none' },
			server: { activity: 'building', note: 'build: rendering all routes' },
			timeline: { ttfb: null, fcp: null, interactive: null },
		},
		{
			description:
				'The build output is pushed to the CDN — finished bytes, close to every visitor.',
			packets: [
				{
					id: 'deploy-1',
					kind: 'html-full',
					from: 'server',
					to: 'cdn',
					position: 0.6,
					size: 0.55,
					label: 'deploy',
				},
			],
			browser: { blocks: ALL_EMPTY, note: 'nobody here yet' },
			cdn: { entry: 'fresh', note: 'cached at the edge' },
			server: { activity: 'idle' },
			timeline: { ttfb: null, fcp: null, interactive: null },
		},
		{
			description:
				'A visitor arrives. The request never reaches your server — the nearest CDN node answers.',
			packets: [
				{
					id: 'req-1',
					kind: 'request',
					from: 'browser',
					to: 'cdn',
					position: 0.6,
					size: 0.15,
					label: 'GET /page',
				},
			],
			browser: { blocks: ALL_EMPTY },
			cdn: { entry: 'fresh' },
			server: { activity: 'idle', note: 'not involved' },
			timeline: { ttfb: null, fcp: null, interactive: null },
		},
		{
			description:
				'Prebuilt HTML in tens of milliseconds — instant paint, no rendering anywhere.',
			packets: [
				{
					id: 'html-1',
					kind: 'html-full',
					from: 'cdn',
					to: 'browser',
					position: 0.8,
					size: 0.55,
					label: 'cached HTML',
				},
			],
			browser: { blocks: ALL_PAINTED, note: 'instant paint' },
			cdn: { entry: 'fresh' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.08, fcp: 0.2, interactive: null },
		},
		{
			description:
				'SSG still ships JS and still hydrates — just starting from a much earlier paint.',
			packets: [],
			browser: { blocks: ALL_HYDRATED },
			cdn: { entry: 'fresh' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.08, fcp: 0.2, interactive: 0.6 },
		},
		{
			description:
				'Different visitor, same bytes: frozen at build time, stale until you rebuild.',
			packets: [
				{
					id: 'req-2',
					kind: 'request',
					from: 'browser',
					to: 'cdn',
					position: 0.4,
					size: 0.15,
					label: 'GET /page',
				},
			],
			browser: { blocks: ALL_HYDRATED },
			cdn: { entry: 'fresh', note: 'identical HTML for everyone' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.08, fcp: 0.2, interactive: 0.6 },
		},
	],
}
