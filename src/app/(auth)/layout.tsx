import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/store/Logo'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="container-x flex h-20 items-center justify-between">
        <Logo className="text-lg" />
        <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to shop
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-md animate-fade-up">{children}</div>
      </main>
    </div>
  )
}
