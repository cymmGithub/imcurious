import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import SketchTitle from '@/components/SketchTitle'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mb-4">
        <SketchTitle />
      </div>
      <Link
        href="/the-js-event-loop-works"
        className="text-[var(--color-chalk)] hover:text-white transition-colors font-body inline-flex items-center gap-1"
      >
        the <img src="/js-logo.png" alt="JavaScript" className="inline h-[1em] align-[-0.1em] rounded-[3px]" /> Event Loop Works <ArrowRight size={16} />
      </Link>
    </main>
  )
}
