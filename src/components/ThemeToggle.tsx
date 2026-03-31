'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
	const [theme, setTheme] = useState<'dark' | 'light'>('dark')

	useEffect(() => {
		// Read initial theme from DOM (set by blocking script in <head>)
		const current =
			document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
		setTheme(current)

		// Listen for system preference changes when no explicit preference
		const mq = window.matchMedia('(prefers-color-scheme: light)')
		const handler = (e: MediaQueryListEvent) => {
			if (!localStorage.getItem('theme')) {
				const next = e.matches ? 'light' : 'dark'
				document.documentElement.dataset.theme = next === 'light' ? 'light' : ''
				setTheme(next)
			}
		}
		mq.addEventListener('change', handler)
		return () => mq.removeEventListener('change', handler)
	}, [])

	function toggle() {
		const next = theme === 'dark' ? 'light' : 'dark'
		document.documentElement.dataset.theme = next === 'light' ? 'light' : ''
		localStorage.setItem('theme', next)
		setTheme(next)
	}

	return (
		<button
			onClick={toggle}
			aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
			className="fixed bottom-5 right-5 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-chalk-faint/40 bg-surface-card/80 backdrop-blur-sm text-chalk-dim transition-colors hover:text-chalk hover:border-chalk-faint cursor-pointer"
		>
			{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
		</button>
	)
}
