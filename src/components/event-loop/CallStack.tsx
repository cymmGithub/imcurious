'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { PaintBucket } from 'lucide-react'
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
  if (cursorState === 'EXECUTING_SYNC' || cursorState === 'STEPPING_SYNC') {
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
      y={CIRCLE.cy - 80}
      width={160}
      height={180}
      overflow="visible"
      style={{
        opacity: visibility,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        style={{ textAlign: 'center' }}
      >
        <div
          className="font-sketch text-[11px] font-bold tracking-[0.08em] uppercase"
          style={{ color: 'var(--color-chalk)', marginBottom: '2px' }}
        >
          Call Stack{' '}
          <span
            className="font-mono text-[7px] tracking-wider uppercase"
            style={{ color: 'var(--color-chalk-faint)' }}
          >
            (LIFO)
          </span>
        </div>
        <div
          className="font-mono text-[9px] rounded-md"
          style={{
            padding: '6px 10px',
            margin: '0 auto',
            width: 'fit-content',
            minWidth: '120px',
            minHeight: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            background: 'var(--color-surface-card)',
            border: `1px ${frames.length > 0 ? 'solid' : 'dashed'} color-mix(in srgb, var(--color-chalk) 20%, transparent)`,
          }}
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
                    background: 'color-mix(in srgb, var(--color-chalk) 7%, transparent)',
                    color: 'var(--color-chalk)',
                    border: '1px solid color-mix(in srgb, var(--color-chalk) 12%, transparent)',
                  }}
                >
                  {frame.startsWith('rAF') ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><PaintBucket size={8} /> {frame}</span>
                  ) : frame}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </foreignObject>
  )
}
