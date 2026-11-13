import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonStyles'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  className = '',
  type = 'button',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, `${fullWidth ? 'w-full' : ''} ${className}`)}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
