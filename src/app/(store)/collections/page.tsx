import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, LayoutGrid } from 'lucide-react'
import { EmptyState } from '@/components/ui/bits'
import { SmartImage } from '@/components/ui/SmartImage'
import { pluralize } from '@/lib/money'
import { listCategories } from '@/server/repos/categories'

export const metadata: Metadata = { title: 'Collections' }

export default async function CollectionsPage() {
  const categories = (await listCategories()).filter((c) => c.productCount > 0)
  return (
    <div className="container-x pt-8 lg:pt-14">
      <header className="max-w-3xl pb-10 lg:pb-16">
        <p className="eyebrow">Collections</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-7xl">One garment. Many silhouettes.</h1>
      </header>
      {categories.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="Collections coming soon" description="We’re curating the first collections. Browse everything in the shop for now." className="rounded-2xl border border-dashed border-line">
          <Link href="/shop" className="link-underline text-sm font-semibold">Go to shop</Link>
        </EmptyState>
      ) : (
        <ul className="grid gap-x-5 gap-y-14 md:grid-cols-2">
          {categories.map((c, i) => (
            <li key={c.id} className={i % 2 === 1 ? 'md:mt-24' : ''}>
              <Link href={`/shop?category=${c.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-bone">
                  {c.image ? (
                    <SmartImage src={c.image} alt={`${c.name} collection`} priority={i < 2} className="absolute inset-0 size-full object-cover transition-transform duration-[1.4s] ease-[var(--ease-premium)] group-hover:scale-[1.04]" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center font-display text-5xl font-semibold tracking-tight text-mute-soft/60">{c.name}</span>
                  )}
                  <span className="absolute top-4 left-4 rounded-full bg-paper/90 px-3 py-1.5 font-display text-xs font-semibold tabular-nums backdrop-blur">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="mt-5 flex items-start justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{c.name}</h2>
                    {c.description && <p className="mt-2 max-w-sm text-mute">{c.description}</p>}
                    <p className="mt-3 text-xs tracking-[0.14em] text-mute uppercase">{pluralize(c.productCount, 'style')}</p>
                  </div>
                  <span className="mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-ink transition group-hover:bg-ink group-hover:text-paper">
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
