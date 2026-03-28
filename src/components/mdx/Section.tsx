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
      {children}
    </section>
  )
}
