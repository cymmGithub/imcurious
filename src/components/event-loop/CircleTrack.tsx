'use client'

import { CIRCLE, STATION_POSITIONS } from '@/lib/circlePath'

interface CircleTrackProps {
  cursorPosition: number
  isExecuting: boolean
  hasHiddenWork?: boolean
  dotVisibilities?: { microtask: number; task: number; render: number }
}

export function CircleTrack({ cursorPosition, isExecuting, hasHiddenWork, dotVisibilities }: CircleTrackProps) {
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
            fill="var(--color-chalk)"
            opacity={0.4 * vis}
          />
        )
      })}

      {/* Heartbeat indicator — event loop working under the hood */}
      <g style={{
        opacity: hasHiddenWork ? 1 : 0,
        transition: 'opacity 1.5s ease',
        pointerEvents: 'none',
      }}>
        <g style={{
          animation: 'spin-slow 12s linear infinite',
          transformOrigin: `${CIRCLE.cx}px ${CIRCLE.cy}px`,
        }}>
          <circle
            cx={CIRCLE.cx}
            cy={CIRCLE.cy}
            r={CIRCLE.r}
            fill="none"
            stroke="var(--color-chalk-dim)"
            strokeWidth={1}
            strokeDasharray="8 12"
            style={{ animation: 'pulse-subtle 3s ease-in-out infinite' }}
          />
        </g>
        <text
          x={CIRCLE.cx}
          y={CIRCLE.cy + CIRCLE.r + 46}
          textAnchor="middle"
          fill="var(--color-chalk)"
          fontSize={12}
          fontFamily="var(--font-body)"
          style={{ animation: 'bounce-hint 2s ease-in-out infinite' }}
        >
          ↓ scroll down to see what it&apos;s working on
        </text>
      </g>

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
            ? 'drop-shadow(0 0 6px color-mix(in srgb, var(--color-chalk) 50%, transparent))'
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
