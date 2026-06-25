import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { unitStatusLabels } from '@/lib/enums'
import type { Enums } from '@/lib/db'

const STATUS_CLASSES: Record<Enums<'unit_status'>, string> = {
  vacant: 'border-transparent bg-muted text-muted-foreground',
  occupied: 'border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200',
  under_renovation:
    'border-transparent bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
}

export function UnitStatusBadge({
  status,
}: {
  status: Enums<'unit_status'> | null
}) {
  const value: Enums<'unit_status'> = status ?? 'vacant'
  return (
    <Badge variant="outline" className={cn('font-normal', STATUS_CLASSES[value])}>
      {unitStatusLabels[value]}
    </Badge>
  )
}
