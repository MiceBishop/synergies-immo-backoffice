import { useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from './data-table-pagination'
import {
  DEFAULT_PAGE_SIZE_OPTIONS,
  type DataTableProps,
} from './types'

export function DataTable<TRow>({
  columns,
  state,
  onStateChange,
  data,
  total,
  isLoading,
  isError,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  emptyMessage = 'Aucun résultat.',
  errorMessage = 'Erreur lors du chargement.',
  toolbar,
  toolbarActions,
}: DataTableProps<TRow>) {
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / state.pageSize)),
    [total, state.pageSize]
  )

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting: state.sorting,
      columnFilters: state.filters,
      pagination: { pageIndex: state.page - 1, pageSize: state.pageSize },
      globalFilter: state.globalFilter,
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(state.sorting) : updater
      onStateChange({ sorting: next as SortingState, page: 1 })
    },
    onColumnFiltersChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(state.filters) : updater
      onStateChange({ filters: next as ColumnFiltersState, page: 1 })
    },
    onPaginationChange: (updater) => {
      const prev = { pageIndex: state.page - 1, pageSize: state.pageSize }
      const next = typeof updater === 'function' ? updater(prev) : updater
      onStateChange({ page: next.pageIndex + 1, pageSize: next.pageSize })
    },
    onGlobalFilterChange: (next) => {
      onStateChange({ globalFilter: next as string, page: 1 })
    },
  })

  return (
    <div className="space-y-3">
      {(toolbar || toolbarActions) && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">{toolbar}</div>
          {toolbarActions && (
            <div className="flex items-center gap-2">{toolbarActions}</div>
          )}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground py-10"
                >
                  Chargement…
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-destructive py-10"
                >
                  {errorMessage}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground py-10"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={state.page}
        pageSize={state.pageSize}
        total={total}
        pageSizeOptions={pageSizeOptions}
        onPageChange={(page) => onStateChange({ page })}
        onPageSizeChange={(pageSize) =>
          onStateChange({ pageSize, page: 1 })
        }
      />
    </div>
  )
}
