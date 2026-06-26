import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Enums, Tables, TablesInsert } from '@/lib/db'
import type { LeaseFormOutput } from '@/schemas/lease.schema'
import type { DataTableState } from '@/components/shared/data-table'

export type Lease = Tables<'leases'>

export type LeaseRow = Lease & {
  tenant: Pick<
    Tables<'tenants'>,
    'id' | 'first_name' | 'last_name' | 'tenant_type'
  > | null
  unit:
    | (Pick<Tables<'units'>, 'id' | 'reference' | 'type' | 'status'> & {
        building: Pick<Tables<'buildings'>, 'id' | 'name'> | null
      })
    | null
}

const leasesKey = ['leases'] as const

const LEASE_SELECT =
  'id, unit_id, tenant_id, start_date, end_date, rent_excl_tax, vat_rate, vat_amount, rent_incl_tax, deposit, deposit_returned, auto_renew, status, special_conditions, created_at, updated_at, tenant:tenants(id, first_name, last_name, tenant_type), unit:units(id, reference, type, status, building:buildings(id, name))'

// When scoping by building we need an inner join on units so PostgREST can apply
// the .eq('unit.building_id', …) filter on the embedded relation.
const LEASE_SELECT_BUILDING_SCOPED = LEASE_SELECT.replace(
  'unit:units(',
  'unit:units!inner('
)

type LeasesListParams = {
  state: DataTableState
  statusFilter?: Enums<'lease_status'>[]
  startFrom?: string | null
  startTo?: string | null
  /** Scope to leases whose unit belongs to this building. */
  buildingId?: string
  /** Scope to leases belonging to this tenant. */
  tenantId?: string
}

export function useLeasesList(params: LeasesListParams) {
  const { state, statusFilter, startFrom, startTo, buildingId, tenantId } =
    params

  return useQuery({
    queryKey: [
      ...leasesKey,
      'list',
      {
        page: state.page,
        pageSize: state.pageSize,
        sorting: state.sorting,
        statusFilter: statusFilter ?? [],
        startFrom: startFrom ?? null,
        startTo: startTo ?? null,
        buildingId: buildingId ?? null,
        tenantId: tenantId ?? null,
      },
    ],
    queryFn: async (): Promise<{ rows: LeaseRow[]; total: number }> => {
      const select = buildingId ? LEASE_SELECT_BUILDING_SCOPED : LEASE_SELECT
      let query = supabase
        .from('leases')
        .select(select, { count: 'exact' })

      if (buildingId) {
        // PostgREST embedded-resource filter — applied on the aliased unit
        // relation that we marked !inner above.
        query = query.eq('unit.building_id', buildingId)
      }
      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }
      if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter)
      }
      if (startFrom) query = query.gte('start_date', startFrom)
      if (startTo) query = query.lte('start_date', startTo)

      if (state.sorting.length === 0) {
        query = query.order('start_date', { ascending: false })
      } else {
        for (const sort of state.sorting) {
          query = query.order(sort.id, { ascending: !sort.desc })
        }
      }

      const from = (state.page - 1) * state.pageSize
      const to = from + state.pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error
      return {
        rows: (data ?? []) as unknown as LeaseRow[],
        total: count ?? 0,
      }
    },
  })
}

export function useLease(id: string | null | undefined) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: [...leasesKey, 'one', id],
    queryFn: async (): Promise<LeaseRow> => {
      const { data, error } = await supabase
        .from('leases')
        .select(LEASE_SELECT)
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as LeaseRow
    },
  })
}

export function useCreateLease() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: LeaseFormOutput): Promise<Lease> => {
      const payload: TablesInsert<'leases'> = values
      const { data, error } = await supabase
        .from('leases')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leasesKey })
    },
  })
}

export function useUpdateLease() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: LeaseFormOutput
    }): Promise<Lease> => {
      const { data, error } = await supabase
        .from('leases')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leasesKey })
    },
  })
}

/** Partial status update — used by detail-page action buttons. */
export function useUpdateLeaseStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: Enums<'lease_status'>
    }): Promise<Lease> => {
      const { data, error } = await supabase
        .from('leases')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leasesKey })
    },
  })
}

export function useDeleteLease() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('leases').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leasesKey })
    },
  })
}
