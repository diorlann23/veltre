'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, Search, User as UserIcon } from 'lucide-react'
import { useSession } from '@/components/providers/AppProviders'
import { isActivePath } from './nav'

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useSession()
  const items = [
    { label: 'Home', href: '/', icon: Home, active: pathname === '/' },
    { label: 'Shop', href: '/shop', icon: Search, active: isActivePath(pathname, '/shop') || isActivePath(pathname, '/product') },
    { label: 'Collections', href: '/collections', icon: LayoutGrid, active: isActivePath(pathname, '/collections') },
    {
      label: user ? 'Account' : 'Log in',
      href: user ? '/account' : '/login',
      icon: UserIcon,
      active: isActivePath(pathname, '/account') || pathname === '/login' || pathname === '/register',
    },
  ]
  return (
    <nav
      aria-label="App"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 rounded-2xl border border-white/60 bg-white/80 shadow-[0_10px_30px_-8px_rgb(14_14_14/0.18)] backdrop-blur-2xl lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${item.active ? 'text-ink' : 'text-mute hover:text-ink'}`}
            >
              <span className={`inline-flex h-7 w-12 items-center justify-center rounded-full transition-colors ${item.active ? 'bg-bone' : ''}`}>
                <item.icon className="size-[18px]" strokeWidth={item.active ? 2 : 1.75} aria-hidden="true" />
              </span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
