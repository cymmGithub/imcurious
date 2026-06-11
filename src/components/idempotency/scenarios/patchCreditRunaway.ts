import type { Scenario } from '../types'

export const patchCreditRunaway: Scenario = {
	id: 'patch-credit-runaway',
	title: 'PATCH (non-idempotent): Applying a Delta',
	steps: [
		{
			description:
				'PATCH with {credit: 50} — an imperative patch: "add 50 to the balance."',
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
					position: 0.8,
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
				'Wire breaks; the response is lost. The server balance is 150 — the client doesn’t know.',
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
				'Client retries the same body. "Add 50" — and the server is about to do it again.',
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
				'Another 50 credited; balance is 200. Alice was credited twice for one intent.',
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
					position: 0.8,
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
				'A clean 200 — but balance is 200, not 150. A delta body is not idempotent.',
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
