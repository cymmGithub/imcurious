'use client'

import { useEffect, useState } from 'react'
import { useEventLoopStore } from '@/stores/eventLoopStore'
import { SCENARIOS } from '@/lib/scenarios'

interface RunCodeProps {
  scenarioId: string
}

export function RunCode({ scenarioId }: RunCodeProps) {
  const activeScenarioId = useEventLoopStore((s) => s.activeScenarioId)
  const cursorState = useEventLoopStore((s) => s.cursorState)
  const syncFrameIndex = useEventLoopStore((s) => s.syncFrameIndex)
  const syncFrameOps = useEventLoopStore((s) => s.syncFrameOps)
  const activeLine = useEventLoopStore((s) => s.activeLine)
  const runScenario = useEventLoopStore((s) => s.runScenario)
  const stepForward = useEventLoopStore((s) => s.stepForward)
  const stepBack = useEventLoopStore((s) => s.stepBack)
  const scenario = SCENARIOS[scenarioId]
  const [highlightedLines, setHighlightedLines] = useState<string[]>([])

  useEffect(() => {
    if (!scenario) return
    let cancelled = false
    import('shiki').then(({ codeToHtml }) =>
      codeToHtml(scenario.code, { lang: 'javascript', theme: 'vitesse-dark' })
    ).then((html) => {
      if (cancelled) return
      // Extract inner content from <pre><code>...</code></pre>
      const codeMatch = html.match(/<code[^>]*>([\s\S]*)<\/code>/)
      if (!codeMatch) return
      // Split by line spans — shiki wraps each line in <span class="line">
      const lineHtmls = codeMatch[1]
        .split(/<span class="line">/)
        .filter(Boolean)
        .map((l) => l.replace(/<\/span>$/, ''))
      setHighlightedLines(lineHtmls)
    })
    return () => { cancelled = true }
  }, [scenario])

  if (!scenario) return null

  const isActive = activeScenarioId === scenarioId
  const isStepping = isActive && cursorState === 'STEPPING_SYNC'
  const isLastStep = isStepping && syncFrameIndex >= syncFrameOps.length - 1
  const currentActiveLine = isActive ? activeLine : null
  const lines = scenario.code.split('\n')

  return (
    <div
      className="rounded-lg overflow-hidden my-8"
      style={{ border: '1px solid var(--color-chalk-faint)' }}
    >
      {/* Code block with line highlighting */}
      <pre
        className="p-4 text-sm overflow-x-auto font-mono"
        style={{ background: 'var(--color-surface-card)' }}
      >
        <code className="font-mono">
          {lines.map((line, i) => (
            <div
              key={i}
              className="transition-colors duration-200"
              style={{
                ...(currentActiveLine !== null && i !== currentActiveLine
                  ? { opacity: 0.3 }
                  : {}),
                backgroundColor: i === currentActiveLine ? 'rgba(232, 228, 220, 0.08)' : 'transparent',
                marginLeft: i === currentActiveLine ? '-1rem' : '0',
                paddingLeft: i === currentActiveLine ? 'calc(1rem - 2px)' : '0',
                borderLeft: i === currentActiveLine ? '2px solid var(--color-chalk)' : '2px solid transparent',
                marginRight: i === currentActiveLine ? '-1rem' : '0',
                paddingRight: i === currentActiveLine ? '1rem' : '0',
              }}
            >
              {highlightedLines[i]
                ? <span dangerouslySetInnerHTML={{ __html: highlightedLines[i] }} />
                : (line || '\u00A0')}
            </div>
          ))}
        </code>
      </pre>

      {/* Action bar */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          background: 'var(--color-surface-card)',
          borderTop: '1px solid var(--color-chalk-faint)',
        }}
      >
        <span
          className="text-[10px] font-mono uppercase tracking-[0.1em]"
          style={{ color: 'var(--color-chalk-faint)' }}
        >
          interactive
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={isStepping ? stepBack : undefined}
            disabled={!isStepping || syncFrameIndex === 0}
            className="font-mono text-xs px-2 py-1 rounded"
            style={{
              color: 'var(--color-chalk)',
              background: 'var(--color-surface-card)',
              border: '1px solid var(--color-chalk-faint)',
              opacity: !isStepping || syncFrameIndex === 0 ? 0.3 : 1,
              cursor: !isStepping || syncFrameIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ←
          </button>
          <span
            className="font-mono text-[10px]"
            style={{ color: 'var(--color-chalk-dim)' }}
          >
            {isStepping
              ? `${syncFrameIndex + 1} / ${syncFrameOps.length}`
              : '· · ·'}
          </span>
          <button
            onClick={() => isStepping ? stepForward() : runScenario(scenarioId)}
            className="font-mono text-xs px-2 py-1 rounded"
            style={{
              color: '#000',
              background: 'var(--color-chalk)',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label={isStepping ? (isLastStep ? 'Finish scenario' : 'Next step') : `Start ${scenarioId} scenario`}
          >
            {isLastStep ? '→ finish' : '→'}
          </button>
        </div>
      </div>
    </div>
  )
}
