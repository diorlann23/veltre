'use client'

import type { ReactNode } from 'react'
import { Accordion } from 'radix-ui'
import { ChevronDown } from 'lucide-react'

interface Item {
  value: string
  title: string
  content: ReactNode
}

export function Disclosures({ items, defaultValue }: { items: Item[]; defaultValue?: string[] }) {
  return (
    <Accordion.Root type="multiple" defaultValue={defaultValue} className="border-t border-line">
      {items.map((item) => (
        <Accordion.Item key={item.value} value={item.value} className="border-b border-line">
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-medium">
              {item.title}
              <ChevronDown className="size-4 shrink-0 transition-transform duration-300 group-data-[state=open]:rotate-180" aria-hidden="true" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden pb-6 text-sm leading-relaxed text-mute">{item.content}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}

export function ProductDetails({ details, fit, deliveryInfo, paymentInfo }: { details: string[]; fit: string; deliveryInfo: string; paymentInfo: string }) {
  const items: Item[] = [
    ...(details.length
      ? [{ value: 'details', title: 'Details', content: <ul className="list-disc space-y-1 pl-5">{details.map((d) => <li key={d}>{d}</li>)}</ul> }]
      : []),
    ...(fit ? [{ value: 'fit', title: 'Size & fit', content: <p>{fit}</p> }] : []),
    {
      value: 'ordering',
      title: 'Ordering, delivery & payment',
      content: (
        <>
          <p>Log in, check out, and send your order to us on WhatsApp. We confirm availability, delivery and payment with you directly.</p>
          {deliveryInfo && <p className="mt-3">{deliveryInfo}</p>}
          {paymentInfo && <p className="mt-3">{paymentInfo}</p>}
        </>
      ),
    },
  ]
  return (
    <div className="mt-10">
      <Disclosures items={items} defaultValue={details.length ? ['details'] : []} />
    </div>
  )
}
