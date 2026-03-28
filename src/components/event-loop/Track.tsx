'use client'

import { forwardRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { TRACK_D, VIEWBOX } from '@/lib/trackPath'

interface TrackProps {
  className?: string
}

export const Track = forwardRef<SVGPathElement, TrackProps>(
  function Track({ className }, ref) {
    const prefersReducedMotion = useReducedMotion()

    return (
      <svg
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        className={className}
        style={{ width: '100%', height: '100%' }}
        role="img"
        aria-label="Figure-eight race track representing the JavaScript event loop with pit stops for microtask queue, task queue, and rendering"
      >
        <defs>
          {/* Neon glow filter */}
          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Checkered pattern for start/finish */}
          <pattern id="checker" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" fill="white" />
            <rect x="5" y="5" width="5" height="5" fill="white" />
            <rect x="5" width="5" height="5" fill="var(--color-surface-muted)" />
            <rect y="5" width="5" height="5" fill="var(--color-surface-muted)" />
          </pattern>

          {/* Kerb stripe pattern */}
          <pattern id="kerb" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="12" fill="#e63946" />
            <rect x="6" width="6" height="12" fill="white" />
          </pattern>
        </defs>

        {/* Track edge lines (slightly wider than surface) */}
        <path
          d={TRACK_D}
          fill="none"
          stroke="var(--color-track-line)"
          strokeWidth={62}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.5}
        />

        {/* Track surface — wide dark stroke */}
        <path
          d={TRACK_D}
          fill="none"
          stroke="var(--color-track-surface)"
          strokeWidth={60}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center dashed line */}
        <path
          d={TRACK_D}
          fill="none"
          stroke="var(--color-track-line)"
          strokeWidth={2}
          strokeDasharray="8 12"
          opacity={0.4}
        />

        {/* The actual path (invisible) for car to follow — this gets the ref */}
        <path
          ref={ref}
          d={TRACK_D}
          fill="none"
          stroke="transparent"
          strokeWidth={1}
        />

        {/* Track glow */}
        <path
          d={TRACK_D}
          fill="none"
          stroke="var(--color-neon-cyan)"
          strokeWidth={64}
          opacity={0.06}
          filter="url(#neon-glow)"
        />

        {/* Animated pulse on track edge */}
        {!prefersReducedMotion && (
          <>
            <path
              d={TRACK_D}
              fill="none"
              stroke="var(--color-neon-cyan)"
              strokeWidth={1}
              opacity={0.3}
            >
              <animate
                attributeName="opacity"
                values="0.1;0.3;0.1"
                dur="3s"
                repeatCount="indefinite"
              />
            </path>

            <path
              d={TRACK_D}
              fill="none"
              stroke="var(--color-neon-cyan)"
              strokeWidth={1}
              opacity={0.3}
            >
              <animate
                attributeName="opacity"
                values="0.1;0.3;0.1"
                dur="3s"
                repeatCount="indefinite"
                begin="1.5s"
              />
            </path>
          </>
        )}

        {/* Start/finish checkered line at center crossing */}
        <rect
          x={395}
          y={270}
          width={10}
          height={60}
          fill="url(#checker)"
          opacity={0.4}
        />
      </svg>
    )
  },
)
