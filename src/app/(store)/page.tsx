import Link from 'next/link'
import { ArrowRight, MessageCircle, Ruler, Send, Sparkles } from 'lucide-react'
import { ProductGrid } from '@/components/store/ProductCard'
import { SectionHeading } from '@/components/ui/bits'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { SmartImage } from '@/components/ui/SmartImage'
import { getCurrentUser } from '@/server/auth'
import { listCategories } from '@/server/repos/categories'
import { homeProducts } from '@/server/repos/products'
import { getSettings } from '@/server/repos/settings'

const steps = [
  { icon: Ruler, title: 'Choose your fit', text: 'Pick your style, colour and size, then add it to your cart.' },
  { icon: Send, title: 'Place your order', text: 'Log in, check out, and send the order summary to us on WhatsApp.' },
  { icon: MessageCircle, title: 'We confirm with you', text: 'We reply to confirm availability, delivery and payment. Track it in your account.' },
]

export default async function HomePage() {
  const [settings, { featured, newArrivals }, categories, user] = await Promise.all([getSettings(), homeProducts(4), listCategories(), getCurrentUser()])
  const hasProducts = featured.length + newArrivals.length > 0
  const shownCategories = categories.filter((c) => c.productCount > 0)

  return (
    <>
      <section className="container-x pt-6 pb-16 lg:pt-10 lg:pb-24" aria-labelledby="hero-title">
        <div className={`grid items-end gap-8 lg:gap-10 ${settings.heroImage ? 'lg:grid-cols-12' : ''}`}>
          <div className={settings.heroImage ? 'lg:col-span-5 lg:pb-10' : 'max-w-4xl py-10 lg:py-20'}>
            <p className="eyebrow animate-fade-up">{settings.brandName}</p>
            <h1 id="hero-title" className="mt-5 animate-fade-up text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.92] font-semibold tracking-[-0.035em] [animation-delay:80ms]">
              {settings.heroHeading || settings.tagline}
            </h1>
            {settings.heroText && <p className="mt-6 max-w-md animate-fade-up text-base leading-relaxed text-mute [animation-delay:160ms] sm:text-lg">{settings.heroText}</p>}
            <div className="mt-9 flex animate-fade-up flex-wrap gap-3 [animation-delay:240ms]">
              <Link href="/shop" className={buttonClasses('primary', 'lg')}>
                Shop now <ArrowRight className="size-4 transition group-hover/btn:translate-x-1" aria-hidden="true" />
              </Link>
              <Link href="/collections" className={buttonClasses('secondary', 'lg')}>
                Collections
              </Link>
            </div>
          </div>
          {settings.heroImage && (
            <div className="relative lg:col-span-7">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-bone sm:aspect-[5/6] lg:aspect-[4/5] lg:max-h-[82vh]">
                <SmartImage src={settings.heroImage} alt={settings.heroHeading || settings.brandName} priority className="absolute inset-0 size-full object-cover" />
              </div>
            </div>
          )}
        </div>
      </section>

      {!hasProducts ? (
        <section className="container-x">
          <div className="card flex flex-col items-center px-6 py-16 text-center">
            <Sparkles className="size-6 text-mute" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-semibold tracking-tight">New collection coming soon</h2>
            <p className="mt-2 max-w-md text-mute">We’re getting the first pieces ready. Check back shortly, or message us on WhatsApp.</p>
            {user?.role === 'admin' && (
              <Link href="/admin/products/new" className={buttonClasses('primary', 'md', 'mt-8')}>
                Add your first product
              </Link>
            )}
          </div>
        </section>
      ) : (
        <>
          {featured.length > 0 && (
            <section className="container-x pt-10 lg:pt-16" aria-labelledby="featured-title">
              <SectionHeading id="featured-title" eyebrow="The edit" title="Featured" link={{ href: '/shop', label: 'Shop all' }} />
              <ProductGrid products={featured} priorityCount={2} />
            </section>
          )}

          {shownCategories.length > 0 && (
            <section className="container-x pt-24 lg:pt-32" aria-labelledby="collections-title">
              <SectionHeading id="collections-title" eyebrow="Collections" title="Find your silhouette" link={{ href: '/collections', label: 'All collections' }} />
              <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {shownCategories.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <Link href={`/shop?category=${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-bone">
                      {c.image && <SmartImage src={c.image} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-[1.4s] ease-[var(--ease-premium)] group-hover:scale-105" />}
                      <span className={`absolute inset-0 ${c.image ? 'bg-gradient-to-t from-black/55 via-black/0' : ''}`} />
                      <span className={`absolute inset-x-4 bottom-4 flex items-end justify-between gap-2 sm:inset-x-5 sm:bottom-5 ${c.image ? 'text-white' : 'text-ink'}`}>
                        <span className="font-display text-lg font-semibold tracking-tight sm:text-2xl">{c.name}</span>
                        <ArrowRight className="mb-1 size-4 shrink-0 transition group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {newArrivals.length > 0 && (
            <section className="container-x pt-24 lg:pt-32" aria-labelledby="new-title">
              <SectionHeading id="new-title" eyebrow="Just landed" title="New arrivals" link={{ href: '/shop?sort=newest', label: 'View all' }} />
              <ProductGrid products={newArrivals} />
            </section>
          )}
        </>
      )}

      <section className="container-x pt-24 lg:pt-32" aria-labelledby="how-title">
        <div className="border-t border-line pt-14 lg:pt-20">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow">How ordering works</p>
              <h2 id="how-title" className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Simple, personal, direct.</h2>
              <p className="mt-4 max-w-sm leading-relaxed text-mute">No online payment. Your order is saved to your account and sent to us on WhatsApp, and we take it from there.</p>
            </div>
            <ol className="grid gap-10 sm:grid-cols-3 lg:col-span-8">
              {steps.map((s, i) => (
                <li key={s.title}>
                  <div className="flex items-center gap-4">
                    <span className="font-display text-sm font-semibold text-mute tabular-nums">0{i + 1}</span>
                    <span className="h-px flex-1 bg-line" />
                    <s.icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mute">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </>
  )
}
