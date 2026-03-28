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
        role="img"
        aria-label="Figure-eight track representing the JavaScript event loop with stops for microtask queue, task queue, and rendering"
      >
        <defs>
          {/* Checkered pattern for start/finish */}
          <pattern id="checker" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" fill="var(--color-chalk-dim)" />
            <rect x="5" y="5" width="5" height="5" fill="var(--color-chalk-dim)" />
            <rect x="5" width="5" height="5" fill="var(--color-surface-card)" />
            <rect y="5" width="5" height="5" fill="var(--color-surface-card)" />
          </pattern>
        </defs>

        {/* Track edge lines */}
        <path
          d={TRACK_D}
          fill="none"
          stroke="var(--color-chalk-faint)"
          strokeWidth={62}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.3}
        />

        {/* Track surface — wide dark stroke */}
        <path
          d={TRACK_D}
          fill="none"
          stroke="var(--color-surface-card)"
          strokeWidth={60}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center dashed line */}
        <path
          d={TRACK_D}
          fill="none"
          stroke="var(--color-chalk-faint)"
          strokeWidth={1}
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

        {/* Subtle edge highlight */}
        <path
          d={TRACK_D}
          fill="none"
          stroke="var(--color-chalk-faint)"
          strokeWidth={1}
          opacity={0.15}
        />

        {/* Start/finish checkered line at center crossing */}
        <rect
          x={395}
          y={270}
          width={10}
          height={60}
          fill="url(#checker)"
          opacity={0.3}
        />
      </svg>
    )
  },
)
