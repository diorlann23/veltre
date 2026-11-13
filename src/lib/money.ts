import { CURRENCY } from './types'

const formatter = new Intl.NumberFormat(CURRENCY.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatMoney(pesewas: number): string {
  return `${CURRENCY.symbol}${formatter.format(pesewas / 100)}`
}

export function toPesewas(cedis: number | string): number {
  const n = typeof cedis === 'string' ? Number(cedis.replace(/[,\s]/g, '')) : cedis
  if (!Number.isFinite(n)) return Number.NaN
  return Math.round(n * 100)
}

export function toCedis(pesewas: number): string {
  return (pesewas / 100).toFixed(2)
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
