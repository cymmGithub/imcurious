import type { Scenario } from '../types'

export const postDoubleCharge: Scenario = {
	id: 'post-double-charge',
	title: 'POST: The Double-Charge Trap',
	steps: [
		{
			description:
				'Client sends POST /accounts with {owner: "Alice", balance: 100} to create the account.',
			resource: { kind: 'none' },
			wire: { healthy: true },
			packets: [
				{
					id: 'req-1',
					kind: 'request',
					method: 'POST',
					position: 0.15,
					fate: 'in-flight',
					label: 'POST /accounts',
					payloadPreview: '{ owner: "Alice", balance: 100 }',
				},
			],
			log: [
				{
					attempt: 1,
					request: {
						method: 'POST',
						path: '/accounts',
						body: '{ owner: "Alice", balance: 100 }',
					},
					serverOutcome: 'not-yet',
					clientOutcome: 'in-flight',
				},
			],
		},
		{
			description:
				'Server receives the POST, creates acc_42, sends back 201 Created.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 100 },
			},
			wire: { healthy: true },
			packets: [
				{
					id: 'res-1',
					kind: 'response',
					statusCode: 201,
					position: 0.5,
					fate: 'in-flight',
					label: '201 Created',
				},
			],
			log: [
				{
					attempt: 1,
					request: {
						method: 'POST',
						path: '/accounts',
						body: '{ owner: "Alice", balance: 100 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'in-flight',
					statusCode: 201,
				},
			],
		},
		{
			description:
				"The wire breaks. The 201 response never reaches the client. From the client's side: silence. From the server's side: the account exists, and the server thinks the job is done.",
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 100 },
			},
			wire: { healthy: false, breakAt: 0.4 },
			packets: [
				{
					id: 'res-1',
					kind: 'response',
					statusCode: 201,
					position: 0.4,
					fate: 'lost',
					label: '201 Created',
				},
			],
			log: [
				{
					attempt: 1,
					request: {
						method: 'POST',
						path: '/accounts',
						body: '{ owner: "Alice", balance: 100 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
			],
		},
		{
			description:
				"Client gives up waiting and retries. From the client's perspective, maybe the request never landed. From the server's perspective, this looks like a brand-new request.",
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 100 },
			},
			wire: { healthy: true },
			packets: [
				{
					id: 'req-2',
					kind: 'request',
					method: 'POST',
					position: 0.15,
					fate: 'in-flight',
					label: 'POST /accounts',
					payloadPreview: '{ owner: "Alice", balance: 100 }',
				},
			],
			log: [
				{
					attempt: 1,
					request: {
						method: 'POST',
						path: '/accounts',
						body: '{ owner: "Alice", balance: 100 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
				{
					attempt: 2,
					request: {
						method: 'POST',
						path: '/accounts',
						body: '{ owner: "Alice", balance: 100 }',
					},
					serverOutcome: 'not-yet',
					clientOutcome: 'in-flight',
				},
			],
		},
		{
			description:
				'The server has no way to know this is a retry. It does what POST does: creates a new account. There are now two Alices.',
			resource: {
				kind: 'collection',
				items: [
					{ id: 'acc_42', owner: 'Alice', balance: 100 },
					{ id: 'acc_43', owner: 'Alice', balance: 100 },
				],
			},
			wire: { healthy: true },
			packets: [
				{
					id: 'res-2',
					kind: 'response',
					statusCode: 201,
					position: 0.5,
					fate: 'in-flight',
					label: '201 Created',
				},
			],
			log: [
				{
					attempt: 1,
					request: {
						method: 'POST',
						path: '/accounts',
						body: '{ owner: "Alice", balance: 100 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
				{
					attempt: 2,
					request: {
						method: 'POST',
						path: '/accounts',
						body: '{ owner: "Alice", balance: 100 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'in-flight',
					statusCode: 201,
				},
			],
		},
		{
			description:
				"Client gets a clean 201. From its point of view: success. From the server's reality: it processed Alice's signup twice. The duplicate is invisible to the side that thinks it's done.",
			resource: {
				kind: 'collection',
				items: [
					{ id: 'acc_42', owner: 'Alice', balance: 100 },
					{ id: 'acc_43', owner: 'Alice', balance: 100 },
				],
			},
			wire: { healthy: true },
			packets: [],
			log: [
				{
					attempt: 1,
					request: {
						method: 'POST',
						path: '/accounts',
						body: '{ owner: "Alice", balance: 100 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'response-lost',
				},
				{
					attempt: 2,
					request: {
						method: 'POST',
						path: '/accounts',
						body: '{ owner: "Alice", balance: 100 }',
					},
					serverOutcome: 'processed',
					clientOutcome: 'success',
					statusCode: 201,
				},
			],
		},
	],
}
