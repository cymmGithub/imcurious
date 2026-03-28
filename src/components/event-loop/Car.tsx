'use client'

import { useRef, useEffect } from 'react'

interface CarProps {
  pathRef: React.RefObject<SVGPathElement | null>
  position: number // 0–1 along the path
  isExecuting: boolean
}

export function Car({ pathRef, position, isExecuting }: CarProps) {
  const carRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const path = pathRef.current
    const car = carRef.current
    if (!path || !car) return

    const totalLength = path.getTotalLength()
    const point = path.getPointAtLength(position * totalLength)

    // Get next point for rotation
    const epsilon = 0.001
    const nextPos = Math.min(position + epsilon, 0.999)
    const nextPoint = path.getPointAtLength(nextPos * totalLength)
    const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x)
    const degrees = (angle * 180) / Math.PI

    // Convert SVG coords to screen coords
    const svg = path.ownerSVGElement
    if (!svg) return

    const svgRect = svg.getBoundingClientRect()
    const viewBox = svg.viewBox.baseVal

    const scaleX = svgRect.width / viewBox.width
    const scaleY = svgRect.height / viewBox.height

    const screenX = point.x * scaleX
    const screenY = point.y * scaleY

    car.style.transform = `translate(${screenX}px, ${screenY}px) rotate(${degrees}deg)`
  }, [pathRef, position])

  return (
    <div
      ref={carRef}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ willChange: 'transform' }}
    >
      {/* F1 car shape */}
      <svg
        width="32"
        height="16"
        viewBox="0 0 32 16"
        className="block -translate-x-1/2 -translate-y-1/2"
      >
        {/* Car body */}
        <rect x="4" y="4" width="24" height="8" rx="2" fill="var(--color-neon-cyan)" />
        {/* Nose */}
        <polygon points="28,6 32,8 28,10" fill="var(--color-neon-cyan)" />
        {/* Rear wing */}
        <rect x="2" y="2" width="3" height="12" rx="1" fill="var(--color-neon-cyan)" opacity="0.8" />
        {/* Wheels */}
        <rect x="8" y="2" width="4" height="3" rx="1" fill="#333" />
        <rect x="8" y="11" width="4" height="3" rx="1" fill="#333" />
        <rect x="22" y="2" width="4" height="3" rx="1" fill="#333" />
        <rect x="22" y="11" width="4" height="3" rx="1" fill="#333" />

        {/* Glow effect when executing */}
        {isExecuting && (
          <rect
            x="4" y="4" width="24" height="8" rx="2"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.6"
          >
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="0.5s"
              repeatCount="indefinite"
            />
          </rect>
        )}
      </svg>
    </div>
  )
}
