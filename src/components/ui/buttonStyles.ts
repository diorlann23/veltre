export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'whatsapp' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'group/btn inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-300 ease-[var(--ease-premium)] disabled:cursor-not-allowed disabled:opacity-45 select-none whitespace-nowrap'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink-soft active:scale-[0.99]',
  secondary: 'border border-ink/80 text-ink hover:bg-ink hover:text-paper',
  ghost: 'text-ink hover:bg-ink/5',
  inverse: 'on-dark bg-paper text-ink hover:bg-white',
  whatsapp: 'bg-whatsapp text-white hover:bg-[#19673f] active:scale-[0.99]',
  danger: 'bg-accent text-paper hover:bg-[#843d22]',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-sm',
}

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = ''): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim()
}
