'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toaster'
import { api } from '@/lib/client/api'
import type { OrderDelivery } from '@/lib/types'

const PAYMENT_METHODS = ['MTN Mobile Money', 'Telecel Cash', 'AirtelTigo Money', 'Bank transfer', 'Cash on delivery']

export function OrderDeliveryForm({ orderId, delivery }: { orderId: string; delivery: OrderDelivery }) {
  const router = useRouter()
  const toast = useToast()
  const [form, setForm] = useState(delivery)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const set = (key: keyof OrderDelivery) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const dirty = (Object.keys(form) as (keyof OrderDelivery)[]).some((k) => form[k] !== delivery[k])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api(`/api/orders/${orderId}`, { method: 'PATCH', body: { delivery: form } })
      toast({ title: 'Details saved', description: 'The customer sees them on their tracking page.' })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save delivery details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="font-medium">Delivery &amp; payment</h2>
        <p className="mt-1 text-xs text-mute">Shown to the customer on their order tracking page.</p>
      </div>
      <Field id="eta" label="Estimated delivery" optional>
        {(a) => <input {...a} className="field" type="date" value={form.estimatedDate} onChange={set('estimatedDate')} />}
      </Field>
      <Field id="payment-method" label="Payment method" optional>
        {(a) => (
          <>
            <input {...a} className="field" list="payment-methods" value={form.paymentMethod} onChange={set('paymentMethod')} maxLength={60} placeholder="e.g. MTN Mobile Money" autoComplete="off" />
            <datalist id="payment-methods">
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </>
        )}
      </Field>
      <FormError message={error} />
      <Button type="submit" variant="secondary" fullWidth loading={saving} disabled={!dirty}>
        Save details
      </Button>
    </form>
  )
}
