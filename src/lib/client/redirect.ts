export function safeNext(value: string | null | undefined, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (value.startsWith('/login') || value.startsWith('/register')) return fallback
  return value
}
