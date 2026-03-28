import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="font-display text-4xl font-bold mb-4 text-[var(--color-chalk)]">imcurious.how</h1>
      <p className="text-[var(--color-chalk-dim)] mb-8 font-body">Interactive explorations of how things work.</p>
      <Link
        href="/the-event-loop-works"
        className="text-[var(--color-chalk)] underline underline-offset-4 decoration-[var(--color-chalk-faint)] hover:decoration-[var(--color-chalk)] transition-colors font-body"
      >
        How the Event Loop Works →
      </Link>
    </main>
  )
}
