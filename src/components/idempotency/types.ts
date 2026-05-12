export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type Account = {
	id: string
	owner: string
	balance: number
}

export type ResourceState =
	| { kind: 'none' }
	| { kind: 'single'; account: Account }
	| { kind: 'collection'; items: Account[] }

export type PacketFate = 'in-flight' | 'arrived' | 'lost'

type PacketBase = {
	id: string
	position: number
	fate: PacketFate
	label: string
}

export type PacketState =
	| (PacketBase & {
			kind: 'request'
			method: HttpMethod
			payloadPreview?: string
	  })
	| (PacketBase & { kind: 'response'; statusCode: number })

export type WireState = { healthy: true } | { healthy: false; breakAt: number }

export type ServerOutcome = 'processed' | 'request-lost' | 'not-yet'
export type ClientOutcome =
	| 'success'
	| 'request-lost'
	| 'response-lost'
	| 'in-flight'

export type LogEntry = {
	attempt: number
	request: {
		method: HttpMethod
		path: string
		body?: string
	}
	serverOutcome: ServerOutcome
	clientOutcome: ClientOutcome
	statusCode?: number
	idempotencyKey?: string
}

export type Snapshot = {
	description: string
	resource: ResourceState
	wire: WireState
	packets: PacketState[]
	log: LogEntry[]
}

export type Scenario = {
	id: string
	title: string
	steps: Snapshot[]
}
