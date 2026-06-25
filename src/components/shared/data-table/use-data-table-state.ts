import { useCallback, useState } from 'react'
import {
  DEFAULT_PAGE_SIZE,
  type DataTableState,
  type DataTableStateUpdate,
} from './types'

export function useDataTableState(
  initial?: Partial<DataTableState>
): [DataTableState, (next: DataTableStateUpdate) => void] {
  const [state, setState] = useState<DataTableState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sorting: [],
    filters: [],
    globalFilter: '',
    ...initial,
  })

  const updateState = useCallback((next: DataTableStateUpdate) => {
    setState((prev) => ({ ...prev, ...next }))
  }, [])

  return [state, updateState]
}
