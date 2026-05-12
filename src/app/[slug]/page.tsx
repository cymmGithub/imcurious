import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ArticleSidebar } from '@/components/mdx/ArticleSidebar'

const posts: Record<
	string,
	{
		loader: () => Promise<{ default: React.ComponentType }>
		meta: { category: string; date: string }
	}
> = {
	'the-js-event-loop-works': {
		loader: () => import('@/posts/the-js-event-loop-works.mdx'),
		meta: { category: 'JS Fundamentals', date: '30/03/26' },
	},
	'how-idempotency-saves-the-web': {
		loader: () => import('@/posts/how-idempotency-saves-the-web.mdx'),
		meta: { category: 'REST APIs', date: '12/05/26' },
	},
}

export function generateStaticParams() {
	return Object.keys(posts).map((slug) => ({ slug }))
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	if (slug === 'the-js-event-loop-works') {
		return {
			title: 'How the JS Event Loop Works? | imcurious.how',
			description:
				'An interactive guide to the JavaScript event loop. Watch tasks navigate queues, microtasks, and rendering.',
		}
	}
	if (slug === 'how-idempotency-saves-the-web') {
		return {
			title: 'How Idempotency Saves the Web? | imcurious.how',
			description:
				'An interactive guide to REST API idempotency. Watch retries, failures, and the contract that decides whether your API survives them.',
		}
	}
	return {}
}

export default async function PostPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const post = posts[slug]
	if (!post) notFound()

	const { default: Post } = await post.loader()

	return (
		<main className="lg:grid lg:grid-cols-[1fr_56px]">
			<nav aria-label="Page" className="contents">
				<Link
					href="/"
					className="fixed top-4 left-4 z-50 group flex items-center gap-1 text-[var(--color-chalk-faint)] hover:text-[var(--color-chalk)] transition-colors rounded-sm min-w-11 min-h-11 justify-center"
					aria-label="Back to home"
				>
					<ArrowLeft
						size={16}
						className="transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
					/>
					<span className="font-sketch text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
						home
					</span>
				</Link>
			</nav>
			<article id="main-content" className="mx-auto">
				<Post />
			</article>
			<ArticleSidebar category={post.meta.category} date={post.meta.date} />
		</main>
	)
}
