import type { Scenario } from '../types'

// TODO(author): encode the put-retry-safe scenario. Spec §7.4 — replay the
// failure-mode-2 sequence but with PUT instead of POST. Retry applies the
// same body; resource state ends up the same as after one PUT.
export const putRetrySafe: Scenario = {
	id: 'put-retry-safe',
	title: 'PUT: Same Failure, Different Outcome',
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
