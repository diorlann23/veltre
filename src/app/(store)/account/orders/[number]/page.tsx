import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ObjectId } from 'mongodb'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Headphones,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  PackageOpen,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User as UserIcon,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { CancelOrderButton } from '@/components/store/AccountForms'
import { LiveRefresh } from '@/components/store/tracking/LiveRefresh'
import { TrackingHero } from '@/components/store/tracking/TrackingHero'
import { TrackingProgress } from '@/components/store/tracking/TrackingProgress'
import { STATUS_LABELS } from '@/components/ui/bits'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { SmartImage } from '@/components/ui/SmartImage'
import { formatMoney, pluralize } from '@/lib/money'
import { STATUS_COPY, orderTimeline, trackingSteps } from '@/lib/tracking'
import type { Order, OrderStatus } from '@/lib/types'
import { orderMessage, whatsappUrl } from '@/lib/whatsapp'
import { requireUserPage } from '@/server/auth'
import { siteUrl } from '@/server/env'
import { getUserOrder } from '@/server/repos/orders'
import { getSettings } from '@/server/repos/settings'

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ placed?: string; blocked?: string }> }

export const metadata: Metadata = { title: 'Track order', robots: { index: false } }

const TZ = 'Africa/Accra'
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ })
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ })
const calendarDay = (ymd: string) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ })

const STATUS_ICONS: Record<OrderStatus, LucideIcon> = {
  pending: ShoppingBag,
  confirmed: BadgeCheck,
  processing: PackageOpen,
  shipped: Truck,
  delivered: PackageCheck,
  cancelled: XCircle,
}

const ACTIVE: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped']

function deliveredAt(order: Order) {
  return [...order.statusHistory].reverse().find((h) => h.status === 'delivered')?.at ?? null
}

function SummaryItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-mute">{label}</dt>
      <dd className="mt-1.5">{children}</dd>
    </div>
  )
}

