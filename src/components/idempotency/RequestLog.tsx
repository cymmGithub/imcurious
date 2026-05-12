'use client'

import { motion } from 'framer-motion'
import type { ClientOutcome, LogEntry } from './types'

interface RequestLogProps {
	log: LogEntry[]
}

const OUTCOME_LABELS: Record<ClientOutcome, string> = {
	'in-flight': 'in flight…',
	success: 'success',
	'request-lost': 'request lost',
	'response-lost': 'response lost',
}

const OUTCOME_COLORS: Record<ClientOutcome, string> = {
	'in-flight': '#6b7280',
	success: '#10b981',
	'request-lost': '#f59e0b',
	'response-lost': '#ef4444',
}

function LogRow({ entry }: { entry: LogEntry }) {
	return (
		<motion.div
			layout
			initial={{ opacity: 0, x: -8 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3 }}
			className="font-mono text-[11px] py-1.5 px-2"
			style={{
				color: 'var(--color-chalk)',
				borderLeft: `2px solid ${OUTCOME_COLORS[entry.clientOutcome]}`,
				background: 'transparent',
			}}
		>
			<div className="flex items-baseline gap-2">
				<span style={{ color: 'var(--color-chalk-dim)' }}>
					#{entry.attempt}
				</span>
				<span style={{ color: 'var(--color-chalk)' }}>
					{entry.request.method}
				</span>
				<span style={{ color: 'var(--color-chalk-dim)' }}>
					{entry.request.path}
				</span>
				{entry.statusCode !== undefined && (
					<span style={{ color: OUTCOME_COLORS[entry.clientOutcome] }}>
						{entry.statusCode}
					</span>
				)}
			</div>
			<div
				className="text-[10px] italic"
				style={{ color: OUTCOME_COLORS[entry.clientOutcome] }}
			>
				{OUTCOME_LABELS[entry.clientOutcome]}
				{entry.idempotencyKey && (
					<span
						className="ml-2 not-italic"
						style={{ color: 'var(--color-chalk-dim)' }}
					>
						key: {entry.idempotencyKey.slice(0, 8)}…
					</span>
				)}
			</div>
		</motion.div>
	)
}

export function RequestLog({ log }: RequestLogProps) {
	return (
		<div
			className="rounded-md p-3 h-full overflow-y-auto"
			style={{
				background: 'var(--color-surface-card)',
				border: '1px solid var(--color-chalk-faint)',
			}}
		>
			<div className="flex items-baseline justify-between mb-2">
				<div
					className="font-sketch text-[11px] uppercase tracking-wider"
					style={{ color: 'var(--color-chalk-dim)' }}
				>
					Request log
				</div>
				<div
					className="font-mono text-[10px]"
					style={{ color: 'var(--color-chalk-faint)' }}
				>
					(client view)
				</div>
			</div>

			{log.length === 0 ? (
				<div
					className="font-mono text-[11px] italic"
					style={{ color: 'var(--color-chalk-dim)' }}
				>
					(no requests yet)
				</div>
			) : (
				<div className="space-y-1">
					{log.map((entry) => (
						<LogRow key={entry.attempt} entry={entry} />
					))}
				</div>
			)}
		</div>
	)
}
