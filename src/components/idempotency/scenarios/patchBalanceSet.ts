import type { Scenario } from '../types'

export const patchBalanceSet: Scenario = {
	id: 'patch-balance-set',
	title: 'PATCH (idempotent): Setting a Value',
	steps: [
		{
			description:
				'Client sends PATCH /accounts/acc_42 with {balance: 200}. A declarative patch — "set the balance to 200."',
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
					payloadPreview: '{ balance: 200 }',
				},
			],
			log: [
				{
					attempt: 1,
					request: {
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ balance: 200 }',
					},
					serverOutcome: 'not-yet',
					clientOutcome: 'in-flight',
				},
			],
		},
		{
			description:
				'Server applies the patch. Balance is now 200. Sends 200 OK.',
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
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ balance: 200 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'in-flight',
					statusCode: 200,
				},
			],
		},
		{
			description:
				'Wire breaks on the return trip. Response is lost. The server state is still {balance: 200}.',
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
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ balance: 200 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
			],
		},
		{
			description: 'Client retries with the same body: {balance: 200}.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 200 },
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
					payloadPreview: '{ balance: 200 }',
				},
			],
			log: [
				{
					attempt: 1,
					request: {
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ balance: 200 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
				{
					attempt: 2,
					request: {
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ balance: 200 }',
					},
					serverOutcome: 'not-yet',
					clientOutcome: 'in-flight',
				},
			],
		},
		{
			description:
				'Server applies the patch again — sets balance to 200. It was already 200. Nothing changes on the server.',
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
						body: '{ balance: 200 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
				{
					attempt: 2,
					request: {
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ balance: 200 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'in-flight',
					statusCode: 200,
				},
			],
		},
		{
			description:
				'Response arrives. Balance is 200. Whether the patch ran once or twice, the answer is the same. A declarative patch is idempotent.',
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
						body: '{ balance: 200 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
				{
					attempt: 2,
					request: {
						method: 'PATCH',
						path: '/accounts/acc_42',
						body: '{ balance: 200 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'success',
					statusCode: 200,
				},
			],
		},
	],
}
