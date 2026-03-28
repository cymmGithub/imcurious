'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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

  if (visibility <= 0) return null

  return (
    <motion.div
      className="flex flex-wrap items-center gap-2 p-3 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: visibility, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Play/Pause */}
      <button
        onClick={onTogglePause}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold font-orbitron tracking-wide transition-colors"
        style={{
          backgroundColor: isPaused ? 'var(--color-neon-cyan)' : '#333',
          color: isPaused ? '#000' : 'var(--color-neon-cyan)',
          boxShadow: isPaused ? '0 0 12px var(--color-neon-cyan)40' : 'none',
        }}
      >
        {isPaused ? '▶ Play' : '⏸ Pause'}
      </button>

      <div className="w-px h-6 bg-gray-700" />

      {/* Add setTimeout */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onAddTask('setTimeout', timeoutDelay)}
          className="px-3 py-1.5 rounded-md text-sm font-bold font-space-mono transition-all hover:brightness-110"
          style={{
            backgroundColor: '#ffbe0b20',
            border: '1px solid var(--color-neon-yellow)',
            color: 'var(--color-neon-yellow)',
          }}
        >
          + setTimeout
        </button>
        <div className="flex items-center gap-1.5">
          <input
            type="range"
            min={0}
            max={2000}
            step={100}
            value={timeoutDelay}
            onChange={(e) => setTimeoutDelay(Number(e.target.value))}
            className="w-20 accent-[var(--color-neon-yellow)]"
          />
          <span className="text-xs text-gray-400 font-space-mono w-12">
            {timeoutDelay}ms
          </span>
        </div>
      </div>

      {/* Add fetch */}
      <button
        onClick={() => onAddTask('fetch')}
        className="px-3 py-1.5 rounded-md text-sm font-bold font-space-mono transition-all hover:brightness-110"
        style={{
          backgroundColor: '#06d6a020',
          border: '1px solid var(--color-neon-green)',
          color: 'var(--color-neon-green)',
        }}
      >
        + fetch
      </button>

      <div className="w-px h-6 bg-gray-700" />

      {/* Reset */}
      <button
        onClick={onReset}
        className="px-2 py-1.5 rounded-md text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Reset
      </button>
    </motion.div>
  )
}
