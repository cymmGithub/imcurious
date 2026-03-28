'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────
// Shared sample content (same text, different styling)
// ─────────────────────────────────────────────

const SAMPLE_CODE = `setTimeout(() => console.log("Task"), 0);
Promise.resolve().then(() => console.log("Microtask"));
console.log("Sync");
// Output: "Sync", "Microtask", "Task"`

const SAMPLE_HEADING = 'The Microtask Queue'
const SAMPLE_BODY =
  'Now here is the plot twist. There is not just one pit lane. There are two. And one of them has VIP access.'
const SAMPLE_CALLOUT =
  'Microtasks run whenever the JavaScript stack empties. Not just between tasks — after every task, after every callback, after every event handler.'
const SAMPLE_LIST = [
  'Task queue — setTimeout, clicks, network callbacks. One per lap.',
  'Microtask queue — Promise .then(), async/await. Drained completely.',
  'Rendering — requestAnimationFrame, style, layout, paint.',
]

// ─────────────────────────────────────────────
// APPROACH 1: Atmospheric Depth
// ─────────────────────────────────────────────

function Approach1() {
  return (
    <div className="space-y-8">
      {/* Section divider */}
      <div className="relative h-px">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--color-neon-cyan), var(--color-neon-pink), transparent)',
            opacity: 0.6,
          }}
        />
        <div
          className="absolute inset-0 blur-sm"
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--color-neon-cyan), var(--color-neon-pink), transparent)',
            opacity: 0.4,
          }}
        />
      </div>

      {/* Heading with glow */}
      <h2
        className="font-orbitron text-2xl font-bold tracking-tight"
        style={{
          color: 'white',
          textShadow: '0 0 30px rgba(0, 245, 255, 0.15)',
        }}
      >
        {SAMPLE_HEADING}
      </h2>

      {/* Body text with better rhythm */}
      <p className="text-gray-300 leading-relaxed text-[15px] max-w-[52ch]">
        {SAMPLE_BODY}
      </p>

      {/* Pit Wall Radio callout */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, rgba(0, 245, 255, 0.04), rgba(255, 0, 110, 0.04))',
          border: '1px solid rgba(0, 245, 255, 0.15)',
        }}
      >
        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          }}
        />
        <div className="p-4 relative">
          <div
            className="font-orbitron text-[10px] font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2"
            style={{ color: 'var(--color-neon-pink)' }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--color-neon-pink)' }}
            />
            Pit Wall Radio
          </div>
          <p
            className="text-gray-200 text-sm leading-relaxed italic"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            &ldquo;{SAMPLE_CALLOUT}&rdquo;
          </p>
        </div>
      </div>

      {/* Code block with header */}
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div
          className="flex items-center gap-2 px-4 py-2"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[11px] text-gray-500 font-space-mono ml-2">
            example.js
          </span>
        </div>
        <div className="relative">
          {/* Scanline effect */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)',
            }}
          />
          <pre
            className="p-4 text-sm overflow-x-auto relative"
            style={{ background: 'rgba(10, 10, 26, 0.8)' }}
          >
            <code className="font-space-mono">
              <span style={{ color: 'var(--color-neon-yellow)' }}>setTimeout</span>
              <span style={{ color: 'var(--color-neon-cyan)' }}>{'(() => '}</span>
              <span style={{ color: 'var(--color-neon-green)' }}>console</span>
              <span className="text-gray-300">.log(</span>
              <span style={{ color: 'var(--color-neon-pink)' }}>&quot;Task&quot;</span>
              <span className="text-gray-300">), </span>
              <span style={{ color: 'var(--color-neon-yellow)' }}>0</span>
              <span className="text-gray-300">);</span>
              {'\n'}
              <span style={{ color: 'var(--color-neon-green)' }}>Promise</span>
              <span className="text-gray-300">.resolve().then(</span>
              <span style={{ color: 'var(--color-neon-cyan)' }}>{'() => '}</span>
              <span style={{ color: 'var(--color-neon-green)' }}>console</span>
              <span className="text-gray-300">.log(</span>
              <span style={{ color: 'var(--color-neon-pink)' }}>&quot;Microtask&quot;</span>
              <span className="text-gray-300">));</span>
              {'\n'}
              <span style={{ color: 'var(--color-neon-green)' }}>console</span>
              <span className="text-gray-300">.log(</span>
              <span style={{ color: 'var(--color-neon-pink)' }}>&quot;Sync&quot;</span>
              <span className="text-gray-300">);</span>
              {'\n'}
              <span className="text-gray-600">{'// Output: "Sync", "Microtask", "Task"'}</span>
            </code>
          </pre>
        </div>
      </div>

      {/* List with neon markers */}
      <ul className="space-y-3">
        {SAMPLE_LIST.map((item, i) => {
          const colors = [
            'var(--color-neon-yellow)',
            'var(--color-neon-green)',
            'var(--color-neon-pink)',
          ]
          return (
            <li key={i} className="flex items-start gap-3 text-gray-300 text-sm leading-relaxed">
              <span
                className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: colors[i],
                  boxShadow: `0 0 8px ${colors[i]}`,
                }}
              />
              {item}
            </li>
          )
        })}
      </ul>

      {/* Mini track mockup — car with trail */}
      <div className="mt-8">
        <p className="font-orbitron text-xs text-gray-500 tracking-wider uppercase mb-3">
          Visualization Preview
        </p>
        <div
          className="relative rounded-xl overflow-hidden p-8"
          style={{
            background: 'rgba(10, 10, 26, 0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <svg viewBox="0 0 400 120" className="w-full">
            {/* Track segment */}
            <path
              d="M 40 60 C 100 20, 180 20, 200 60 C 220 100, 300 100, 360 60"
              fill="none"
              stroke="#1a1a2e"
              strokeWidth="32"
              strokeLinecap="round"
            />
            <path
              d="M 40 60 C 100 20, 180 20, 200 60 C 220 100, 300 100, 360 60"
              fill="none"
              stroke="#4a4a6a"
              strokeWidth="34"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Center dashed */}
            <path
              d="M 40 60 C 100 20, 180 20, 200 60 C 220 100, 300 100, 360 60"
              fill="none"
              stroke="#4a4a6a"
              strokeWidth="1"
              strokeDasharray="6 8"
              opacity="0.4"
            />
            {/* Exhaust trail */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <circle
                key={i}
                cx={280 - i * 18}
                cy={78 - i * 2 + Math.sin(i * 0.8) * 6}
                r={2.5 - i * 0.25}
                fill="var(--color-neon-cyan)"
                opacity={0.6 - i * 0.07}
              >
                <animate
                  attributeName="opacity"
                  values={`${0.6 - i * 0.07};${0.3 - i * 0.03};${0.6 - i * 0.07}`}
                  dur="1.5s"
                  repeatCount="indefinite"
                  begin={`${i * 0.1}s`}
                />
              </circle>
            ))}
            {/* Car */}
            <g transform="translate(290, 72) rotate(-15)">
              <rect x="-12" y="-4" width="24" height="8" rx="2" fill="var(--color-neon-cyan)" />
              <polygon points="12,-2 16,0 12,2" fill="var(--color-neon-cyan)" />
              <rect x="-14" y="-6" width="3" height="12" rx="1" fill="var(--color-neon-cyan)" opacity="0.8" />
              {/* Glow */}
              <rect
                x="-12" y="-4" width="24" height="8" rx="2"
                fill="none" stroke="white" strokeWidth="1.5" opacity="0.4"
              />
            </g>
            {/* Pit stop glow — microtask */}
            <circle cx="200" cy="42" r="20" fill="var(--color-neon-green)" opacity="0.08" />
            <circle cx="200" cy="42" r="10" fill="var(--color-neon-green)" opacity="0.12">
              <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.12;0.06;0.12" dur="2s" repeatCount="indefinite" />
            </circle>
            <text
              x="200" y="38"
              textAnchor="middle"
              className="font-orbitron"
              fontSize="5"
              fontWeight="bold"
              fill="var(--color-neon-green)"
              letterSpacing="0.1em"
            >
              MICROTASK
            </text>
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// APPROACH 2: Typography First
// ─────────────────────────────────────────────

