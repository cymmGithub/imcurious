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
			<div className="text-[var(--color-chalk-dim)] text-[15px] leading-[1.6] italic font-body [&>p]:mb-0 p-2 [&_a]:font-bold [&_a]:not-italic [&_a]:text-[var(--color-chalk)] [&_a]:underline [&_a]:decoration-dashed [&_a]:decoration-[#f97316] [&_a]:decoration-[1.5px] [&_a]:underline-offset-4 [&_a]:transition-colors [&_table]:not-italic [&_table]:w-full [&_table]:my-3 [&_table]:text-[14px] [&_th]:text-left [&_th]:pb-2 [&_th]:pr-3 [&_th]:font-bold [&_th]:text-[var(--color-chalk)] [&_th]:border-b [&_th]:border-[var(--color-chalk-faint)] [&_td]:py-1.5 [&_td]:pr-3 [&_td]:align-top [&_td]:border-b [&_td]:border-[color:color-mix(in_srgb,var(--color-chalk-faint)_40%,transparent)]">
				{children}
			</div>
		</div>
	)
}
