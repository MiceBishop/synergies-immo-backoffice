import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
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
  DataTableDateRangeFilter,
  useDataTableState,
  type DateRangeValue,
} from '@/components/shared/data-table'
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog'
import { OwnerFormDialog } from '@/components/owners/owner-form-dialog'
import {
  useOwnersList,
  useDeleteOwner,
  type Owner,
} from '@/hooks/use-owners'
import { formatDate } from '@/lib/format'

export function OwnersPage() {
  const navigate = useNavigate()
  const [state, setState] = useDataTableState({
    sorting: [{ id: 'last_name', desc: false }],
  })
  const [search, setSearch] = useState('')
  const [created, setCreated] = useState<DateRangeValue>({ from: null, to: null })

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Owner | null>(null)
  const [deleting, setDeleting] = useState<Owner | null>(null)

  const stateForQuery = useMemo(
    () => ({ ...state, globalFilter: search }),
    [state, search]
  )

  const { data, isLoading, isError } = useOwnersList({
    state: stateForQuery,
    createdFrom: created.from,
    createdTo: created.to,
  })
  const deleteOwner = useDeleteOwner()

  const fullName = (o: Owner) =>
    [o.first_name, o.last_name].filter(Boolean).join(' ')

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (owner: Owner) => {
    setEditing(owner)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteOwner.mutateAsync(deleting.id)
      toast.success('Propriétaire supprimé')
      setDeleting(null)
    } catch (error) {
      toast.error('Échec de la suppression', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const hasActiveFilters =
    Boolean(search) || Boolean(created.from || created.to)

  const resetFilters = () => {
    setSearch('')
    setCreated({ from: null, to: null })
    setState({ page: 1 })
  }

  const columns = useMemo<ColumnDef<Owner>[]>(
    () => [
      {
        accessorKey: 'last_name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nom" />
        ),
        cell: ({ row }) => (
          <Link
            to="/owners/$id"
            params={{ id: row.original.id }}
            onClick={(e) => e.stopPropagation()}
            className="font-medium hover:underline"
          >
            {fullName(row.original)}
          </Link>
        ),
      },
      {
        accessorKey: 'email',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="E-mail" />
        ),
        cell: ({ row }) => row.original.email ?? '—',
      },
      {
        accessorKey: 'phone',
        header: 'Téléphone',
        enableSorting: false,
        cell: ({ row }) => row.original.phone ?? '—',
      },
      {
        accessorKey: 'tax_id',
        header: 'NINEA',
        enableSorting: false,
        cell: ({ row }) => row.original.tax_id ?? '—',
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
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propriétaires</h1>
          <p className="text-muted-foreground">
            Gérez les propriétaires des immeubles.
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
        onRowClick={(row) =>
          navigate({ to: '/owners/$id', params: { id: row.id } })
        }
        emptyMessage={
          hasActiveFilters
            ? 'Aucun propriétaire ne correspond aux filtres.'
            : 'Aucun propriétaire enregistré. Ajoutez-en un pour commencer.'
        }
        toolbar={
          <>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, e-mail ou téléphone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
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
            Ajouter un propriétaire
          </Button>
        }
      />

      <OwnerFormDialog open={formOpen} onOpenChange={setFormOpen} owner={editing} />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteOwner.isPending}
        title="Supprimer ce propriétaire ?"
        description={
          deleting
            ? `${fullName(deleting)} sera définitivement supprimé. Les immeubles liés ne seront pas supprimés mais perdront leur propriétaire.`
            : ''
        }
      />
    </div>
  )
}
