'use client'

import { useRef, useEffect, type RefObject } from 'react'
import { useReducedMotion } from 'framer-motion'

interface CarProps {
  pathRef: RefObject<SVGPathElement | null>
  position: number
  isExecuting: boolean
  positionHistory: RefObject<number[]>
}

export function Car({ pathRef, position, isExecuting, positionHistory }: CarProps) {
  const carRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)
  const layoutCache = useRef<{ scaleX: number; scaleY: number; totalLength: number } | null>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    function updateCache() {
      const p = pathRef.current
      if (!p) return
      const svg = p.ownerSVGElement
      if (!svg) return
      const svgRect = svg.getBoundingClientRect()
      const viewBox = svg.viewBox.baseVal
      layoutCache.current = {
        scaleX: svgRect.width / viewBox.width,
        scaleY: svgRect.height / viewBox.height,
        totalLength: p.getTotalLength(),
      }
    }

    updateCache()

    const observer = new ResizeObserver(updateCache)
    const svg = path.ownerSVGElement
    if (svg) observer.observe(svg)

    return () => observer.disconnect()
  }, [pathRef])

  useEffect(() => {
    const path = pathRef.current
    const car = carRef.current
    const cache = layoutCache.current
    if (!path || !car || !cache) return

    const point = path.getPointAtLength(position * cache.totalLength)

    const epsilon = 0.001
    const nextPos = Math.min(position + epsilon, 0.999)
    const nextPoint = path.getPointAtLength(nextPos * cache.totalLength)
    const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x)
    const degrees = (angle * 180) / Math.PI

    const screenX = point.x * cache.scaleX
    const screenY = point.y * cache.scaleY

    car.style.transform = `translate(${screenX}px, ${screenY}px) rotate(${degrees}deg)`

    // Update trail positions
    const trail = trailRef.current
    const history = positionHistory.current
    if (trail && cache && history.length > 0) {
      const dots = trail.children
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i] as HTMLElement
        const historyIndex = history.length - 1 - i
        if (historyIndex < 0) {
          dot.style.opacity = '0'
          continue
        }
        const pos = history[historyIndex]
        const pt = path.getPointAtLength(pos * cache.totalLength)
        const sx = pt.x * cache.scaleX
        const sy = pt.y * cache.scaleY
        const opacity = 0.5 - i * 0.05
        const scale = 1 - i * 0.08
        dot.style.transform = `translate(${sx}px, ${sy}px) scale(${scale})`
        dot.style.opacity = String(Math.max(0, opacity))
      }
    }
  }, [pathRef, position, positionHistory])

  return (
    <>
      {/* Exhaust trail */}
      {!prefersReducedMotion && (
        <div ref={trailRef} className="absolute top-0 left-0 pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-[5px] h-[5px] rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{
                backgroundColor: 'var(--color-neon-cyan)',
                boxShadow: '0 0 4px var(--color-neon-cyan)',
                willChange: 'transform, opacity',
                opacity: 0,
                ['--trail-opacity' as string]: `${0.5 - i * 0.05}`,
                animation: 'trail-pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Car */}
      <div
        ref={carRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ willChange: 'transform' }}
      >
        <svg
          width="32"
          height="16"
          viewBox="0 0 32 16"
          className="block -translate-x-1/2 -translate-y-1/2"
          role="img"
          aria-label="F1 car on track"
        >
          {/* Shadow */}
          <ellipse cx="16" cy="14" rx="14" ry="3" fill="rgba(0,0,0,0.25)" />

          {/* Car body */}
          <rect x="4" y="4" width="24" height="8" rx="2" fill="var(--color-neon-cyan)" />
          {/* Nose */}
          <polygon points="28,6 32,8 28,10" fill="var(--color-neon-cyan)" />
          {/* Rear wing */}
          <rect x="2" y="2" width="3" height="12" rx="1" fill="var(--color-neon-cyan)" opacity="0.8" />
          {/* Wheels */}
          <rect x="8" y="2" width="4" height="3" rx="1" fill="var(--color-surface-muted)" />
          <rect x="8" y="11" width="4" height="3" rx="1" fill="var(--color-surface-muted)" />
          <rect x="22" y="2" width="4" height="3" rx="1" fill="var(--color-surface-muted)" />
          <rect x="22" y="11" width="4" height="3" rx="1" fill="var(--color-surface-muted)" />

          {/* Glow effect when executing */}
          {isExecuting && !prefersReducedMotion && (
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
    </>
  )
}
