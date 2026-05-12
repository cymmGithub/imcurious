interface RedditQuoteProps {
	src: string
	alt: string
	author: string
	subreddit: string
	age?: string
	url?: string
	/** CSS width for the whole quote frame. Defaults to "100%". */
	width?: string
}

export function RedditQuote({
	src,
	alt,
	author,
	subreddit,
	age,
	url,
	width = '100%',
}: RedditQuoteProps) {
	const captionParts = [author, subreddit, age].filter(Boolean).join(' · ')

	return (
		<figure
			role="figure"
			aria-label={alt}
			className="my-8 mx-auto rounded-md overflow-hidden"
			style={{
				background: 'var(--color-surface-card)',
				border: '1px solid var(--color-chalk-faint)',
				width,
			}}
		>
			<div
				className="flex items-center justify-between px-4 py-2 text-[10px] tracking-wider uppercase font-mono"
				style={{
					color: 'var(--color-chalk-dim)',
					borderBottom: '1px solid var(--color-chalk-faint)',
				}}
			>
				<span>reddit</span>
			</div>

			<div className="px-3 py-3">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={src}
					alt={alt}
					className="block w-full h-auto rounded"
					loading="lazy"
				/>
			</div>

			<figcaption
				className="px-4 py-2 text-[11px] font-mono"
				style={{
					color: 'var(--color-chalk-dim)',
					borderTop: '1px solid var(--color-chalk-faint)',
				}}
			>
				source:{' '}
				{url ? (
					<a
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						className="underline"
						style={{ color: 'var(--color-chalk)' }}
					>
						{captionParts}
					</a>
				) : (
					<span style={{ color: 'var(--color-chalk)' }}>{captionParts}</span>
				)}
			</figcaption>
		</figure>
	)
}
