// src/hooks/useAnimationLoop.ts
'use client'

import { useEffect, useRef } from 'react'
import { useEventLoopStore } from '@/stores/eventLoopStore'

export function useAnimationLoop() {
  const tick = useEventLoopStore((s) => s.tick)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    let rafId = 0

    function frame(timestamp: number) {
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp
      const dt = Math.min(timestamp - lastTimeRef.current, 50)
      lastTimeRef.current = timestamp
      tick(dt)
      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [tick])
}
