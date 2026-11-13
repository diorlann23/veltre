import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { AdminHeader, FilterTabs, Pagination, SearchForm } from '@/components/admin/AdminUI'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { SmartImage } from '@/components/ui/SmartImage'
import { totalStock, unitPrice } from '@/lib/catalog'
import { formatMoney } from '@/lib/money'
import { listAdminProducts } from '@/server/repos/products'

export const metadata: Metadata = { title: 'Products' }

type Props = { searchParams: Promise<{ q?: string; status?: string; page?: string }> }

const STATUS_STYLE = { active: 'bg-emerald-100 text-emerald-900', draft: 'bg-amber-100 text-amber-900', archived: 'bg-stone-200 text-stone-700' }

export default async function AdminProducts({ searchParams }: Props) {
  const sp = await searchParams
  const q = sp.q ?? ''
  const status = sp.status ?? ''
  const page = Math.max(1, Number(sp.page) || 1)
  const { products, total, pages } = await listAdminProducts({ q, status, page })
  const link = (over: Record<string, string>) => {
    const p = new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...over })
    for (const [k, v] of [...p]) if (!v) p.delete(k)
    return `/admin/products${p.size ? `?${p}` : ''}`
  }
  const tabs = [
    { label: 'All', value: '', href: link({ status: '', page: '' }) },
    { label: 'Active', value: 'active', href: link({ status: 'active', page: '' }) },
    { label: 'Draft', value: 'draft', href: link({ status: 'draft', page: '' }) },
    { label: 'Archived', value: 'archived', href: link({ status: 'archived', page: '' }) },
  ]

  return (
    <div className="space-y-6">
      <AdminHeader title="Products" description={`${total} product${total === 1 ? '' : 's'}`}>
        <Link href="/admin/products/new" className={buttonClasses()}><Plus className="size-4" aria-hidden="true" /> Add product</Link>
      </AdminHeader>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs tabs={tabs} active={status} />
        <SearchForm defaultValue={q} placeholder="Search products" hidden={{ status }} />
      </div>
      {products.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <p className="font-medium">{q || status ? 'No products match.' : 'No products yet.'}</p>
          {!q && !status && <Link href="/admin/products/new" className={buttonClasses('primary', 'md', 'mt-5')}>Add your first product</Link>}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-line text-left text-xs text-mute">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Collection</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => {
                const units = totalStock(p.variants)
                return (
                  <tr key={p.id} className="hover:bg-bone/40">
                    <td className="px-5 py-3">
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-medium hover:underline">
                        <span className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-bone"><SmartImage src={p.images[0]} alt="" className="size-full object-cover" /></span>
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-mute">{p.category?.name ?? '—'}</td>
                    <td className="px-5 py-3 tabular-nums">{formatMoney(unitPrice(p))}{p.salePrice !== null && <span className="ml-1 text-xs text-accent">sale</span>}</td>
                    <td className={`px-5 py-3 tabular-nums ${units === 0 ? 'text-accent' : ''}`}>{units === 0 ? 'Sold out' : `${units} units`}</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLE[p.status]}`}>{p.status}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} basePath="/admin/products" params={{ status, q }} />
    </div>
  )
}
