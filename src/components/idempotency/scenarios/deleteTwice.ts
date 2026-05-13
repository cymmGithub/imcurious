import type { Scenario } from '../types'

export const deleteTwice: Scenario = {
	id: 'delete-twice',
	title: 'DELETE Twice: Same State, Different Responses',
	steps: [
		{
			description: 'Client sends DELETE /accounts/acc_42 for the first time.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 100 },
			},
			wire: { healthy: true },
			packets: [
				{
					id: 'req-1',
					kind: 'request',
					method: 'DELETE',
					position: 0.2,
					fate: 'in-flight',
					label: 'DELETE /accounts/acc_42',
				},
			],
			log: [
				{
					attempt: 1,
					request: { method: 'DELETE', path: '/accounts/acc_42' },
					serverOutcome: 'not-yet',
					clientOutcome: 'in-flight',
				},
			],
		},
		{
			description:
				'Server deletes the account. The resource is gone. Server sends back 204 No Content.',
			resource: { kind: 'none' },
			wire: { healthy: true },
			packets: [
				{
					id: 'res-1',
					kind: 'response',
					statusCode: 204,
					position: 0.8,
					fate: 'in-flight',
					label: '204 No Content',
				},
			],
			log: [
				{
					attempt: 1,
					request: { method: 'DELETE', path: '/accounts/acc_42' },
					serverOutcome: 'processed',
					clientOutcome: 'in-flight',
					statusCode: 204,
				},
			],
		},
		{
			description:
				'Response arrives. Client knows the account is gone. Server agrees.',
			resource: { kind: 'none' },
			wire: { healthy: true },
			packets: [],
			log: [
				{
					attempt: 1,
					request: { method: 'DELETE', path: '/accounts/acc_42' },
					serverOutcome: 'processed',
					clientOutcome: 'success',
					statusCode: 204,
				},
			],
		},
		{
			description:
				'Client sends DELETE /accounts/acc_42 again. Maybe a retry, maybe a paranoid double-check.',
			resource: { kind: 'none' },
			wire: { healthy: true },
			packets: [
				{
					id: 'req-2',
					kind: 'request',
					method: 'DELETE',
					position: 0.2,
					fate: 'in-flight',
					label: 'DELETE /accounts/acc_42',
				},
			],
			log: [
				{
					attempt: 1,
					request: { method: 'DELETE', path: '/accounts/acc_42' },
					serverOutcome: 'processed',
					clientOutcome: 'success',
					statusCode: 204,
				},
				{
					attempt: 2,
					request: { method: 'DELETE', path: '/accounts/acc_42' },
					serverOutcome: 'not-yet',
					clientOutcome: 'in-flight',
				},
			],
		},
		{
			description:
				'Server looks up the account. It is already gone. Sends back 404 Not Found. The resource stays gone.',
			resource: { kind: 'none' },
			wire: { healthy: true },
			packets: [
				{
					id: 'res-2',
					kind: 'response',
					statusCode: 404,
					position: 0.8,
					fate: 'in-flight',
					label: '404 Not Found',
				},
			],
			log: [
				{
					attempt: 1,
					request: { method: 'DELETE', path: '/accounts/acc_42' },
					serverOutcome: 'processed',
					clientOutcome: 'success',
					statusCode: 204,
				},
				{
					attempt: 2,
					request: { method: 'DELETE', path: '/accounts/acc_42' },
					serverOutcome: 'processed',
					clientOutcome: 'in-flight',
					statusCode: 404,
				},
			],
		},
		{
			description:
				'Response arrives. 204 the first time, 404 the second — but the server state is the same after both: gone. That is what idempotent really means.',
			resource: { kind: 'none' },
			wire: { healthy: true },
			packets: [],
			log: [
				{
					attempt: 1,
					request: { method: 'DELETE', path: '/accounts/acc_42' },
					serverOutcome: 'processed',
					clientOutcome: 'success',
					statusCode: 204,
				},
				{
					attempt: 2,
					request: { method: 'DELETE', path: '/accounts/acc_42' },
					serverOutcome: 'processed',
					clientOutcome: 'success',
					statusCode: 404,
				},
			],
		},
	],
}
