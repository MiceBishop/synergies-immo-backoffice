import { CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type DatePickerProps = {
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  fromYear?: number
  toYear?: number
  className?: string
}

function parseIso(s: string | null): Date | undefined {
  if (!s) return undefined
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isoDate(date: Date | undefined): string | null {
  if (!date) return null
  return format(date, 'yyyy-MM-dd')
}

/**
 * Single-date picker. Stores values as ISO `YYYY-MM-DD` strings (locale-safe,
 * matches Postgres `date`). Displays in French with `date-fns` formatting.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Sélectionner une date',
  clearable = true,
  disabled,
  className,
}: DatePickerProps) {
  const selected = parseIso(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start font-normal',
            !selected && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="size-4" />
          <span className="flex-1 text-left">
            {selected ? format(selected, 'd MMMM yyyy', { locale: fr }) : placeholder}
          </span>
          {clearable && selected && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onChange(null)
              }}
              className="rounded-sm opacity-70 hover:opacity-100"
              aria-label="Effacer la date"
            >
              <X className="size-3.5" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={fr}
          selected={selected}
          onSelect={(d) => onChange(isoDate(d))}
        />
      </PopoverContent>
    </Popover>
  )
}
