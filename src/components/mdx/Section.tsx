'use client'

import { useRef } from 'react'

interface SectionProps {
  stage: number
  children: React.ReactNode
}

export function Section({ stage, children }: SectionProps) {
  const ref = useRef<HTMLElement>(null)

  return (
    <section
      ref={ref}
      data-stage={stage}
      className="min-h-[60vh] py-12"
    >
      {children}
    </section>
  )
}
