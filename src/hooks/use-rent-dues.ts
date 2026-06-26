import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Enums, Tables } from '@/lib/db'

export type RentDue = Tables<'rent_dues'>

export type RentDueRow = RentDue & {
  lease:
    | (Pick<
        Tables<'leases'>,
        'id' | 'rent_excl_tax' | 'vat_rate' | 'rent_incl_tax'
      > & {
        tenant: Pick<
          Tables<'tenants'>,
          'id' | 'first_name' | 'last_name' | 'tenant_type'
        > | null
        unit:
          | (Pick<Tables<'units'>, 'id' | 'reference'> & {
              building: Pick<Tables<'buildings'>, 'id' | 'name'> | null
            })
          | null
      })
    | null
}

const rentDuesKey = ['rent_dues'] as const

const RENT_DUE_SELECT =
  'id, lease_id, due_month, amount_excl_tax, vat_amount, amount_incl_tax, status, created_at, lease:leases(id, rent_excl_tax, vat_rate, rent_incl_tax, tenant:tenants(id, first_name, last_name, tenant_type), unit:units(id, reference, building:buildings(id, name)))'

// When scoping by tenant we need an inner join on leases so PostgREST applies
// the embedded-resource filter to the parent rent_dues rows.
const RENT_DUE_SELECT_TENANT_SCOPED = RENT_DUE_SELECT.replace(
  'lease:leases(',
  'lease:leases!inner('
)

// When scoping by building we additionally need an inner join on units —
// without it the `lease.unit.building_id` filter only nulls-out the embedded
// unit instead of excluding the parent rent_due row.
const RENT_DUE_SELECT_BUILDING_SCOPED = RENT_DUE_SELECT_TENANT_SCOPED.replace(
  'unit:units(',
  'unit:units!inner('
)

type RentDuesListParams = {
  page: number
  pageSize: number
  sorting: { id: string; desc: boolean }[]
  statusFilter?: Enums<'payment_status'>[]
  /** Multi-select month (1-12). Combined with `years` per the truth table. */
  months?: number[]
  /** Multi-select year. Combined with `months` per the truth table. */
  years?: number[]
  /** Scope to rent dues belonging to a single lease. */
  leaseId?: string
  /** Scope to rent dues whose lease.unit.building_id matches. */
  buildingIds?: string[]
  /** Scope to rent dues whose lease.tenant_id matches. */
  tenantIds?: string[]
}

/**
 * Builds the SQL filter for the (months, years) tuple. `due_month` is always
 * stored as YYYY-MM-01, so each filter style takes advantage of that.
 */
function applyMonthYearFilter<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  months: number[],
  years: number[]
): T {
  const hasMonths = months.length > 0
  const hasYears = years.length > 0
  if (!hasMonths && !hasYears) return query

  const mm = (m: number) => String(m).padStart(2, '0')

  if (hasMonths && hasYears) {
    // Explicit cartesian product of YYYY-MM-01 strings.
    const values: string[] = []
    for (const y of years) {
      for (const m of months) {
        values.push(`${y}-${mm(m)}-01`)
      }
    }
    return query.in('due_month', values)
  }

  if (hasYears) {
    // Years only — one .gte/.lte if single year, else explicit IN of every
    // month within each selected year.
    if (years.length === 1) {
      const y = years[0]
      return query.gte('due_month', `${y}-01-01`).lte('due_month', `${y}-12-01`)
    }
    const values: string[] = []
    for (const y of years) {
      for (let m = 1; m <= 12; m++) values.push(`${y}-${mm(m)}-01`)
    }
    return query.in('due_month', values)
  }

  // Months only across all years — pattern match via PostgREST `like`.
  // `_` matches a single character, so `____-MM-01` matches any 4-digit year.
  const patterns = months.map((m) => `due_month.like.____-${mm(m)}-01`)
  return query.or(patterns.join(','))
}

