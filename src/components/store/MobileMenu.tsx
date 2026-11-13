'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, LogIn, LogOut, Mail, MapPin, MessageCircle, Package, Phone, Search, ShoppingBag, UserPlus, User as UserIcon } from 'lucide-react'
import { useSession, useSettings } from '@/components/providers/AppProviders'
import { Sheet } from '@/components/ui/Sheet'
import { whatsappUrl } from '@/lib/whatsapp'
import { isActivePath, mainNav } from './nav'

const row = 'flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors'

export function MobileMenu({ open, onOpenChange, onSearch }: { open: boolean; onOpenChange: (o: boolean) => void; onSearch: () => void }) {
  const pathname = usePathname()
  const settings = useSettings()
  const { user, logout } = useSession()
  const close = () => onOpenChange(false)
  const socials = Object.entries(settings.social).filter(([, url]) => url)
  const chat = whatsappUrl(settings.whatsappNumber, `Hello ${settings.brandName}, I have a question.`)

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Menu">
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
        <nav aria-label="Mobile">
          <ul className="space-y-1">
            {mainNav.map((item) => {
              const active = isActivePath(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={close} aria-current={active ? 'page' : undefined} className={`${row} ${active ? 'bg-bone text-ink' : 'text-ink/75 hover:bg-bone/60 hover:text-ink'}`}>
                    {item.label}
                  </Link>
                </li>
              )
            })}
            <li>
              <button type="button" onClick={() => {
                  close()
                  onSearch()
                }} className={`${row} w-full text-ink/75 hover:bg-bone/60 hover:text-ink`}>
                <Search className="size-4" aria-hidden="true" /> Search
              </button>
            </li>
          </ul>
        </nav>

        <div className="mt-5 border-t border-line pt-5">
          <p className="eyebrow px-4">Account</p>
          <ul className="mt-2 space-y-1">
            {user ? (
              <>
                <li>
                  <Link href="/account" onClick={close} className={`${row} text-ink/75 hover:bg-bone/60`}>
                    <UserIcon className="size-4 text-mute" aria-hidden="true" /> My account
                  </Link>
                </li>
                <li>
                  <Link href="/account/orders" onClick={close} className={`${row} text-ink/75 hover:bg-bone/60`}>
                    <Package className="size-4 text-mute" aria-hidden="true" /> My orders
                  </Link>
                </li>
                {user.role === 'admin' && (
                  <li>
                    <Link href="/admin" onClick={close} className={`${row} text-ink/75 hover:bg-bone/60`}>
                      <LayoutDashboard className="size-4 text-mute" aria-hidden="true" /> Admin dashboard
                    </Link>
                  </li>
                )}
                <li>
                  <button type="button" onClick={() => {
                      close()
                      logout()
                    }} className={`${row} w-full text-ink/75 hover:bg-bone/60`}>
                    <LogOut className="size-4 text-mute" aria-hidden="true" /> Log out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/login" onClick={close} className={`${row} text-ink/75 hover:bg-bone/60`}>
                    <LogIn className="size-4 text-mute" aria-hidden="true" /> Log in
                  </Link>
                </li>
                <li>
                  <Link href="/register" onClick={close} className={`${row} text-ink/75 hover:bg-bone/60`}>
                    <UserPlus className="size-4 text-mute" aria-hidden="true" /> Create account
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="mt-5 border-t border-line px-4 pt-6">
          <p className="eyebrow">Contact us</p>
          <ul className="mt-4 space-y-3 text-sm text-ink/80">
            {settings.contact.phone && (
              <li>
                <a href={chat} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-ink">
                  <Phone className="size-4 text-mute" aria-hidden="true" /> {settings.contact.phone}
                </a>
              </li>
            )}
            {settings.contact.email && (
              <li>
                <a href={`mailto:${settings.contact.email}`} className="flex items-center gap-3 hover:text-ink">
                  <Mail className="size-4 text-mute" aria-hidden="true" /> {settings.contact.email}
                </a>
              </li>
            )}
            {settings.contact.location && (
              <li className="flex items-center gap-3">
                <MapPin className="size-4 text-mute" aria-hidden="true" /> {settings.contact.location}
              </li>
            )}
          </ul>
          <div className="mt-6 grid gap-2">
            <Link href="/shop" onClick={close} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-paper hover:bg-ink-soft">
              <ShoppingBag className="size-4" aria-hidden="true" /> Shop now
            </Link>
            <a href={chat} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold hover:border-ink">
              <MessageCircle className="size-4" aria-hidden="true" /> Chat on WhatsApp
            </a>
          </div>
          {socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-mute capitalize">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                    {name === 'x' ? 'X' : name}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {settings.tagline && <p className="mt-6 pb-4 text-center text-sm text-mute italic">“{settings.tagline}”</p>}
        </div>
      </div>
    </Sheet>
  )
}
