import type { Scenario } from '../types'

// TODO(author): encode the non-idempotent PATCH scenario. Spec §7.6 — PATCH
// with a delta-style body {credit: 50}. Retries accumulate. THE KILLER demo.
export const patchCreditRunaway: Scenario = {
	id: 'patch-credit-runaway',
	title: 'PATCH (non-idempotent): Apply a Delta',
	steps: [
		{
			description: 'TODO: author this scenario.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 100 },
			},
			wire: { healthy: true },
			packets: [],
			log: [],
		},
	],
}
