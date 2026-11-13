'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, MessageCircle, ShoppingBag } from 'lucide-react'
import { useCart, useSettings } from '@/components/providers/AppProviders'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/bits'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { Field, FormError } from '@/components/ui/Field'
import { SmartImage } from '@/components/ui/SmartImage'
import { Checkbox } from '@/components/ui/Toggle'
import { ApiError, api } from '@/lib/client/api'
import { formatMoney } from '@/lib/money'
import type { Order, User } from '@/lib/types'
import { checkoutCustomerSchema, fieldErrors } from '@/lib/validation'
import { OrderTotals } from './OrderTotals'

export function CheckoutForm({ user }: { user: User }) {
  const { items, quote, ready, clear, refresh } = useCart()
  const settings = useSettings()
  const router = useRouter()
  const [values, setValues] = useState({ fullName: user.name, whatsapp: user.phone, address: user.address, notes: '' })
  const [saveDetails, setSaveDetails] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!ready || (items.length > 0 && !quote?.lines.length)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-mute" aria-label="Loading" />
      </div>
    )
  }

  if (items.length === 0 || !quote || quote.itemCount === 0) {
    return (
      <EmptyState icon={ShoppingBag} title="Nothing to check out yet" description="Your cart is empty. Add something you love to get started.">
        <Link href="/shop" className={buttonClasses('primary', 'lg')}>Shop now</Link>
      </EmptyState>
    )
  }

  const unavailable = quote.lines.some((l) => !l.available)
  const set = (k: keyof typeof values) => (v: string) => {
    setValues((s) => ({ ...s, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const parsed = checkoutCustomerSchema.safeParse(values)
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error)
      setErrors(errs)
      document.getElementById(`checkout-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    const win = window.open('', '_blank')
    setSubmitting(true)
    try {
      const res = await api<{ order: Order; whatsappUrl: string }>('/api/orders', {
        body: { items: quote.lines.filter((l) => l.available).map(({ productId, color, size, quantity }) => ({ productId, color, size, quantity })), customer: parsed.data, saveDetails },
      })
      if (win) {
        win.opener = null
        win.location.href = res.whatsappUrl
      }
      clear()
      router.push(`/account/orders/${res.order.number}?placed=1${win ? '' : '&blocked=1'}`)
    } catch (err) {
      win?.close()
      setSubmitting(false)
      if (err instanceof ApiError) {
        setErrors(err.fields)
        setFormError(err.message)
        if (err.status === 409) refresh()
      } else setFormError('Something went wrong. Please try again.')
    }
  }

  const text = (k: 'fullName' | 'whatsapp', label: string, extra: Record<string, string>, hint?: string) => (
    <Field id={`checkout-${k}`} label={label} error={errors[k]} hint={hint}>
      {(a) => <input {...a} {...extra} value={values[k]} onChange={(e) => set(k)(e.target.value)} className="field" />}
    </Field>
  )

  return (
    <div className="grid gap-12 pt-8 lg:grid-cols-12 lg:gap-16 lg:pt-12">
      <form onSubmit={onSubmit} noValidate className="lg:col-span-7" aria-labelledby="details-title">
        <h2 id="details-title" className="font-display text-xl font-semibold tracking-tight">Delivery details</h2>
        <div className="mt-6 space-y-6">
          <FormError message={formError} />
          {text('fullName', 'Full name', { type: 'text', autoComplete: 'name' })}
          {text('whatsapp', 'WhatsApp number', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: 'e.g. 024 123 4567' }, 'We’ll message you on this number to confirm your order.')}
          <Field id="checkout-address" label="Delivery location or address" hint="Area, street, landmark or digital address." error={errors.address}>
            {(a) => <textarea {...a} rows={3} autoComplete="street-address" value={values.address} onChange={(e) => set('address')(e.target.value)} className="field min-h-24 resize-y" />}
          </Field>
          <Field id="checkout-notes" label="Additional instructions" optional hint="Preferred delivery time, gate code, alternative contact…" error={errors.notes}>
            {(a) => <textarea {...a} rows={3} value={values.notes} onChange={(e) => set('notes')(e.target.value)} className="field min-h-24 resize-y" />}
          </Field>
          <Checkbox id="save-details" label="Save these details to my account" checked={saveDetails} onCheckedChange={setSaveDetails} />
        </div>
        <div className="mt-8 rounded-2xl border border-line bg-bone/40 p-5 text-sm leading-relaxed">
          <p className="font-medium">Payment &amp; delivery</p>
          <p className="mt-2 text-mute">{settings.paymentInfo}</p>
          <p className="mt-2 text-mute">{settings.deliveryInfo}</p>
        </div>
        {unavailable && <p className="mt-6 text-sm text-accent">Some items are no longer available and will not be included.</p>}
        <Button type="submit" variant="whatsapp" size="lg" fullWidth className="mt-8" loading={submitting}>
          <MessageCircle className="size-4" aria-hidden="true" />
          Place order &amp; send on WhatsApp<span className="hidden sm:inline"> · {formatMoney(quote.total)}</span>
        </Button>
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-mute">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Your order is saved to your account, then WhatsApp opens with the summary. Press Send so we can confirm availability, delivery and payment.
        </p>
      </form>

      <aside className="lg:col-span-5" aria-label="Order summary">
        <div className="card p-6 sm:p-8 lg:sticky lg:top-28">
          <h2 className="font-display text-xl font-semibold tracking-tight">Order summary</h2>
          <ul className="mt-2 divide-y divide-line">
            {quote.lines.filter((l) => l.available).map((l) => (
              <li key={l.key} className="flex gap-4 py-4">
                <div className="relative h-20 w-16 shrink-0 rounded-lg bg-bone">
                  <SmartImage src={l.image} alt="" className="size-full rounded-lg object-cover" />
                  <span className="absolute -top-2 -right-2 inline-flex size-5 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-paper tabular-nums">{l.quantity}</span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{l.name}</p>
                    <p className="mt-0.5 text-mute">{l.color} · Size {l.size}</p>
                    <p className="mt-0.5 text-mute tabular-nums">{l.quantity} × {formatMoney(l.unitPrice)}</p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums">{formatMoney(l.lineTotal)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-line pt-5">
            <OrderTotals totals={quote} deliveryInfo={settings.deliveryInfo} />
          </div>
        </div>
      </aside>
    </div>
  )
}
