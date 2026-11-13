import type { ReactNode } from 'react'

export interface FieldA11y {
  id: string
  'aria-invalid': boolean
  'aria-describedby'?: string
}

interface FieldProps {
  id: string
  label: string
  hint?: string
  error?: string
  optional?: boolean
  className?: string
  children: (a11y: FieldA11y) => ReactNode
}

export function Field({ id, label, hint, error, optional, className = '', children }: FieldProps) {
  const messageId = error || hint ? `${id}-message` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between gap-2 text-sm font-medium">
        {label}
        {optional && <span className="text-xs font-normal text-mute">Optional</span>}
      </label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': messageId })}
      {(error || hint) && (
        <p id={messageId} className={`mt-2 ${error ? 'text-sm text-accent' : 'text-xs text-mute'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-xl border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-accent">
      {message}
    </p>
  )
}
