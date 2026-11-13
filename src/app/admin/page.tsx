import Link from 'next/link'
import { AlertTriangle, ArrowRight, Package, Plus, Shirt, Users, Wallet } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminUI'
import { StatusBadge } from '@/components/ui/bits'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { formatMoney } from '@/lib/money'
import { dashboardStats } from '@/server/repos/stats'

export default async function AdminDashboard() {
  const s = await dashboardStats()
  const cards = [
    { label: 'Pending orders', value: String(s.pendingOrders), icon: Package, href: '/admin/orders?status=pending', highlight: s.pendingOrders > 0 },
    { label: 'Orders · 30 days', value: String(s.orders30d), icon: Package, href: '/admin/orders' },
    { label: 'Order value · 30 days', value: formatMoney(s.revenue30d), icon: Wallet, href: '/admin/orders' },
    { label: 'Customers', value: String(s.customers), icon: Users, href: '/admin/customers' },
    { label: 'Active products', value: String(s.activeProducts), icon: Shirt, href: '/admin/products' },
  ]
  return (
    <div className="space-y-8">
      <AdminHeader title="Dashboard" description="Your store at a glance.">
        <Link href="/admin/products/new" className={buttonClasses('primary', 'md')}>
          <Plus className="size-4" aria-hidden="true" /> Add product
        </Link>
      </AdminHeader>

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        {cards.map((c) => (
          <li key={c.label}>
            <Link href={c.href} className={`card block p-4 transition hover:border-ink/30 sm:p-5 ${c.highlight ? 'border-accent/40 bg-accent/5' : ''}`}>
              <c.icon className="size-4 text-mute" aria-hidden="true" />
              <p className="mt-3 font-display text-2xl font-semibold tracking-tight tabular-nums">{c.value}</p>
              <p className="mt-1 text-xs text-mute">{c.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 xl:grid-cols-12">
        <section className="card overflow-hidden xl:col-span-8" aria-labelledby="recent-title">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="recent-title" className="font-medium">Recent orders</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-mute hover:text-ink">View all <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
          </div>
          {s.recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-mute">No orders yet. They will appear here as soon as customers check out.</p>
          ) : (
            <ul className="divide-y divide-line">
              {s.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 text-sm hover:bg-bone/50">
                    <span className="font-medium tabular-nums">{o.number}</span>
                    <span className="min-w-0 flex-1 truncate text-mute">{o.customer.fullName}</span>
                    <StatusBadge status={o.status} />
                    <span className="w-24 text-right font-medium tabular-nums">{formatMoney(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card overflow-hidden xl:col-span-4" aria-labelledby="stock-title">
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            <AlertTriangle className="size-4 text-accent" aria-hidden="true" />
            <h2 id="stock-title" className="font-medium">Low stock</h2>
          </div>
          {s.lowStock.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-mute">All variants are well stocked.</p>
          ) : (
            <ul className="divide-y divide-line">
              {s.lowStock.map((l) => (
                <li key={`${l.id}-${l.color}-${l.size}`}>
                  <Link href={`/admin/products/${l.id}`} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-bone/50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{l.name}</span>
                      <span className="text-xs text-mute">{l.color} · {l.size}</span>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${l.stock === 0 ? 'bg-accent text-paper' : 'bg-amber-100 text-amber-900'}`}>{l.stock === 0 ? 'Sold out' : `${l.stock} left`}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
