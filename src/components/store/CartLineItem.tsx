'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { useCart } from '@/components/providers/AppProviders'
import { QuantityStepper } from '@/components/ui/bits'
import { SmartImage } from '@/components/ui/SmartImage'
import { useToast } from '@/components/ui/Toaster'
import { formatMoney } from '@/lib/money'
import type { CartLine } from '@/lib/types'

export function CartLineItem({ line, compact, onNavigate }: { line: CartLine; compact?: boolean; onNavigate?: () => void }) {
  const { update, remove, add } = useCart()
  const toast = useToast()
  const href = line.slug ? `/product/${line.slug}` : '/shop'

  const onRemove = () => {
    const { productId, color, size, quantity } = line
    remove(line.key)
    toast({
      variant: 'info',
      title: 'Removed from cart',
      description: `${line.name} — ${color} / ${size}`,
      action: { label: 'Undo', onClick: () => add({ productId, color, size, quantity }, quantity) },
    })
  }

  return (
    <li className="flex gap-4 py-5">
      <Link href={href} onClick={onNavigate} className={`relative shrink-0 overflow-hidden rounded-xl bg-bone ${compact ? 'h-28 w-22' : 'h-36 w-28 sm:h-44 sm:w-36'}`}>
        <SmartImage src={line.image} alt={line.name} className={`size-full object-cover ${line.available ? '' : 'grayscale'}`} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={href} onClick={onNavigate} className="link-underline font-display text-[15px] font-medium tracking-tight">
              {line.name}
            </Link>
            <p className="mt-1 text-sm text-mute">
              {line.color} · Size {line.size}
            </p>
            {line.available && <p className="mt-1 text-sm text-mute tabular-nums">{formatMoney(line.unitPrice)} each</p>}
          </div>
          <button type="button" onClick={onRemove} className="-m-2 p-2 text-mute transition hover:text-ink" aria-label={`Remove ${line.name}, ${line.color}, size ${line.size}`}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        {line.available ? (
          <>
            <div className="mt-auto flex items-end justify-between gap-3 pt-3">
              <QuantityStepper size="sm" value={line.quantity} max={line.maxQuantity} onChange={(q) => update(line.key, q)} label={`Quantity for ${line.name}`} />
              <p className="text-sm font-medium tabular-nums">{formatMoney(line.lineTotal)}</p>
            </div>
            {line.quantity >= line.maxQuantity && <p className="mt-2 text-xs text-mute">Maximum available quantity selected.</p>}
          </>
        ) : (
          <p className="mt-auto pt-3 text-sm text-accent">No longer available — please remove it.</p>
        )}
      </div>
    </li>
  )
}
