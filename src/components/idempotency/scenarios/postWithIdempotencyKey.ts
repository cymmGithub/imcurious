import type { Scenario } from '../types'

const KEY = '9b3f1c80-7a2d-4d61-b27e-1234567890ab'

export const postWithIdempotencyKey: Scenario = {
	id: 'post-with-idempotency-key',
	title: 'POST with Idempotency Key',
	steps: [
		{
			description:
				'Client sends the POST with a fresh UUID header: Idempotency-Key: 9b3f….',
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
				'Key 9b3f… not in the dedupe table: create acc_42, store key → response, send 201.',
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
					position: 0.8,
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
				'Wire breaks; the 201 is lost. Server has acc_42 — and the key in its table.',
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
				'Client retries with the same key — the key says "retry, not a new request."',
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
				'Key found in the table: skip the create, replay the cached 201. No second account.',
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
					position: 0.8,
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
				'A clean 201, one account. The key absorbed the failure — POST is now survivable.',
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
