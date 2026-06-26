import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  DataTable,
  DataTableColumnHeader,
  DataTableDateRangeFilter,
  DataTableFacetedFilter,
  useDataTableState,
  type DateRangeValue,
  type FacetOption,
} from '@/components/shared/data-table'
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog'
import { ExpenseFormDialog } from '@/components/expenses/expense-form-dialog'
import {
  useExpensesList,
  useDeleteExpense,
  type ExpenseRow,
} from '@/hooks/use-expenses'
import { useBuildings } from '@/hooks/use-buildings'
import { useSettings } from '@/hooks/use-settings'
import { formatAmount, formatDate } from '@/lib/format'
import { enumOptions, expenseTypeLabels } from '@/lib/enums'
import type { Enums } from '@/lib/db'

const typeOptions: FacetOption[] = enumOptions(expenseTypeLabels)

type ExpensesListProps = {
  /** Scope to expenses directly on a single building. */
  buildingId?: string
  /** Scope to expenses on a single unit. */
  unitId?: string
  /** Hide the Cible column when redundant (e.g. inside a unit / building detail). */
  hideTargetColumn?: boolean
}

export function ExpensesList({
  buildingId,
  unitId,
  hideTargetColumn = false,
}: ExpensesListProps) {
  const scoped = Boolean(buildingId) || Boolean(unitId)

  const [state, setState] = useDataTableState({
    sorting: [{ id: 'expense_date', desc: true }],
  })
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<Enums<'expense_type'>[]>([])
  const [buildingFilter, setBuildingFilter] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    from: null,
    to: null,
  })

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseRow | null>(null)
  const [deleting, setDeleting] = useState<ExpenseRow | null>(null)

  const stateForQuery = useMemo(
    () => ({ ...state, globalFilter: search }),
    [state, search]
  )

  const { data, isLoading, isError } = useExpensesList({
    state: stateForQuery,
    typeFilter,
    buildingIds: scoped ? undefined : buildingFilter,
    buildingId,
    unitId,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  })
  const { data: buildings } = useBuildings()
  const { data: settings } = useSettings()
  const deleteExpense = useDeleteExpense()

  const buildingOptions: FacetOption[] = (buildings ?? []).map((b) => ({
    value: b.id,
    label: b.name,
  }))

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (e: ExpenseRow) => {
    setEditing(e)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteExpense.mutateAsync(deleting.id)
      toast.success('Dépense supprimée')
      setDeleting(null)
    } catch (error) {
      toast.error('Échec de la suppression', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const hasActiveFilters =
    Boolean(search) ||
    typeFilter.length > 0 ||
    (!scoped && buildingFilter.length > 0) ||
    Boolean(dateRange.from || dateRange.to)

  const resetFilters = () => {
    setSearch('')
    setTypeFilter([])
    if (!scoped) setBuildingFilter([])
    setDateRange({ from: null, to: null })
    setState({ page: 1 })
  }

  const columns = useMemo<ColumnDef<ExpenseRow>[]>(() => {
    const cols: ColumnDef<ExpenseRow>[] = [
      {
        accessorKey: 'expense_date',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => formatDate(row.original.expense_date),
      },
      {
        accessorKey: 'label',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Libellé" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.label}</span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        enableSorting: false,
        cell: ({ row }) => expenseTypeLabels[row.original.type],
      },
    ]

    if (!hideTargetColumn) {
      cols.push({
        id: 'target',
        header: 'Cible',
        enableSorting: false,
        cell: ({ row }) => {
          const e = row.original
          if (e.building) {
            return (
              <Link
                to="/buildings/$id"
                params={{ id: e.building.id }}
                onClick={(ev) => ev.stopPropagation()}
                className="hover:underline"
              >
                {e.building.name}
              </Link>
            )
          }
          if (e.unit) {
            return (
              <span>
                <span className="font-medium">{e.unit.reference}</span>
                {e.unit.building && (
                  <>
                    {' — '}
                    <Link
                      to="/buildings/$id"
                      params={{ id: e.unit.building.id }}
                      onClick={(ev) => ev.stopPropagation()}
                      className="hover:underline"
                    >
                      {e.unit.building.name}
                    </Link>
                  </>
                )}
              </span>
            )
          }
          return '—'
        },
      })
    }

    cols.push(
      {
        accessorKey: 'amount',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Montant" align="right" />
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatAmount(row.original.amount, settings)}
          </div>
        ),
      },
      {
        accessorKey: 'billable',
        header: 'Refacturable',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.billable ? (
            <Badge
              variant="outline"
              className="font-normal border-transparent bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200"
            >
              Oui
            </Badge>
          ) : (
            <span className="text-muted-foreground">Non</span>
          ),
      },
      {
        id: 'actions',
        header: () => null,
        enableSorting: false,
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => openEdit(row.original)}>
                  <Pencil className="mr-2 size-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setDeleting(row.original)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      }
    )

    return cols
  }, [settings, hideTargetColumn])

  return (
    <>
      <DataTable
        columns={columns}
        state={state}
        onStateChange={setState}
        data={data?.rows ?? []}
        total={data?.total ?? 0}
        isLoading={isLoading}
        isError={isError}
        onRowClick={(row) => openEdit(row)}
        emptyMessage={
          hasActiveFilters
            ? 'Aucune dépense ne correspond aux filtres.'
            : scoped
              ? 'Aucune dépense enregistrée.'
              : 'Aucune dépense enregistrée. Ajoutez-en une pour commencer.'
        }
        toolbar={
          <>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par libellé ou note…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <DataTableFacetedFilter
              title="Type"
              options={typeOptions}
              selected={typeFilter}
              onChange={(v) => setTypeFilter(v as Enums<'expense_type'>[])}
            />
            {!scoped && buildingOptions.length > 0 && (
              <DataTableFacetedFilter
                title="Immeuble"
                options={buildingOptions}
                selected={buildingFilter}
                onChange={setBuildingFilter}
              />
            )}
            <DataTableDateRangeFilter
              title="Date entre"
              value={dateRange}
              onChange={setDateRange}
            />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={resetFilters}
              >
                Réinitialiser
                <X className="ml-1 size-3.5" />
              </Button>
            )}
          </>
        }
        toolbarActions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Nouvelle dépense
          </Button>
        }
      />

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editing}
        defaultBuildingId={buildingId}
        defaultUnitId={unitId}
      />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteExpense.isPending}
        title="Supprimer cette dépense ?"
        description={
          deleting
            ? `${deleting.label} (${formatAmount(deleting.amount, settings)}) sera définitivement supprimée.`
            : ''
        }
      />
    </>
  )
}
