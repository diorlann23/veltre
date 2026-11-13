import type { Metadata } from 'next'
import Link from 'next/link'
import { AdminHeader, FilterTabs, Pagination, SearchForm } from '@/components/admin/AdminUI'
import { StatusBadge } from '@/components/ui/bits'
import { formatMoney } from '@/lib/money'
import { ORDER_STATUSES } from '@/lib/types'
import { listAdminOrders } from '@/server/repos/orders'

export const metadata: Metadata = { title: 'Orders' }

type Props = { searchParams: Promise<{ status?: string; q?: string; page?: string }> }

export default async function AdminOrders({ searchParams }: Props) {
  const sp = await searchParams
  const status = sp.status ?? ''
  const q = sp.q ?? ''
  const page = Math.max(1, Number(sp.page) || 1)
  const { orders, total, pages } = await listAdminOrders({ status, q, page })
  const link = (over: Record<string, string>) => {
    const p = new URLSearchParams({ ...(status && { status }), ...(q && { q }), ...over })
    for (const [k, v] of [...p]) if (!v) p.delete(k)
    return `/admin/orders${p.size ? `?${p}` : ''}`
  }
  const tabs = [{ label: 'All', value: '', href: link({ status: '', page: '' }) }, ...ORDER_STATUSES.map((s) => ({ label: s[0].toUpperCase() + s.slice(1), value: s, href: link({ status: s, page: '' }) }))]

  return (
    <div className="space-y-6">
      <AdminHeader title="Orders" description={`${total} order${total === 1 ? '' : 's'}`} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs tabs={tabs} active={status} />
        <SearchForm defaultValue={q} placeholder="Search number, name or phone" hidden={{ status }} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line text-left text-xs text-mute">
            <tr>
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Payment</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-mute">No orders found.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-bone/40">
                <td className="px-5 py-3.5"><Link href={`/admin/orders/${o.id}`} className="font-medium tabular-nums hover:underline">{o.number}</Link></td>
                <td className="px-5 py-3.5"><span className="block">{o.customer.fullName}</span><span className="text-xs text-mute">{o.customer.whatsapp}</span></td>
                <td className="px-5 py-3.5 text-mute">{new Date(o.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Accra' })}</td>
                <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                <td className="px-5 py-3.5"><span className={o.paymentStatus === 'paid' ? 'text-success' : 'text-mute'}>{o.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</span></td>
                <td className="px-5 py-3.5 text-right font-medium tabular-nums">{formatMoney(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={pages} basePath="/admin/orders" params={{ status, q }} />
    </div>
  )
}
