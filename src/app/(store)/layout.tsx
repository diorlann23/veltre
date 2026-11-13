import type { ReactNode } from 'react'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { BottomNav } from '@/components/store/BottomNav'
import { CartDrawer } from '@/components/store/CartDrawer'
import { Footer } from '@/components/store/Footer'
import { Header } from '@/components/store/Header'
import { listCategories } from '@/server/repos/categories'

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const categories = await listCategories()
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-50 rounded-lg bg-ink px-4 py-3 text-sm text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1 pt-[4.75rem] sm:pt-32" tabIndex={-1}>
        {children}
      </main>
      <Footer categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
      <BottomNav />
      <CartDrawer />
      <InstallPrompt />
    </div>
  )
}
