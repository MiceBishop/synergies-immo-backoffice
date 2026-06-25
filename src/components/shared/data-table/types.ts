import type { ColumnDef, ColumnFiltersState, SortingState } from '@tanstack/react-table'

export type DataTableSortDir = 'asc' | 'desc'

export type DataTableSort = {
  id: string
  desc: boolean
}

export type DataTableState = {
  page: number       // 1-based
  pageSize: number
  sorting: SortingState
  filters: ColumnFiltersState
  globalFilter: string
}

export type DataTableStateUpdate = Partial<DataTableState>

export type DataTableQueryResult<TRow> = {
  rows: TRow[]
  total: number
}

export type DataTableProps<TRow> = {
  columns: ColumnDef<TRow>[]
  state: DataTableState
  onStateChange: (next: DataTableStateUpdate) => void
  data: TRow[]
  total: number
  isLoading?: boolean
  isError?: boolean
  pageSizeOptions?: number[]
  emptyMessage?: string
  errorMessage?: string
  /** Toolbar rendered above the table (search input, faceted filters, date range, etc). */
  toolbar?: React.ReactNode
  /** Optional right-aligned actions (e.g. an "Add" button) next to the toolbar. */
  toolbarActions?: React.ReactNode
}

export const DEFAULT_PAGE_SIZE = 25
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