function Approach2() {
  return (
    <div className="space-y-8">
      {/* Section divider — subtle */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="font-orbitron text-[9px] tracking-[0.3em] text-gray-600 uppercase">
          Section 05
        </span>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Drop cap heading */}
      <div>
        <h2
          className="font-orbitron text-3xl font-bold tracking-tight text-white"
        >
          {SAMPLE_HEADING}
        </h2>
        <div
          className="mt-2 w-16 h-0.5"
          style={{ background: 'var(--color-neon-green)' }}
        />
      </div>

      {/* Body with drop cap */}
      <p className="text-gray-300 leading-[1.8] text-[15px] max-w-[56ch]">
        <span
          className="float-left font-orbitron text-5xl font-bold mr-3 mt-1 leading-none"
          style={{
            color: 'var(--color-neon-cyan)',
            textShadow: '0 0 20px rgba(0, 245, 255, 0.3)',
          }}
        >
          N
        </span>
        ow here is the plot twist. There is not just one pit lane. There are{' '}
        <strong className="text-white font-bold">two</strong>. And one of them
        has VIP access.
      </p>

      {/* Pull quote */}
      <blockquote
        className="relative py-6 px-8 my-8"
        style={{
          borderLeft: '2px solid var(--color-neon-pink)',
        }}
      >
        <div
          className="absolute -top-3 left-6 font-orbitron text-4xl leading-none"
          style={{ color: 'var(--color-neon-pink)', opacity: 0.3 }}
        >
          &ldquo;
        </div>
        <p className="text-gray-200 text-base leading-relaxed italic">
          {SAMPLE_CALLOUT}
        </p>
        <cite className="block mt-3 text-xs text-gray-500 font-space-mono not-italic">
          — Jake Archibald
        </cite>
      </blockquote>

      {/* Code block — clean, minimal */}
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between px-4 py-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <span className="text-[10px] text-gray-500 font-space-mono tracking-wider uppercase">
            JavaScript
          </span>
          <button className="text-[10px] text-gray-600 hover:text-gray-400 font-space-mono transition-colors">
            Copy
          </button>
        </div>
        <pre className="p-4 text-sm overflow-x-auto" style={{ background: 'rgba(10, 10, 26, 0.5)' }}>
          <code className="font-space-mono text-gray-300">
            {SAMPLE_CODE}
          </code>
        </pre>
      </div>

      {/* List — typographic emphasis */}
      <ul className="space-y-4 ml-1">
        {SAMPLE_LIST.map((item, i) => (
          <li key={i} className="flex items-start gap-4 text-gray-300 text-sm leading-relaxed">
            <span className="font-orbitron text-[11px] font-bold mt-0.5 flex-shrink-0 w-5 text-right" style={{ color: 'var(--color-neon-cyan)', opacity: 0.5 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            {item}
          </li>
        ))}
      </ul>

      {/* Viz preview — minimal */}
      <div className="mt-8">
        <p className="font-orbitron text-xs text-gray-500 tracking-wider uppercase mb-3">
          Visualization Preview
        </p>
        <div
          className="relative rounded-xl overflow-hidden p-8"
          style={{
            background: 'rgba(10, 10, 26, 0.4)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <svg viewBox="0 0 400 120" className="w-full">
            <path
              d="M 40 60 C 100 20, 180 20, 200 60 C 220 100, 300 100, 360 60"
              fill="none"
              stroke="#1a1a2e"
              strokeWidth="32"
              strokeLinecap="round"
            />
            <path
              d="M 40 60 C 100 20, 180 20, 200 60 C 220 100, 300 100, 360 60"
              fill="none"
              stroke="#4a4a6a"
              strokeWidth="34"
              strokeLinecap="round"
              opacity="0.3"
            />
            <path
              d="M 40 60 C 100 20, 180 20, 200 60 C 220 100, 300 100, 360 60"
              fill="none"
              stroke="#4a4a6a"
              strokeWidth="1"
              strokeDasharray="6 8"
              opacity="0.4"
            />
            {/* Simple active pit glow */}
            <circle cx="200" cy="42" r="14" fill="var(--color-neon-green)" opacity="0.06">
              <animate attributeName="r" values="12;16;12" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <text
              x="200" y="39"
              textAnchor="middle"
              fontSize="5"
              fontWeight="bold"
              fill="var(--color-neon-green)"
              letterSpacing="0.08em"
              className="font-orbitron"
            >
              MICROTASK
            </text>
            {/* Car — no trail */}
            <g transform="translate(290, 72) rotate(-15)">
              <rect x="-12" y="-4" width="24" height="8" rx="2" fill="var(--color-neon-cyan)" />
              <polygon points="12,-2 16,0 12,2" fill="var(--color-neon-cyan)" />
              <rect x="-14" y="-6" width="3" height="12" rx="1" fill="var(--color-neon-cyan)" opacity="0.8" />
            </g>
          </svg>
          <p className="text-center text-[10px] text-gray-600 mt-2 font-space-mono">
            Minimal changes — active glow on pit stops only
          </p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// APPROACH 3: Visualization Showcase
// ─────────────────────────────────────────────

function Approach3() {
  return (
    <div className="space-y-8">
      {/* Heading — basic */}
      <h2 className="font-orbitron text-2xl font-bold tracking-tight text-white">
        {SAMPLE_HEADING}
      </h2>

      {/* Body — minimal styling */}
      <p className="text-gray-300 leading-relaxed text-sm">
        {SAMPLE_BODY}
      </p>

      {/* Simple callout */}
      <div className="rounded-md p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-gray-300 text-sm leading-relaxed italic">
          &ldquo;{SAMPLE_CALLOUT}&rdquo;
        </p>
      </div>

      {/* Basic code block */}
      <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto text-sm">
        <code className="font-space-mono text-gray-300">{SAMPLE_CODE}</code>
      </pre>

      {/* Basic list */}
      <ul className="space-y-2 text-gray-300 text-sm list-disc list-inside">
        {SAMPLE_LIST.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      {/* Viz preview — THE STAR */}
      <div className="mt-8">
        <p className="font-orbitron text-xs text-gray-500 tracking-wider uppercase mb-3">
          Visualization Preview
        </p>
        <div
          className="relative rounded-xl overflow-hidden p-6"
          style={{
            background: 'linear-gradient(180deg, rgba(10, 10, 26, 0.8) 0%, rgba(26, 26, 46, 0.4) 100%)',
            border: '1px solid rgba(0, 245, 255, 0.08)',
            boxShadow: '0 0 60px rgba(0, 245, 255, 0.03)',
          }}
        >
          <svg viewBox="0 0 400 160" className="w-full">
            {/* Track glow underneath */}
            <path
              d="M 40 80 C 100 30, 180 30, 200 80 C 220 130, 300 130, 360 80"
              fill="none"
              stroke="var(--color-neon-cyan)"
              strokeWidth="50"
              opacity="0.03"
            />
            {/* Track edge */}
            <path
              d="M 40 80 C 100 30, 180 30, 200 80 C 220 130, 300 130, 360 80"
              fill="none"
              stroke="#4a4a6a"
              strokeWidth="36"
              strokeLinecap="round"
              opacity="0.4"
            />
            {/* Track surface with texture */}
            <path
              d="M 40 80 C 100 30, 180 30, 200 80 C 220 130, 300 130, 360 80"
              fill="none"
              stroke="#1a1a2e"
              strokeWidth="34"
              strokeLinecap="round"
            />
            {/* Center line */}
            <path
              d="M 40 80 C 100 30, 180 30, 200 80 C 220 130, 300 130, 360 80"
              fill="none"
              stroke="#4a4a6a"
              strokeWidth="1"
              strokeDasharray="6 8"
              opacity="0.4"
            />
            {/* Neon edge glow */}
            <path
              d="M 40 80 C 100 30, 180 30, 200 80 C 220 130, 300 130, 360 80"
              fill="none"
              stroke="var(--color-neon-cyan)"
              strokeWidth="1"
              opacity="0.3"
            >
              <animate
                attributeName="opacity"
                values="0.15;0.35;0.15"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>

            {/* Exhaust trail — particles */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <circle
                key={i}
                cx={272 - i * 15}
                cy={100 - i * 2.5 + Math.sin(i * 0.7) * 8}
                r={3 - i * 0.22}
                fill="var(--color-neon-cyan)"
                opacity={0.7 - i * 0.06}
              >
                <animate
                  attributeName="opacity"
                  values={`${0.7 - i * 0.06};${0.2 - i * 0.01};${0.7 - i * 0.06}`}
                  dur="1.2s"
                  repeatCount="indefinite"
                  begin={`${i * 0.08}s`}
                />
              </circle>
            ))}

            {/* Speed lines */}
            {[0, 1, 2].map((i) => (
              <line
                key={i}
                x1={250 - i * 22}
                y1={92 - i * 3 + Math.sin(i) * 3}
                x2={260 - i * 22}
                y2={91 - i * 3 + Math.sin(i) * 3}
                stroke="var(--color-neon-cyan)"
                strokeWidth="0.8"
                opacity={0.3 - i * 0.08}
              />
            ))}

            {/* Car with richer detail */}
            <g transform="translate(282, 93) rotate(-20)">
              {/* Shadow underneath */}
              <ellipse cx="0" cy="6" rx="14" ry="3" fill="rgba(0,0,0,0.3)" />
              {/* Body */}
              <rect x="-12" y="-4" width="24" height="8" rx="2" fill="var(--color-neon-cyan)" />
              <polygon points="12,-2 16,0 12,2" fill="var(--color-neon-cyan)" />
              <rect x="-14" y="-6" width="3" height="12" rx="1" fill="var(--color-neon-cyan)" opacity="0.8" />
              {/* Wheels */}
              <rect x="-6" y="-6" width="4" height="3" rx="1" fill="#444" />
              <rect x="-6" y="3" width="4" height="3" rx="1" fill="#444" />
              <rect x="6" y="-6" width="4" height="3" rx="1" fill="#444" />
              <rect x="6" y="3" width="4" height="3" rx="1" fill="#444" />
              {/* Glow */}
              <rect
                x="-14" y="-6" width="30" height="12" rx="3"
                fill="none" stroke="var(--color-neon-cyan)" strokeWidth="1" opacity="0.3"
              >
                <animate
                  attributeName="opacity"
                  values="0.2;0.5;0.2"
                  dur="0.8s"
                  repeatCount="indefinite"
                />
              </rect>
            </g>

            {/* Active pit stop — beacon ring effect */}
            <circle cx="200" cy="55" r="22" fill="none" stroke="var(--color-neon-green)" strokeWidth="1" opacity="0.15">
              <animate attributeName="r" values="18;28;18" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="55" r="14" fill="none" stroke="var(--color-neon-green)" strokeWidth="1" opacity="0.2">
              <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="opacity" values="0.25;0;0.25" dur="2s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            <circle cx="200" cy="55" r="8" fill="var(--color-neon-green)" opacity="0.1" />
            <text
              x="200" y="52"
              textAnchor="middle"
              fontSize="5"
              fontWeight="bold"
              fill="var(--color-neon-green)"
              letterSpacing="0.1em"
              className="font-orbitron"
            >
              MICROTASK
            </text>

            {/* Telemetry HUD overlay */}
            <g opacity="0.7">
              {/* Speed readout */}
              <text x="20" y="18" fontSize="4" fill="var(--color-neon-cyan)" className="font-space-mono" opacity="0.6">
                SPD
              </text>
              <text x="20" y="26" fontSize="7" fontWeight="bold" fill="var(--color-neon-cyan)" className="font-orbitron">
                142
              </text>
              <text x="46" y="26" fontSize="4" fill="var(--color-neon-cyan)" opacity="0.4" className="font-space-mono">
                u/s
              </text>

              {/* State readout */}
              <text x="340" y="18" fontSize="4" fill="var(--color-neon-green)" className="font-space-mono" opacity="0.6" textAnchor="end">
                STATE
              </text>
              <text x="340" y="26" fontSize="6" fontWeight="bold" fill="var(--color-neon-green)" className="font-orbitron" textAnchor="end">
                DRIVING
              </text>

              {/* Queue counts */}
              <text x="20" y="150" fontSize="4" fill="var(--color-neon-yellow)" className="font-space-mono" opacity="0.5">
                TASK Q: 2
              </text>
              <text x="120" y="150" fontSize="4" fill="var(--color-neon-green)" className="font-space-mono" opacity="0.5">
                MICRO Q: 0
              </text>
              <text x="250" y="150" fontSize="4" fill="var(--color-neon-pink)" className="font-space-mono" opacity="0.5">
                RENDER: IDLE
              </text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Sampler Page
// ─────────────────────────────────────────────

const approaches = [
  {
    id: 'atmospheric',
    label: '1. Atmospheric Depth',
    tagline: 'Rich atmosphere across article + visualization',
    component: Approach1,
    accent: 'var(--color-neon-cyan)',
  },
  {
    id: 'typography',
    label: '2. Typography First',
    tagline: 'World-class reading experience, lighter viz changes',
    component: Approach2,
    accent: 'var(--color-neon-pink)',
  },
  {
    id: 'showcase',
    label: '3. Viz Showcase',
    tagline: 'Interactive track is the star, basic article styling',
    component: Approach3,
    accent: 'var(--color-neon-green)',
  },
]

export default function SamplerPage() {
  const [active, setActive] = useState(0)

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800/50 px-6 py-8">
        <h1 className="font-orbitron text-xl font-bold tracking-tight text-white mb-2">
          Design Sampler
        </h1>
        <p className="text-gray-500 text-sm font-space-mono">
          Compare the same content styled three different ways. Pick the direction that feels right.
        </p>
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800/30">
        <div className="flex">
          {approaches.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setActive(i)}
              className="flex-1 px-4 py-4 text-left transition-all relative"
              style={{
                borderBottom: active === i ? `2px solid ${a.accent}` : '2px solid transparent',
              }}
            >
              <span
                className="font-orbitron text-xs font-bold tracking-wide block"
                style={{
                  color: active === i ? a.accent : 'rgba(255,255,255,0.3)',
                }}
              >
                {a.label}
              </span>
              <span className="text-[11px] text-gray-600 font-space-mono block mt-0.5">
                {a.tagline}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {approaches.map((a, i) => (
          <div key={a.id} className={active === i ? 'block' : 'hidden'}>
            <a.component />
          </div>
        ))}
      </div>
    </main>
  )
}
