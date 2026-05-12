import type { Scenario } from '../types'

// TODO(author): encode the delete-twice scenario. Spec §7.2 — demolish the
// "idempotent means same response" misconception. First DELETE returns 204;
// second returns 404; resource state is gone both times.
export const deleteTwice: Scenario = {
	id: 'delete-twice',
	title: 'DELETE Twice: Same State, Different Responses',
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
