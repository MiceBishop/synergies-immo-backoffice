import { useMemo } from 'react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

type OccupancyChartProps = {
  occupied: number
  vacant: number
  underRenovation: number
}

const SEGMENTS = [
  { key: 'occupied', label: 'Occupé', color: '#10b981' },
  { key: 'vacant', label: 'Vacant', color: '#a3a3a3' },
  { key: 'under_renovation', label: 'En rénovation', color: '#f59e0b' },
] as const

export function OccupancyChart({
  occupied,
  vacant,
  underRenovation,
}: OccupancyChartProps) {
  const data = useMemo(
    () => [
      { key: 'occupied', label: 'Occupé', value: occupied, color: SEGMENTS[0].color },
      { key: 'vacant', label: 'Vacant', value: vacant, color: SEGMENTS[1].color },
      {
        key: 'under_renovation',
        label: 'En rénovation',
        value: underRenovation,
        color: SEGMENTS[2].color,
      },
    ],
    [occupied, vacant, underRenovation]
  )

  const total = occupied + vacant + underRenovation
  const occupiedPct = total === 0 ? 0 : Math.round((occupied / total) * 100)

  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Aucun local enregistré.
      </div>
    )
  }

  return (
    <div className="flex items-center gap-6">
      <div className="h-56 w-56 shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="65%"
              outerRadius="95%"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _name, props) => [
                value,
                props.payload.label,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-semibold tracking-tight">
            {occupiedPct}%
          </span>
          <span className="text-xs text-muted-foreground">occupation</span>
        </div>
      </div>
      <div className="space-y-2 text-sm flex-1 min-w-0">
        {data.map((d) => (
          <div key={d.key} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="size-3 rounded-sm shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="truncate">{d.label}</span>
            </span>
            <span className="font-medium tabular-nums">{d.value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2 border-t text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold tabular-nums">{total}</span>
        </div>
      </div>
    </div>
  )
}
