'use client'

import { MDXProvider as BaseMDXProvider } from '@mdx-js/react'
import type { ComponentPropsWithoutRef } from 'react'
import { ScrollStage } from '@/components/event-loop/ScrollStage'
import { Section } from './Section'
import { Callout } from './Callout'

const components = {
  ScrollStage,
  Section,
  Callout,
  h1: (props: ComponentPropsWithoutRef<'h1'>) => (
    <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--color-chalk)] mb-6" {...props} />
  ),
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--color-chalk)] mt-16 mb-4" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="font-display text-xl font-semibold text-[var(--color-chalk-dim)] mt-8 mb-3 italic" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="text-[var(--color-chalk)] leading-relaxed mb-4 font-body" {...props} />
  ),
  code: ({ className, ...rest }: ComponentPropsWithoutRef<'code'>) => {
    if (className || (rest as Record<string, unknown>)['data-theme']) {
      return <code className={`${className ?? ''} font-mono`} {...rest} />
    }
    return (
      <code
        className="bg-[var(--color-surface-card)] text-[var(--color-chalk)] px-1.5 py-0.5 rounded text-sm font-mono"
        style={{
          borderLeft: '2px solid var(--color-chalk-faint)',
        }}
        {...rest}
      />
    )
  },
  pre: ({ children, ...rest }: ComponentPropsWithoutRef<'pre'>) => (
    <div className="rounded-lg overflow-hidden mb-6" style={{ border: '1px solid var(--color-chalk-faint)' }}>
      <pre
        className="p-4 text-sm overflow-x-auto font-mono"
        style={{ background: 'var(--color-surface-card)' }}
        {...rest}
      >
        {children}
      </pre>
    </div>
  ),
  strong: (props: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="text-[var(--color-chalk)] font-bold" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="space-y-3 mb-6 list-none pl-0" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="space-y-3 mb-6 list-none pl-0" {...props} />
  ),
  li: ({ children, ...rest }: ComponentPropsWithoutRef<'li'>) => (
    <li className="flex items-start gap-3 text-[var(--color-chalk)] text-sm leading-relaxed" {...rest}>
      <span
        className="mt-[7px] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--color-chalk-dim)]"
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
  ),
}

export function MDXProvider({ children }: { children: React.ReactNode }) {
  return <BaseMDXProvider components={components}>{children}</BaseMDXProvider>
}
