'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Confirm } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Toggle'
import { STATUS_LABELS } from '@/components/ui/bits'
import { useToast } from '@/components/ui/Toaster'
import { api } from '@/lib/client/api'
import type { OrderStatus } from '@/lib/types'

export function OrderStatusPanel({ orderId, status, paymentStatus, next }: { orderId: string; status: OrderStatus; paymentStatus: 'paid' | 'unpaid'; next: OrderStatus[] }) {
  const router = useRouter()
  const toast = useToast()
  const [target, setTarget] = useState<string>(next.find((s) => s !== 'cancelled') ?? next[0] ?? '')
  const [note, setNote] = useState('')
  const [update, setUpdate] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const patch = async (body: Record<string, unknown>, success: string) => {
    setLoading(true)
    try {
      await api(`/api/orders/${orderId}`, { method: 'PATCH', body })
      toast({ title: success })
      setNote('')
      setUpdate('')
      setConfirm(false)
      router.refresh()
    } catch (err) {
      toast({ variant: 'error', title: 'Update failed', description: err instanceof Error ? err.message : undefined })
    } finally {
      setLoading(false)
    }
  }

  const apply = () => (target === 'cancelled' ? setConfirm(true) : patch({ status: target, note }, `Order marked ${STATUS_LABELS[target as OrderStatus].toLowerCase()}`))

  return (
    <section className="card space-y-5 p-5 sm:p-6">
      <h2 className="font-medium">Update order</h2>
      {next.length > 0 ? (
        <>
          <div>
            <label htmlFor="next-status" className="mb-2 block text-sm font-medium">Status</label>
            <Select id="next-status" label="New status" value={target} onValueChange={setTarget} options={next.map((s) => ({ value: s, label: STATUS_LABELS[s] }))} className="w-full" />
          </div>
          <div>
            <label htmlFor="status-note" className="mb-2 block text-sm font-medium">Note <span className="font-normal text-mute">(optional, visible to customer)</span></label>
            <textarea id="status-note" rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} className="field resize-y" placeholder="e.g. Packed and ready to go" />
          </div>
          <Button fullWidth onClick={apply} loading={loading && !confirm} variant={target === 'cancelled' ? 'danger' : 'primary'}>
            {target === 'cancelled' ? 'Cancel order' : `Mark as ${STATUS_LABELS[target as OrderStatus]?.toLowerCase()}`}
          </Button>
        </>
      ) : (
        <p className="text-sm text-mute">This order is {status} and can no longer change status.</p>
      )}
      {status !== 'cancelled' && (
        <form
          className="space-y-3 border-t border-line pt-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (update.trim()) patch({ note: update.trim() }, 'Update posted to the customer')
          }}
        >
          <div>
            <label htmlFor="customer-update" className="mb-1 block text-sm font-medium">Post an update</label>
            <p className="mb-2 text-xs text-mute">Appears on the customer’s tracking page without changing the status.</p>
            <textarea id="customer-update" rows={2} maxLength={300} value={update} onChange={(e) => setUpdate(e.target.value)} className="field resize-y" placeholder="e.g. Your parcel will arrive this afternoon" />
          </div>
          <Button type="submit" variant="secondary" fullWidth loading={loading && !!update.trim()} disabled={!update.trim()}>
            Post update
          </Button>
        </form>
      )}
      {status !== 'cancelled' && (
        <div className="border-t border-line pt-5">
          <Switch id="paid" label="Payment received" description="Mark when the customer has paid." checked={paymentStatus === 'paid'} onCheckedChange={(v) => patch({ paymentStatus: v ? 'paid' : 'unpaid' }, v ? 'Marked as paid' : 'Marked as unpaid')} />
        </div>
      )}
      <Confirm open={confirm} onOpenChange={setConfirm} title="Cancel this order?" description="Reserved items will be returned to stock. This can’t be undone." confirmLabel="Cancel order" danger loading={loading} onConfirm={() => patch({ status: 'cancelled', note }, 'Order cancelled')} />
    </section>
  )
}
