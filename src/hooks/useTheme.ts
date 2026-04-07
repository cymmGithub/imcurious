'use client'

import { useState, useEffect } from 'react'

export function useTheme(): 'dark' | 'light' {
	const [theme, setTheme] = useState<'dark' | 'light'>('dark')

	useEffect(() => {
		const html = document.documentElement
		const read = () => (html.dataset.theme === 'light' ? 'light' : 'dark')
		setTheme(read())

		const observer = new MutationObserver(() => setTheme(read()))
		observer.observe(html, {
			attributes: true,
			attributeFilter: ['data-theme'],
		})
		return () => observer.disconnect()
	}, [])

	return theme
}
