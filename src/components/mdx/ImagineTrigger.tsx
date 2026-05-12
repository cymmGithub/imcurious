'use client'

import { useUberStory } from '@/components/idempotency/UberStoryContext'

interface ImagineTriggerProps {
	children: React.ReactNode
}

export function ImagineTrigger({ children }: ImagineTriggerProps) {
	const { isPlaying, start } = useUberStory()

	if (isPlaying) {
		return <span>{children}</span>
	}

	return (
		<button
			type="button"
			onClick={start}
			title="Click to play the cascade"
			aria-label="Play the Uber Eats cascade animation"
			className="cursor-pointer transition-colors"
			style={{
				color: 'inherit',
				background: 'transparent',
				border: 'none',
				padding: 0,
				font: 'inherit',
				fontWeight: 700,
				textDecoration: 'underline',
				textDecorationStyle: 'dashed',
				textDecorationColor: '#f97316',
				textDecorationThickness: '1.5px',
				textUnderlineOffset: '4px',
			}}
		>
			{children}
		</button>
	)
}
