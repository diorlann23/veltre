import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { ProductGrid } from '@/components/store/ProductCard'
import { ProductPurchase } from '@/components/store/ProductPurchase'
import { ProductDetails } from '@/components/store/ProductDetails'
import { Price, SectionHeading } from '@/components/ui/bits'
import { discountPercent, isInStock, isOnSale, unitPrice } from '@/lib/catalog'
import { getCurrentUser } from '@/server/auth'
import { siteUrl } from '@/server/env'
import { getProductBySlug, relatedProducts } from '@/server/repos/products'
import { getSettings } from '@/server/repos/settings'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug)
  if (!product) return { title: 'Product not found' }
  return {
    title: product.name,
    description: product.description.slice(0, 160) || undefined,
    openGraph: { images: product.images.slice(0, 1) },
    alternates: { canonical: `/product/${product.slug}` },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const user = await getCurrentUser()
  const product = await getProductBySlug(slug, { includeHidden: user?.role === 'admin' })
  if (!product) notFound()
  const [related, settings, base] = await Promise.all([relatedProducts(product), getSettings(), siteUrl()])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((i) => `${base}${i}`),
    brand: { '@type': 'Brand', name: settings.brandName },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'GHS',
      price: (unitPrice(product) / 100).toFixed(2),
      availability: isInStock(product) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${base}/product/${product.slug}`,
    },
  }

  return (
    <div className="container-x pt-6 lg:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      {product.status !== 'active' && (
        <p className="mb-6 rounded-xl border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-accent">
          Preview: this product is <strong>{product.status}</strong> and hidden from customers.
        </p>
      )}
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-mute">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/shop" className="hover:text-ink">Shop</Link></li>
          {product.category && (
            <>
              <li aria-hidden="true">/</li>
              <li><Link href={`/shop?category=${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link></li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">{product.name}</li>
        </ol>
      </nav>

      <ProductPurchase
        product={product}
        after={
          <>
            <ProductDetails details={product.details} fit={product.fit} deliveryInfo={settings.deliveryInfo} paymentInfo={settings.paymentInfo} />
            <Link href="/contact" className="mt-6 inline-flex items-center gap-2 text-sm text-mute transition hover:text-ink">
              <MessageCircle className="size-4" aria-hidden="true" /> Questions about sizing? Talk to us
            </Link>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {product.category && <p className="eyebrow">{product.category.name}</p>}
          {product.newArrival && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-paper uppercase">New</span>}
          {isOnSale(product) && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-paper uppercase">−{discountPercent(product)}%</span>}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1>
        <Price product={product} className="mt-3 text-xl font-medium tabular-nums" />
        {product.description && <p className="mt-6 leading-relaxed whitespace-pre-line text-mute">{product.description}</p>}
      </ProductPurchase>

      {related.length > 0 && (
        <section className="pt-24 lg:pt-32" aria-labelledby="related-title">
          <SectionHeading id="related-title" eyebrow="Complete the rotation" title="You may also like" />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  )
}
