'use client'

import { useEventLoop } from '@/contexts/EventLoopContext'
import { SCENARIOS } from '@/lib/scenarios'

interface RunCodeProps {
  scenarioId: string
}

export function RunCode({ scenarioId }: RunCodeProps) {
  const { state, runScenario, stepForward, stepBack } = useEventLoop()
  const scenario = SCENARIOS[scenarioId]

  if (!scenario) return null

  const isActive = state.activeScenarioId === scenarioId
  const isStepping = isActive && state.cursorState === 'STEPPING_SYNC'
  const isLastStep = isStepping && state.syncFrameIndex >= state.syncFrameOps.length - 1
  const activeLine = isActive ? state.activeLine : null
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
                color: activeLine !== null
                  ? (i === activeLine ? 'var(--color-chalk)' : 'var(--color-chalk-faint)')
                  : 'var(--color-chalk)',
                backgroundColor: i === activeLine ? 'rgba(232, 228, 220, 0.08)' : 'transparent',
                marginLeft: i === activeLine ? '-1rem' : '0',
                paddingLeft: i === activeLine ? 'calc(1rem - 2px)' : '0',
                borderLeft: i === activeLine ? '2px solid var(--color-chalk)' : '2px solid transparent',
                marginRight: i === activeLine ? '-1rem' : '0',
                paddingRight: i === activeLine ? '1rem' : '0',
              }}
            >
              {line || '\u00A0'}
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
            disabled={!isStepping || state.syncFrameIndex === 0}
            className="font-mono text-xs px-2 py-1 rounded"
            style={{
              color: 'var(--color-chalk)',
              background: 'var(--color-surface-card)',
              border: '1px solid var(--color-chalk-faint)',
              opacity: !isStepping || state.syncFrameIndex === 0 ? 0.3 : 1,
              cursor: !isStepping || state.syncFrameIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ←
          </button>
          <span
            className="font-mono text-[10px]"
            style={{ color: 'var(--color-chalk-dim)' }}
          >
            {isStepping
              ? `${state.syncFrameIndex + 1} / ${state.syncFrameOps.length}`
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
