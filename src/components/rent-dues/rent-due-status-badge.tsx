import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { paymentStatusLabels } from '@/lib/enums'
import type { Enums } from '@/lib/db'

/**
 * A rent due's *effective* status. The DB stores paid/partial/unpaid (kept
 * in sync by the payments trigger); the fourth value `overdue` is derived
 * client-side when an unpaid due is past its month.
 */
export type EffectiveRentDueStatus = Enums<'payment_status'>

const STATUS_CLASSES: Record<EffectiveRentDueStatus, string> = {
  paid:
    'border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200',
  partial:
    'border-transparent bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
  unpaid: 'border-transparent bg-muted text-muted-foreground',
  overdue:
    'border-transparent bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200',
}

export function effectiveRentDueStatus(
  status: Enums<'payment_status'> | null,
  dueMonth: string
): EffectiveRentDueStatus {
  const value = status ?? 'unpaid'
  if (value !== 'unpaid') return value
  // dueMonth is YYYY-MM-DD (first day of month). Compare with current month.
  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  return dueMonth < currentMonth ? 'overdue' : 'unpaid'
}

export function RentDueStatusBadge({
  status,
  dueMonth,
}: {
  status: Enums<'payment_status'> | null
  dueMonth: string
}) {
  const value = effectiveRentDueStatus(status, dueMonth)
  return (
    <Badge variant="outline" className={cn('font-normal', STATUS_CLASSES[value])}>
      {paymentStatusLabels[value]}
    </Badge>
  )
}
