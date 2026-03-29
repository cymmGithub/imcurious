'use client'

import { useRef, useEffect, useCallback, type RefObject } from 'react'
import { useReducedMotion } from 'framer-motion'

interface CarProps {
  pathRef: RefObject<SVGPathElement | null>
  position: number
  isExecuting: boolean
  cursorHistory: RefObject<number[]>
}

export function Car({ pathRef, position, isExecuting, cursorHistory }: CarProps) {
  const carRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)
  const layoutCache = useRef<{ scaleX: number; scaleY: number; totalLength: number } | null>(null)
  const readyRef = useRef(false)
  const prefersReducedMotion = useReducedMotion()

  const updateLayout = useCallback(() => {
    const p = pathRef.current
    if (!p) return
    const svg = p.ownerSVGElement
    if (!svg) return
    const svgRect = svg.getBoundingClientRect()
    const viewBox = svg.viewBox.baseVal
    if (viewBox.width === 0 || viewBox.height === 0) return
    layoutCache.current = {
      scaleX: svgRect.width / viewBox.width,
      scaleY: svgRect.height / viewBox.height,
      totalLength: p.getTotalLength(),
    }
  }, [pathRef])

  // Watch for SVG resize
  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    updateLayout()

    const observer = new ResizeObserver(updateLayout)
    const svg = path.ownerSVGElement
    if (svg) observer.observe(svg)

    return () => observer.disconnect()
  }, [pathRef, updateLayout])

  // Position the car — runs every frame via position prop changes
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
    const degrees = (angle * 180) / Math.PI + 180 // +180 because PNG points left

    const screenX = point.x * cache.scaleX
    const screenY = point.y * cache.scaleY

    car.style.transform = `translate(${screenX}px, ${screenY}px) rotate(${degrees}deg)`

    // Show car once we have a valid position
    if (!readyRef.current) {
      readyRef.current = true
      car.style.opacity = '1'
    }

    // Update trail positions
    const trail = trailRef.current
    const history = cursorHistory.current
    if (trail && history.length > 0) {
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
        const opacity = 0.4 - i * 0.04
        const scale = 1 - i * 0.08
        dot.style.transform = `translate(${sx}px, ${sy}px) scale(${scale})`
        dot.style.opacity = String(Math.max(0, opacity))
      }
    }
  }, [pathRef, position, cursorHistory])

  return (
    <>
      {/* Trail dots */}
      {!prefersReducedMotion && (
        <div ref={trailRef} className="absolute top-0 left-0 pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-[4px] h-[4px] rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{
                backgroundColor: 'var(--color-chalk-dim)',
                willChange: 'transform, opacity',
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Car — hidden until first valid position */}
      <div
        ref={carRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ willChange: 'transform', opacity: 0 }}
      >
        <img
          src="/f1-car.png"
          alt="F1 car on track"
          className="block -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 40,
            height: 'auto',
            filter: isExecuting && !prefersReducedMotion
              ? 'drop-shadow(0 0 4px rgba(255,255,255,0.6))'
              : 'none',
            transition: 'filter 0.2s',
          }}
          draggable={false}
        />
      </div>
    </>
  )
}
