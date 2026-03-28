'use client'

import { forwardRef } from 'react'
import { TRACK_D, VIEWBOX } from '@/lib/trackPath'

interface TrackProps {
  className?: string
}

export const Track = forwardRef<SVGPathElement, TrackProps>(
  function Track({ className }, ref) {
    return (
      <svg
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        className={className}
        style={{ width: '100%', height: '100%' }}
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
            <rect x="5" width="5" height="5" fill="#333" />
            <rect y="5" width="5" height="5" fill="#333" />
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
          opacity={0.04}
          filter="url(#neon-glow)"
        />
      </svg>
    )
  },
)
