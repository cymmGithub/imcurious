import type { Scenario } from '../types'
import { postDoubleCharge } from './postDoubleCharge'
import { getBaseline } from './getBaseline'
import { deleteTwice } from './deleteTwice'
import { putRetrySafe } from './putRetrySafe'
import { patchBalanceSet } from './patchBalanceSet'
import { patchCreditRunaway } from './patchCreditRunaway'
import { postWithIdempotencyKey } from './postWithIdempotencyKey'

export type ScenarioId =
	| typeof getBaseline.id
	| typeof deleteTwice.id
	| typeof postDoubleCharge.id
	| typeof putRetrySafe.id
	| typeof patchBalanceSet.id
	| typeof patchCreditRunaway.id
	| typeof postWithIdempotencyKey.id

export const SCENARIOS: Record<ScenarioId, Scenario> = {
	[getBaseline.id]: getBaseline,
	[deleteTwice.id]: deleteTwice,
	[postDoubleCharge.id]: postDoubleCharge,
	[putRetrySafe.id]: putRetrySafe,
	[patchBalanceSet.id]: patchBalanceSet,
	[patchCreditRunaway.id]: patchCreditRunaway,
	[postWithIdempotencyKey.id]: postWithIdempotencyKey,
}
