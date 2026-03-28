import type { MDXComponents } from 'mdx/types'
import type { ComponentPropsWithoutRef } from 'react'
import { ScrollStage } from '@/components/event-loop/ScrollStage'
import { Section } from '@/components/mdx/Section'
import { Callout } from '@/components/mdx/Callout'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ScrollStage,
    Section,
    Callout,
    h1: (props: ComponentPropsWithoutRef<'h1'>) => (
      <h1 className="font-orbitron text-4xl font-bold tracking-tight text-white mb-8" {...props} />
    ),
    h2: (props: ComponentPropsWithoutRef<'h2'>) => (
      <h2 className="font-orbitron text-2xl font-bold tracking-tight text-white mt-16 mb-6" {...props} />
    ),
    h3: (props: ComponentPropsWithoutRef<'h3'>) => (
      <h3 className="font-orbitron text-xl font-semibold text-gray-200 mt-10 mb-4" {...props} />
    ),
    p: (props: ComponentPropsWithoutRef<'p'>) => (
      <p className="text-gray-200 leading-[1.85] mb-6 text-[15px]" {...props} />
    ),
    code: ({ className, ...rest }: ComponentPropsWithoutRef<'code'>) => {
      // Code inside <pre> blocks gets a language-* className from MDX — render plain
      if (className) {
        return <code className={`${className} font-space-mono text-gray-300`} {...rest} />
      }
      // Inline code gets the styled treatment
      return (
        <code
          className="bg-gray-800 text-[var(--color-neon-cyan)] px-1.5 py-0.5 rounded text-sm font-space-mono"
          style={{
            borderLeft: '2px solid rgba(0, 245, 255, 0.3)',
          }}
          {...rest}
        />
      )
    },
    pre: ({ children, ...rest }: ComponentPropsWithoutRef<'pre'>) => (
      <div className="rounded-lg overflow-hidden my-8" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
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
          <span className="text-[11px] text-gray-500 font-space-mono ml-2">js</span>
        </div>
        <div className="relative">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)',
              opacity: 0.02,
            }}
          />
          <pre
            className="p-4 text-sm overflow-x-auto relative font-space-mono"
            style={{ background: 'rgba(10, 10, 26, 0.8)' }}
          >
            {children}
          </pre>
        </div>
      </div>
    ),
    strong: (props: ComponentPropsWithoutRef<'strong'>) => (
      <strong className="text-white font-bold" {...props} />
    ),
    ul: (props: ComponentPropsWithoutRef<'ul'>) => (
      <ul className="space-y-3 my-6 list-none pl-0" {...props} />
    ),
    ol: (props: ComponentPropsWithoutRef<'ol'>) => (
      <ol className="space-y-3 my-6 list-none pl-0" {...props} />
    ),
    li: ({ children, ...rest }: ComponentPropsWithoutRef<'li'>) => {
      const colors = ['var(--color-neon-yellow)', 'var(--color-neon-green)', 'var(--color-neon-pink)']
      const text = typeof children === 'string' ? children : ''
      const colorIndex = Math.abs(text.length) % colors.length
      const color = colors[colorIndex]
      return (
        <li className="flex items-start gap-3 text-gray-200 text-[15px] leading-[1.85]" {...rest}>
          <span
            className="mt-[9px] flex-shrink-0 w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`,
            }}
            aria-hidden="true"
          />
          <span>{children}</span>
        </li>
      )
    },
    ...components,
  }
}
