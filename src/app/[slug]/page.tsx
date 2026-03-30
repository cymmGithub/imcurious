import { notFound } from 'next/navigation'
import { MDXProvider } from '@/components/mdx/MDXProvider'
import { ArticleSidebar } from '@/components/mdx/ArticleSidebar'

const posts: Record<string, { loader: () => Promise<{ default: React.ComponentType }>, meta: { category: string, date: string } }> = {
  'the-js-event-loop-works': {
    loader: () => import('@/posts/the-js-event-loop-works.mdx'),
    meta: { category: 'JS Fundamentals', date: '30/03/26' },
  },
}

export function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (slug === 'the-js-event-loop-works') {
    return {
      title: 'How the JS Event Loop Works? | imcurious.how',
      description:
        'An interactive guide to the JavaScript event loop. Watch tasks navigate queues, microtasks, and rendering.',
    }
  }
  return {}
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = posts[slug]
  if (!post) notFound()

  const { default: Post } = await post.loader()

  return (
    <main className="lg:grid lg:grid-cols-[1fr_56px]">
      <article className="mx-auto">
        <MDXProvider>
          <Post />
        </MDXProvider>
      </article>
      <ArticleSidebar
        category={post.meta.category}
        date={post.meta.date}
      />
    </main>
  )
}
