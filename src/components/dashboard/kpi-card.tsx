import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type KpiCardProps = {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon: LucideIcon
  tone?: 'neutral' | 'emerald' | 'amber' | 'red'
}

const TONE_BG: Record<NonNullable<KpiCardProps['tone']>, string> = {
  neutral: 'bg-muted text-muted-foreground',
  emerald: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200',
  amber: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
  red: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200',
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
}: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-semibold tracking-tight truncate">
              {value}
            </p>
            {hint && (
              <p className="text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
          <div className={cn('rounded-md p-2 shrink-0', TONE_BG[tone])}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
