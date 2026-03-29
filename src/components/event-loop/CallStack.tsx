'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { CursorState, Task } from '@/lib/simulation'
import { CIRCLE } from '@/lib/circlePath'

interface CallStackProps {
  cursorState: CursorState
  currentTask: Task | null
  callStackFrames: string[]
  visibility: number
}

export function CallStack({
  cursorState,
  currentTask,
  callStackFrames,
  visibility,
}: CallStackProps) {
  let frames: string[] = []
  if (cursorState === 'EXECUTING_SYNC') {
    frames = callStackFrames
  } else if (
    cursorState === 'EXECUTING_TASK' ||
    cursorState === 'EXECUTING_MICROTASK'
  ) {
    frames = currentTask ? ['global()', currentTask.label] : ['global()']
  } else if (cursorState === 'RENDERING') {
    frames = ['requestAnimationFrame()']
  }

  return (
    <foreignObject
      x={CIRCLE.cx - 80}
      y={CIRCLE.cy - 50}
      width={160}
      height={120}
      overflow="visible"
      style={{
        opacity: 0.3 + visibility * 0.7,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        style={{ textAlign: 'center' }}
      >
        <div
          className="font-display text-[9px] font-bold tracking-[0.15em] uppercase"
          style={{ color: 'var(--color-chalk)', marginBottom: '6px' }}
        >
          Call Stack
        </div>
        <div
          className="font-mono text-[9px] rounded-md"
          style={{
            padding: '6px 10px',
            margin: '0 auto',
            width: 'fit-content',
            minWidth: '80px',
            minHeight: '24px',
            background: 'var(--color-surface-card)',
            border: `1px ${frames.length > 0 ? 'solid' : 'dashed'} rgba(232, 228, 220, 0.2)`,
          }}
          role="list"
          aria-label="Call stack frames"
        >
          <AnimatePresence mode="popLayout">
            {frames.length === 0 ? (
              <div style={{ color: 'var(--color-chalk-faint)', fontSize: '8px' }}>
                (empty)
              </div>
            ) : (
              [...frames].reverse().map((frame, i) => (
                <motion.div
                  key={`${frame}-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  style={{
                    padding: '2px 6px',
                    marginTop: i > 0 ? '3px' : 0,
                    borderRadius: '3px',
                    background: 'rgba(232, 228, 220, 0.07)',
                    color: 'var(--color-chalk)',
                    border: '1px solid rgba(232, 228, 220, 0.12)',
                  }}
                >
                  {frame}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </foreignObject>
  )
}
