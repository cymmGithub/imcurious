import type { MDXComponents } from 'mdx/types'
import { ScrollStage } from '@/components/event-loop/ScrollStage'
import { Section } from '@/components/mdx/Section'
import { Callout } from '@/components/mdx/Callout'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ScrollStage,
    Section,
    Callout,
    ...components,
  }
}
