'use client'

import { Select as RadixSelect } from 'radix-ui'
import { Check, ChevronDown } from 'lucide-react'

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  options: readonly { value: string; label: string }[]
  label: string
  id?: string
  className?: string
  placeholder?: string
}

export function Select({ value, onValueChange, options, label, id, className = '', placeholder }: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger
        id={id}
        aria-label={label}
        className={`inline-flex h-10 items-center justify-between gap-2 rounded-full border border-line bg-white/60 pr-3 pl-4 text-sm transition hover:border-ink focus:border-ink focus:outline-none data-[placeholder]:text-mute-soft ${className}`}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown className="size-4" aria-hidden="true" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="pop-anim z-50 max-h-80 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-line bg-paper p-1 shadow-xl"
        >
          <RadixSelect.Viewport>
            {options.map((o) => (
              <RadixSelect.Item
                key={o.value}
                value={o.value}
                className="relative flex cursor-pointer items-center rounded-lg py-2 pr-3 pl-8 text-sm outline-none select-none data-[highlighted]:bg-bone"
              >
                <RadixSelect.ItemIndicator className="absolute left-2.5">
                  <Check className="size-4" aria-hidden="true" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}
