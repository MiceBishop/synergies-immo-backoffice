import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { leaseStatusLabels } from '@/lib/enums'
import type { Enums } from '@/lib/db'

const STATUS_CLASSES: Record<Enums<'lease_status'>, string> = {
  draft: 'border-transparent bg-muted text-muted-foreground',
  active:
    'border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200',
  expired:
    'border-transparent bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
  // Orange (not red) so terminated contracts don't blend with brand-red primary
  terminated:
    'border-transparent bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200',
}

export function LeaseStatusBadge({
  status,
}: {
  status: Enums<'lease_status'> | null
}) {
  const value: Enums<'lease_status'> = status ?? 'draft'
  return (
    <Badge variant="outline" className={cn('font-normal', STATUS_CLASSES[value])}>
      {leaseStatusLabels[value]}
    </Badge>
  )
}
