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
				'No visitor in sight. At build time — deploy, CI, whenever you ship — the server renders every route to plain HTML files. The clock on the server is the build running.',
			packets: [],
			browser: { blocks: ALL_EMPTY, note: 'nobody here yet' },
			cdn: { entry: 'none' },
			server: { activity: 'building', note: 'build: rendering all routes' },
			timeline: { ttfb: null, fcp: null, interactive: null },
		},
		{
			description:
				'The build output is pushed to the CDN. From this moment the page exists as finished bytes on machines all over the world, close to every visitor.',
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
				'A visitor arrives. The request doesn’t even reach your server — the CDN node nearest to them answers.',
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
				'The CDN returns the prebuilt HTML in tens of milliseconds. First byte and first paint land almost immediately — no rendering happened anywhere.',
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
				'SSG still ships JavaScript and still hydrates — the page becomes interactive the same way SSR does, just starting from a much earlier paint.',
			packets: [],
			browser: { blocks: ALL_HYDRATED },
			cdn: { entry: 'fresh' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.08, fcp: 0.2, interactive: 0.6 },
		},
		{
			description:
				'A second visitor, a different country, a different account — same bytes. Everyone gets the page exactly as it looked at build time. No personalization, no request-time data, and stale until you rebuild. That is the trade.',
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
