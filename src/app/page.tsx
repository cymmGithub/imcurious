import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import SketchTitle from '@/components/SketchTitle'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,transparent_0%,rgba(0,0,0,0.85)_100%)]">
      <div className="mb-4">
        <SketchTitle />
      </div>
      <div className="flex flex-col items-center">
        <Link
          href="/the-js-event-loop-works"
          className="group text-[var(--color-chalk)] hover:text-white transition-colors font-body inline-flex items-center gap-1.5"
        >
          <span className="relative">
            <span className="relative">
              the <img src="/js-logo.png" alt="JavaScript" className="inline h-[1em] align-[-0.1em] rounded-[3px]" /> Event Loop Works?
            </span>
            <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-white/60 transition-all duration-300 ease-out group-hover:w-full" />
          </span>
          <ArrowRight size={16} className="opacity-60 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-1 group-hover:opacity-100" />
        </Link>
        <span className="mt-3 font-sketch text-[0.8rem] text-[var(--color-chalk-faint)] tracking-wider select-none">
          01 / ...
        </span>
      </div>
    </main>
  )
}
