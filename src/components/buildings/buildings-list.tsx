import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
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

type BuildingsListProps = {
  /** Scope rows to a single owner — used by the owner detail page. */
  ownerId?: string
  /** Hide the Propriétaire column when redundant (e.g. inside an owner detail). */
  hideOwnerColumn?: boolean
}

export function BuildingsList({
  ownerId,
  hideOwnerColumn = false,
}: BuildingsListProps) {
  const navigate = useNavigate()
  const scoped = Boolean(ownerId)

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
    ownerIdFilter: ownerId ? [ownerId] : ownerFilter,
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
    (!scoped && ownerFilter.length > 0) ||
    Boolean(created.from || created.to)

  const resetFilters = () => {
    setSearch('')
    setCityFilter([])
    if (!scoped) setOwnerFilter([])
    setCreated({ from: null, to: null })
    setState({ page: 1 })
  }

  const columns = useMemo<ColumnDef<BuildingRow>[]>(() => {
    const cols: ColumnDef<BuildingRow>[] = [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nom" />
        ),
        cell: ({ row }) => (
          <Link
            to="/buildings/$id"
            params={{ id: row.original.id }}
            onClick={(e) => e.stopPropagation()}
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
    ]

    if (!hideOwnerColumn) {
      cols.push({
        id: 'owner',
        header: 'Propriétaire',
        enableSorting: false,
        cell: ({ row }) => {
          const owner = row.original.owner
          if (!owner) return '—'
          const name = [owner.first_name, owner.last_name]
            .filter(Boolean)
            .join(' ')
          return (
            <Link
              to="/owners/$id"
              params={{ id: owner.id }}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline"
            >
              {name}
            </Link>
          )
        },
      })
    }

    cols.push(
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
  }, [hideOwnerColumn])

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
        onRowClick={(row) =>
          navigate({ to: '/buildings/$id', params: { id: row.id } })
        }
        emptyMessage={
          hasActiveFilters
            ? 'Aucun immeuble ne correspond aux filtres.'
            : scoped
              ? 'Aucun immeuble pour ce propriétaire.'
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
            {!scoped && ownerOptions.length > 0 && (
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
            ? `${deleting.name} sera définitivement supprimé. Tous les locaux liés seront également supprimés.`
            : ''
        }
      />
    </>
  )
}
