'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { TaskBlock } from './TaskBlock'
import type { Task } from '@/lib/simulation'

interface PitStopProps {
  label: string
  color: string
  tasks: Task[]
  currentTask: Task | null
  isActive: boolean
  position: { x: number; y: number }
  labelOffset: { x: number; y: number }
  visibility: number // 0–1 for progressive reveal
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
  if (visibility <= 0) return null

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: visibility, scale: 0.8 + visibility * 0.2, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Pit stop zone glow */}
      <div
        className="absolute rounded-xl"
        style={{
          background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
          width: 120,
          height: 80,
          transform: 'translate(-50%, -50%)',
          left: '50%',
          top: '50%',
        }}
      />

      {/* Label */}
      <div
        className="absolute font-orbitron text-xs font-bold tracking-wider uppercase whitespace-nowrap"
        style={{
          color: color,
          left: `calc(50% + ${labelOffset.x}px)`,
          top: `calc(50% + ${labelOffset.y}px)`,
          transform: 'translate(-50%, -50%)',
          textShadow: `0 0 10px ${color}80`,
        }}
      >
        {label}
      </div>

      {/* Task blocks */}
      <div className="flex gap-1 mt-6 justify-center min-h-[28px]">
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

      {/* Render sub-steps (only for render pit stop) */}
      {renderSubSteps && isActive && (
        <div className="flex gap-2 mt-2 justify-center">
          {RENDER_SUB_STEPS.map((step, i) => {
            const stepProgress = renderProgress ?? 0
            const isStepActive = stepProgress > i / RENDER_SUB_STEPS.length
            return (
              <span
                key={step}
                className="text-[10px] font-space-mono font-bold uppercase tracking-wide transition-all duration-300"
                style={{
                  color: isStepActive ? color : `${color}40`,
                  textShadow: isStepActive ? `0 0 8px ${color}` : 'none',
                }}
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
