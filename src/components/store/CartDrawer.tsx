'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { ArrowRight, Loader2, ShoppingBag } from 'lucide-react'
import { useCart, useSettings } from '@/components/providers/AppProviders'
import { EmptyState } from '@/components/ui/bits'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { Sheet } from '@/components/ui/Sheet'
import { formatMoney, pluralize } from '@/lib/money'
import { CartLineItem } from './CartLineItem'

export function CartDrawer() {
  const { drawerOpen, setDrawerOpen, quote, items, quoting } = useCart()
  const settings = useSettings()
  const pathname = usePathname()
  const close = () => setDrawerOpen(false)

  useEffect(() => setDrawerOpen(false), [pathname, setDrawerOpen])

  const count = quote?.itemCount ?? 0
  const lines = quote?.lines ?? []

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen} title={count > 0 ? `Cart (${count})` : 'Cart'}>
      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState icon={ShoppingBag} title="Your cart is empty" description="Find your fit and it will wait for you here.">
            <Link href="/shop" onClick={close} className={buttonClasses()}>
              Shop now
            </Link>
          </EmptyState>
        </div>
      ) : (
        <>
          <ul className="flex-1 divide-y divide-line overflow-y-auto overscroll-contain px-5 sm:px-6" aria-busy={quoting}>
            {lines.length === 0 ? (
              <li className="flex justify-center py-16">
                <Loader2 className="size-5 animate-spin text-mute" aria-label="Loading cart" />
              </li>
            ) : (
              lines.map((line) => <CartLineItem key={line.key} line={line} compact onNavigate={close} />)
            )}
          </ul>
          <footer className="border-t border-line bg-bone/40 px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-mute">Subtotal · {pluralize(count, 'item')}</span>
              <span className="font-display text-lg font-semibold tabular-nums">{formatMoney(quote?.subtotal ?? 0)}</span>
            </div>
            <p className="mt-1 text-xs text-mute">
              {settings.deliveryFee === null ? 'Delivery fee confirmed separately on WhatsApp.' : `Delivery ${formatMoney(settings.deliveryFee)} added at checkout.`}
            </p>
            <div className="mt-4 grid gap-2">
              <Link href="/checkout" onClick={close} aria-disabled={count === 0} className={buttonClasses('primary', 'lg', `w-full ${count === 0 ? 'pointer-events-none opacity-45' : ''}`)}>
                Checkout <ArrowRight className="size-4 transition group-hover/btn:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link href="/cart" onClick={close} className={buttonClasses('secondary', 'md', 'w-full')}>
                View cart
              </Link>
            </div>
          </footer>
        </>
      )}
    </Sheet>
  )
}
