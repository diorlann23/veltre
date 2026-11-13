import { BadgeCheck, Check, PackageCheck, PackageOpen, ShoppingBag, Truck, type LucideIcon } from 'lucide-react'
import type { TrackingStep } from '@/lib/tracking'

const ICONS: Record<TrackingStep['status'], LucideIcon> = {
  pending: ShoppingBag,
  confirmed: BadgeCheck,
  processing: PackageOpen,
  shipped: Truck,
  delivered: PackageCheck,
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Accra' })
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Africa/Accra' })

function Marker({ step, large }: { step: TrackingStep; large?: boolean }) {
  const Icon = ICONS[step.status]
  if (step.state === 'done')
    return (
      <span className="tk-fill inline-flex size-11 shrink-0 items-center justify-center rounded-full text-white shadow-[0_6px_16px_-4px_rgb(232_119_46/0.6)]">
        <Check className="size-5" strokeWidth={2.75} aria-hidden="true" />
      </span>
    )
  if (step.state === 'current')
    return (
      <span className={`tk-halo inline-flex shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-ember ${large ? 'size-16' : 'size-11'}`}>
        <span className={`tk-fill relative inline-flex items-center justify-center rounded-full text-white ${large ? 'size-12' : 'size-8'}`}>
          <Icon className={large ? 'size-6' : 'size-4'} aria-hidden="true" />
        </span>
      </span>
    )
  return (
    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-bone text-mute-soft">
      <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
    </span>
  )
}

function When({ step }: { step: TrackingStep }) {
  if (step.at)
    return (
      <>
        <span className="block">{day(step.at)}</span>
        <span className="block">{time(step.at)}</span>
      </>
    )
  return <span className="block">{step.state === 'upcoming' ? 'Pending' : 'Completed'}</span>
}

const stateLabel = { done: 'completed', current: 'current step', upcoming: 'not yet' }

export function TrackingProgress({ steps, cancelled }: { steps: TrackingStep[]; cancelled?: boolean }) {
  const reached = Math.max(0, steps.findLastIndex((s) => s.state !== 'upcoming'))
  const fill = `${(reached / (steps.length - 1)) * 100}%`

  return (
    <>
      {/* Wide screens: horizontal track */}
      <div className="relative hidden md:block">
        <div aria-hidden="true" className="absolute top-8 right-[10%] left-[10%] h-[3px] -translate-y-1/2 rounded-full bg-line">
          <div className={`h-full rounded-full ${cancelled ? 'bg-mute-soft' : 'tk-fill'}`} style={{ width: fill }} />
        </div>
        <ol className="relative grid grid-cols-5" aria-label="Order progress">
        {steps.map((step) => (
          <li key={step.status} className="relative flex flex-col items-center text-center">
            <span className="flex h-16 items-center">
              <Marker step={step} large />
            </span>
            <p className={`mt-3 text-sm font-semibold ${step.state === 'upcoming' ? 'text-mute' : ''}`}>
              {step.label}
              <span className="sr-only">, {stateLabel[step.state]}</span>
            </p>
            <p className={`mt-1 text-xs leading-relaxed tabular-nums ${step.state === 'current' ? 'text-ember-deep' : 'text-mute'}`}>
              <When step={step} />
            </p>
          </li>
        ))}
        </ol>
      </div>

      {/* Phones: vertical timeline */}
      <ol className="relative md:hidden" aria-label="Order progress">
        {steps.map((step, i) => (
          <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute top-11 bottom-0 left-[21px] w-[3px] rounded-full ${i < reached && !cancelled ? 'tk-fill' : 'bg-line'}`}
              />
            )}
            <Marker step={step} />
            <div className="min-w-0 pt-1.5">
              <p className={`text-sm font-semibold ${step.state === 'upcoming' ? 'text-mute' : ''}`}>
                {step.label}
                <span className="sr-only">, {stateLabel[step.state]}</span>
              </p>
              <p className={`mt-0.5 flex gap-1.5 text-xs tabular-nums ${step.state === 'current' ? 'text-ember-deep' : 'text-mute'}`}>
                {step.at ? `${day(step.at)} · ${time(step.at)}` : step.state === 'upcoming' ? 'Pending' : 'Completed'}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </>
  )
}
