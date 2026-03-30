import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, JetBrains_Mono, Caveat } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-sketch',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'imcurious.how',
  description: 'Interactive explorations of how things work',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${jetbrains.variable} ${caveat.variable}`}>
      <body className="bg-black text-[var(--color-chalk)] antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded focus:bg-[var(--color-chalk)] focus:text-black focus:font-body focus:text-sm"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
