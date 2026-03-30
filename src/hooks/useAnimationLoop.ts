// src/hooks/useAnimationLoop.ts
'use client'

import { useEffect, useRef } from 'react'
import { useEventLoopStore } from '@/stores/eventLoopStore'

export function useAnimationLoop() {
  const tick = useEventLoopStore((s) => s.tick)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    let rafId = 0
    let visible = !document.hidden

    function frame(timestamp: number) {
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp
      const dt = Math.min(timestamp - lastTimeRef.current, 50)
      lastTimeRef.current = timestamp
      tick(dt)
      rafId = requestAnimationFrame(frame)
    }

    function start() {
      if (!visible) return
      lastTimeRef.current = 0
      rafId = requestAnimationFrame(frame)
    }

    function stop() {
      cancelAnimationFrame(rafId)
      rafId = 0
    }

    function onVisibilityChange() {
      visible = !document.hidden
      if (visible) start()
      else stop()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    start()

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [tick])
}
