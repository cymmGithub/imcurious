import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="font-orbitron text-4xl font-bold mb-4">imcurious.how</h1>
      <p className="text-gray-400 mb-8">Interactive explorations of how things work.</p>
      <Link
        href="/the-event-loop-works"
        className="text-[var(--color-neon-cyan)] hover:underline"
      >
        How the Event Loop Works →
      </Link>
    </main>
  )
}
