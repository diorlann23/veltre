import { formatMoney } from './money'
import type { Order } from './types'

export function whatsappUrl(number: string, message?: string): string {
  const base = `https://wa.me/${number}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export function orderMessage(order: Order, brandName: string, adminUrl?: string): string {
  const when = new Date(order.createdAt).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Accra',
  })
  const items = order.items.map((l, i) =>
    [
      `${i + 1}. *${l.name}*`,
      `   Size: ${l.size} | Colour: ${l.color}`,
      `   Qty: ${l.quantity} × ${formatMoney(l.unitPrice)} = ${formatMoney(l.lineTotal)}`,
    ].join('\n'),
  )
  const pendingDelivery = order.deliveryFee === null
  const notes = order.customer.notes.trim()

  return [
    `*NEW ORDER — ${brandName}*`,
    `Order: ${order.number}`,
    `Date: ${when}`,
    '',
    '*Customer details*',
    `Name: ${order.customer.fullName}`,
    `WhatsApp: ${order.customer.whatsapp}`,
    `Delivery address: ${order.customer.address}`,
    ...(notes ? [`Instructions: ${notes}`] : []),
    '',
    `*Items (${order.itemCount})*`,
    items.join('\n\n'),
    '',
    `Subtotal: ${formatMoney(order.subtotal)}`,
    `Delivery: ${pendingDelivery ? 'To be confirmed by seller' : formatMoney(order.deliveryFee as number)}`,
    pendingDelivery
      ? `*Order total: ${formatMoney(order.total)}* (excluding delivery)`
      : `*Order total: ${formatMoney(order.total)}*`,
    ...(adminUrl ? ['', `Manage order: ${adminUrl}`] : []),
    '',
    'Please confirm availability, delivery and payment details. Thank you!',
  ].join('\n')
}
