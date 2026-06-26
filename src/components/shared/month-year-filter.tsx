import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type MonthYearValue = {
  year: number | null
  month: number | null // 1-12
}

type MonthYearFilterProps = {
  value: MonthYearValue
  onChange: (next: MonthYearValue) => void
  /** How many years back to include in the year dropdown. */
  yearsBack?: number
}

const MONTHS: { value: number; label: string }[] = Array.from(
  { length: 12 },
  (_, i) => ({
    value: i + 1,
    label: format(new Date(2000, i, 1), 'LLLL', { locale: fr }),
  })
)

const ALL = '__all__'

/**
 * Month + Year dropdowns scoped to a list of monthly records (rent dues).
 * Better fit than a date-range picker for filtering by "show me April 2026"
 * or "show me all of 2025". Both dropdowns are independent; pick "Tous"
 * in either to ignore that dimension.
 *
 * Resolve to a date range via `monthYearToRange(value)`.
 */
export function MonthYearFilter({
  value,
  onChange,
  yearsBack = 10,
}: MonthYearFilterProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: yearsBack + 1 }, (_, i) => currentYear - i)

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value.month === null ? ALL : String(value.month)}
        onValueChange={(v) =>
          onChange({ ...value, month: v === ALL ? null : Number(v) })
        }
      >
        <SelectTrigger className="h-9 w-[150px] capitalize">
          <SelectValue placeholder="Mois" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tous les mois</SelectItem>
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={String(m.value)} className="capitalize">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.year === null ? ALL : String(value.year)}
        onValueChange={(v) =>
          onChange({ ...value, year: v === ALL ? null : Number(v) })
        }
      >
        <SelectTrigger className="h-9 w-[120px]">
          <SelectValue placeholder="Année" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Toutes</SelectItem>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * Translates a {year, month} selection into an inclusive ISO date range
 * suitable for `.gte`/`.lte` against a `YYYY-MM-01` column.
 *
 * - year=null, month=null → no filter (both null)
 * - year set, month=null → full year
 * - year set, month set  → exact month
 * - year=null, month set → cannot filter server-side without a SQL function;
 *   returns nulls so the caller falls back to "no filter". (Pick a year.)
 */
export function monthYearToRange(value: MonthYearValue): {
  from: string | null
  to: string | null
} {
  const { year, month } = value
  if (year === null) {
    return { from: null, to: null }
  }
  if (month === null) {
    return {
      from: `${year}-01-01`,
      to: `${year}-12-01`,
    }
  }
  const mm = String(month).padStart(2, '0')
  const iso = `${year}-${mm}-01`
  return { from: iso, to: iso }
}

export const EMPTY_MONTH_YEAR: MonthYearValue = { year: null, month: null }

export function isMonthYearActive(value: MonthYearValue): boolean {
  return value.year !== null || value.month !== null
}
