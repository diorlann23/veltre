import Link from 'next/link'
import { Price } from '@/components/ui/bits'
import { SmartImage } from '@/components/ui/SmartImage'
import { discountPercent, isInStock, isOnSale } from '@/lib/catalog'
import type { Product } from '@/lib/types'

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const inStock = isInStock(product)
  const [first, second] = product.images
  const badge = !inStock
    ? { text: 'Sold out', className: 'bg-paper text-mute' }
    : isOnSale(product)
      ? { text: `−${discountPercent(product)}%`, className: 'bg-accent text-paper' }
      : product.newArrival
        ? { text: 'New', className: 'bg-ink text-paper' }
        : null

  return (
    <article className="group relative">
      <Link href={`/product/${product.slug}`} className="block rounded-2xl focus-visible:outline-offset-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-bone">
          <SmartImage
            src={first}
            alt={product.name}
            priority={priority}
            className={`absolute inset-0 size-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-premium)] group-hover:scale-[1.03] ${inStock ? '' : 'grayscale-[40%]'}`}
          />
          {second && (
            <SmartImage
              src={second}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover opacity-0! transition-opacity duration-700 group-hover:opacity-100!"
            />
          )}
          {badge && <span className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase ${badge.className}`}>{badge.text}</span>}
        </div>
        <div className="mt-3.5 flex flex-col gap-1 lg:mt-4 lg:flex-row lg:items-start lg:justify-between lg:gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[14px] leading-snug font-medium tracking-tight sm:text-[15px] lg:truncate">{product.name}</h3>
            {product.category && <p className="mt-0.5 text-xs text-mute">{product.category.name}</p>}
          </div>
          <Price product={product} className="shrink-0 text-sm font-medium tabular-nums" />
        </div>
      </Link>
      {product.colors.length > 1 && (
        <ul className="mt-2.5 flex items-center gap-1.5" aria-label={`Colours: ${product.colors.map((c) => c.name).join(', ')}`}>
          {product.colors.map((c) => (
            <li key={c.name} title={c.name} className="size-3 rounded-full ring-1 ring-black/15 ring-offset-1 ring-offset-paper" style={{ backgroundColor: c.hex }} />
          ))}
        </ul>
      )}
    </article>
  )
}

export function ProductGrid({ products, columns = 4, priorityCount = 0 }: { products: Product[]; columns?: 3 | 4; priorityCount?: number }) {
  return (
    <ul className={`grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:gap-y-14 ${columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
      {products.map((p, i) => (
        <li key={p.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  )
}
