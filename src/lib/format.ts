import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { SettingsMap } from '@/hooks/use-settings'

const DEFAULTS = {
  currency_code: 'XOF',
  currency_locale: 'fr-SN',
} as const

/**
 * Formats a monetary amount using currency/locale from the settings map.
 * Falls back to XOF / fr-SN. XOF has no minor units, so no decimals.
 */
export function formatAmount(
  value: number | null | undefined,
  settings?: SettingsMap
): string {
  if (value === null || value === undefined) return '—'
  const currency = settings?.currency_code ?? DEFAULTS.currency_code
  const locale = settings?.currency_locale ?? DEFAULTS.currency_locale
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Formats an ISO date string (or Date) in French. Default pattern: 12 janv. 2025.
 */
export function formatDate(
  value: string | Date | null | undefined,
  pattern = 'd MMM yyyy'
): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, pattern, { locale: fr })
}
