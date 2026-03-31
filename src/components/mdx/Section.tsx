'use client'

import { motion } from 'framer-motion'

interface SectionProps {
	stage: number
	children: React.ReactNode
}

export function Section({ stage, children }: SectionProps) {
	return (
		<section data-stage={stage} className="min-h-[60vh] py-12">
			{stage > 1 && (
				<div
					className="mb-12"
					style={{
						borderTop: '1px dashed var(--color-chalk-faint)',
					}}
				/>
			)}

			<motion.div
				initial={{ opacity: 0, y: 12 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true, amount: 0.1 }}
				transition={{ duration: 0.5, ease: 'easeOut' }}
			>
				{children}
			</motion.div>
		</section>
	)
}
