'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { Task } from '@/lib/simulation'

interface StationProps {
  label: string
  color: string
  tasks: Task[]
  currentTask: Task | null
  isActive: boolean
  visibility: number
  foreignObjectX: number
  foreignObjectY: number
  foreignObjectWidth: number
  foreignObjectHeight: number
  align?: 'left' | 'center' | 'right'
  renderSubSteps?: boolean
  renderProgress?: number
}

const RENDER_STEPS = ['rAF', 'Style', 'Layout', 'Paint']

export function Station({
  label,
  color,
  tasks,
  currentTask,
  isActive,
  visibility,
  foreignObjectX,
  foreignObjectY,
  foreignObjectWidth,
  foreignObjectHeight,
  align = 'left',
  renderSubSteps,
  renderProgress = 0,
}: StationProps) {
  const allTasks = currentTask ? [currentTask, ...tasks] : tasks
  const activeStep = renderSubSteps ? Math.floor(renderProgress * RENDER_STEPS.length) : -1

  return (
    <foreignObject
      x={foreignObjectX}
      y={foreignObjectY}
      width={foreignObjectWidth}
      height={foreignObjectHeight}
      overflow="visible"
      style={{
        opacity: 0.3 + visibility * 0.7,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        style={{ textAlign: align }}
      >
        <div
          className="font-mono text-[10px] font-bold tracking-wider uppercase inline-block"
          style={{
            padding: '5px 14px',
            borderRadius: '20px',
            background: `${color}0d`,
            border: `1px ${isActive ? 'solid' : 'dashed'} ${color}4d`,
            color,
            marginBottom: '6px',
          }}
        >
          {label}
        </div>

        {(allTasks.length > 0 || renderSubSteps) && (
          <div
            className="font-mono text-[9px] rounded-md"
            style={{
              padding: '6px 10px',
              background: 'var(--color-surface-card)',
              border: `1px solid ${color}33`,
              width: 'fit-content',
              ...(align === 'right' ? { marginLeft: 'auto' } : {}),
              ...(align === 'center' ? { margin: '0 auto' } : {}),
            }}
          >
            <AnimatePresence mode="popLayout">
              {renderSubSteps
                ? RENDER_STEPS.map((step, i) => (
                    <div
                      key={step}
                      className="font-mono text-[9px] rounded-sm"
                      style={{
                        padding: '2px 6px',
                        marginTop: i > 0 ? '3px' : 0,
                        background: `${color}12`,
                        color,
                        border: `1px solid ${color}1f`,
                        opacity: i <= activeStep ? 1 : 0.4,
                      }}
                    >
                      {step}
                    </div>
                  ))
                : allTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="font-mono text-[9px] rounded-sm"
                      style={{
                        padding: '2px 6px',
                        marginTop: '3px',
                        background: `${color}12`,
                        color,
                        border: `1px solid ${color}1f`,
                      }}
                    >
                      {task.label}
                    </motion.div>
                  ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </foreignObject>
  )
}
