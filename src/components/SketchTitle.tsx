'use client'

import { motion } from 'framer-motion'

const prefix = 'imcurious'
const tld = 'how'
const charDelay = 0.045
const tldStart = prefix.length * charDelay + 0.05
const dotStart = tldStart + tld.length * charDelay + 0.3

export default function SketchTitle() {
	return (
		<h1 className="font-sketch text-4xl font-bold text-[var(--color-chalk)]">
			{prefix.split('').map((char, i) => (
				<motion.span
					key={i}
					initial={{ opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.15, delay: i * charDelay, ease: 'easeOut' }}
					className="inline-block"
				>
					{char}
				</motion.span>
			))}

			<motion.span
				initial={{ opacity: 0, scale: 0 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{
					duration: 0.3,
					delay: dotStart,
					ease: [0.34, 1.56, 0.64, 1],
				}}
				className="inline-block text-red-400 origin-bottom relative top-0.75"
			>
				.
			</motion.span>

			{tld.split('').map((char, i) => (
				<motion.span
					key={`tld-${i}`}
					initial={{ opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						duration: 0.15,
						delay: tldStart + i * charDelay,
						ease: 'easeOut',
					}}
					className="inline-block relative top-0.75"
				>
					{char}
				</motion.span>
			))}
		</h1>
	)
}
