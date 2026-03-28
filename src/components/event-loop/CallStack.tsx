'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { CarState, Task } from '@/lib/simulation'

interface CallStackProps {
  carState: CarState
  currentTask: Task | null
  visibility: number
}

interface StackFrame {
  id: string
  label: string
  color: string
}

function deriveFrames(carState: CarState, currentTask: Task | null): StackFrame[] {
  switch (carState) {
    case 'EXECUTING_TASK':
    case 'EXECUTING_MICROTASK':
      if (!currentTask) return []
      return [
        { id: 'global', label: 'global()', color: '#ffffff' },
        { id: `task-${currentTask.id}`, label: currentTask.label, color: currentTask.color },
      ]
    case 'RENDERING':
      return [
        { id: 'raf', label: 'requestAnimationFrame()', color: '#c0b8a8' },
      ]
    default:
      return []
  }
}

export function CallStack({ carState, currentTask, visibility }: CallStackProps) {
  const prefersReducedMotion = useReducedMotion()

  if (visibility <= 0) return null

  const frames = deriveFrames(carState, currentTask)
  const isEmpty = frames.length === 0

  return (
    <motion.div
      className="absolute top-3 right-3 pointer-events-none"
      initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
      animate={{ opacity: visibility, x: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
      role="region"
      aria-label="Call stack"
    >
      <div
        className="rounded-lg overflow-hidden min-w-[140px]"
        style={{
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-chalk-faint)',
        }}
      >
        {/* Header */}
        <div
          className="px-3 py-1.5 flex items-center gap-2"
          style={{
            borderBottom: '1px solid var(--color-chalk-faint)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: isEmpty ? 'var(--color-chalk-faint)' : 'var(--color-chalk)',
            }}
          />
          <span
            className="font-display text-[9px] font-bold tracking-[0.15em] uppercase"
            style={{ color: 'var(--color-chalk-dim)' }}
          >
            Call Stack
          </span>
        </div>

        {/* Stack frames */}
        <div className="p-2 min-h-[32px] flex flex-col-reverse gap-1">
          <AnimatePresence mode="popLayout">
            {isEmpty && (
              <motion.div
                key="empty"
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                className="text-[10px] text-[var(--color-chalk-faint)] font-mono text-center py-1"
              >
                (empty)
              </motion.div>
            )}
            {frames.map((frame) => (
              <motion.div
                key={frame.id}
                layoutId={`frame-${frame.id}`}
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, x: -10 }}
                transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
                className="px-2 py-1 rounded text-[10px] font-mono font-bold truncate"
                style={{
                  backgroundColor: `${frame.color}12`,
                  border: `1px solid ${frame.color}30`,
                  color: frame.color,
                }}
              >
                {frame.label}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
