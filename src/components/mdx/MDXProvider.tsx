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
    <h1 className="font-orbitron text-4xl font-bold tracking-tight text-white mb-6" {...props} />
  ),
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="font-orbitron text-2xl font-bold tracking-tight text-white mt-16 mb-4" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="font-orbitron text-xl font-semibold text-gray-200 mt-8 mb-3" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="text-gray-300 leading-relaxed mb-4" {...props} />
  ),
  code: (props: ComponentPropsWithoutRef<'code'>) => (
    <code className="bg-gray-800 text-[var(--color-neon-cyan)] px-1.5 py-0.5 rounded text-sm font-space-mono" {...props} />
  ),
  pre: (props: ComponentPropsWithoutRef<'pre'>) => (
    <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto mb-6" {...props} />
  ),
  strong: (props: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="text-white font-bold" {...props} />
  ),
}

export function MDXProvider({ children }: { children: React.ReactNode }) {
  return <BaseMDXProvider components={components}>{children}</BaseMDXProvider>
}
