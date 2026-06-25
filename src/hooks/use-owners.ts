import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/db'
import type { OwnerFormOutput } from '@/schemas/owner.schema'
import type { DataTableState } from '@/components/shared/data-table'

export type Owner = Tables<'owners'>

const ownersKey = ['owners'] as const

/**
 * Returns the full, non-paginated list of owners.
 * Use for FK pickers (combobox in building form, faceted filters on building list).
 * For the owners page itself, use `useOwnersList` (server-side paginated).
 */
export function useOwners(search?: string) {
  return useQuery({
    queryKey: [...ownersKey, 'all', { search: search ?? '' }],
    queryFn: async (): Promise<Owner[]> => {
      let query = supabase
        .from('owners')
        .select('*')
        .order('last_name', { ascending: true })

      if (search && search.trim()) {
        const term = `%${search.trim()}%`
        query = query.or(
          `last_name.ilike.${term},first_name.ilike.${term},email.ilike.${term}`
        )
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

type OwnersListParams = {
  state: DataTableState
  /** ISO 'YYYY-MM-DD' bounds on created_at. */
  createdFrom?: string | null
  createdTo?: string | null
}

/**
 * Server-side paginated list. Translates DataTable state into a Supabase query
 * with global search across name/email/phone, optional created_at range, sorting,
 * and range-based pagination. Returns `{ rows, total }` for the DataTable.
 */
export function useOwnersList(params: OwnersListParams) {
  const { state, createdFrom, createdTo } = params

  return useQuery({
    queryKey: [
      ...ownersKey,
      'list',
      {
        page: state.page,
        pageSize: state.pageSize,
        sorting: state.sorting,
        globalFilter: state.globalFilter,
        createdFrom: createdFrom ?? null,
        createdTo: createdTo ?? null,
      },
    ],
    queryFn: async (): Promise<{ rows: Owner[]; total: number }> => {
      let query = supabase.from('owners').select('*', { count: 'exact' })

      if (state.globalFilter.trim()) {
        const term = `%${state.globalFilter.trim()}%`
        query = query.or(
          `last_name.ilike.${term},first_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`
        )
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

export function useCreateOwner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: OwnerFormOutput): Promise<Owner> => {
      const { data, error } = await supabase
        .from('owners')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownersKey })
    },
  })
}

export function useUpdateOwner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: OwnerFormOutput
    }): Promise<Owner> => {
      const { data, error } = await supabase
        .from('owners')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownersKey })
    },
  })
}

export function useDeleteOwner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('owners').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownersKey })
    },
  })
}
