'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Loader2, MessageCircle, ShoppingBag } from 'lucide-react'
import { useCart, useSession, useSettings } from '@/components/providers/AppProviders'
import { CartLineItem } from '@/components/store/CartLineItem'
import { OrderTotals } from '@/components/store/OrderTotals'
import { EmptyState, PageHeader } from '@/components/ui/bits'
import { buttonClasses } from '@/components/ui/buttonStyles'

export default function CartPage() {
  const { items, quote, ready } = useCart()
  const { user } = useSession()
  const settings = useSettings()

  if (!ready || (items.length > 0 && !quote?.lines.length)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-mute" aria-label="Loading cart" />
      </div>
    )
  }

  if (items.length === 0 || !quote) {
    return (
      <div className="container-x py-16">
        <EmptyState icon={ShoppingBag} title="Your cart is empty" description="Looks like you haven’t added anything yet. Explore the collection and find your fit.">
          <Link href="/shop" className={buttonClasses('primary', 'lg')}>Shop now</Link>
          <Link href="/collections" className={buttonClasses('secondary', 'lg')}>Browse collections</Link>
        </EmptyState>
      </div>
    )
  }

  const hasUnavailable = quote.lines.some((l) => !l.available)

  return (
    <div className="container-x pt-8 lg:pt-14">
      <PageHeader eyebrow="Cart" title="Your cart" />
      <div className="grid gap-12 pt-4 lg:grid-cols-12 lg:gap-16">
        <section className="lg:col-span-7" aria-label="Cart items">
          <ul className="divide-y divide-line">
            {quote.lines.map((line) => <CartLineItem key={line.key} line={line} />)}
          </ul>
          <Link href="/shop" className="group mt-6 inline-flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="size-4 transition group-hover:-translate-x-1" aria-hidden="true" />
            <span className="link-underline">Continue shopping</span>
          </Link>
        </section>
        <aside className="lg:col-span-5" aria-label="Order summary">
          <div className="card p-6 sm:p-8 lg:sticky lg:top-28">
            <h2 className="font-display text-xl font-semibold tracking-tight">Order summary</h2>
            <div className="mt-6">
              <OrderTotals totals={quote} deliveryInfo={settings.deliveryInfo} />
            </div>
            {hasUnavailable && <p className="mt-6 text-sm text-accent">Remove unavailable items to continue.</p>}
            <Link
              href={user ? '/checkout' : '/login?next=/checkout'}
              aria-disabled={hasUnavailable || quote.itemCount === 0}
              className={buttonClasses('primary', 'lg', `mt-8 w-full ${hasUnavailable || quote.itemCount === 0 ? 'pointer-events-none opacity-45' : ''}`)}
            >
              {user ? 'Proceed to checkout' : 'Log in to check out'}
              <ArrowRight className="size-4 transition group-hover/btn:translate-x-1" aria-hidden="true" />
            </Link>
            <p className="mt-5 flex gap-3 text-xs leading-relaxed text-mute">
              <MessageCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Your order is saved to your account and sent to us on WhatsApp. No payment is taken on this website.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
