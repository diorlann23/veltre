'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { InstallAppLink } from '@/components/pwa/InstallPrompt'
import { useSettings } from '@/components/providers/AppProviders'
import { whatsappUrl } from '@/lib/whatsapp'
import { Logo } from './Logo'

export function Footer({ categories }: { categories: { slug: string; name: string }[] }) {
  const s = useSettings()
  const socials = Object.entries(s.social).filter(([, url]) => url)
  const year = new Date().getFullYear()

  return (
    <footer className="on-dark mt-24 bg-ink pb-[calc(4.5rem+env(safe-area-inset-bottom))] text-paper lg:mt-32 lg:pb-0">
      <div className="container-x grid gap-12 py-16 md:grid-cols-12 lg:py-20">
        <div className="md:col-span-5">
          <Logo className="text-2xl" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-paper/65">{s.description}</p>
          <a
            href={whatsappUrl(s.whatsappNumber, `Hello ${s.brandName}, I have a question.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 border-b border-paper/40 pb-1 text-sm font-medium transition hover:border-paper"
          >
            Chat with us on WhatsApp <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </div>
        <nav aria-label="Shop" className="md:col-span-2">
          <h2 className="eyebrow text-paper/50">Shop</h2>
          <ul className="mt-5 space-y-3 text-sm text-paper/80">
            <li>
              <Link href="/shop" className="hover:text-paper">All products</Link>
            </li>
            <li>
              <Link href="/shop?sort=newest" className="hover:text-paper">New arrivals</Link>
            </li>
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="hover:text-paper">{c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Information" className="md:col-span-2">
          <h2 className="eyebrow text-paper/50">Info</h2>
          <ul className="mt-5 space-y-3 text-sm text-paper/80">
            <li><Link href="/about" className="hover:text-paper">About</Link></li>
            <li><Link href="/contact" className="hover:text-paper">Contact</Link></li>
            <li><Link href="/contact#faq" className="hover:text-paper">Ordering &amp; delivery</Link></li>
            <li><Link href="/account/orders" className="hover:text-paper">Track an order</Link></li>
            <li><InstallAppLink className="hover:text-paper" /></li>
          </ul>
        </nav>
        <div className="md:col-span-3">
          <h2 className="eyebrow text-paper/50">Contact</h2>
          <ul className="mt-5 space-y-3 text-sm text-paper/80">
            {s.contact.phone && <li>{s.contact.phone}</li>}
            {s.contact.email && (
              <li>
                <a href={`mailto:${s.contact.email}`} className="hover:text-paper">{s.contact.email}</a>
              </li>
            )}
            {s.contact.location && <li>{s.contact.location}</li>}
            {s.contact.hours && <li className="text-paper/60">{s.contact.hours}</li>}
          </ul>
          {socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm capitalize">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-paper/80 hover:text-paper">
                    {name === 'x' ? 'X' : name} <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {s.brandName}. All rights reserved.</p>
          <p>Orders are confirmed on WhatsApp. No payment is taken on this website.</p>
        </div>
      </div>
      <div aria-hidden="true" className="overflow-hidden">
        <p className="wordmark -mb-[0.18em] text-center text-[14.5vw] leading-none text-paper/[0.04] select-none">{s.brandName}</p>
      </div>
    </footer>
  )
}
