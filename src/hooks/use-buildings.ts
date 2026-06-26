import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/db'
import type { BuildingFormOutput } from '@/schemas/building.schema'
import type { DataTableState } from '@/components/shared/data-table'

export type Building = Tables<'buildings'>

export type BuildingRow = Building & {
  owner: Pick<Tables<'owners'>, 'id' | 'first_name' | 'last_name'> | null
}

const buildingsKey = ['buildings'] as const

/**
 * Full non-paginated buildings list. Used for FK pickers / faceted filters
 * (e.g. building facet on the rent dues list). For the buildings page,
 * use `useBuildingsList`.
 */
export function useBuildings() {
  return useQuery({
    queryKey: [...buildingsKey, 'all'],
    queryFn: async (): Promise<Building[]> => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}

type BuildingsListParams = {
  state: DataTableState
  /** Optional pre-set filters merged into the state's column filters (e.g. owner_id from URL). */
  cityFilter?: string[]
  ownerIdFilter?: string[]
  /** ISO 'YYYY-MM-DD' bounds on created_at. */
  createdFrom?: string | null
  createdTo?: string | null
}

export function useBuildingsList(params: BuildingsListParams) {
  const { state, cityFilter, ownerIdFilter, createdFrom, createdTo } = params

  return useQuery({
    queryKey: [
      ...buildingsKey,
      'list',
      {
        page: state.page,
        pageSize: state.pageSize,
        sorting: state.sorting,
        globalFilter: state.globalFilter,
        cityFilter: cityFilter ?? [],
        ownerIdFilter: ownerIdFilter ?? [],
        createdFrom: createdFrom ?? null,
        createdTo: createdTo ?? null,
      },
    ],
    queryFn: async (): Promise<{ rows: BuildingRow[]; total: number }> => {
      let query = supabase
        .from('buildings')
        .select(
          'id, name, address, city, floor_count, owner_id, notes, photo_url, created_at, updated_at, owner:owners(id, first_name, last_name)',
          { count: 'exact' }
        )

      // Global search across name and address.
      if (state.globalFilter.trim()) {
        const term = `%${state.globalFilter.trim()}%`
        query = query.or(`name.ilike.${term},address.ilike.${term}`)
      }

      if (cityFilter && cityFilter.length > 0) {
        query = query.in('city', cityFilter)
      }
      if (ownerIdFilter && ownerIdFilter.length > 0) {
        query = query.in('owner_id', ownerIdFilter)
      }
      if (createdFrom) query = query.gte('created_at', createdFrom)
      if (createdTo) {
        // Inclusive day end.
        query = query.lte('created_at', `${createdTo}T23:59:59.999Z`)
      }

      // Sorting — fall back to name ascending so order is stable.
      if (state.sorting.length === 0) {
        query = query.order('name', { ascending: true })
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
        rows: (data ?? []) as unknown as BuildingRow[],
        total: count ?? 0,
      }
    },
  })
}

export function useBuilding(id: string | null | undefined) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: [...buildingsKey, 'one', id],
    queryFn: async (): Promise<BuildingRow> => {
      const { data, error } = await supabase
        .from('buildings')
        .select(
          'id, name, address, city, floor_count, owner_id, notes, photo_url, created_at, updated_at, owner:owners(id, first_name, last_name)'
        )
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as BuildingRow
    },
  })
}

/** Distinct city list — feeds the faceted filter. */
export function useBuildingCities() {
  return useQuery({
    queryKey: [...buildingsKey, 'cities'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('buildings')
        .select('city')
        .order('city', { ascending: true })
      if (error) throw error
      const unique = Array.from(new Set((data ?? []).map((r) => r.city)))
      return unique
    },
  })
}

export function useCreateBuilding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: BuildingFormOutput): Promise<Building> => {
      const { data, error } = await supabase
        .from('buildings')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildingsKey })
    },
  })
}

export function useUpdateBuilding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: BuildingFormOutput
    }): Promise<Building> => {
      const { data, error } = await supabase
        .from('buildings')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildingsKey })
    },
  })
}

export function useDeleteBuilding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('buildings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildingsKey })
    },
  })
}
