import { notFound } from 'next/navigation'
import { MDXProvider } from '@/components/mdx/MDXProvider'

const posts: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  'the-event-loop-works': () => import('@/posts/the-event-loop-works.mdx'),
}

export function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (slug === 'the-event-loop-works') {
    return {
      title: 'How the Event Loop Works | imcurious.how',
      description:
        'An interactive, F1-themed guide to the JavaScript event loop. Watch a race car navigate task queues, microtasks, and rendering.',
    }
  }
  return {}
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const loader = posts[slug]
  if (!loader) notFound()

  const { default: Post } = await loader()

  return (
    <article className="mx-auto">
      <MDXProvider>
        <Post />
      </MDXProvider>
    </article>
  )
}
