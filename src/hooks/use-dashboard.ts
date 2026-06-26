import { useQuery } from '@tanstack/react-query'
import { format, subMonths, startOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'

export type DashboardStats = {
  totalUnits: number
  occupiedUnits: number
  vacantUnits: number
  underRenovationUnits: number
  expectedRentThisMonth: number
  collectedRentThisMonth: number
  totalUnpaid: number
}

/**
 * Reads the `v_dashboard_stats` view plus a couple of follow-up counts so
 * the home page can render four KPI cards without bouncing between hooks.
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const [viewRes, unitsRes] = await Promise.all([
        supabase.from('v_dashboard_stats').select('*').single(),
        // Pull the under_renovation count separately — not in the view.
        supabase
          .from('units')
          .select('id', { head: true, count: 'exact' })
          .eq('status', 'under_renovation'),
      ])
      if (viewRes.error) throw viewRes.error
      if (unitsRes.error) throw unitsRes.error
      const v = viewRes.data
      return {
        totalUnits: Number(v?.total_units ?? 0),
        occupiedUnits: Number(v?.occupied_units ?? 0),
        vacantUnits: Number(v?.vacant_units ?? 0),
        underRenovationUnits: unitsRes.count ?? 0,
        expectedRentThisMonth: Number(v?.expected_rent_this_month ?? 0),
        collectedRentThisMonth: Number(v?.collected_rent_this_month ?? 0),
        totalUnpaid: Number(v?.total_unpaid ?? 0),
      }
    },
  })
}

export type MonthlyRevenuePoint = {
  monthIso: string // YYYY-MM-01
  label: string // "juin"
  expected: number // sum of rent_dues.amount_incl_tax for that month
  collected: number // sum of payments.amount for dues of that month
}

/**
 * Builds a 12-month rolling revenue series client-side. Each point holds
 * the total expected (sum of rent dues) and total collected (sum of
 * payments for those dues) for that month. Cheap as long as the portfolio
 * is small; promote to an SQL view when monthly volume grows past ~10k rows.
 */
export function useMonthlyRevenue() {
  return useQuery({
    queryKey: ['dashboard', 'monthly-revenue'],
    queryFn: async (): Promise<MonthlyRevenuePoint[]> => {
      const start = format(
        startOfMonth(subMonths(new Date(), 11)),
        'yyyy-MM-dd'
      )

      // Fetch rent dues for the last 12 months including their joined
      // payments via PostgREST.
      const { data, error } = await supabase
        .from('rent_dues')
        .select('id, due_month, amount_incl_tax, payments(amount)')
        .gte('due_month', start)
      if (error) throw error

      // Build the 12-month skeleton so months with no activity still appear.
      const buckets = new Map<string, MonthlyRevenuePoint>()
      for (let i = 11; i >= 0; i--) {
        const d = startOfMonth(subMonths(new Date(), i))
        const iso = format(d, 'yyyy-MM-dd')
        buckets.set(iso, {
          monthIso: iso,
          label: format(d, 'LLL', { locale: fr }),
          expected: 0,
          collected: 0,
        })
      }

      for (const row of data ?? []) {
        const bucket = buckets.get(row.due_month)
        if (!bucket) continue
        bucket.expected += Number(row.amount_incl_tax ?? 0)
        const payments = (row.payments as { amount: number }[] | null) ?? []
        for (const p of payments) {
          bucket.collected += Number(p.amount ?? 0)
        }
      }

      return Array.from(buckets.values())
    },
  })
}

export type UnpaidRentDueRow = {
  id: string
  due_month: string
  amount_incl_tax: number
  tenant_name: string
  unit_label: string
}

/**
 * Top N unpaid / partial rent dues, sorted by oldest first (most overdue
 * float to the top). Powers the dashboard "À encaisser" mini-table.
 */
export function useUnpaidRentDues(limit = 5) {
  return useQuery({
    queryKey: ['dashboard', 'unpaid', { limit }],
    queryFn: async (): Promise<UnpaidRentDueRow[]> => {
      const { data, error } = await supabase
        .from('rent_dues')
        .select(
          'id, due_month, amount_incl_tax, lease:leases(tenant:tenants(first_name, last_name, tenant_type), unit:units(reference, building:buildings(name)))'
        )
        .in('status', ['unpaid', 'partial'])
        .order('due_month', { ascending: true })
        .limit(limit)
      if (error) throw error
      return (data ?? []).map((r) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row = r as any
        const t = row.lease?.tenant
        const tenantName = t
          ? t.tenant_type === 'company'
            ? t.last_name
            : [t.first_name, t.last_name].filter(Boolean).join(' ')
          : '—'
        const u = row.lease?.unit
        const unitLabel = u
          ? `${u.reference}${u.building ? ` — ${u.building.name}` : ''}`
          : '—'
        return {
          id: row.id,
          due_month: row.due_month,
          amount_incl_tax: Number(row.amount_incl_tax ?? 0),
          tenant_name: tenantName,
          unit_label: unitLabel,
        }
      })
    },
  })
}
