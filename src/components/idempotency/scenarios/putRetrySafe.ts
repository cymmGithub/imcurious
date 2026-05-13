import type { Scenario } from '../types'

export const putRetrySafe: Scenario = {
	id: 'put-retry-safe',
	title: 'PUT: Same Failure, Different Outcome',
	steps: [
		{
			description:
				'Client sends PUT /accounts/acc_42 with {owner: "Alice", balance: 200} to update the account.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 100 },
			},
			wire: { healthy: true },
			packets: [
				{
					id: 'req-1',
					kind: 'request',
					method: 'PUT',
					position: 0.2,
					fate: 'in-flight',
					label: 'PUT /accounts/acc_42',
					payloadPreview: '{ owner: "Alice", balance: 200 }',
				},
			],
			log: [
				{
					attempt: 1,
					request: {
						method: 'PUT',
						path: '/accounts/acc_42',
						body: '{ owner: "Alice", balance: 200 }',
					},
					serverOutcome: 'not-yet',
					clientOutcome: 'in-flight',
				},
			],
		},
		{
			description:
				'Server replaces the account with the new body. Balance is now 200. Sends back 200 OK.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 200 },
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
						method: 'PUT',
						path: '/accounts/acc_42',
						body: '{ owner: "Alice", balance: 200 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'in-flight',
					statusCode: 200,
				},
			],
		},
		{
			description:
				'The wire breaks on the return trip. The 200 never reaches the client. Server: done. Client: silent.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 200 },
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
						method: 'PUT',
						path: '/accounts/acc_42',
						body: '{ owner: "Alice", balance: 200 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
			],
		},
		{
			description:
				'Client retries with the same body. From its view: maybe the first never landed. From the server: another PUT — same as the previous one.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 200 },
			},
			wire: { healthy: true },
			packets: [
				{
					id: 'req-2',
					kind: 'request',
					method: 'PUT',
					position: 0.2,
					fate: 'in-flight',
					label: 'PUT /accounts/acc_42',
					payloadPreview: '{ owner: "Alice", balance: 200 }',
				},
			],
			log: [
				{
					attempt: 1,
					request: {
						method: 'PUT',
						path: '/accounts/acc_42',
						body: '{ owner: "Alice", balance: 200 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
				{
					attempt: 2,
					request: {
						method: 'PUT',
						path: '/accounts/acc_42',
						body: '{ owner: "Alice", balance: 200 }',
					},
					serverOutcome: 'not-yet',
					clientOutcome: 'in-flight',
				},
			],
		},
		{
			description:
				'Server applies the PUT again. Same body, same result — balance stays 200. The retry is a no-op on the server.',
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
						method: 'PUT',
						path: '/accounts/acc_42',
						body: '{ owner: "Alice", balance: 200 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
				{
					attempt: 2,
					request: {
						method: 'PUT',
						path: '/accounts/acc_42',
						body: '{ owner: "Alice", balance: 200 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'in-flight',
					statusCode: 200,
				},
			],
		},
		{
			description:
				'Response arrives. Client got a clean 200. Server has one account, balance 200 — exactly what would have happened with one PUT. That is what idempotent buys you.',
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
						method: 'PUT',
						path: '/accounts/acc_42',
						body: '{ owner: "Alice", balance: 200 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
				{
					attempt: 2,
					request: {
						method: 'PUT',
						path: '/accounts/acc_42',
						body: '{ owner: "Alice", balance: 200 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'success',
					statusCode: 200,
				},
			],
		},
	],
}
