import type { Scenario } from '../types'

export const getBaseline: Scenario = {
	id: 'get-baseline',
	title: 'GET: The "Safe" Baseline',
	steps: [
		{
			description:
				'Client sends GET /accounts/acc_42. The request packet leaves the client and starts its trip across the wire.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 100 },
			},
			wire: { healthy: true },
			packets: [
				{
					id: 'req-1',
					kind: 'request',
					method: 'GET',
					position: 0.2,
					fate: 'in-flight',
					label: 'GET /accounts/acc_42',
				},
			],
			log: [
				{
					attempt: 1,
					request: { method: 'GET', path: '/accounts/acc_42' },
					serverOutcome: 'not-yet',
					clientOutcome: 'in-flight',
				},
			],
		},
		{
			description:
				'Server receives the GET, reads the account, sends 200 back with the account body. Nothing on the server changes — GET is safe.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 100 },
			},
			wire: { healthy: true },
			packets: [
				{
					id: 'res-1',
					kind: 'response',
					statusCode: 200,
					position: 0.8,
					fate: 'in-flight',
					label: '200 OK',
				},
			],
			log: [
				{
					attempt: 1,
					request: { method: 'GET', path: '/accounts/acc_42' },
					serverOutcome: 'processed',
					clientOutcome: 'in-flight',
					statusCode: 200,
				},
			],
		},
		{
			description:
				'Response arrives. Client got the data; server is exactly as it was. That is the safe, idempotent baseline.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 100 },
			},
			wire: { healthy: true },
			packets: [],
			log: [
				{
					attempt: 1,
					request: { method: 'GET', path: '/accounts/acc_42' },
					serverOutcome: 'processed',
					clientOutcome: 'success',
					statusCode: 200,
				},
			],
		},
	],
}
