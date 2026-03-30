'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { PendingWebAPI } from '@/lib/simulation'
import { WEB_API_POSITION } from '@/lib/circlePath'

interface WebApiBoxProps {
  pendingAPIs: PendingWebAPI[]
  visibility: number
}

export function WebApiBox({ pendingAPIs, visibility }: WebApiBoxProps) {
  return (
    <foreignObject
      x={WEB_API_POSITION.x}
      y={WEB_API_POSITION.y}
      width={170}
      height={120}
      overflow="visible"
      style={{
        opacity: visibility,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div>
        <div
          className="font-mono text-[9px] rounded-md"
          style={{
            padding: '8px 12px',
            background: 'var(--color-surface-card)',
            border: '1px dashed var(--color-chalk-dim)',
            textAlign: 'center',
          }}
        >
          <div
            className="font-sketch text-[11px] font-bold tracking-[0.08em] uppercase"
            style={{ color: 'var(--color-chalk-dim)', marginBottom: '5px' }}
          >
            Web APIs
          </div>
          <AnimatePresence mode="popLayout">
            {pendingAPIs.length === 0 ? (
              <div style={{ color: 'var(--color-chalk-faint)' }}>idle</div>
            ) : (
              pendingAPIs.map((api) => (
                <motion.div
                  key={api.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="font-mono text-[9px] rounded-sm"
                  style={{
                    padding: '2px 6px',
                    marginTop: '3px',
                    background: 'rgba(160, 154, 142, 0.07)',
                    color: 'var(--color-chalk-dim)',
                    border: '1px solid rgba(160, 154, 142, 0.12)',
                  }}
                >
                  {api.type === 'setTimeout' ? (
                    <>⏱ {(api.remainingDelay / 1000).toFixed(1)}s</>
                  ) : api.type === 'rAF' ? (
                    <>🎨 rAF</>
                  ) : (
                    <>↗ fetching...</>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </foreignObject>
  )
}
