import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, Minus, Plus, type LucideIcon } from 'lucide-react'
import { isOnSale, unitPrice } from '@/lib/catalog'
import { formatMoney } from '@/lib/money'
import type { OrderStatus, Product } from '@/lib/types'

export function Price({ product, className = '' }: { product: Pick<Product, 'price' | 'salePrice'>; className?: string }) {
  if (!isOnSale(product)) return <span className={className}>{formatMoney(product.price)}</span>
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className="text-accent">
        <span className="sr-only">Sale price </span>
        {formatMoney(unitPrice(product))}
      </span>
      <s className="text-mute-soft">
        <span className="sr-only">Original price </span>
        {formatMoney(product.price)}
      </s>
    </span>
  )
}

export function QuantityStepper({
  value,
  max,
  min = 1,
  onChange,
  label,
  size = 'md',
}: {
  value: number
  max: number
  min?: number
  onChange: (v: number) => void
  label: string
  size?: 'sm' | 'md'
}) {
  const box = size === 'sm' ? 'size-9' : 'size-12'
  const btn = `${box} inline-flex items-center justify-center transition hover:bg-bone disabled:opacity-30 disabled:hover:bg-transparent`
  return (
    <div className="inline-flex items-center overflow-hidden rounded-full border border-line bg-white/60" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Minus className="size-3.5" aria-hidden="true" />
      </button>
      <span className="w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className = '',
}: {
  icon: LucideIcon
  title: string
  description: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center px-6 py-16 text-center ${className}`}>
      <span className="mb-6 inline-flex size-16 items-center justify-center rounded-full border border-line">
        <Icon className="size-6 text-mute" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-sm text-mute">{description}</p>
      {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  )
}

export function SectionHeading({ eyebrow, title, link, id }: { eyebrow?: string; title: string; link?: { href: string; label: string }; id?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 lg:mb-12">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 id={id} className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h2>
      </div>
      {link && (
        <Link href={link.href} className="group hidden shrink-0 items-center gap-2 text-sm font-semibold sm:inline-flex">
          <span className="link-underline">{link.label}</span>
          <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-sky-100 text-sky-900',
  processing: 'bg-indigo-100 text-indigo-900',
  shipped: 'bg-violet-100 text-violet-900',
  delivered: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-stone-200 text-stone-700',
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Awaiting confirmation',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="border-b border-line pb-8">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      {children}
    </header>
  )
}
