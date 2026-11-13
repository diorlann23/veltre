import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CheckoutForm } from '@/components/store/CheckoutForm'
import { requireUserPage } from '@/server/auth'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

export default async function CheckoutPage() {
  const user = await requireUserPage('/checkout')
  return (
    <div className="container-x pt-8 lg:pt-14">
      <header className="border-b border-line pb-8">
        <Link href="/cart" className="group inline-flex items-center gap-2 text-xs text-mute hover:text-ink">
          <ArrowLeft className="size-3.5 transition group-hover:-translate-x-0.5" aria-hidden="true" /> Back to cart
        </Link>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Checkout</h1>
      </header>
      <CheckoutForm user={user} />
    </div>
  )
}
