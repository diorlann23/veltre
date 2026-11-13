import { describe, expect, it } from 'vitest'
import { orderTimeline, trackingSteps } from '@/lib/tracking'
import type { Order, OrderStatus } from '@/lib/types'

const at = (h: number) => `2026-10-14T${String(h).padStart(2, '0')}:00:00.000Z`
const order = (status: OrderStatus, history: [OrderStatus, number, string?][]): Pick<Order, 'status' | 'statusHistory' | 'createdAt'> => ({
  status,
  createdAt: at(8),
  statusHistory: history.map(([s, h, note = '']) => ({ status: s, at: at(h), note })),
})

const states = (o: ReturnType<typeof order>) => trackingSteps(o).map((s) => s.state)

describe('trackingSteps', () => {
  it('marks earlier steps done, the order’s status current and the rest upcoming', () => {
    expect(states(order('processing', [['pending', 8], ['confirmed', 9], ['processing', 10]]))).toEqual(['done', 'done', 'current', 'upcoming', 'upcoming'])
  })

  it('completes every step once delivered, even skipped ones', () => {
    const steps = trackingSteps(order('delivered', [['pending', 8], ['confirmed', 9], ['shipped', 11], ['delivered', 13]]))
    expect(steps.map((s) => s.state)).toEqual(['done', 'done', 'done', 'done', 'done'])
    expect(steps.find((s) => s.status === 'processing')?.at).toBeNull()
  })

  it('dates a step from when it was reached, not from later updates', () => {
    const steps = trackingSteps(order('shipped', [['pending', 8], ['confirmed', 9], ['shipped', 11], ['shipped', 12, 'Arriving this afternoon']]))
    expect(steps.find((s) => s.status === 'shipped')?.at).toBe(at(11))
  })

  it('freezes a cancelled order at the step it had reached', () => {
    expect(states(order('cancelled', [['pending', 8], ['confirmed', 9], ['cancelled', 10]]))).toEqual(['done', 'current', 'upcoming', 'upcoming', 'upcoming'])
  })
})

describe('orderTimeline', () => {
  it('lists newest first and tells posted updates apart from status changes', () => {
    const timeline = orderTimeline(order('shipped', [['pending', 8, 'Order placed'], ['shipped', 11], ['shipped', 12, 'Arriving this afternoon']]))
    expect(timeline.map((t) => [t.status, t.isUpdate])).toEqual([['shipped', true], ['shipped', false], ['pending', false]])
  })
})
