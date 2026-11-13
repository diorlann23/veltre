import type { Metadata } from 'next'
import { AdminHeader, Pagination, SearchForm } from '@/components/admin/AdminUI'
import { CustomerActions } from '@/components/admin/CustomerActions'
import { formatMoney } from '@/lib/money'
import { requireAdminPage } from '@/server/auth'
import { listCustomers } from '@/server/repos/users'

export const metadata: Metadata = { title: 'Customers' }

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams
  const q = sp.q ?? ''
  const page = Math.max(1, Number(sp.page) || 1)
  const [me, { customers, total, pages }] = await Promise.all([requireAdminPage(), listCustomers({ q, page })])
  return (
    <div className="space-y-6">
      <AdminHeader title="Customers" description={`${total} account${total === 1 ? '' : 's'}`} />
      <SearchForm defaultValue={q} placeholder="Search name, email or phone" />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-line text-left text-xs text-mute">
            <tr>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Orders</th>
              <th className="px-5 py-3 font-medium">Spent</th>
              <th className="px-5 py-3 font-medium">Joined</th>
              <th className="px-5 py-3 text-right font-medium">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {customers.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-mute">No customers found.</td></tr>}
            {customers.map((c) => (
              <tr key={c.id} className={c.disabled ? 'opacity-55' : ''}>
                <td className="px-5 py-3">
                  <span className="block font-medium">{c.name} {c.role === 'admin' && <span className="ml-1 rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-paper uppercase">Admin</span>}</span>
                  <span className="text-xs text-mute">{c.email}</span>
                </td>
                <td className="px-5 py-3 text-mute">{c.phone}</td>
                <td className="px-5 py-3 tabular-nums">{c.orderCount}</td>
                <td className="px-5 py-3 tabular-nums">{formatMoney(c.totalSpent)}</td>
                <td className="px-5 py-3 text-mute">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className="px-5 py-3 text-right">{c.id !== me.id ? <CustomerActions id={c.id} name={c.name} role={c.role} disabled={c.disabled} /> : <span className="text-xs text-mute">You</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={pages} basePath="/admin/customers" params={{ q }} />
    </div>
  )
}
