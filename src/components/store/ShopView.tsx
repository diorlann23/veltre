'use client'

import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { Checkbox } from '@/components/ui/Toggle'
import { SORT_OPTIONS, catalogQueryToParams, countActiveFilters, type CatalogQuery, type SortOption } from '@/lib/catalog'
import { formatMoney, pluralize } from '@/lib/money'

interface Facets {
  sizes: string[]
  colors: { name: string; hex: string }[]
  minPrice: number
  maxPrice: number
}

interface Props {
  query: CatalogQuery
  facets: Facets
  categories: { slug: string; name: string }[]
  total: number
}

interface ShopViewProps extends Props {
  title: string
  description?: string
  children: ReactNode
}

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

function FilterPanel({ query, facets, categories, onChange }: Omit<Props, 'total'> & { onChange: (q: CatalogQuery) => void }) {
  const set = (patch: Partial<CatalogQuery>) => onChange({ ...query, ...patch, page: 1 })
  const priceValue = (v: number | null) => (v === null ? '' : String(v / 100))
  const parse = (v: string) => (v.trim() === '' || !Number.isFinite(Number(v)) || Number(v) < 0 ? null : Math.round(Number(v) * 100))
  const group = 'border-t border-line py-6 first:border-t-0 first:pt-0'

  return (
    <div>
      {categories.length > 0 && (
        <fieldset className={group}>
          <legend className="eyebrow mb-4 text-ink">Collection</legend>
          {categories.map((c) => (
            <Checkbox key={c.slug} id={`cat-${c.slug}`} label={c.name} checked={query.categories.includes(c.slug)} onCheckedChange={() => set({ categories: toggle(query.categories, c.slug) })} />
          ))}
        </fieldset>
      )}
      {facets.sizes.length > 0 && (
        <fieldset className={group}>
          <legend className="eyebrow mb-4 text-ink">Size</legend>
          <div className="grid grid-cols-4 gap-2">
            {facets.sizes.map((s) => {
              const active = query.sizes.includes(s)
              return (
                <button key={s} type="button" aria-pressed={active} onClick={() => set({ sizes: toggle(query.sizes, s) })} className={`h-10 rounded-lg border text-xs font-medium transition ${active ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}>
                  {s}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}
      {facets.colors.length > 0 && (
        <fieldset className={group}>
          <legend className="eyebrow mb-4 text-ink">Colour</legend>
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((c) => {
              const active = query.colors.includes(c.name)
              return (
                <button key={c.name} type="button" aria-pressed={active} onClick={() => set({ colors: toggle(query.colors, c.name) })} className={`inline-flex items-center gap-2 rounded-full border py-1.5 pr-3 pl-1.5 text-xs transition ${active ? 'border-ink bg-white' : 'border-line hover:border-ink'}`}>
                  <span className="size-4 rounded-full ring-1 ring-black/15" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                  {c.name}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}
      <fieldset className={group}>
        <legend className="eyebrow mb-4 text-ink">Price (GH₵)</legend>
        <div className="flex items-center gap-3">
          <label className="flex-1 text-xs text-mute">
            Min
            <input type="number" inputMode="decimal" min={0} placeholder={String(Math.floor(facets.minPrice / 100))} key={`min-${query.min}`} defaultValue={priceValue(query.min)} onBlur={(e) => set({ min: parse(e.target.value) })} className="field mt-1 py-2" />
          </label>
          <label className="flex-1 text-xs text-mute">
            Max
            <input type="number" inputMode="decimal" min={0} placeholder={String(Math.ceil(facets.maxPrice / 100))} key={`max-${query.max}`} defaultValue={priceValue(query.max)} onBlur={(e) => set({ max: parse(e.target.value) })} className="field mt-1 py-2" />
          </label>
        </div>
      </fieldset>
      <fieldset className={group}>
        <legend className="eyebrow mb-4 text-ink">Availability</legend>
        <Checkbox id="f-instock" label="In stock only" checked={query.inStock} onCheckedChange={(v) => set({ inStock: v })} />
        <Checkbox id="f-sale" label="On sale" checked={query.sale} onCheckedChange={(v) => set({ sale: v })} />
      </fieldset>
    </div>
  )
}

export function ShopView({ query, facets, categories, total, title, description, children }: ShopViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(query.q)
  const active = countActiveFilters(query)

  const navigate = (q: CatalogQuery) => {
    const params = catalogQueryToParams(q).toString()
    startTransition(() => router.replace(params ? `${pathname}?${params}` : pathname, { scroll: false }))
  }

  useEffect(() => setSearch(query.q), [query.q])

  const latest = useRef({ query, navigate })
  latest.current = { query, navigate }

  useEffect(() => {
    if (search === latest.current.query.q) return
    const t = setTimeout(() => latest.current.navigate({ ...latest.current.query, q: search, page: 1 }), 350)
    return () => clearTimeout(t)
  }, [search])

  const chips = [
    ...query.categories.map((c) => ({ label: categories.find((x) => x.slug === c)?.name ?? c, q: { categories: query.categories.filter((x) => x !== c) } })),
    ...query.sizes.map((s) => ({ label: `Size ${s}`, q: { sizes: query.sizes.filter((x) => x !== s) } })),
    ...query.colors.map((c) => ({ label: c, q: { colors: query.colors.filter((x) => x !== c) } })),
    ...(query.min !== null ? [{ label: `From ${formatMoney(query.min)}`, q: { min: null } }] : []),
    ...(query.max !== null ? [{ label: `Up to ${formatMoney(query.max)}`, q: { max: null } }] : []),
    ...(query.inStock ? [{ label: 'In stock', q: { inStock: false } }] : []),
    ...(query.sale ? [{ label: 'On sale', q: { sale: false } }] : []),
  ]
  const clearAll = () => navigate({ ...query, categories: [], sizes: [], colors: [], min: null, max: null, inStock: false, sale: false, page: 1 })

  return (
    <div className="container-x pt-8 lg:pt-14">
      <header className="flex flex-col gap-6 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Shop</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
          {description && <p className="mt-3 max-w-lg text-mute">{description}</p>}
        </div>
        <div className="w-full lg:w-80">
          <label htmlFor="shop-search" className="sr-only">Search products</label>
          <input id="shop-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="field rounded-full" />
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium transition hover:border-ink lg:hidden">
            <SlidersHorizontal className="size-4" aria-hidden="true" /> Filters{active > 0 && <span className="tabular-nums">({active})</span>}
          </button>
          <p className="flex items-center gap-2 text-sm whitespace-nowrap text-mute" aria-live="polite">
            {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
            {pluralize(total, 'product')}
          </p>
        </div>
        <Select label="Sort by" value={query.sort} onValueChange={(v) => navigate({ ...query, sort: v as SortOption, page: 1 })} options={SORT_OPTIONS} className="w-44 sm:w-52" />
      </div>

      {chips.length > 0 && (
        <ul className="-mt-1 mb-6 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((chip) => (
            <li key={chip.label}>
              <button type="button" onClick={() => navigate({ ...query, ...chip.q, page: 1 })} className="inline-flex items-center gap-1.5 rounded-full bg-bone px-3 py-1.5 text-xs transition hover:bg-sand" aria-label={`Remove filter: ${chip.label}`}>
                {chip.label} <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={clearAll} className="px-2 text-xs underline underline-offset-4">Clear all</button>
          </li>
        </ul>
      )}

      <div className="grid gap-10 lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-28">
            <FilterPanel query={query} facets={facets} categories={categories} onChange={navigate} />
          </div>
        </aside>
        <section aria-label="Products" className={`transition-opacity ${pending ? 'opacity-60' : ''}`}>
          {children}
        </section>
      </div>

      <Sheet open={open} onOpenChange={setOpen} title="Filters">
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6">
          <FilterPanel query={query} facets={facets} categories={categories} onChange={navigate} />
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-line px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button variant="secondary" onClick={clearAll} disabled={active === 0}>Clear</Button>
          <Button onClick={() => setOpen(false)} loading={pending}>Show {total}</Button>
        </div>
      </Sheet>
    </div>
  )
}
