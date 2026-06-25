import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ExternalLink, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
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
  DataTableDateRangeFilter,
  useDataTableState,
  type DateRangeValue,
  type FacetOption,
} from '@/components/shared/data-table'
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog'
import { BuildingFormDialog } from '@/components/buildings/building-form-dialog'
import {
  useBuildingsList,
  useBuildingCities,
  useDeleteBuilding,
  type BuildingRow,
  type Building,
} from '@/hooks/use-buildings'
import { useOwners } from '@/hooks/use-owners'
import { formatDate } from '@/lib/format'

export function BuildingsPage() {
  const [state, setState] = useDataTableState({
    sorting: [{ id: 'name', desc: false }],
  })
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState<string[]>([])
  const [ownerFilter, setOwnerFilter] = useState<string[]>([])
  const [created, setCreated] = useState<DateRangeValue>({ from: null, to: null })

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Building | null>(null)
  const [deleting, setDeleting] = useState<BuildingRow | null>(null)

  const stateForQuery = useMemo(
    () => ({ ...state, globalFilter: search }),
    [state, search]
  )

  const { data, isLoading, isError } = useBuildingsList({
    state: stateForQuery,
    cityFilter,
    ownerIdFilter: ownerFilter,
    createdFrom: created.from,
    createdTo: created.to,
  })
  const { data: cities } = useBuildingCities()
  const { data: owners } = useOwners()
  const deleteBuilding = useDeleteBuilding()

  const cityOptions: FacetOption[] = (cities ?? []).map((c) => ({
    label: c,
    value: c,
  }))
  const ownerOptions: FacetOption[] = (owners ?? []).map((o) => ({
    label: [o.first_name, o.last_name].filter(Boolean).join(' '),
    value: o.id,
  }))

  const ownerName = (b: BuildingRow) =>
    b.owner
      ? [b.owner.first_name, b.owner.last_name].filter(Boolean).join(' ')
      : '—'

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (b: Building) => {
    setEditing(b)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteBuilding.mutateAsync(deleting.id)
      toast.success('Immeuble supprimé')
      setDeleting(null)
    } catch (error) {
      toast.error('Échec de la suppression', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const hasActiveFilters =
    Boolean(search) ||
    cityFilter.length > 0 ||
    ownerFilter.length > 0 ||
    Boolean(created.from || created.to)

  const resetFilters = () => {
    setSearch('')
    setCityFilter([])
    setOwnerFilter([])
    setCreated({ from: null, to: null })
    setState({ page: 1 })
  }

  const columns = useMemo<ColumnDef<BuildingRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nom" />
        ),
        cell: ({ row }) => (
          <Link
            to="/buildings/$id"
            params={{ id: row.original.id }}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'address',
        header: 'Adresse',
        enableSorting: false,
        cell: ({ row }) => row.original.address,
      },
      {
        accessorKey: 'city',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Ville" />
        ),
      },
      {
        id: 'owner',
        header: 'Propriétaire',
        enableSorting: false,
        cell: ({ row }) => ownerName(row.original),
      },
      {
        accessorKey: 'floor_count',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Étages" align="right" />
        ),
        cell: ({ row }) => (
          <div className="text-right">{row.original.floor_count ?? '—'}</div>
        ),
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Créé le" />
        ),
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        id: 'actions',
        header: () => null,
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  to="/buildings/$id"
                  params={{ id: row.original.id }}
                  className="cursor-pointer"
                >
                  <ExternalLink className="mr-2 size-4" />
                  Voir le détail
                </Link>
              </DropdownMenuItem>
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
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Immeubles</h1>
          <p className="text-muted-foreground">
            Gérez le portefeuille d'immeubles et leurs propriétaires.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        state={state}
        onStateChange={setState}
        data={data?.rows ?? []}
        total={data?.total ?? 0}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={
          hasActiveFilters
            ? 'Aucun immeuble ne correspond aux filtres.'
            : 'Aucun immeuble enregistré. Ajoutez-en un pour commencer.'
        }
        toolbar={
          <>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou adresse…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            {cityOptions.length > 0 && (
              <DataTableFacetedFilter
                title="Ville"
                options={cityOptions}
                selected={cityFilter}
                onChange={setCityFilter}
              />
            )}
            {ownerOptions.length > 0 && (
              <DataTableFacetedFilter
                title="Propriétaire"
                options={ownerOptions}
                selected={ownerFilter}
                onChange={setOwnerFilter}
              />
            )}
            <DataTableDateRangeFilter
              title="Créé entre"
              value={created}
              onChange={setCreated}
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
            Ajouter un immeuble
          </Button>
        }
      />

      <BuildingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        building={editing}
      />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteBuilding.isPending}
        title="Supprimer cet immeuble ?"
        description={
          deleting
            ? `${deleting.name} sera définitivement supprimé. Toutes les unités liées seront également supprimées.`
            : ''
        }
      />
    </div>
  )
}
