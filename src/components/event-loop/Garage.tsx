'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { PendingWebAPI } from '@/lib/simulation'
import { VIEWBOX } from '@/lib/trackPath'

interface GarageProps {
  pendingAPIs: PendingWebAPI[]
  position: { x: number; y: number }
  visibility: number
}

export function Garage({ pendingAPIs, position, visibility }: GarageProps) {
  const prefersReducedMotion = useReducedMotion()

  if (visibility <= 0) return null

  // Convert SVG coordinates to percentages for responsive positioning
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
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: visibility, scale: 0.8 + visibility * 0.2 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
      role="region"
      aria-label="Web APIs garage"
    >
      <div
        className="font-orbitron text-xs font-bold tracking-wider uppercase text-center mb-2"
        style={{
          color: 'var(--color-neon-cyan)',
          textShadow: '0 0 10px var(--color-neon-cyan)40',
        }}
      >
        Web APIs
      </div>

      <div
        className="relative rounded-lg border border-dashed p-2 min-w-[120px] min-h-[40px]"
        style={{
          borderColor: 'var(--color-neon-cyan)30',
          backgroundColor: 'var(--color-neon-cyan)08',
        }}
      >
        <div className="flex flex-col gap-1">
          <AnimatePresence mode="popLayout">
            {pendingAPIs.map((api) => (
              <motion.div
                key={api.id}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
                className="flex items-center gap-2 px-2 py-1 rounded text-xs font-space-mono"
                style={{
                  backgroundColor: `${api.color}15`,
                  border: `1px solid ${api.color}40`,
                  color: api.color,
                }}
              >
                <span className="font-bold">{api.label}</span>
                <span className="text-[10px] opacity-60">
                  {Math.max(0, Math.round(api.remainingDelay))}ms
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {pendingAPIs.length === 0 && (
            <span className="text-[10px] text-gray-400 text-center">idle</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
