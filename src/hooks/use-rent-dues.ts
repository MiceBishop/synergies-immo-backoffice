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

// When scoping by building or tenant we need an inner join on leases so
// PostgREST can apply the embedded-resource filters.
const RENT_DUE_SELECT_SCOPED = RENT_DUE_SELECT.replace(
  'lease:leases(',
  'lease:leases!inner('
)

type RentDuesListParams = {
  page: number
  pageSize: number
  sorting: { id: string; desc: boolean }[]
  statusFilter?: Enums<'payment_status'>[]
  monthFrom?: string | null
  monthTo?: string | null
  /** Scope to rent dues belonging to a single lease. */
  leaseId?: string
  /** Scope to rent dues whose lease.unit.building_id matches. */
  buildingIds?: string[]
  /** Scope to rent dues whose lease.tenant_id matches. */
  tenantIds?: string[]
}

export function useRentDuesList(params: RentDuesListParams) {
  const {
    page,
    pageSize,
    sorting,
    statusFilter,
    monthFrom,
    monthTo,
    leaseId,
    buildingIds,
    tenantIds,
  } = params

  const hasBuildingOrTenantScope =
    (buildingIds && buildingIds.length > 0) ||
    (tenantIds && tenantIds.length > 0)

  return useQuery({
    queryKey: [
      ...rentDuesKey,
      'list',
      {
        page,
        pageSize,
        sorting,
        statusFilter: statusFilter ?? [],
        monthFrom: monthFrom ?? null,
        monthTo: monthTo ?? null,
        leaseId: leaseId ?? null,
        buildingIds: buildingIds ?? [],
        tenantIds: tenantIds ?? [],
      },
    ],
    queryFn: async (): Promise<{ rows: RentDueRow[]; total: number }> => {
      const select = hasBuildingOrTenantScope
        ? RENT_DUE_SELECT_SCOPED
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
      if (monthFrom) query = query.gte('due_month', monthFrom)
      if (monthTo) query = query.lte('due_month', monthTo)

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
