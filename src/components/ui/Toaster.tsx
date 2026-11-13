'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Toast } from 'radix-ui'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

type Variant = 'success' | 'info' | 'error'

interface ToastOptions {
  title: string
  description?: string
  variant?: Variant
  action?: { label: string; onClick: () => void }
}

interface ToastItem extends ToastOptions {
  id: number
  open: boolean
}

const ToastContext = createContext<((t: ToastOptions) => void) | null>(null)
const icons = { success: CheckCircle2, info: Info, error: AlertCircle }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const toast = useCallback((t: ToastOptions) => {
    const id = nextId.current++
    setItems((all) => [...all.slice(-2), { ...t, id, open: true }])
  }, [])

  const value = useMemo(() => toast, [toast])

  return (
    <ToastContext.Provider value={value}>
      <Toast.Provider swipeDirection="right" duration={4500}>
        {children}
        {items.map((t) => {
          const Icon = icons[t.variant ?? 'success']
          return (
            <Toast.Root
              key={t.id}
              open={t.open}
              onOpenChange={(open) => {
                if (!open) setTimeout(() => setItems((all) => all.filter((x) => x.id !== t.id)), 300)
                setItems((all) => all.map((x) => (x.id === t.id ? { ...x, open } : x)))
              }}
              type={t.variant === 'error' ? 'foreground' : 'background'}
              className="toast-anim on-dark flex w-full items-start gap-3 rounded-2xl bg-ink p-4 text-paper shadow-2xl shadow-black/20"
            >
              <Icon className={`mt-0.5 size-5 shrink-0 ${t.variant === 'error' ? 'text-accent-soft' : 'text-paper/80'}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <Toast.Title className="text-sm font-medium">{t.title}</Toast.Title>
                {t.description && <Toast.Description className="mt-0.5 text-sm text-paper/70">{t.description}</Toast.Description>}
                {t.action && (
                  <Toast.Action
                    altText={t.action.label}
                    onClick={t.action.onClick}
                    className="mt-2 text-xs font-semibold tracking-[0.12em] uppercase underline underline-offset-4 hover:text-paper/80"
                  >
                    {t.action.label}
                  </Toast.Action>
                )}
              </div>
              <Toast.Close className="-m-1 p-1 text-paper/60 hover:text-paper" aria-label="Dismiss">
                <X className="size-4" aria-hidden="true" />
              </Toast.Close>
            </Toast.Root>
          )
        })}
        <Toast.Viewport className="fixed right-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] flex w-full flex-col gap-2 p-4 outline-none sm:bottom-0 sm:max-w-sm lg:bottom-0" />
      </Toast.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
