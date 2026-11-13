import type { Metadata } from 'next'
import { WifiOff } from 'lucide-react'

export const metadata: Metadata = { title: 'Offline' }

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-full border border-line">
        <WifiOff className="size-6 text-mute" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">You’re offline</h1>
      <p className="mt-2 max-w-sm text-mute">Check your internet connection. Pages you visited recently are still available.</p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full reload is needed to retry while offline */}
      <a href="/" className="mt-8 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-semibold text-paper">Try again</a>
    </main>
  )
}
