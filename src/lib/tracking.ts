import type { Order, OrderStatus } from './types'

export type StepState = 'done' | 'current' | 'upcoming'

export interface TrackingStep {
  status: Exclude<OrderStatus, 'cancelled'>
  label: string
  state: StepState
  /** When the order reached this step, or null if it hasn't (or skipped it). */
  at: string | null
}

const STEPS: { status: TrackingStep['status']; label: string }[] = [
  { status: 'pending', label: 'Order placed' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'processing', label: 'Packing' },
  { status: 'shipped', label: 'Out for delivery' },
  { status: 'delivered', label: 'Delivered' },
]

/** The furthest step the order reached; for a cancelled order, the step it was at when cancelled. */
export function reachedStatus(order: Pick<Order, 'status' | 'statusHistory'>): TrackingStep['status'] {
  if (order.status !== 'cancelled') return order.status
  const before = [...order.statusHistory].reverse().find((h) => h.status !== 'cancelled')
  return (before?.status as TrackingStep['status'] | undefined) ?? 'pending'
}

export function trackingSteps(order: Pick<Order, 'status' | 'statusHistory' | 'createdAt'>): TrackingStep[] {
  const reached = STEPS.findIndex((s) => s.status === reachedStatus(order))
  const delivered = order.status === 'delivered'
  return STEPS.map((step, i) => {
    // The first entry for a status is when the order reached it; later ones are updates posted by the store.
    const entry = order.statusHistory.find((h) => h.status === step.status)
    const state: StepState = i < reached || (i === reached && delivered) ? 'done' : i === reached ? 'current' : 'upcoming'
    return { ...step, state, at: entry?.at ?? (step.status === 'pending' ? order.createdAt : null) }
  })
}

export interface StatusCopy {
  lead: string
  highlight: string
  intro: string
  title: string
  detail: string
}

export const STATUS_COPY: Record<OrderStatus, StatusCopy> = {
  pending: {
    lead: 'We’ve got',
    highlight: 'your order!',
    intro: 'Follow every step of your order here, from confirmation to your doorstep.',
    title: 'Awaiting confirmation',
    detail: 'We’ll confirm stock, delivery and payment with you on WhatsApp shortly.',
  },
  confirmed: {
    lead: 'Your order is',
    highlight: 'confirmed!',
    intro: 'Thanks for shopping with us. Your items are reserved and will be packed soon.',
    title: 'Order confirmed',
    detail: 'Everything is in order. We’ll start packing your items shortly.',
  },
  processing: {
    lead: 'We’re packing',
    highlight: 'your order',
    intro: 'Your items are being checked and packed with care, ready for delivery.',
    title: 'Packing your order',
    detail: 'Your package will be handed to a courier as soon as it’s ready.',
  },
  shipped: {
    lead: 'Your order is',
    highlight: 'on its way!',
    intro: 'Your package has left our store and is heading to you. Keep your phone close.',
    title: 'Out for delivery',
    detail: 'Your package has left our store and is on its way to your delivery address.',
  },
  delivered: {
    lead: 'Delivered.',
    highlight: 'Enjoy!',
    intro: 'Your order has arrived. We hope you love it. Thank you for shopping with us.',
    title: 'Delivered',
    detail: 'Your package was delivered. Something not right? Message us on WhatsApp.',
  },
  cancelled: {
    lead: 'This order was',
    highlight: 'cancelled',
    intro: 'Nothing will be delivered for this order, and any reserved items have been released.',
    title: 'Order cancelled',
    detail: 'Changed your mind? You can place a new order anytime.',
  },
}

export interface TimelineEntry {
  status: OrderStatus
  at: string
  note: string
  /** True for a note the store posted without changing the status. */
  isUpdate: boolean
}

/** The order's history, newest first, telling status changes apart from updates posted along the way. */
export function orderTimeline(order: Pick<Order, 'statusHistory'>): TimelineEntry[] {
  return order.statusHistory.map((h, i) => ({ ...h, isUpdate: i > 0 && order.statusHistory[i - 1]!.status === h.status })).reverse()
}
