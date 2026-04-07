'use client'

import {
	STATIC_HIGHLIGHTS_DARK,
	STATIC_HIGHLIGHTS_LIGHT,
} from '@/lib/__generated__/staticHighlights'
import { useTheme } from '@/hooks/useTheme'

interface StaticCodeProps {
	id: string
}

export function StaticCode({ id }: StaticCodeProps) {
	const theme = useTheme()
	const html =
		theme === 'light' ? STATIC_HIGHLIGHTS_LIGHT[id] : STATIC_HIGHLIGHTS_DARK[id]

	if (!html)
		return <pre className="p-4 text-sm font-mono">Unknown code block: {id}</pre>

	return (
		<div
			className="rounded-lg overflow-hidden my-8"
			style={{ border: '1px solid var(--color-chalk-faint)' }}
		>
			<div
				className="p-4 text-sm overflow-x-auto font-mono [&_pre]:!bg-transparent [&_code]:!bg-transparent"
				style={{ background: 'var(--color-surface-card)' }}
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</div>
	)
}
