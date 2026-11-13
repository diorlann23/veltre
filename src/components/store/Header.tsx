'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DropdownMenu } from 'radix-ui'
import { ArrowRight, LayoutDashboard, LogOut, Menu, Package, Phone, Search, ShoppingBag, User as UserIcon } from 'lucide-react'
import { useCart, useSession, useSettings } from '@/components/providers/AppProviders'
import { whatsappUrl } from '@/lib/whatsapp'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'
import { SearchDialog } from './SearchDialog'
import { isActivePath, mainNav } from './nav'

const iconBtn = 'relative inline-flex size-10 items-center justify-center rounded-xl text-ink transition-colors hover:bg-ink/5'
const menuItem = 'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none select-none data-[highlighted]:bg-bone'

function AccountMenu() {
  const { user, logout } = useSession()
  if (!user) {
    return (
      <Link href="/login" className={iconBtn} aria-label="Log in">
        <UserIcon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
      </Link>
    )
  }
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger className={iconBtn} aria-label="Account menu">
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={10} className="pop-anim z-50 w-60 rounded-2xl border border-line bg-paper p-1.5 shadow-xl">
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-mute">{user.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item asChild className={menuItem}>
            <Link href="/account">
              <UserIcon className="size-4 text-mute" aria-hidden="true" /> My account
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={menuItem}>
            <Link href="/account/orders">
              <Package className="size-4 text-mute" aria-hidden="true" /> My orders
            </Link>
          </DropdownMenu.Item>
          {user.role === 'admin' && (
            <DropdownMenu.Item asChild className={menuItem}>
              <Link href="/admin">
                <LayoutDashboard className="size-4 text-mute" aria-hidden="true" /> Admin dashboard
              </Link>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item className={menuItem} onSelect={() => logout()}>
            <LogOut className="size-4 text-mute" aria-hidden="true" /> Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export function Header() {
  const pathname = usePathname()
  const settings = useSettings()
  const { quote, items, setDrawerOpen } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const count = quote?.itemCount ?? items.reduce((s, i) => s + i.quantity, 0)
  const { contact, tagline } = settings
  const hasStrip = Boolean(contact.phone || contact.location || tagline)

  return (
    <>
      <header
        className={`fixed top-3 left-1/2 z-40 w-max max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-2xl border transition-all duration-500 ease-[var(--ease-premium)] sm:top-4 ${
          scrolled
            ? 'border-white/60 bg-white/70 shadow-[0_10px_25px_-3px_rgb(14_14_14/0.10),0_4px_6px_-4px_rgb(14_14_14/0.06)] backdrop-blur-2xl'
            : 'border-ink/[0.06] bg-white/55 shadow-[0_4px_20px_-8px_rgb(14_14_14/0.08)] backdrop-blur-xl'
        }`}
      >
        {hasStrip && (
          <div
            className={`hidden overflow-hidden border-b transition-all duration-500 ease-[var(--ease-premium)] sm:block ${
              scrolled ? 'max-h-0 border-transparent opacity-0' : 'max-h-10 border-ink/[0.07] opacity-100'
            }`}
            aria-hidden={scrolled}
          >
            <div className="flex h-10 items-center justify-between gap-8 px-6 text-[13px] text-mute lg:px-8">
              <div className="flex items-center gap-6">
                {contact.phone && (
                  <a
                    href={whatsappUrl(settings.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={scrolled ? -1 : undefined}
                    className="group flex items-center gap-2 transition-colors hover:text-ink"
                  >
                    <Phone className="size-3.5 transition-transform group-hover:scale-110" aria-hidden="true" />
                    {contact.phone}
                  </a>
                )}
                {contact.location && <span className="hidden md:inline">{contact.location}</span>}
              </div>
              {tagline && <span className="hidden text-xs tracking-wide md:inline">{tagline}</span>}
            </div>
          </div>
        )}

        <div className={`flex items-center justify-between gap-6 px-4 transition-all duration-500 sm:px-6 lg:gap-10 lg:px-8 ${scrolled ? 'h-14 sm:h-16' : 'h-14 sm:h-[4.5rem]'}`}>
          <Logo className="shrink-0 text-base sm:text-lg" />

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center">
              {mainNav.map((item) => {
                const active = isActivePath(pathname, item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`group relative inline-flex px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-300 ${active ? 'text-ink' : 'text-ink/65 hover:text-ink'}`}
                    >
                      {item.label}
                      <span
                        aria-hidden="true"
                        className={`absolute right-4 bottom-0 left-4 h-0.5 origin-left rounded-full bg-accent transition-transform duration-300 ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button type="button" className={`${iconBtn} max-sm:hidden`} onClick={() => setSearchOpen(true)} aria-label="Search products">
              <Search className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <div className="max-lg:hidden">
              <AccountMenu />
            </div>
            <button type="button" className={iconBtn} onClick={() => setDrawerOpen(true)} aria-label={`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
              <ShoppingBag className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
              {count > 0 && (
                <span
                  key={count}
                  className="absolute top-0.5 right-0.5 inline-flex min-w-[18px] animate-fade-in items-center justify-center rounded-full bg-accent px-1 text-[10px] leading-[18px] font-semibold text-paper tabular-nums"
                  aria-hidden="true"
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
            <Link
              href="/shop"
              className="group ml-2 hidden items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-paper transition-colors hover:bg-ink-soft lg:inline-flex"
            >
              Shop now
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <button type="button" className={`${iconBtn} -mr-1.5 lg:hidden`} onClick={() => setMenuOpen(true)} aria-label="Open main menu" aria-expanded={menuOpen}>
              <Menu className="size-6" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} onSearch={() => setSearchOpen(true)} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
