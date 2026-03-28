'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { TaskBlock } from './TaskBlock'
import type { Task } from '@/lib/simulation'
import { VIEWBOX } from '@/lib/trackPath'

interface PitStopProps {
  label: string
  color: string
  tasks: Task[]
  currentTask: Task | null
  isActive: boolean
  position: { x: number; y: number }
  labelOffset: { x: number; y: number }
  visibility: number
  renderSubSteps?: boolean
  renderProgress?: number
}

const RENDER_SUB_STEPS = ['rAF', 'Style', 'Layout', 'Paint']

export function PitStop({
  label,
  color,
  tasks,
  currentTask,
  isActive,
  position,
  labelOffset,
  visibility,
  renderSubSteps,
  renderProgress,
}: PitStopProps) {
  const prefersReducedMotion = useReducedMotion()

  if (visibility <= 0) return null

  const leftPct = (position.x / VIEWBOX.width) * 100
  const topPct = (position.y / VIEWBOX.height) * 100

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: 'translate(-50%, -50%)',
      }}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: visibility, scale: 0.8 + visibility * 0.2, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
      role="region"
      aria-label={`${label} pit stop`}
    >
      {/* Pit stop zone */}
      <div
        className="absolute rounded-lg"
        style={{
          background: `${color}08`,
          border: `1px ${isActive ? 'solid' : 'dashed'} ${color}30`,
          width: 120,
          height: 80,
          transform: 'translate(-50%, -50%)',
          left: '50%',
          top: '50%',
        }}
      />

      {/* Label */}
      <div
        className="absolute font-display text-xs font-bold tracking-wider uppercase whitespace-nowrap"
        style={{
          color: color,
          left: `calc(50% + ${labelOffset.x}px)`,
          top: `calc(50% + ${labelOffset.y}px)`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {label}
      </div>

      {/* Task blocks */}
      <div className="flex gap-1 mt-6 justify-center min-h-[28px]" aria-label={`${tasks.length} tasks queued`}>
        <AnimatePresence mode="popLayout">
          {currentTask && isActive && (
            <TaskBlock
              key={`current-${currentTask.id}`}
              id={currentTask.id}
              label={currentTask.label}
              color={currentTask.color}
              isExecuting
            />
          )}
          {tasks.map((task) => (
            <TaskBlock
              key={task.id}
              id={task.id}
              label={task.label}
              color={task.color}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Render sub-steps */}
      {renderSubSteps && isActive && (
        <div className="flex gap-2 mt-2 justify-center" role="list" aria-label="Render pipeline steps">
          {RENDER_SUB_STEPS.map((step, i) => {
            const stepProgress = renderProgress ?? 0
            const isStepActive = stepProgress > i / RENDER_SUB_STEPS.length
            return (
              <span
                key={step}
                role="listitem"
                className="text-[10px] font-mono font-bold uppercase tracking-wide transition-all duration-300"
                style={{
                  color: isStepActive ? color : `${color}40`,
                }}
                aria-current={isStepActive ? 'step' : undefined}
              >
                {step}
              </span>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
