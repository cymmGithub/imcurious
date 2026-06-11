import type { RaceLaneId, RenderScenario } from '../types'
import { csr } from './csr'
import { ssr } from './ssr'
import { hydration } from './hydration'
import { ssg } from './ssg'
import { isr } from './isr'
import { streaming } from './streaming'
import { rsc } from './rsc'
import { ppr } from './ppr'

export type RenderScenarioId =
	| typeof csr.id
	| typeof ssr.id
	| typeof hydration.id
	| typeof ssg.id
	| typeof isr.id
	| typeof streaming.id
	| typeof rsc.id
	| typeof ppr.id

export const RENDER_SCENARIOS: Record<RenderScenarioId, RenderScenario> = {
	[csr.id]: csr,
	[ssr.id]: ssr,
	[hydration.id]: hydration,
	[ssg.id]: ssg,
	[isr.id]: isr,
	[streaming.id]: streaming,
	[rsc.id]: rsc,
	[ppr.id]: ppr,
}

// The four classic strategies raced in stage 7, in lane order.
export const RACE_LANE_SCENARIOS: Record<RaceLaneId, RenderScenario> = {
	csr,
	ssr,
	ssg,
	isr,
}
