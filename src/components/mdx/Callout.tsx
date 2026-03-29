interface CalloutProps {
  children: React.ReactNode
}

export function Callout({ children }: CalloutProps) {
  return (
    <div
      className="relative my-8 rounded-sm pl-5 py-4 pr-4"
      style={{
        borderLeft: '2px solid var(--color-chalk-faint)',
        background: 'var(--color-surface-card)',
      }}
    >
      <div className="text-[var(--color-chalk-dim)] text-sm leading-relaxed italic font-body">
        {children}
      </div>
    </div>
  )
}
