import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { paymentStatusLabels } from '@/lib/enums'
import { firstOfCurrentMonthIso } from '@/lib/format'
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
  // Orange (not red) so overdue dues don't visually collide with the brand red
  overdue:
    'border-transparent bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200',
}

export function effectiveRentDueStatus(
  status: Enums<'payment_status'> | null,
  dueMonth: string
): EffectiveRentDueStatus {
  const value = status ?? 'unpaid'
  if (value !== 'unpaid') return value
  // dueMonth is "YYYY-MM-DD" (first day of month). Lexicographic compare works.
  return dueMonth < firstOfCurrentMonthIso() ? 'overdue' : 'unpaid'
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
