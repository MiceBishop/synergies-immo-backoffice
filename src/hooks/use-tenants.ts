import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/db'
import type { TenantFormOutput } from '@/schemas/tenant.schema'
import type { TenantType } from '@/lib/enums'
import type { DataTableState } from '@/components/shared/data-table'

export type Tenant = Tables<'tenants'>

const tenantsKey = ['tenants'] as const

/**
 * Returns the full non-paginated list of tenants.
 * Use for FK pickers (combobox in lease form). For the tenants page itself,
 * use `useTenantsList` (server-side paginated).
 */
export function useTenants(search?: string) {
  return useQuery({
    queryKey: [...tenantsKey, 'all', { search: search ?? '' }],
    queryFn: async (): Promise<Tenant[]> => {
      let query = supabase
        .from('tenants')
        .select('*')
        .order('last_name', { ascending: true })

      if (search && search.trim()) {
        const term = `%${search.trim()}%`
        query = query.or(
          `last_name.ilike.${term},first_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`
        )
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

type TenantsListParams = {
  state: DataTableState
  typeFilter?: TenantType[]
  createdFrom?: string | null
  createdTo?: string | null
}

export function useTenantsList(params: TenantsListParams) {
  const { state, typeFilter, createdFrom, createdTo } = params

  return useQuery({
    queryKey: [
      ...tenantsKey,
      'list',
      {
        page: state.page,
        pageSize: state.pageSize,
        sorting: state.sorting,
        globalFilter: state.globalFilter,
        typeFilter: typeFilter ?? [],
        createdFrom: createdFrom ?? null,
        createdTo: createdTo ?? null,
      },
    ],
    queryFn: async (): Promise<{ rows: Tenant[]; total: number }> => {
      let query = supabase.from('tenants').select('*', { count: 'exact' })

      if (state.globalFilter.trim()) {
        const term = `%${state.globalFilter.trim()}%`
        query = query.or(
          `last_name.ilike.${term},first_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`
        )
      }

      if (typeFilter && typeFilter.length > 0) {
        query = query.in('tenant_type', typeFilter)
      }
      if (createdFrom) query = query.gte('created_at', createdFrom)
      if (createdTo) query = query.lte('created_at', `${createdTo}T23:59:59.999Z`)

      if (state.sorting.length === 0) {
        query = query.order('last_name', { ascending: true })
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
      return { rows: data ?? [], total: count ?? 0 }
    },
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: TenantFormOutput): Promise<Tenant> => {
      const { data, error } = await supabase
        .from('tenants')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantsKey })
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: TenantFormOutput
    }): Promise<Tenant> => {
      const { data, error } = await supabase
        .from('tenants')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantsKey })
    },
  })
}

export function useDeleteTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('tenants').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantsKey })
    },
  })
}