export default async function OrderPage({ params, searchParams }: Props) {
  const { number } = await params
  const { placed, blocked } = await searchParams
  const user = await requireUserPage(`/account/orders/${number}`)
  const order = await getUserOrder(new ObjectId(user.id), number)
  if (!order) notFound()
  const settings = await getSettings()
  const sendUrl = whatsappUrl(settings.whatsappNumber, orderMessage(order, settings.brandName, `${await siteUrl()}/admin/orders/${order.id}`))
  const helpUrl = whatsappUrl(settings.whatsappNumber, `Hello ${settings.brandName}, I have a question about my order ${order.number}.`)

  const steps = trackingSteps(order)
  const copy = STATUS_COPY[order.status]
  const active = ACTIVE.includes(order.status)
  const cancelled = order.status === 'cancelled'
  const { delivery } = order
  const StatusIcon = STATUS_ICONS[order.status]
  const delivered = deliveredAt(order)
  const timeline = orderTimeline(order)
  const latest = timeline.find((h) => h.note && h.note !== 'Order placed')


  return (
    <div className="space-y-6">
      {active && <LiveRefresh />}
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm text-mute hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" /> All orders
      </Link>

      {placed && order.status === 'pending' && (
        <div className="animate-fade-up rounded-2xl border border-whatsapp/30 bg-whatsapp/5 p-5 sm:p-6">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-whatsapp" aria-hidden="true" />
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">Order placed — now send it on WhatsApp</h2>
              <p className="mt-1 text-sm text-mute">
                {blocked ? 'WhatsApp didn’t open automatically. ' : ''}Press <strong className="text-ink">Send</strong> in WhatsApp so we can confirm availability, delivery and payment with you.
              </p>
              <a href={sendUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses('whatsapp', 'md', 'mt-4')}>
                <MessageCircle className="size-4" aria-hidden="true" /> Send order on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-6 lg:col-span-8">
          <TrackingHero status={order.status} />

          {/* Summary and progress */}
          <section className="card p-5 sm:p-7" aria-label="Order summary">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm sm:grid-cols-[auto_1fr_1fr_1fr] sm:divide-x sm:divide-line [&>div]:sm:pl-6 [&>div:first-child]:col-span-2 [&>div:first-child]:sm:col-span-1 [&>div:first-child]:sm:pl-0">
                <SummaryItem label="Order number">
                  <span className="font-display text-lg font-semibold tracking-tight whitespace-nowrap tabular-nums sm:text-base xl:text-lg">{order.number}</span>
                </SummaryItem>
                <SummaryItem label="Placed on">
                  <span className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-mute" aria-hidden="true" />
                    <span>
                      <span className="block font-medium">{day(order.createdAt)}</span>
                      <span className="block text-xs text-mute">{time(order.createdAt)}</span>
                    </span>
                  </span>
                </SummaryItem>
                <SummaryItem label="Payment">
                  <span className="flex items-start gap-2">
                    {order.paymentStatus === 'paid' ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    ) : (
                      <Clock className="mt-0.5 size-4 shrink-0 text-ember-deep" aria-hidden="true" />
                    )}
                    <span>
                      <span className={`block font-medium ${order.paymentStatus === 'paid' ? 'text-success' : 'text-ember-deep'}`}>
                        {order.paymentStatus === 'paid' ? 'Paid' : cancelled ? 'Not charged' : 'Awaiting payment'}
                      </span>
                      <span className="block text-xs text-mute">{delivery.paymentMethod || (order.paymentStatus === 'paid' ? 'Received' : 'Arranged on WhatsApp')}</span>
                    </span>
                  </span>
                </SummaryItem>
                <SummaryItem label={delivered ? 'Delivered on' : 'Estimated delivery'}>
                  <span className="flex items-start gap-2">
                    <Clock className="mt-0.5 size-4 shrink-0 text-mute" aria-hidden="true" />
                    <span>
                      <span className="block font-medium">{delivered ? day(delivered) : cancelled ? '—' : delivery.estimatedDate ? calendarDay(delivery.estimatedDate) : 'To be confirmed'}</span>
                      <span className="block text-xs text-mute">{delivered ? time(delivered) : cancelled ? 'Cancelled' : delivery.estimatedDate ? 'Estimated' : 'We’ll let you know'}</span>
                    </span>
                  </span>
                </SummaryItem>
              </dl>
              <a href="#order-items" className={buttonClasses('primary', 'md', 'shrink-0 self-start xl:self-center')}>
                View order details <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>

            <div className="mt-7 border-t border-line pt-7">
              <TrackingProgress steps={steps} cancelled={cancelled} />
            </div>
          </section>

          {/* Current status and the store's latest update */}
          <section className="on-dark grid gap-6 rounded-2xl bg-ink p-5 text-paper sm:p-6 md:grid-cols-[1fr_auto] md:items-center" aria-label="Current status">
            <div className="flex gap-4">
              <span
                className={`relative inline-flex size-16 shrink-0 items-center justify-center rounded-2xl ${cancelled ? 'bg-paper/10 text-paper/60' : 'tk-halo bg-ember/15 text-ember-soft ring-1 ring-ember/40'}`}
              >
                <StatusIcon className="relative size-7" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <p className="text-[11px] font-semibold tracking-[0.22em] text-paper/50 uppercase">
                    <span className="text-ember-soft">Current</span> status
                  </p>
                  {active && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-ember/50 px-2.5 py-0.5 text-[11px] font-medium text-ember-soft">
                      <span className="tk-dot size-1.5 rounded-full bg-ember" aria-hidden="true" /> Live updates
                    </span>
                  )}
                </div>
                <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight">{copy.title}</h2>
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-paper/65">{copy.detail}</p>
                {order.status === 'pending' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a href={sendUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses('inverse', 'sm')}>
                      <MessageCircle className="size-4" aria-hidden="true" /> Resend on WhatsApp
                    </a>
                    <CancelOrderButton number={order.number} className="text-ember-soft hover:bg-paper/10" />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-paper/10 pt-5 text-sm md:w-[17rem] md:border-t-0 md:border-l md:pt-0 md:pl-6">
              {latest ? (
                <>
                  <p className="text-xs text-paper/50">Latest update from {settings.brandName}</p>
                  <p className="mt-1.5 leading-relaxed font-medium">“{latest.note}”</p>
                  <p className="mt-1 text-xs text-paper/50 tabular-nums">
                    {day(latest.at)} · {time(latest.at)}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">Questions about your order?</p>
                  <p className="mt-1 text-paper/60">We usually reply within minutes.</p>
                </>
              )}
              <a href={helpUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full border border-paper/25 px-3.5 text-xs font-medium transition hover:bg-paper hover:text-ink">
                <MessageCircle className="size-3.5" aria-hidden="true" /> Chat with us
              </a>
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          {/* Updates from the store */}
          <section className="card p-5 sm:p-6" aria-label="Order updates">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2.5 font-semibold">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-ember/10 text-ember">
                  <Clock className="size-4" aria-hidden="true" />
                </span>
                Order updates
              </h2>
              {active ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                  <span className="tk-dot size-2 rounded-full bg-success" aria-hidden="true" /> Live
                </span>
              ) : (
                <span className="text-xs font-medium text-mute">{STATUS_LABELS[order.status]}</span>
              )}
            </div>
            <ol className="mt-5">
              {timeline.map((h, i) => (
                <li key={`${h.at}-${i}`} className="relative flex gap-3.5 pb-5 last:pb-0">
                  {i < timeline.length - 1 && <span aria-hidden="true" className="absolute top-4 bottom-0 left-[5px] w-px bg-line" />}
                  <span className={`relative mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-paper ${i === 0 ? (cancelled ? 'bg-mute' : 'tk-fill') : 'bg-sand'}`} />
                  <div className="min-w-0 text-sm">
                    <p className="font-medium">{h.isUpdate ? `Update from ${settings.brandName}` : STATUS_LABELS[h.status]}</p>
                    {h.note && <p className="mt-0.5 leading-relaxed break-words text-ink/80">{h.note}</p>}
                    <p className="mt-0.5 text-xs text-mute tabular-nums">
                      {day(h.at)} · {time(h.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Delivery information */}
          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2.5 font-semibold">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-ember/10 text-ember">
                <MapPin className="size-4" aria-hidden="true" />
              </span>
              Delivery information
            </h2>
            <dl className="mt-4 divide-y divide-line text-sm">
              {[
                { icon: UserIcon, label: 'Recipient', value: order.customer.fullName },
                { icon: Phone, label: 'Phone', value: order.customer.whatsapp },
                { icon: MapPin, label: 'Address', value: order.customer.address },
                ...(order.customer.notes ? [{ icon: MessageCircle, label: 'Notes', value: order.customer.notes }] : []),
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-[1.25rem_5.5rem_1fr] items-start gap-2 py-3 first:pt-0 last:pb-0">
                  <row.icon className="mt-0.5 size-4 text-mute" aria-hidden="true" />
                  <dt className="text-mute">{row.label}</dt>
                  <dd className="font-medium break-words whitespace-pre-line">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Package */}
          <section id="order-items" className="on-dark scroll-mt-28 rounded-2xl bg-ink p-5 text-paper sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2.5 font-semibold">
                <Package className="size-5 text-ember-soft" aria-hidden="true" /> Package details
              </h2>
              <span className="text-xs text-paper/55">{pluralize(order.itemCount, 'item')}</span>
            </div>
            <ul className="mt-4 space-y-3">
              {order.items.map((i) => (
                <li key={`${i.productId}-${i.color}-${i.size}`} className="flex items-center gap-3 rounded-xl bg-paper/[0.06] p-2.5">
                  <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-paper/10">
                    <SmartImage src={i.image} alt="" className="size-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <Link href={`/product/${i.slug}`} className="line-clamp-1 font-medium hover:underline">
                      {i.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-paper/55">
                      {i.color} · Size {i.size} · Qty {i.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatMoney(i.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t border-paper/10 pt-4 text-sm">
              <div className="flex justify-between text-paper/65">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{formatMoney(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-paper/65">
                <dt>Delivery</dt>
                <dd className="tabular-nums">{order.deliveryFee === null ? 'Confirmed on WhatsApp' : order.deliveryFee === 0 ? 'Free' : formatMoney(order.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatMoney(order.total)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      {/* Reassurance */}
      <section className="on-dark grid gap-5 rounded-2xl bg-ink px-5 py-6 text-paper sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:items-center" aria-label="Why shop with us">
        {[
          { icon: ShieldCheck, title: 'Secure & private', text: 'Your details stay with us.' },
          { icon: Headphones, title: 'WhatsApp support', text: 'Real people, quick replies.', href: helpUrl },
          { icon: Clock, title: 'Updates at every step', text: 'This page refreshes itself.' },
        ].map((f) => (
          <div key={f.title} className="flex items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-paper/15">
              <f.icon className="size-5 text-ember-soft" aria-hidden="true" />
            </span>
            <div className="text-sm">
              {f.href ? (
                <a href={f.href} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                  {f.title}
                </a>
              ) : (
                <p className="font-semibold">{f.title}</p>
              )}
              <p className="text-xs text-paper/55">{f.text}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-1 lg:justify-end">
          <span className="text-lg tracking-[0.08em] text-ember-soft italic" style={{ fontFamily: 'var(--font-splash), var(--font-display)' }}>
            Shop with confidence
          </span>
          <img src="/icons/splash-mark.png" alt="" width={40} height={40} className="size-10" />
        </div>
      </section>
    </div>
  )
}
