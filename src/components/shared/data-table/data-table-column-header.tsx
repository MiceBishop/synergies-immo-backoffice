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

  const button = (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => column.toggleSorting(sorted === 'asc')}
      className={cn(
        'h-8 data-[state=open]:bg-accent',
        align === 'right' ? '-mr-3' : '-ml-3',
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

  // TableHead is not a flex container by default, so `ml-auto` on the button
  // alone doesn't right-align it. Wrap in a flex container when needed.
  if (align === 'right') {
    return <div className="flex justify-end">{button}</div>
  }

  return button
}
