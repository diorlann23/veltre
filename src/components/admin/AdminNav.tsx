'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, LayoutDashboard, LayoutGrid, LogOut, Package, Settings, Shirt, Users } from 'lucide-react'
import { useSession, useSettings } from '@/components/providers/AppProviders'

const items = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: Package },
  { href: '/admin/products', label: 'Products', icon: Shirt },
  { href: '/admin/collections', label: 'Collections', icon: LayoutGrid },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminNav({ pendingOrders }: { pendingOrders: number }) {
  const pathname = usePathname()
  const { brandName } = useSettings()
  const { user, logout } = useSession()
  const active = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`))

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-white/50 lg:flex">
        <div className="flex h-16 items-center justify-between border-b border-line px-6">
          <Link href="/admin" className="wordmark text-base">{brandName}</Link>
          <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold tracking-wide text-paper uppercase">Admin</span>
        </div>
        <nav aria-label="Admin" className="flex-1 space-y-1 p-3">
          {items.map((i) => (
            <Link key={i.href} href={i.href} aria-current={active(i.href, i.exact) ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active(i.href, i.exact) ? 'bg-ink text-paper' : 'text-ink/70 hover:bg-bone hover:text-ink'}`}>
              <i.icon className="size-4" aria-hidden="true" />
              {i.label}
              {i.href === '/admin/orders' && pendingOrders > 0 && <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-paper tabular-nums">{pendingOrders}</span>}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-line p-3 text-sm">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-ink/70 hover:bg-bone hover:text-ink">
            <ExternalLink className="size-4" aria-hidden="true" /> View store
          </Link>
          <button type="button" onClick={() => logout()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-ink/70 hover:bg-bone hover:text-ink">
            <LogOut className="size-4" aria-hidden="true" /> Log out
          </button>
          <p className="truncate px-3 pt-2 text-xs text-mute">{user?.email}</p>
        </div>
      </aside>

      <div className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/admin" className="wordmark text-sm">{brandName}</Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-mute">
            Store <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        <nav aria-label="Admin" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
          {items.map((i) => (
            <Link key={i.href} href={i.href} aria-current={active(i.href, i.exact) ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium ${active(i.href, i.exact) ? 'bg-ink text-paper' : 'text-ink/70'}`}>
              <i.icon className="size-3.5" aria-hidden="true" /> {i.label}
              {i.href === '/admin/orders' && pendingOrders > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] text-paper tabular-nums">{pendingOrders}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
