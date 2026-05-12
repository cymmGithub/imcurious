import type { Scenario } from '../types'

const KEY = '9b3f1c80-7a2d-4d61-b27e-1234567890ab'

export const postWithIdempotencyKey: Scenario = {
	id: 'post-with-idempotency-key',
	title: 'POST with Idempotency Key',
	steps: [
		{
			description:
				'Client generates a UUID and sends POST /accounts with header Idempotency-Key: 9b3f… and body {owner: "Alice", balance: 100}.',
			resource: { kind: 'none' },
			wire: { healthy: true },
			packets: [
				{
					id: 'req-1',
					kind: 'request',
					method: 'POST',
					position: 0.2,
					fate: 'in-flight',
					label: 'POST /accounts',
					payloadPreview: 'Idempotency-Key: 9b3f…',
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
					idempotencyKey: KEY,
				},
			],
		},
		{
			description:
				'Server looks up the key 9b3f… in its dedupe table. Not found. Processes the POST, creates acc_42, stores key → response in the table, sends 201 Created.',
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
					idempotencyKey: KEY,
				},
			],
		},
		{
			description:
				'Wire breaks on the return trip. The 201 never reaches the client. Server has acc_42; key 9b3f… is in the dedupe table.',
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
					idempotencyKey: KEY,
				},
			],
		},
		{
			description:
				'Client retries — same POST, same Idempotency-Key: 9b3f…. The key is what tells the server "this is a retry, not a new request."',
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
					position: 0.2,
					fate: 'in-flight',
					label: 'POST /accounts',
					payloadPreview: 'Idempotency-Key: 9b3f…',
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
					idempotencyKey: KEY,
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
					idempotencyKey: KEY,
				},
			],
		},
		{
			description:
				'Server looks up 9b3f… in the dedupe table — finds it. Skips the create entirely. Replays the cached 201 from the first request. No second account.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 100 },
			},
			wire: { healthy: true },
			packets: [
				{
					id: 'res-2',
					kind: 'response',
					statusCode: 201,
					position: 0.5,
					fate: 'in-flight',
					label: '201 (cached)',
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
					idempotencyKey: KEY,
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
					idempotencyKey: KEY,
				},
			],
		},
		{
			description:
				'Response arrives. Client got a clean 201, exactly what it expected. One account on the server. The key absorbed the failure. POST is now survivable.',
			resource: {
				kind: 'single',
				account: { id: 'acc_42', owner: 'Alice', balance: 100 },
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
					idempotencyKey: KEY,
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
					idempotencyKey: KEY,
				},
			],
		},
	],
}
