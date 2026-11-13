'use client'

import type { ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  side?: 'right' | 'top'
  hideTitle?: boolean
  children: ReactNode
  className?: string
}

export function Sheet({ open, onOpenChange, title, side = 'right', hideTitle, children, className = '' }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-anim fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className={
            side === 'right'
              ? `sheet-right fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-paper shadow-2xl focus:outline-none ${className}`
              : `sheet-top fixed inset-x-0 top-0 z-50 flex max-h-[85dvh] flex-col bg-paper shadow-2xl focus:outline-none ${className}`
          }
        >
          {hideTitle ? (
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
          ) : (
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5 sm:px-6">
              <Dialog.Title className="font-display text-lg font-semibold tracking-tight">{title}</Dialog.Title>
              <Dialog.Close
                className="-mr-2 inline-flex size-10 items-center justify-center rounded-xl text-mute transition hover:bg-ink/5 hover:text-ink"
                aria-label="Close"
              >
                <X className="size-5" aria-hidden="true" />
              </Dialog.Close>
            </div>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const SheetClose = Dialog.Close
