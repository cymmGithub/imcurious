'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface TaskBlockProps {
  id: string
  label: string
  color: string
  isExecuting?: boolean
}

const ICON_BY_TYPE: Record<string, string> = {
  setTimeout: '⏱',
  fetch: '↗',
}

export function TaskBlock({ id, label, color, isExecuting }: TaskBlockProps) {
  const prefersReducedMotion = useReducedMotion()
  // Derive icon from label text
  const icon = label.startsWith('setTimeout') ? ICON_BY_TYPE.setTimeout
    : label.startsWith('fetch') ? ICON_BY_TYPE.fetch
    : ''

  return (
    <motion.div
      layoutId={`task-${id}`}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: 1,
        boxShadow: isExecuting
          ? `0 0 20px ${color}, 0 0 40px ${color}40`
          : `0 0 8px ${color}60`,
      }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: -10 }}
      transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
      className="px-2 py-1 rounded text-xs font-space-mono font-bold whitespace-nowrap"
      style={{
        backgroundColor: `${color}20`,
        border: `1px solid ${color}`,
        color: color,
      }}
    >
      {icon && <span aria-hidden="true">{icon} </span>}{label}
    </motion.div>
  )
}
