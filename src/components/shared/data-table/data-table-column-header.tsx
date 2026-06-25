import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import type { Column } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>
  title: string
  className?: string
  align?: 'left' | 'right'
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  align = 'left',
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <div
        className={cn(
          'text-xs font-medium text-muted-foreground',
          align === 'right' && 'text-right',
          className
        )}
      >
        {title}
      </div>
    )
  }

  const sorted = column.getIsSorted()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => column.toggleSorting(sorted === 'asc')}
      className={cn(
        '-ml-3 h-8 data-[state=open]:bg-accent',
        align === 'right' && 'ml-auto -mr-3',
        className
      )}
    >
      <span>{title}</span>
      {sorted === 'desc' ? (
        <ArrowDown className="ml-2 size-3.5" />
      ) : sorted === 'asc' ? (
        <ArrowUp className="ml-2 size-3.5" />
      ) : (
        <ChevronsUpDown className="ml-2 size-3.5 opacity-50" />
      )}
    </Button>
  )
}
