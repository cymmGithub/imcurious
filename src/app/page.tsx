import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="font-display text-4xl font-bold mb-4 text-[var(--color-chalk)]">imcurious</h1>
      <Link
        href="/the-js-event-loop-works"
        className="text-[var(--color-chalk)] hover:text-white transition-colors font-body"
      >
        How the <img src="/js-logo.png" alt="JavaScript" className="inline h-[1em] align-[-0.1em] rounded-[3px]" /> Event Loop Works →
      </Link>
    </main>
  )
}
