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
				className="absolute left-2.5 top-[28px] text-yellow-400"
				aria-hidden="true"
				strokeWidth={2.5}
			/>
			<div className="text-[var(--color-chalk-dim)] text-[15px] leading-[1.6] italic font-body [&>p]:mb-0 p-2 [&_a]:font-bold [&_a]:not-italic [&_a]:text-[var(--color-chalk)] [&_a]:underline [&_a]:decoration-dashed [&_a]:decoration-[#f97316] [&_a]:decoration-[1.5px] [&_a]:underline-offset-4 [&_a]:transition-colors">
				{children}
			</div>
		</div>
	)
}
