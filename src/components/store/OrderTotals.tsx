import { formatMoney, pluralize } from '@/lib/money'

interface Totals {
  itemCount: number
  subtotal: number
  deliveryFee: number | null
  total: number
}

export function OrderTotals({ totals, deliveryInfo }: { totals: Totals; deliveryInfo?: string }) {
  const pending = totals.deliveryFee === null
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-mute">Subtotal ({pluralize(totals.itemCount, 'item')})</dt>
        <dd className="font-medium tabular-nums">{formatMoney(totals.subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-mute">Delivery</dt>
        <dd className="text-right font-medium tabular-nums">{pending ? 'Confirmed separately' : formatMoney(totals.deliveryFee as number)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4">
        <dt className="font-display text-base font-semibold">Total</dt>
        <dd className="text-right">
          <span className="font-display text-xl font-semibold tabular-nums">{formatMoney(totals.total)}</span>
          {pending && <span className="block text-xs text-mute">excluding delivery</span>}
        </dd>
      </div>
      {pending && deliveryInfo && <p className="pt-1 text-xs leading-relaxed text-mute">{deliveryInfo}</p>}
    </dl>
  )
}
