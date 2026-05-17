'use client'

import type { ReactNode, Ref } from 'react'

interface StickyVizLayoutProps {
	ref?: Ref<HTMLDivElement>
	viz: ReactNode
	vizMinHeight?: string
	vizOverflow?: 'visible' | 'hidden'
	children: ReactNode
}

export function StickyVizLayout({
	ref,
	viz,
	vizMinHeight = '280px',
	vizOverflow = 'visible',
	children,
}: StickyVizLayoutProps) {
	const overflowClass = vizOverflow === 'hidden' ? 'overflow-hidden' : ''
	return (
		<div ref={ref} className="relative">
			<div className="flex flex-col lg:flex-row">
				<div
					className={`lg:w-1/2 lg:h-screen lg:sticky lg:top-0 h-[40vh] sticky top-0 z-10 bg-surface border-b border-dashed border-chalk-faint/40 lg:border-b-0 ${overflowClass}`.trim()}
					style={{ minHeight: vizMinHeight }}
				>
					{viz}
				</div>
				<div className="lg:w-1/2 px-6 lg:px-12 py-8 lg:py-16 relative z-0">
					{children}
				</div>
			</div>
		</div>
	)
}
