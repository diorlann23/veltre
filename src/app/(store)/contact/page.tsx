import type { Metadata } from 'next'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { ContactForm } from '@/components/store/ContactForm'
import { Disclosures } from '@/components/store/ProductDetails'
import { getSettings } from '@/server/repos/settings'

export const metadata: Metadata = { title: 'Contact' }

export default async function ContactPage() {
  const s = await getSettings()
  const channels = [
    s.contact.phone && { icon: Phone, label: 'Phone & WhatsApp', value: s.contact.phone, href: `https://wa.me/${s.whatsappNumber}` },
    s.contact.email && { icon: Mail, label: 'Email', value: s.contact.email, href: `mailto:${s.contact.email}` },
    s.contact.location && { icon: MapPin, label: 'Location', value: s.contact.location },
    s.contact.hours && { icon: Clock, label: 'Hours', value: s.contact.hours },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[]

  const faqs = [
    { q: 'How do I place an order?', a: 'Create an account or log in, add items to your cart and check out. Your order is saved to your account and sent to us on WhatsApp — press Send and we will reply to confirm.' },
    { q: 'How do I pay?', a: s.paymentInfo },
    { q: 'How much is delivery?', a: s.deliveryFee === null ? s.deliveryInfo : `Delivery is a flat fee shown at checkout. ${s.deliveryInfo}` },
    { q: 'How do I track my order?', a: 'Go to My account → My orders to see the status of every order. We also keep you updated on WhatsApp.' },
    { q: 'What if my size doesn’t fit?', a: s.exchangesInfo },
  ].filter((f) => f.a)

  return (
    <div className="container-x pt-8 lg:pt-14">
      <header className="max-w-3xl pb-10 lg:pb-16">
        <p className="eyebrow">Contact</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-7xl">Talk to us.</h1>
        <p className="mt-5 max-w-xl text-lg text-mute">Questions about sizing, an order or a restock? WhatsApp is the fastest way to reach us.</p>
      </header>
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <section className="lg:col-span-6" aria-labelledby="message-title">
          <ContactForm />
        </section>
        <section className="lg:col-span-5 lg:col-start-8" aria-label="Contact details">
          <ul className="space-y-6">
            {channels.map((c) => (
              <li key={c.label} className="flex gap-4">
                <c.icon className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <div>
                  <p className="eyebrow">{c.label}</p>
                  {c.href ? (
                    <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="link-underline mt-1 inline-block">
                      {c.value}
                    </a>
                  ) : (
                    <p className="mt-1">{c.value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div id="faq" className="mt-14 scroll-mt-28">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Ordering &amp; delivery</h2>
            <div className="mt-4">
              <Disclosures items={faqs.map((f, i) => ({ value: `faq-${i}`, title: f.q, content: <p>{f.a}</p> }))} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
