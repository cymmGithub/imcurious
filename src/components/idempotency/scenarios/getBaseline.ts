import type { Scenario } from '../types'

// TODO(author): encode the GET baseline scenario. Spec §7.1 — establish the
// visual grammar with a happy-path GET that leaves the server unchanged.
// ~3 steps: send GET, server responds 200, response arrives.
export const getBaseline: Scenario = {
	id: 'get-baseline',
	title: 'GET: The Safe Baseline',
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
