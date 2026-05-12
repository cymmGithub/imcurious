import type { Scenario } from '../types'

// TODO(author): encode the idempotent PATCH scenario. Spec §7.5 — PATCH with
// a set-style body {balance: 200}. Retries are safe because the body is
// declarative.
export const patchBalanceSet: Scenario = {
	id: 'patch-balance-set',
	title: 'PATCH (idempotent): Set a Value',
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
