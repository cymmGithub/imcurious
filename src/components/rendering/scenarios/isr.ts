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
				'The page was generated with revalidate: 60. The CDN entry is fresh, and requests are served straight from the edge — pure SSG behavior so far.',
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
				'Sixty seconds pass. The freshness window expires. Nothing happens — revalidation is triggered by requests, not by a timer. No visitors, no regeneration.',
			packets: [],
			browser: { blocks: ALL_HYDRATED },
			cdn: { entry: 'stale', note: 'window expired — entry kept' },
			server: { activity: 'idle', note: 'nothing to do yet' },
			timeline: { ttfb: 0.08, fcp: 0.2, interactive: 0.6 },
		},
		{
			description:
				'The next visitor arrives — and gets the STALE page, immediately. Not the fresh one. The CDN answers with what it has, and only then kicks the server to regenerate in the background.',
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
				'Regeneration succeeds and the new HTML replaces the cached entry. The visitor who triggered it never saw it — they already have the stale page.',
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
				'The request after that one gets the fresh page — from the edge, instantly. One visitor paid nothing and got stale; everyone after gets fresh.',
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
				'Later, the window expires again and this time regeneration throws — the CMS is down, a fetch fails. ISR fails open: the error is swallowed and the last successfully generated page keeps being served.',
			packets: [],
			browser: { blocks: ALL_HYDRATED },
			cdn: { entry: 'stale', note: 'regen failed — keeping last good' },
			server: { activity: 'regenerating', note: 'error ✗' },
			timeline: { ttfb: 0.08, fcp: 0.2, interactive: 0.6 },
		},
		{
			description:
				'Visitors keep getting the last good page, never a 500 and never a blank. Stale beats broken — that is ISR’s whole bet.',
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
