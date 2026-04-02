'use client'

import { motion } from 'framer-motion'

interface Source {
	title: string
	url: string
	author: string
	type: string
}

interface SourcesProps {
	sources: Source[]
}

export function Sources({ sources }: SourcesProps) {
	return (
		<motion.footer
			initial={{ opacity: 0, y: 12 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.2 }}
			transition={{ duration: 0.5, ease: 'easeOut' }}
			className="py-12"
			role="doc-endnotes"
			aria-label="Sources"
		>
			<div
				className="mb-7 text-center text-lg tracking-[0.5em] opacity-40"
				style={{ color: 'var(--color-chalk-faint)' }}
				aria-hidden="true"
			>
				&mdash;&mdash;&mdash;
			</div>

			<div
				className="mb-5 font-sketch text-lg lowercase"
				style={{ color: 'var(--color-chalk-dim)' }}
			>
				Sources:
			</div>

			<ol className="list-none space-y-0 pl-0">
				{sources.map((source, i) => (
					<motion.li
						key={source.url}
						initial={{ opacity: 0, y: 8 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{
							duration: 0.4,
							ease: 'easeOut',
							delay: i * 0.1,
						}}
						className="group"
					>
						<a
							href={source.url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-start gap-[18px] py-3 no-underline"
							style={{
								color: 'inherit',
								borderTop: i > 0 ? '1px solid rgba(90, 85, 77, 0.18)' : 'none',
							}}
						>
							<span
								className="min-w-[24px] pt-0 font-sketch text-[22px] font-bold leading-none transition-colors duration-300"
								style={{ color: 'var(--color-chalk-faint)' }}
							>
								<span className="group-hover:text-[#ef4444] transition-colors duration-300">
									{i + 1}
								</span>
							</span>
							<div className="flex-1 pt-1">
								<div>
									<span
										className="font-sketch text-[17px] font-semibold leading-[1.3] underline decoration-wavy decoration-transparent underline-offset-4 transition-all duration-350 group-hover:decoration-[var(--color-chalk-faint)]"
										style={{
											color: 'var(--color-chalk)',
										}}
									>
										{source.title}
									</span>
								</div>
								<div
									className="mt-0.5 font-sketch text-[14px] opacity-70"
									style={{
										color: 'var(--color-chalk-dim)',
									}}
								>
									{source.author}{' '}
									<span
										className="font-mono text-[10px] uppercase tracking-wide"
										style={{
											color: 'var(--color-chalk-faint)',
										}}
									>
										&middot; {source.type}
									</span>
								</div>
							</div>
						</a>
					</motion.li>
				))}
			</ol>
		</motion.footer>
	)
}
