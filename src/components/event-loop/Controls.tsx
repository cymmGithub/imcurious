'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { TaskType } from '@/lib/simulation'

interface ControlsProps {
  isPaused: boolean
  onTogglePause: () => void
  onAddTask: (type: TaskType, delay?: number) => void
  onReset: () => void
  visibility: number
}

export function Controls({
  isPaused,
  onTogglePause,
  onAddTask,
  onReset,
  visibility,
}: ControlsProps) {
  const [timeoutDelay, setTimeoutDelay] = useState(500)
  const prefersReducedMotion = useReducedMotion()

  if (visibility <= 0) return null

  return (
    <motion.div
      className="flex flex-wrap items-center gap-2 p-3 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-800"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: visibility, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
    >
      {/* Play/Pause */}
      <button
        onClick={onTogglePause}
        aria-label={isPaused ? 'Play simulation' : 'Pause simulation'}
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-bold font-orbitron tracking-wide transition-colors min-h-[44px]"
        style={{
          backgroundColor: isPaused ? 'var(--color-neon-cyan)' : 'var(--color-surface-muted)',
          color: isPaused ? '#000' : 'var(--color-neon-cyan)',
          boxShadow: isPaused ? '0 0 12px var(--color-neon-cyan)40' : 'none',
        }}
      >
        {isPaused ? '▶ Play' : '⏸ Pause'}
      </button>

      <div className="w-px h-6 bg-gray-700" aria-hidden="true" />

      {/* Add setTimeout */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onAddTask('setTimeout', timeoutDelay)}
          aria-label={`Add setTimeout with ${timeoutDelay}ms delay`}
          className="px-3 py-2.5 rounded-md text-sm font-bold font-space-mono transition-all hover:brightness-110 min-h-[44px]"
          style={{
            backgroundColor: '#ffbe0b20',
            border: '1px solid var(--color-neon-yellow)',
            color: 'var(--color-neon-yellow)',
          }}
        >
          ⏱ setTimeout
        </button>
        <div className="flex items-center gap-1.5">
          <label htmlFor="timeout-delay" className="sr-only">
            Timeout delay in milliseconds
          </label>
          <input
            id="timeout-delay"
            type="range"
            min={0}
            max={2000}
            step={100}
            value={timeoutDelay}
            onChange={(e) => setTimeoutDelay(Number(e.target.value))}
            className="w-20 accent-[var(--color-neon-yellow)]"
            aria-valuetext={`${timeoutDelay} milliseconds`}
          />
          <span className="text-xs text-gray-400 font-space-mono w-12" aria-hidden="true">
            {timeoutDelay}ms
          </span>
        </div>
      </div>

      {/* Add fetch */}
      <button
        onClick={() => onAddTask('fetch')}
        aria-label="Add fetch request"
        className="px-3 py-2.5 rounded-md text-sm font-bold font-space-mono transition-all hover:brightness-110 min-h-[44px]"
        style={{
          backgroundColor: '#06d6a020',
          border: '1px solid var(--color-neon-green)',
          color: 'var(--color-neon-green)',
        }}
      >
        ↗ fetch
      </button>

      <div className="w-px h-6 bg-gray-700" aria-hidden="true" />

      {/* Reset */}
      <button
        onClick={onReset}
        aria-label="Reset simulation"
        className="px-3 py-2.5 rounded-md text-sm text-gray-500 hover:text-gray-300 transition-colors min-h-[44px]"
      >
        Reset
      </button>
    </motion.div>
  )
}
