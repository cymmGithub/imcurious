'use client'

import { motion } from 'framer-motion'

interface TaskBlockProps {
  id: string
  label: string
  color: string
  isExecuting?: boolean
}

export function TaskBlock({ id, label, color, isExecuting }: TaskBlockProps) {
  return (
    <motion.div
      layoutId={`task-${id}`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: 1,
        boxShadow: isExecuting
          ? `0 0 20px ${color}, 0 0 40px ${color}40`
          : `0 0 8px ${color}60`,
      }}
      exit={{ opacity: 0, scale: 0.5, y: -10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="px-2 py-1 rounded text-xs font-space-mono font-bold whitespace-nowrap"
      style={{
        backgroundColor: `${color}20`,
        border: `1px solid ${color}`,
        color: color,
      }}
    >
      {label}
    </motion.div>
  )
}
