export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidPhone(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || /[^\d\s+\-().]/.test(trimmed) || trimmed.indexOf('+') > 0) return false
  const digits = phoneDigits(trimmed)
  return digits.length >= 9 && digits.length <= 15
}

export function toInternational(value: string, defaultCountry = '233'): string {
  const trimmed = value.trim()
  const digits = phoneDigits(trimmed)
  if (trimmed.startsWith('+') || trimmed.startsWith('00')) return digits.replace(/^00/, '')
  if (digits.startsWith('0') && digits.length === 10) return `${defaultCountry}${digits.slice(1)}`
  if (digits.length === 9) return `${defaultCountry}${digits}`
  return digits
}

export function isValidWhatsAppNumber(value: string): boolean {
  return /^[1-9]\d{7,14}$/.test(value)
}
