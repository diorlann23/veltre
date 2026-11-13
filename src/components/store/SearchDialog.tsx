'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Search } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { SmartImage } from '@/components/ui/SmartImage'
import { Price } from '@/components/ui/bits'
import { api } from '@/lib/client/api'
import type { Product } from '@/lib/types'

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[] | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const inputId = useId()
  const q = query.trim()

  useEffect(() => {
    if (!q) {
      setResults(null)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    const t = setTimeout(() => {
      api<{ products: Product[] }>(`/api/products?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) => setResults(r.products.slice(0, 5)))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 200)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [q])

  const close = (o: boolean) => {
    if (!o) setQuery('')
    onOpenChange(o)
  }

  return (
    <Sheet open={open} onOpenChange={close} title="Search products" side="top" hideTitle>
      <div className="container-x py-5">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            router.push(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop')
            close(false)
          }}
          className="flex items-center gap-3 border-b border-ink pb-3"
        >
          {loading ? <Loader2 className="size-5 shrink-0 animate-spin text-mute" aria-hidden="true" /> : <Search className="size-5 shrink-0 text-mute" aria-hidden="true" />}
          <label htmlFor={inputId} className="sr-only">
            Search products
          </label>
          <input
            id={inputId}
            type="search"
            autoFocus
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dresses, colours, styles…"
            className="min-w-0 flex-1 bg-transparent py-2 font-display text-xl tracking-tight placeholder:text-mute-soft focus:outline-none sm:text-2xl"
          />
        </form>
        <div className="py-4" aria-live="polite">
          {!q ? (
            <p className="text-sm text-mute">Search by product name, colour or collection.</p>
          ) : results && results.length === 0 && !loading ? (
            <p className="text-sm text-mute">No products match “{q}”.</p>
          ) : (
            <ul className="divide-y divide-line">
              {results?.map((p) => (
                <li key={p.id}>
                  <Link href={`/product/${p.slug}`} onClick={() => close(false)} className="group flex items-center gap-4 py-3">
                    <span className="block h-16 w-13 shrink-0 overflow-hidden rounded-lg bg-bone">
                      <SmartImage src={p.images[0]} alt="" className="size-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium group-hover:underline">{p.name}</span>
                      <Price product={p} className="text-sm text-mute" />
                    </span>
                    <ArrowRight className="size-4 text-mute transition group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Sheet>
  )
}
