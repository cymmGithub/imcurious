'use client'

import { CIRCLE, STATION_POSITIONS } from '@/lib/circlePath'

interface CircleTrackProps {
  cursorPosition: number
  isExecuting: boolean
  dotVisibilities?: { microtask: number; task: number; render: number }
}

export function CircleTrack({ cursorPosition, isExecuting, dotVisibilities }: CircleTrackProps) {
  const angle = cursorPosition * 2 * Math.PI
  const cx = CIRCLE.cx + CIRCLE.r * Math.sin(angle)
  const cy = CIRCLE.cy - CIRCLE.r * Math.cos(angle)

  return (
    <>
      {/* Main circle */}
      <circle
        cx={CIRCLE.cx}
        cy={CIRCLE.cy}
        r={CIRCLE.r}
        fill="none"
        stroke="var(--color-chalk-faint)"
        strokeWidth={2}
      />

      {/* Anchor dots on the circle */}
      {(Object.keys(STATION_POSITIONS) as Array<keyof typeof STATION_POSITIONS>).map((key) => {
        const station = STATION_POSITIONS[key]
        const vis = dotVisibilities ? dotVisibilities[key] : 1
        return (
          <circle
            key={station.label}
            cx={station.anchor.x}
            cy={station.anchor.y}
            r={3}
            fill={station.color}
            opacity={0.4 * vis}
          />
        )
      })}

      {/* Cursor */}
      <rect
        x={cx - 7}
        y={cy - 7}
        width={14}
        height={14}
        rx={3}
        fill="var(--color-chalk)"
        opacity={0.9}
        style={{
          filter: isExecuting
            ? 'drop-shadow(0 0 6px rgba(232, 228, 220, 0.5))'
            : 'none',
        }}
      />
      {/* Cursor glow ring */}
      <rect
        x={cx - 11}
        y={cy - 11}
        width={22}
        height={22}
        rx={5}
        fill="none"
        stroke="var(--color-chalk)"
        strokeWidth={0.5}
        opacity={isExecuting ? 0.3 : 0.1}
      />
    </>
  )
}
