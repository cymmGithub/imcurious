import type { Scenario } from '../types'

// TODO(author): encode the idempotency-key fix. Spec §7.7 — POST with an
// Idempotency-Key header. Server caches response by key; retry returns the
// cached response without creating a duplicate. Closing callback to Uber.
export const postWithIdempotencyKey: Scenario = {
	id: 'post-with-idempotency-key',
	title: 'POST with Idempotency Key',
	steps: [
		{
			description: 'TODO: author this scenario.',
			resource: { kind: 'none' },
			wire: { healthy: true },
			packets: [],
			log: [],
		},
	],
}
