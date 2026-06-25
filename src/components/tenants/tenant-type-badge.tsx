import { Building, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { tenantTypeLabels, type TenantType } from '@/lib/enums'

const TYPE_CLASSES: Record<TenantType, string> = {
  individual:
    'border-transparent bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200',
  company:
    'border-transparent bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-200',
}

const TYPE_ICONS: Record<TenantType, typeof User> = {
  individual: User,
  company: Building,
}

export function TenantTypeBadge({ type }: { type: string | null }) {
  const value: TenantType =
    type === 'company' || type === 'individual' ? type : 'individual'
  const Icon = TYPE_ICONS[value]
  return (
    <Badge
      variant="outline"
      className={cn('font-normal gap-1', TYPE_CLASSES[value])}
    >
      <Icon className="size-3" />
      {tenantTypeLabels[value]}
    </Badge>
  )
}