export function useRentDuesList(params: RentDuesListParams) {
  const {
    page,
    pageSize,
    sorting,
    statusFilter,
    months,
    years,
    leaseId,
    buildingIds,
    tenantIds,
  } = params

  const hasBuildingScope = Boolean(buildingIds && buildingIds.length > 0)
  const hasTenantScope = Boolean(tenantIds && tenantIds.length > 0)

  return useQuery({
    queryKey: [
      ...rentDuesKey,
      'list',
      {
        page,
        pageSize,
        sorting,
        statusFilter: statusFilter ?? [],
        months: months ?? [],
        years: years ?? [],
        leaseId: leaseId ?? null,
        buildingIds: buildingIds ?? [],
        tenantIds: tenantIds ?? [],
      },
    ],
    queryFn: async (): Promise<{ rows: RentDueRow[]; total: number }> => {
      const select = hasBuildingScope
        ? RENT_DUE_SELECT_BUILDING_SCOPED
        : hasTenantScope
          ? RENT_DUE_SELECT_TENANT_SCOPED
          : RENT_DUE_SELECT
      let query = supabase
        .from('rent_dues')
        .select(select, { count: 'exact' })

      if (leaseId) {
        query = query.eq('lease_id', leaseId)
      }
      if (buildingIds && buildingIds.length > 0) {
        // PostgREST embedded-resource filter on the aliased lease.unit.
        query = query.in('lease.unit.building_id', buildingIds)
      }
      if (tenantIds && tenantIds.length > 0) {
        query = query.in('lease.tenant_id', tenantIds)
      }

      if (statusFilter && statusFilter.length > 0) {
        // Strip the synthetic 'overdue' before hitting the DB — DB stores
        // only paid/partial/unpaid. Asking for 'overdue' means "unpaid".
        const realStatuses = statusFilter
          .filter((s) => s !== 'overdue')
          .concat(statusFilter.includes('overdue') ? ['unpaid'] : [])
        const unique = Array.from(new Set(realStatuses))
        if (unique.length > 0) {
          query = query.in('status', unique)
        }
      }

      query = applyMonthYearFilter(query, months ?? [], years ?? [])

      if (sorting.length === 0) {
        query = query
          .order('due_month', { ascending: false })
          .order('created_at', { ascending: false })
      } else {
        for (const s of sorting) {
          query = query.order(s.id, { ascending: !s.desc })
        }
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error
      return {
        rows: (data ?? []) as unknown as RentDueRow[],
        total: count ?? 0,
      }
    },
  })
}

export function useRentDue(id: string | null | undefined) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: [...rentDuesKey, 'one', id],
    queryFn: async (): Promise<RentDueRow> => {
      const { data, error } = await supabase
        .from('rent_dues')
        .select(RENT_DUE_SELECT)
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as RentDueRow
    },
  })
}

/**
 * Calls the `generate_rent_dues_for_month` RPC (defined in the services repo
 * migration 20260626063227). Returns counts so the UI can render
 * "N nouvelles quittances créées, M existaient déjà".
 */
export function useGenerateRentDues() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      targetMonth: string // YYYY-MM-DD, first of month
    }): Promise<{ created: number; existed: number }> => {
      // Types for the RPC aren't in database.types.ts yet (will be after
      // `npm run gen:types` once the services migration deploys). Use a
      // loose call here; the response shape is known from the migration.
      type GenRow = { lease_id: string; generated: boolean }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rpc = (supabase as any).rpc.bind(supabase)
      const { data, error } = (await rpc('generate_rent_dues_for_month', {
        target_month: params.targetMonth,
      })) as { data: GenRow[] | null; error: { message: string } | null }
      if (error) throw new Error(error.message)
      const rows = data ?? []
      const created = rows.filter((r) => r.generated).length
      const existed = rows.length - created
      return { created, existed }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentDuesKey })
    },
  })
}

export function useDeleteRentDue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('rent_dues').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentDuesKey })
    },
  })
}
