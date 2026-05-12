import type { Scenario } from '../types'

export const patchCreditRunaway: Scenario = {
	id: 'patch-credit-runaway',
	title: 'PATCH (non-idempotent): Applying a Delta',
	steps: [
		{
			description:
				'Client sends PATCH /accounts/acc_42 with {credit: 50}. An imperative patch — "add 50 to the balance."',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 100 },
			},
			wire: { healthy: true },
			packets: [
				{
					id: 'req-1',
					kind: 'request',
					method: 'PATCH',
					position: 0.2,
					fate: 'in-flight',
					label: 'PATCH /accounts/acc_42',
					payloadPreview: '{ credit: 50 }',
				},
			],
			log: [
				{
					attempt: 1,
					request: {
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ credit: 50 }',
					},
					serverOutcome: 'not-yet',
					clientOutcome: 'in-flight',
				},
			],
		},
		{
			description:
				'Server credits 50 to the balance. 100 + 50 = 150. Sends 200 OK.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 150 },
			},
			wire: { healthy: true },
			packets: [
				{
					id: 'res-1',
					kind: 'response',
					statusCode: 200,
					position: 0.5,
					fate: 'in-flight',
					label: '200 OK',
				},
			],
			log: [
				{
					attempt: 1,
					request: {
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ credit: 50 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'in-flight',
					statusCode: 200,
				},
			],
		},
		{
			description:
				'Wire breaks on the return trip. Response is lost. Balance on the server is now 150 — but the client does not know that.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 150 },
			},
			wire: { healthy: false, breakAt: 0.4 },
			packets: [
				{
					id: 'res-1',
					kind: 'response',
					statusCode: 200,
					position: 0.4,
					fate: 'lost',
					label: '200 OK',
				},
			],
			log: [
				{
					attempt: 1,
					request: {
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ credit: 50 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
			],
		},
		{
			description:
				'Client retries with the same body: {credit: 50}. Same intent. Same payload. The body says "add 50" — and the server is about to do that again.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 150 },
			},
			wire: { healthy: true },
			packets: [
				{
					id: 'req-2',
					kind: 'request',
					method: 'PATCH',
					position: 0.2,
					fate: 'in-flight',
					label: 'PATCH /accounts/acc_42',
					payloadPreview: '{ credit: 50 }',
				},
			],
			log: [
				{
					attempt: 1,
					request: {
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ credit: 50 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
				{
					attempt: 2,
					request: {
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ credit: 50 }',
					},
					serverOutcome: 'not-yet',
					clientOutcome: 'in-flight',
				},
			],
		},
		{
			description:
				'Server credits another 50. Balance is now 200. Alice has been credited twice for one user intent.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 200 },
			},
			wire: { healthy: true },
			packets: [
				{
					id: 'res-2',
					kind: 'response',
					statusCode: 200,
					position: 0.5,
					fate: 'in-flight',
					label: '200 OK',
				},
			],
			log: [
				{
					attempt: 1,
					request: {
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ credit: 50 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
				{
					attempt: 2,
					request: {
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ credit: 50 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'in-flight',
					statusCode: 200,
				},
			],
		},
		{
			description:
				'Response arrives. Client got a clean 200. Balance is 200, not 150. The runaway is real. PATCH is not idempotent when the body is a delta.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 200 },
			},
			wire: { healthy: true },
			packets: [],
			log: [
				{
					attempt: 1,
					request: {
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ credit: 50 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
				{
					attempt: 2,
					request: {
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ credit: 50 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'success',
					statusCode: 200,
				},
			],
		},
	],
}
