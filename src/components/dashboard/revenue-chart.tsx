import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatAmount } from '@/lib/format'
import type { MonthlyRevenuePoint } from '@/hooks/use-dashboard'
import type { SettingsMap } from '@/hooks/use-settings'

type RevenueChartProps = {
  data: MonthlyRevenuePoint[]
  settings: SettingsMap | undefined
}

/**
 * 12-month bar chart comparing expected vs collected rent. Y-axis ticks use
 * a compact "k FCFA" formatter so the labels fit on small screens; the
 * tooltip switches to the full Intl-formatted amount via formatAmount().
 */
export function RevenueChart({ data, settings }: RevenueChartProps) {
  const compactTick = (value: number) => {
    if (value === 0) return '0'
    if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`
    if (value >= 1_000) return `${Math.round(value / 1_000)}k`
    return String(value)
  }

  const totalExpected = data.reduce((s, p) => s + p.expected, 0)
  const totalCollected = data.reduce((s, p) => s + p.collected, 0)

  if (totalExpected === 0 && totalCollected === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Aucune donnée à afficher pour les 12 derniers mois.
      </div>
    )
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) =>
              v.length > 0 ? v.charAt(0).toUpperCase() + v.slice(1) : v
            }
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={compactTick}
            tick={{ fontSize: 11 }}
            width={48}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            formatter={(value: number) => formatAmount(value, settings)}
            labelFormatter={(label) => (
              <span style={{ textTransform: 'capitalize' }}>{label}</span>
            )}
          />
          <Legend
            iconType="square"
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar
            dataKey="expected"
            name="Attendu"
            fill="#a3a3a3"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="collected"
            name="Encaissé"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
