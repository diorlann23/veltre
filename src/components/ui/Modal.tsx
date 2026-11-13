'use client'

import type { ReactNode } from 'react'
import { AlertDialog, Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  wide?: boolean
}

export function Modal({ open, onOpenChange, title, description, children, wide }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-anim fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px]" />
        <Dialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={`pop-anim fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-paper p-6 shadow-2xl focus:outline-none sm:p-8 ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-xl font-semibold tracking-tight">{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-1 text-sm text-mute">{description}</Dialog.Description>}
            </div>
            <Dialog.Close className="-mt-1 -mr-2 inline-flex size-9 items-center justify-center rounded-xl text-mute hover:bg-ink/5 hover:text-ink" aria-label="Close">
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

interface ConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  loading?: boolean
  danger?: boolean
}

export function Confirm({ open, onOpenChange, title, description, confirmLabel, onConfirm, loading, danger }: ConfirmProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="overlay-anim fixed inset-0 z-50 bg-ink/45" />
        <AlertDialog.Content className="pop-anim fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-paper p-6 shadow-2xl sm:p-8">
          <AlertDialog.Title className="font-display text-xl font-semibold tracking-tight">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-mute">{description}</AlertDialog.Description>
          <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary">Cancel</Button>
            </AlertDialog.Cancel>
            <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
