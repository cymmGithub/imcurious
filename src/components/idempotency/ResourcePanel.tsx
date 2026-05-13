'use client'

import { motion } from 'framer-motion'
import { memo } from 'react'
import type { Account, ResourceState } from './types'

interface ResourcePanelProps {
	resource: ResourceState
}

const AccountRow = memo(function AccountRow({
	account,
	isNew,
}: {
	account: Account
	isNew?: boolean
}) {
	return (
		<motion.div
			layout
			initial={isNew ? { opacity: 0, x: -8 } : false}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.35 }}
			className="font-mono text-[12px] leading-relaxed pl-2"
			style={{
				color: 'var(--color-chalk)',
				borderLeft: isNew
					? '2px solid #f97316'
					: '2px solid var(--color-chalk-faint)',
			}}
		>
			<div>
				<span style={{ color: 'var(--color-chalk-dim)' }}>id:</span>{' '}
				{account.id}
			</div>
			<div>
				<span style={{ color: 'var(--color-chalk-dim)' }}>owner:</span> &quot;
				{account.owner}&quot;
			</div>
			<div>
				<span style={{ color: 'var(--color-chalk-dim)' }}>balance:</span>{' '}
				{account.balance}
			</div>
		</motion.div>
	)
})

export function ResourcePanel({ resource }: ResourcePanelProps) {
	return (
		<div
			className="rounded-md p-3 h-full overflow-y-auto"
			style={{
				background: 'var(--color-surface-card)',
				border: '1px solid var(--color-chalk-faint)',
			}}
		>
			<div className="mb-2">
				<div
					className="font-sketch text-[11px] uppercase tracking-wider"
					style={{ color: 'var(--color-chalk-dim)' }}
				>
					Server resource
				</div>
			</div>

			{resource.kind === 'none' && (
				<div
					className="font-mono text-[12px] italic"
					style={{ color: 'var(--color-chalk-dim)' }}
				>
					(no accounts)
				</div>
			)}

			{resource.kind === 'single' && <AccountRow account={resource.account} />}

			{resource.kind === 'collection' && (
				<div className="space-y-2">
					{resource.items.map((account, i) => (
						<AccountRow
							key={account.id}
							account={account}
							isNew={
								i === resource.items.length - 1 && resource.items.length > 1
							}
						/>
					))}
				</div>
			)}
		</div>
	)
}
