import { format, parseISO, startOfMonth } from 'date-fns'
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

/**
 * Formats a month string ("YYYY-MM-DD" or Date) as "juin 2026" — used as the
 * label of monthly rent dues.
 */
export function formatMonthYear(
  value: string | Date | null | undefined
): string {
  return formatDate(value, 'LLLL yyyy')
}

/**
 * Today's date as ISO "YYYY-MM-DD" in *local* time. Replaces the buggy
 * `new Date().toISOString().slice(0, 10)` pattern, which returns yesterday's
 * date in UTC+ timezones late at night.
 */
export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/**
 * Snaps any "YYYY-MM-DD" (or Date) to the first day of its month, returned
 * as "YYYY-MM-DD" in local time.
 */
export function firstOfMonthIso(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(startOfMonth(date), 'yyyy-MM-dd')
}

/** First day of the current month as ISO "YYYY-MM-DD" in local time. */
export function firstOfCurrentMonthIso(): string {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd')
}
