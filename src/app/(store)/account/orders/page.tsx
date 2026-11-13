import type { Metadata } from 'next'
import Link from 'next/link'
import { ObjectId } from 'mongodb'
import { ChevronRight, Package } from 'lucide-react'
import { EmptyState, StatusBadge } from '@/components/ui/bits'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { formatMoney, pluralize } from '@/lib/money'
import { requireUserPage } from '@/server/auth'
import { listUserOrders } from '@/server/repos/orders'

export const metadata: Metadata = { title: 'My orders', robots: { index: false } }

export default async function OrdersPage() {
  const user = await requireUserPage('/account/orders')
  const orders = await listUserOrders(new ObjectId(user.id))
  if (orders.length === 0) {
    return (
      <EmptyState icon={Package} title="No orders yet" description="When you place an order it will appear here so you can track it." className="card">
        <Link href="/shop" className={buttonClasses()}>Start shopping</Link>
      </EmptyState>
    )
  }
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/account/orders/${o.number}`} className="card flex items-center gap-4 p-4 transition hover:border-ink/30 sm:p-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="font-medium tabular-nums">{o.number}</p>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-1 text-sm text-mute">
                {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {pluralize(o.itemCount, 'item')}
              </p>
            </div>
            <p className="font-medium tabular-nums">{formatMoney(o.total)}</p>
            <ChevronRight className="size-4 text-mute" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
