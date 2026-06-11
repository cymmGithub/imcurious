import { blocksAll, type BlocksState, type RenderScenario } from '../types'

const ALL_PAINTED: BlocksState = blocksAll('painted')
const ALL_HYDRATED: BlocksState = blocksAll('hydrated')

// Stale-while-revalidate, step by step. The invariant the test suite locks
// down: once a page has been generated, the CDN entry never goes back to
// 'none' — ISR fails open to the last good page, never to a blank or a 500.
export const isr: RenderScenario = {
	id: 'isr-stale-while-revalidate',
	title: 'ISR: Stale While Revalidating',
	steps: [
		{
			description:
				'Generated with revalidate: 60. The entry is fresh — pure SSG behavior so far.',
			packets: [
				{
					id: 'html-1',
					kind: 'html-full',
					from: 'cdn',
					to: 'browser',
					position: 0.75,
					size: 0.55,
					label: 'cached HTML',
				},
			],
			browser: { blocks: ALL_PAINTED, note: 'instant paint' },
			cdn: { entry: 'fresh', note: 'revalidate: 60 — fresh' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.08, fcp: 0.2, interactive: null },
		},
		{
			description:
				'The window expires. Nothing happens — revalidation is request-triggered, not a timer.',
			packets: [],
			browser: { blocks: ALL_HYDRATED },
			cdn: { entry: 'stale', note: 'window expired — entry kept' },
			server: { activity: 'idle', note: 'nothing to do yet' },
			timeline: { ttfb: 0.08, fcp: 0.2, interactive: 0.6 },
		},
		{
			description:
				'The next visitor gets the STALE page, instantly; regeneration starts behind it.',
			packets: [
				{
					id: 'html-stale',
					kind: 'html-full',
					from: 'cdn',
					to: 'browser',
					position: 0.7,
					size: 0.55,
					label: 'stale HTML',
				},
				{
					id: 'regen-req',
					kind: 'request',
					from: 'cdn',
					to: 'server',
					position: 0.5,
					size: 0.15,
					label: 'regenerate',
				},
			],
			browser: { blocks: ALL_PAINTED, note: 'served stale — still instant' },
			cdn: { entry: 'stale', note: 'serving stale…' },
			server: { activity: 'regenerating', note: 'in the background' },
			timeline: { ttfb: 0.08, fcp: 0.2, interactive: 0.6 },
		},
		{
			description:
				'Fresh HTML replaces the entry. The visitor who triggered it never saw it.',
			packets: [
				{
					id: 'html-new',
					kind: 'html-full',
					from: 'server',
					to: 'cdn',
					position: 0.7,
					size: 0.55,
					label: 'fresh HTML',
				},
			],
			browser: { blocks: ALL_HYDRATED },
			cdn: { entry: 'fresh', note: 'entry replaced' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.08, fcp: 0.2, interactive: 0.6 },
		},
		{
			description:
				'The request after that gets the fresh page — instantly, from the edge.',
			packets: [
				{
					id: 'html-2',
					kind: 'html-full',
					from: 'cdn',
					to: 'browser',
					position: 0.75,
					size: 0.55,
					label: 'fresh HTML',
				},
			],
			browser: { blocks: ALL_PAINTED, note: 'fresh, still instant' },
			cdn: { entry: 'fresh' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.08, fcp: 0.2, interactive: 0.6 },
		},
		{
			description:
				'This time regeneration throws. ISR fails open: the last good page keeps serving.',
			packets: [],
			browser: { blocks: ALL_HYDRATED },
			cdn: { entry: 'stale', note: 'regen failed — keeping last good' },
			server: { activity: 'regenerating', note: 'error ✗' },
			timeline: { ttfb: 0.08, fcp: 0.2, interactive: 0.6 },
		},
		{
			description:
				'Never a 500, never a blank. Stale beats broken — ISR’s whole bet.',
			packets: [
				{
					id: 'html-3',
					kind: 'html-full',
					from: 'cdn',
					to: 'browser',
					position: 0.75,
					size: 0.55,
					label: 'last good HTML',
				},
			],
			browser: { blocks: ALL_PAINTED, note: 'still up' },
			cdn: { entry: 'stale', note: 'retry on a later request' },
			server: { activity: 'idle' },
			timeline: { ttfb: 0.08, fcp: 0.2, interactive: 0.6 },
		},
	],
}
