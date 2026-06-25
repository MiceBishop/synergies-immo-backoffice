import { CalendarIcon, X } from 'lucide-react'
import { fr } from 'date-fns/locale'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type DateRangeValue = {
  from: string | null
  to: string | null
}

type DataTableDateRangeFilterProps = {
  title: string
  value: DateRangeValue
  onChange: (next: DateRangeValue) => void
}

function isoDate(date: Date | undefined): string | null {
  if (!date) return null
  // YYYY-MM-DD, locale-independent
  return format(date, 'yyyy-MM-dd')
}

function parseIso(s: string | null): Date | undefined {
  if (!s) return undefined
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function DataTableDateRangeFilter({
  title,
  value,
  onChange,
}: DataTableDateRangeFilterProps) {
  const hasValue = Boolean(value.from || value.to)
  const range: DateRange | undefined =
    value.from || value.to
      ? { from: parseIso(value.from), to: parseIso(value.to) }
      : undefined

  const label = !hasValue
    ? title
    : range?.from && range.to
      ? `${format(range.from, 'd MMM yyyy', { locale: fr })} – ${format(range.to, 'd MMM yyyy', { locale: fr })}`
      : range?.from
        ? `Depuis ${format(range.from, 'd MMM yyyy', { locale: fr })}`
        : range?.to
          ? `Jusqu'au ${format(range.to, 'd MMM yyyy', { locale: fr })}`
          : title

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-9 border-dashed', hasValue && 'border-solid')}
        >
          <CalendarIcon className="size-4" />
          <span>{label}</span>
          {hasValue && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onChange({ from: null, to: null })
              }}
              className="ml-1 rounded-sm opacity-70 hover:opacity-100"
              aria-label="Effacer le filtre de date"
            >
              <X className="size-3.5" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          locale={fr}
          numberOfMonths={2}
          selected={range}
          onSelect={(next) =>
            onChange({ from: isoDate(next?.from), to: isoDate(next?.to) })
          }
        />
      </PopoverContent>
    </Popover>
  )
}
