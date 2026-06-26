import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Enums, Tables, TablesInsert } from '@/lib/db'
import type { UnitFormOutput } from '@/schemas/unit.schema'
import type { DataTableState } from '@/components/shared/data-table'

export type Unit = Tables<'units'>

export type UnitWithBuilding = Unit & {
  building: Pick<Tables<'buildings'>, 'id' | 'name'> | null
}

const unitsKey = ['units'] as const

/**
 * Full non-paginated list of units, joined with their building. Used by FK
 * pickers (lease form). For the per-building list, use `useUnitsList`.
 */
export function useUnitsWithBuilding() {
  return useQuery({
    queryKey: [...unitsKey, 'all-with-building'],
    queryFn: async (): Promise<UnitWithBuilding[]> => {
      const { data, error } = await supabase
        .from('units')
        .select('*, building:buildings(id, name)')
        .order('reference', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as UnitWithBuilding[]
    },
  })
}

type UnitsListParams = {
  buildingId: string
  state: DataTableState
  typeFilter?: Enums<'unit_type'>[]
  statusFilter?: Enums<'unit_status'>[]
}

export function useUnitsList(params: UnitsListParams) {
  const { buildingId, state, typeFilter, statusFilter } = params

  return useQuery({
    enabled: Boolean(buildingId),
    queryKey: [
      ...unitsKey,
      'list',
      buildingId,
      {
        page: state.page,
        pageSize: state.pageSize,
        sorting: state.sorting,
        globalFilter: state.globalFilter,
        typeFilter: typeFilter ?? [],
        statusFilter: statusFilter ?? [],
      },
    ],
    queryFn: async (): Promise<{ rows: Unit[]; total: number }> => {
      let query = supabase
        .from('units')
        .select('*', { count: 'exact' })
        .eq('building_id', buildingId)

      if (state.globalFilter.trim()) {
        const term = `%${state.globalFilter.trim()}%`
        query = query.or(`reference.ilike.${term},description.ilike.${term}`)
      }
      if (typeFilter && typeFilter.length > 0) {
        query = query.in('type', typeFilter)
      }
      if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter)
      }

      if (state.sorting.length === 0) {
        query = query.order('reference', { ascending: true })
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

export function useCreateUnit(buildingId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: UnitFormOutput): Promise<Unit> => {
      const payload: TablesInsert<'units'> = { ...values, building_id: buildingId }
      const { data, error } = await supabase
        .from('units')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitsKey })
    },
  })
}

export function useUpdateUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: UnitFormOutput
    }): Promise<Unit> => {
      const { data, error } = await supabase
        .from('units')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitsKey })
    },
  })
}

export function useDeleteUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('units').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitsKey })
    },
  })
}
