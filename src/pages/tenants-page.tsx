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
import { TenantFormDialog } from '@/components/tenants/tenant-form-dialog'
import { TenantTypeBadge } from '@/components/tenants/tenant-type-badge'
import {
  useTenantsList,
  useDeleteTenant,
  type Tenant,
} from '@/hooks/use-tenants'
import { formatDate } from '@/lib/format'
import { tenantTypeLabels, enumOptions, type TenantType } from '@/lib/enums'

const typeOptions: FacetOption[] = enumOptions(tenantTypeLabels)

export function TenantsPage() {
  const navigate = useNavigate()
  const [state, setState] = useDataTableState({
    sorting: [{ id: 'last_name', desc: false }],
  })
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TenantType[]>([])
  const [created, setCreated] = useState<DateRangeValue>({
    from: null,
    to: null,
  })

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Tenant | null>(null)
  const [deleting, setDeleting] = useState<Tenant | null>(null)

  const stateForQuery = useMemo(
    () => ({ ...state, globalFilter: search }),
    [state, search]
  )

  const { data, isLoading, isError } = useTenantsList({
    state: stateForQuery,
    typeFilter,
    createdFrom: created.from,
    createdTo: created.to,
  })
  const deleteTenant = useDeleteTenant()

  const displayName = (t: Tenant) =>
    t.tenant_type === 'company'
      ? t.last_name
      : [t.first_name, t.last_name].filter(Boolean).join(' ')

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (t: Tenant) => {
    setEditing(t)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteTenant.mutateAsync(deleting.id)
      toast.success('Locataire supprimé')
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
    Boolean(created.from || created.to)

  const resetFilters = () => {
    setSearch('')
    setTypeFilter([])
    setCreated({ from: null, to: null })
    setState({ page: 1 })
  }

  const columns = useMemo<ColumnDef<Tenant>[]>(
    () => [
      {
        accessorKey: 'last_name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nom" />
        ),
        cell: ({ row }) => (
          <Link
            to="/tenants/$id"
            params={{ id: row.original.id }}
            onClick={(e) => e.stopPropagation()}
            className="font-medium hover:underline"
          >
            {displayName(row.original)}
          </Link>
        ),
      },
      {
        accessorKey: 'tenant_type',
        header: 'Type',
        enableSorting: false,
        cell: ({ row }) => <TenantTypeBadge type={row.original.tenant_type} />,
      },
      {
        accessorKey: 'phone',
        header: 'Téléphone',
        enableSorting: false,
        cell: ({ row }) => row.original.phone,
      },
      {
        accessorKey: 'email',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="E-mail" />
        ),
        cell: ({ row }) => row.original.email ?? '—',
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
          <h1 className="text-2xl font-semibold tracking-tight">Locataires</h1>
          <p className="text-muted-foreground">
            Particuliers et entreprises titulaires de contrats.
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
          navigate({ to: '/tenants/$id', params: { id: row.id } })
        }
        emptyMessage={
          hasActiveFilters
            ? 'Aucun locataire ne correspond aux filtres.'
            : 'Aucun locataire enregistré. Ajoutez-en un pour commencer.'
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
            <DataTableFacetedFilter
              title="Type"
              options={typeOptions}
              selected={typeFilter}
              onChange={(v) => setTypeFilter(v as TenantType[])}
            />
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
            Ajouter un locataire
          </Button>
        }
      />

      <TenantFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        tenant={editing}
      />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteTenant.isPending}
        title="Supprimer ce locataire ?"
        description={
          deleting
            ? `${displayName(deleting)} sera définitivement supprimé. Les contrats liés bloqueront la suppression si présents.`
            : ''
        }
      />
    </div>
  )
}
