interface CalloutProps {
  children: React.ReactNode
}

export function Callout({ children }: CalloutProps) {
  return (
    <div
      className="relative rounded-lg overflow-hidden my-8"
      style={{
        background:
          'linear-gradient(135deg, rgba(0, 245, 255, 0.04), rgba(255, 0, 110, 0.04))',
        border: '1px solid rgba(0, 245, 255, 0.15)',
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          opacity: 0.03,
        }}
      />
      <div className="p-5 relative">
        <div
          className="font-orbitron text-[10px] font-bold tracking-[0.2em] uppercase mb-3 flex items-center gap-2"
          style={{ color: 'var(--color-neon-pink)' }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--color-neon-pink)' }}
          />
          Pit Wall Radio
        </div>
        <div className="text-gray-200 text-sm leading-relaxed italic font-space-mono">
          {children}
        </div>
      </div>
    </div>
  )
}
