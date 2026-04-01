import { Info } from 'lucide-react'

interface CalloutProps {
	children: React.ReactNode
}

export function Callout({ children }: CalloutProps) {
	return (
		<div
			className="relative my-8 rounded-sm pl-8 py-4 pr-4"
			style={{
				borderLeft: '2px solid var(--color-chalk-faint)',
				background: 'var(--color-surface-card)',
			}}
		>
			<Info
				size={18}
				className="absolute left-2.5 top-[28px]"
				style={{ color: 'var(--color-callout-icon)' }}
				aria-hidden="true"
				strokeWidth={2.5}
			/>
			<div className="text-[var(--color-chalk-dim)] text-[15px] leading-[1.6] italic font-body [&>p]:mb-0 p-2">
				{children}
			</div>
		</div>
	)
}
