'use client'

import { Checkbox as RadixCheckbox, Switch as RadixSwitch } from 'radix-ui'
import { Check } from 'lucide-react'

export function Switch({
  id,
  checked,
  onCheckedChange,
  label,
  description,
}: {
  id: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-mute">{description}</span>}
      </label>
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="relative h-6 w-11 shrink-0 rounded-full bg-sand transition-colors data-[state=checked]:bg-ink"
      >
        <RadixSwitch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
      </RadixSwitch.Root>
    </div>
  )
}

export function Checkbox({ id, checked, onCheckedChange, label }: { id: string; checked: boolean; onCheckedChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <RadixCheckbox.Root
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-mute-soft transition hover:border-ink data-[state=checked]:border-ink data-[state=checked]:bg-ink"
      >
        <RadixCheckbox.Indicator>
          <Check className="size-3 text-paper" strokeWidth={3} aria-hidden="true" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
    </div>
  )
}
