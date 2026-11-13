import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react'
import { ProductGrid } from '@/components/store/ProductCard'
import { ShopView } from '@/components/store/ShopView'
import { EmptyState } from '@/components/ui/bits'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { catalogQueryToParams, countActiveFilters, parseCatalogQuery } from '@/lib/catalog'
import { listCategories } from '@/server/repos/categories'
import { catalogFacets, searchProducts } from '@/server/repos/products'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = parseCatalogQuery(await searchParams)
  if (query.categories.length === 1) {
    const c = (await listCategories()).find((x) => x.slug === query.categories[0])
    if (c) return { title: c.name, description: c.description || undefined }
  }
  return { title: 'Shop', description: 'Shop premium joggers. Filter by size, colour and price.' }
}

export default async function ShopPage({ searchParams }: Props) {
  const query = parseCatalogQuery(await searchParams)
  const [result, facets, categories] = await Promise.all([searchProducts(query), catalogFacets(), listCategories()])
  const single = query.categories.length === 1 ? categories.find((c) => c.slug === query.categories[0]) : undefined
  const title = single?.name ?? (query.sale ? 'Sale' : query.sort === 'newest' ? 'New arrivals' : 'All products')
  const pageHref = (page: number) => {
    const p = catalogQueryToParams({ ...query, page }).toString()
    return p ? `/shop?${p}` : '/shop'
  }

  return (
    <ShopView
      query={query}
      facets={facets}
      categories={categories.filter((c) => c.productCount > 0).map((c) => ({ slug: c.slug, name: c.name }))}
      total={result.total}
      title={title}
      description={single?.description}
    >
      {result.products.length > 0 ? (
        <>
          <ProductGrid products={result.products} columns={3} priorityCount={3} />
          {result.pages > 1 && (
            <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-2">
              {query.page > 1 && (
                <Link href={pageHref(query.page - 1)} className={buttonClasses('secondary', 'sm')} aria-label="Previous page">
                  <ChevronLeft className="size-4" aria-hidden="true" /> Previous
                </Link>
              )}
              <span className="px-3 text-sm text-mute tabular-nums">
                Page {query.page} of {result.pages}
              </span>
              {query.page < result.pages && (
                <Link href={pageHref(query.page + 1)} className={buttonClasses('secondary', 'sm')} aria-label="Next page">
                  Next <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              )}
            </nav>
          )}
        </>
      ) : (
        <EmptyState
          icon={SearchX}
          title={countActiveFilters(query) || query.q ? 'No products found' : 'No products yet'}
          description={countActiveFilters(query) || query.q ? 'Try a different search or remove a few filters.' : 'New pieces are on the way. Check back soon.'}
          className="rounded-2xl border border-dashed border-line"
        >
          {(countActiveFilters(query) > 0 || query.q) && (
            <Link href="/shop" className={buttonClasses()}>
              Reset filters
            </Link>
          )}
        </EmptyState>
      )}
    </ShopView>
  )
}
