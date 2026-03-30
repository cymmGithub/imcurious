interface ArticleSidebarProps {
  category: string
  date: string
  pageNumber?: string
}

export function ArticleSidebar({ category, date, pageNumber = '01' }: ArticleSidebarProps) {
  return (
    <>
    {/* Mobile metadata bar */}
    <aside className="lg:hidden flex items-center justify-center gap-4 py-3 px-4 text-[var(--color-chalk-dim)] select-none border-t border-[var(--color-chalk-faint)]">
      <span className="font-display text-xs tracking-wider">{category}</span>
      <span className="w-px h-3 bg-[var(--color-chalk-faint)]" aria-hidden="true" />
      <span className="font-mono text-[10px] tracking-wider">{date}</span>
    </aside>

    {/* Desktop vertical sidebar */}
    <aside className="hidden lg:flex flex-col items-center justify-between sticky top-0 h-screen py-8 w-14 select-none">
      {/* Page number */}
      <span
        className="font-display text-2xl font-bold text-[var(--color-chalk-faint)]"
      >
        {pageNumber}
      </span>

      {/* Rotated metadata */}
      <div
        className="flex items-center gap-6 text-[var(--color-chalk-dim)]"
        style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
        }}
      >
        <span className="font-display text-sm tracking-wider">{category}</span>
        <span
          className="w-px h-8 bg-[var(--color-chalk-faint)]"
          aria-hidden="true"
        />
        <span className="font-mono text-xs tracking-wider">{date}</span>
      </div>

      {/* Bottom spacer for visual balance */}
      <div className="w-6 border-t border-[var(--color-chalk-faint)]" />
    </aside>
    </>
  )
}
