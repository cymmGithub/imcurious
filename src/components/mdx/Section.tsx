'use client'

import { motion } from 'framer-motion'

interface SectionProps {
  stage: number
  children: React.ReactNode
}

export function Section({ stage, children }: SectionProps) {
  return (
    <section
      data-stage={stage}
      className="min-h-[60vh] py-12"
    >
      {/* Gradient divider — skip for first section */}
      {stage > 1 && (
        <div className="relative h-px mb-12">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--color-neon-cyan), var(--color-neon-pink), transparent)',
              opacity: 0.6,
            }}
          />
          <div
            className="absolute inset-0 blur-sm"
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--color-neon-cyan), var(--color-neon-pink), transparent)',
              opacity: 0.4,
            }}
          />
        </div>
      )}

      {/* Fade-in on scroll */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </section>
  )
}
