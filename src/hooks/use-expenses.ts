import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Enums, Tables, TablesInsert, TablesUpdate } from '@/lib/db'
import type { ExpenseFormOutput } from '@/schemas/expense.schema'
import type { DataTableState } from '@/components/shared/data-table'

export type Expense = Tables<'expenses'>

export type ExpenseRow = Expense & {
  building: Pick<Tables<'buildings'>, 'id' | 'name'> | null
  unit:
    | (Pick<Tables<'units'>, 'id' | 'reference'> & {
        building: Pick<Tables<'buildings'>, 'id' | 'name'> | null
      })
    | null
}

const expensesKey = ['expenses'] as const

const EXPENSE_SELECT =
  'id, type, label, amount, expense_date, billable, notes, building_id, unit_id, created_at, building:buildings(id, name), unit:units(id, reference, building:buildings(id, name))'

type ExpensesListParams = {
  state: DataTableState
  typeFilter?: Enums<'expense_type'>[]
  buildingIds?: string[]
  /** Scope to expenses on a single building (no unit-level rows). */
  buildingId?: string
  /** Scope to expenses on a single unit. */
  unitId?: string
  dateFrom?: string | null
  dateTo?: string | null
}

export function useExpensesList(params: ExpensesListParams) {
  const {
    state,
    typeFilter,
    buildingIds,
    buildingId,
    unitId,
    dateFrom,
    dateTo,
  } = params

  return useQuery({
    queryKey: [
      ...expensesKey,
      'list',
      {
        page: state.page,
        pageSize: state.pageSize,
        sorting: state.sorting,
        globalFilter: state.globalFilter,
        typeFilter: typeFilter ?? [],
        buildingIds: buildingIds ?? [],
        buildingId: buildingId ?? null,
        unitId: unitId ?? null,
        dateFrom: dateFrom ?? null,
        dateTo: dateTo ?? null,
      },
    ],
    queryFn: async (): Promise<{ rows: ExpenseRow[]; total: number }> => {
      let query = supabase
        .from('expenses')
        .select(EXPENSE_SELECT, { count: 'exact' })

      if (buildingId) {
        query = query.eq('building_id', buildingId)
      }
      if (unitId) {
        query = query.eq('unit_id', unitId)
      }
      if (state.globalFilter.trim()) {
        const term = `%${state.globalFilter.trim()}%`
        query = query.or(`label.ilike.${term},notes.ilike.${term}`)
      }
      if (typeFilter && typeFilter.length > 0) {
        query = query.in('type', typeFilter)
      }
      if (buildingIds && buildingIds.length > 0) {
        query = query.in('building_id', buildingIds)
      }
      if (dateFrom) query = query.gte('expense_date', dateFrom)
      if (dateTo) query = query.lte('expense_date', dateTo)

      if (state.sorting.length === 0) {
        query = query.order('expense_date', { ascending: false })
      } else {
        for (const s of state.sorting) {
          query = query.order(s.id, { ascending: !s.desc })
        }
      }

      const from = (state.page - 1) * state.pageSize
      const to = from + state.pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error
      return {
        rows: (data ?? []) as unknown as ExpenseRow[],
        total: count ?? 0,
      }
    },
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: ExpenseFormOutput): Promise<Expense> => {
      const payload: TablesInsert<'expenses'> = values
      const { data, error } = await supabase
        .from('expenses')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesKey })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: ExpenseFormOutput
    }): Promise<Expense> => {
      const payload: TablesUpdate<'expenses'> = values
      const { data, error } = await supabase
        .from('expenses')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesKey })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesKey })
    },
  })
}
