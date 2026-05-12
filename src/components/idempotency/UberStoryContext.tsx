'use client'

import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from 'react'

interface UberStoryContextValue {
	isPlaying: boolean
	start: () => void
}

const UberStoryContext = createContext<UberStoryContextValue | null>(null)

export function UberStoryProvider({ children }: { children: ReactNode }) {
	const [isPlaying, setPlaying] = useState(false)
	const start = useCallback(() => setPlaying(true), [])
	return (
		<UberStoryContext.Provider value={{ isPlaying, start }}>
			{children}
		</UberStoryContext.Provider>
	)
}

export function useUberStory(): UberStoryContextValue {
	const ctx = useContext(UberStoryContext)
	// Outside provider: animation is treated as "already playing" so the
	// component still functions if rendered standalone (e.g. tests, docs).
	if (!ctx) return { isPlaying: true, start: () => {} }
	return ctx
}
