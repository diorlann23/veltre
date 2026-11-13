import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { OrderDeliveryForm } from '@/components/admin/OrderDeliveryForm'
import { OrderStatusPanel } from '@/components/admin/OrderStatusPanel'
import { OrderTotals } from '@/components/store/OrderTotals'
import { STATUS_LABELS, StatusBadge } from '@/components/ui/bits'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { SmartImage } from '@/components/ui/SmartImage'
import { formatMoney } from '@/lib/money'
import { orderTimeline } from '@/lib/tracking'
import { toInternational } from '@/lib/phone'
import { whatsappUrl } from '@/lib/whatsapp'
import { toObjectId } from '@/server/http'
import { ORDER_TRANSITIONS, getOrderById } from '@/server/repos/orders'
import { getSettings } from '@/server/repos/settings'

export const metadata: Metadata = { title: 'Order' }

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let order
  try {
    order = await getOrderById(toObjectId(id))
  } catch {
    notFound()
  }
  if (!order) notFound()
  const settings = await getSettings()
  const customerChat = whatsappUrl(toInternational(order.customer.whatsapp), `Hello ${order.customer.fullName.split(' ')[0]}, this is ${settings.brandName} about your order ${order.number}.`)
  const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Accra' })

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-mute hover:text-ink"><ArrowLeft className="size-4" aria-hidden="true" /> Orders</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight tabular-nums">{order.number}</h1>
          <p className="mt-1 text-sm text-mute">Placed {when(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-700'}`}>{order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</span>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <section className="card p-5 sm:p-6" aria-label="Items">
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={`${i.productId}-${i.color}-${i.size}`} className="flex gap-4 py-4 first:pt-0">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-bone"><SmartImage src={i.image} alt="" className="size-full object-cover" /></div>
                  <div className="flex min-w-0 flex-1 justify-between gap-3 text-sm">
                    <div>
                      <Link href={`/admin/products/${i.productId}`} className="font-medium hover:underline">{i.name}</Link>
                      <p className="mt-0.5 text-mute">{i.color} · Size {i.size}</p>
                      <p className="mt-0.5 text-mute tabular-nums">{i.quantity} × {formatMoney(i.unitPrice)}</p>
                    </div>
                    <p className="font-medium tabular-nums">{formatMoney(i.lineTotal)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-line pt-5"><OrderTotals totals={order} /></div>
          </section>
          <section className="card p-5 sm:p-6">
            <h2 className="font-medium">History</h2>
            <ol className="mt-4 space-y-3 text-sm">
              {orderTimeline(order).map((h, n) => (
                <li key={n} className="flex gap-3">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n === 0 ? 'bg-ink' : 'bg-line'}`} />
                  <div><p className="font-medium">{h.isUpdate ? 'Update posted' : STATUS_LABELS[h.status]}</p><p className="text-xs text-mute">{when(h.at)}{h.note ? ` · ${h.note}` : ''}</p></div>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <div className="space-y-6 xl:col-span-4">
          <OrderStatusPanel key={`${order.status}-${order.paymentStatus}`} orderId={order.id} status={order.status} paymentStatus={order.paymentStatus} next={ORDER_TRANSITIONS[order.status]} />
          {order.status !== 'cancelled' && <OrderDeliveryForm key={order.updatedAt} orderId={order.id} delivery={order.delivery} />}
          <section className="card p-5 text-sm sm:p-6">
            <h2 className="font-medium">Customer</h2>
            <dl className="mt-3 space-y-2">
              <div><dt className="text-xs text-mute">Name</dt><dd>{order.customer.fullName}</dd></div>
              <div><dt className="text-xs text-mute">WhatsApp</dt><dd>{order.customer.whatsapp}</dd></div>
              <div><dt className="text-xs text-mute">Delivery address</dt><dd className="whitespace-pre-line">{order.customer.address}</dd></div>
              {order.customer.notes && <div><dt className="text-xs text-mute">Instructions</dt><dd className="whitespace-pre-line">{order.customer.notes}</dd></div>}
            </dl>
            <a href={customerChat} target="_blank" rel="noopener noreferrer" className={buttonClasses('whatsapp', 'md', 'mt-5 w-full')}>
              <MessageCircle className="size-4" aria-hidden="true" /> Message customer
            </a>
          </section>
        </div>
      </div>
    </div>
  )
}
