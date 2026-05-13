import type { MDXComponents } from 'mdx/types'
import type { ComponentPropsWithoutRef } from 'react'
import { ScrollStage } from '@/components/event-loop/ScrollStage'
import { RunCode } from '@/components/event-loop/RunCode'
import { RestStage } from '@/components/idempotency/RestStage'
import { RetryStepList } from '@/components/idempotency/RetryStepList'
import { Section } from '@/components/mdx/Section'
import { Callout } from '@/components/mdx/Callout'
import { StepList } from '@/components/mdx/StepList'
import { StaticCode } from '@/components/mdx/StaticCode'
import { DemoCode } from '@/components/mdx/DemoCode'
import { Sources } from '@/components/mdx/Sources'
import { RedditQuote } from '@/components/mdx/RedditQuote'
import { ImagineTrigger } from '@/components/mdx/ImagineTrigger'
import { Footnote } from '@/components/mdx/Footnote'

export function useMDXComponents(components: MDXComponents): MDXComponents {
	return {
		ScrollStage,
		RunCode,
		RestStage,
		RetryStepList,
		Section,
		Callout,
		StepList,
		StaticCode,
		DemoCode,
		Sources,
		RedditQuote,
		ImagineTrigger,
		Footnote,
		h1: (props: ComponentPropsWithoutRef<'h1'>) => (
			<h1
				className="font-sketch text-4xl font-bold tracking-tight text-[var(--color-chalk)] mb-8"
				{...props}
			/>
		),
		h2: ({ children, ...rest }: ComponentPropsWithoutRef<'h2'>) => (
			<h2
				className="font-sketch text-2xl font-bold tracking-tight text-[var(--color-chalk)] mt-16 mb-6"
				{...rest}
			>
				<span className="heading-chalk-underline">{children}</span>
			</h2>
		),
		h3: (props: ComponentPropsWithoutRef<'h3'>) => (
			<h3
				className="font-sketch text-xl font-semibold tracking-tight text-[var(--color-chalk-dim)] mt-10 mb-4 italic"
				{...props}
			/>
		),
		p: (props: ComponentPropsWithoutRef<'p'>) => (
			<p
				className="text-[var(--color-chalk)] leading-[1.6] mb-6 text-[17px] font-body"
				{...props}
			/>
		),
		code: ({ className, ...rest }: ComponentPropsWithoutRef<'code'>) => {
			// Block code (inside <pre>) — rehype-pretty-code handles styling via data-theme
			if (className || (rest as Record<string, unknown>)['data-theme']) {
				return <code className={`${className ?? ''} font-mono`} {...rest} />
			}
			// Inline code
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
			<div
				className="rounded-lg overflow-hidden my-8"
				style={{ border: '1px solid var(--color-chalk-faint)' }}
			>
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
			<ul className="space-y-3 my-6 list-none pl-0" {...props} />
		),
		ol: (props: ComponentPropsWithoutRef<'ol'>) => (
			<ol className="space-y-3 my-6 list-none pl-0" {...props} />
		),
		li: ({ children, ...rest }: ComponentPropsWithoutRef<'li'>) => (
			<li
				className="flex items-start gap-3 text-[var(--color-chalk)] text-[17px] leading-[1.6]"
				{...rest}
			>
				<span
					className="mt-[10px] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--color-chalk-dim)]"
					aria-hidden="true"
				/>
				<span>{children}</span>
			</li>
		),
		...components,
	}
}
