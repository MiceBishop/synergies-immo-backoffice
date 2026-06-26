import { useMemo, useState } from 'react'
import { MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
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
  DataTableFacetedFilter,
  useDataTableState,
  type FacetOption,
} from '@/components/shared/data-table'
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog'
import { UnitDetailSheet } from '@/components/units/unit-detail-sheet'
import { UnitFormDialog } from '@/components/units/unit-form-dialog'
import { UnitStatusBadge } from '@/components/units/unit-status-badge'
import {
  useUnitsList,
  useDeleteUnit,
  type Unit,
} from '@/hooks/use-units'
import { useSettings } from '@/hooks/use-settings'
import { formatAmount } from '@/lib/format'
import {
  unitStatusLabels,
  unitTypeLabels,
  enumOptions,
} from '@/lib/enums'
import type { Enums } from '@/lib/db'

type UnitsListProps = {
  buildingId: string
}

const typeOptions: FacetOption[] = enumOptions(unitTypeLabels)
const statusOptions: FacetOption[] = enumOptions(unitStatusLabels)

export function UnitsList({ buildingId }: UnitsListProps) {
  const [state, setState] = useDataTableState({
    sorting: [{ id: 'reference', desc: false }],
  })
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<Enums<'unit_type'>[]>([])
  const [statusFilter, setStatusFilter] = useState<Enums<'unit_status'>[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Unit | null>(null)
  const [deleting, setDeleting] = useState<Unit | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const stateForQuery = useMemo(
    () => ({ ...state, globalFilter: search }),
    [state, search]
  )

  const { data, isLoading, isError } = useUnitsList({
    buildingId,
    state: stateForQuery,
    typeFilter,
    statusFilter,
  })
  const deleteUnit = useDeleteUnit()
  const { data: settings } = useSettings()

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (unit: Unit) => {
    setEditing(unit)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteUnit.mutateAsync(deleting.id)
      toast.success('Local supprimé')
      setDeleting(null)
    } catch (error) {
      toast.error('Échec de la suppression', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const hasActiveFilters =
    Boolean(search) || typeFilter.length > 0 || statusFilter.length > 0

  const resetFilters = () => {
    setSearch('')
    setTypeFilter([])
    setStatusFilter([])
    setState({ page: 1 })
  }

  const columns = useMemo<ColumnDef<Unit>[]>(
    () => [
      {
        accessorKey: 'reference',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Référence" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.reference}</span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        enableSorting: false,
        cell: ({ row }) => unitTypeLabels[row.original.type],
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        enableSorting: false,
        cell: ({ row }) => <UnitStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'floor',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Étage" align="right" />
        ),
        cell: ({ row }) => (
          <div className="text-right">{row.original.floor ?? '—'}</div>
        ),
      },
      {
        accessorKey: 'area_sqm',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Surface" align="right" />
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.area_sqm !== null ? `${row.original.area_sqm} m²` : '—'}
          </div>
        ),
      },
      {
        accessorKey: 'base_rent',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Loyer" align="right" />
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatAmount(row.original.base_rent, settings)}
          </div>
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
      },
    ],
    [settings]
  )

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
        onRowClick={(row) => setDetailId(row.id)}
        emptyMessage={
          hasActiveFilters
            ? 'Aucun local ne correspond aux filtres.'
            : "Aucun local enregistré pour cet immeuble. Ajoutez-en un pour commencer."
        }
        toolbar={
          <>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par référence ou description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <DataTableFacetedFilter
              title="Type"
              options={typeOptions}
              selected={typeFilter}
              onChange={(v) => setTypeFilter(v as Enums<'unit_type'>[])}
            />
            <DataTableFacetedFilter
              title="Statut"
              options={statusOptions}
              selected={statusFilter}
              onChange={(v) => setStatusFilter(v as Enums<'unit_status'>[])}
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
            Ajouter un local
          </Button>
        }
      />

      <UnitDetailSheet
        unitId={detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(unit) => {
          setDetailId(null)
          openEdit(unit)
        }}
        onDelete={(unit) => {
          setDetailId(null)
          setDeleting(unit)
        }}
      />
      <UnitFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        buildingId={buildingId}
        unit={editing}
      />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteUnit.isPending}
        title="Supprimer ce local ?"
        description={
          deleting
            ? `${deleting.reference} sera définitivement supprimé. Les contrats liés bloqueront la suppression si présents.`
            : ''
        }
      />
    </>
  )
}
