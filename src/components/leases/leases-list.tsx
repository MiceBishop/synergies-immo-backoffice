import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
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
import { LeaseFormDialog } from '@/components/leases/lease-form-dialog'
import { LeaseStatusBadge } from '@/components/leases/lease-status-badge'
import {
  useLeasesList,
  useDeleteLease,
  type LeaseRow,
} from '@/hooks/use-leases'
import { useSettings } from '@/hooks/use-settings'
import { formatAmount, formatDate } from '@/lib/format'
import { enumOptions, leaseStatusLabels } from '@/lib/enums'
import type { Enums } from '@/lib/db'

const statusOptions: FacetOption[] = enumOptions(leaseStatusLabels)

type LeasesListProps = {
  /** Scope rows to a building (via the unit's building_id). */
  buildingId?: string
  /** Scope rows to a tenant. */
  tenantId?: string
  /** Scope rows to a single unit. */
  unitId?: string
  /** Hide the Unité column when redundant (e.g. inside a building detail). */
  hideUnitColumn?: boolean
  /** Hide the Locataire column when redundant (e.g. inside a tenant detail). */
  hideTenantColumn?: boolean
}

export function LeasesList({
  buildingId,
  tenantId,
  unitId,
  hideUnitColumn = false,
  hideTenantColumn = false,
}: LeasesListProps) {
  const navigate = useNavigate()
  const [state, setState] = useDataTableState({
    sorting: [{ id: 'start_date', desc: true }],
  })
  const [statusFilter, setStatusFilter] = useState<Enums<'lease_status'>[]>([])
  const [startRange, setStartRange] = useState<DateRangeValue>({
    from: null,
    to: null,
  })

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LeaseRow | null>(null)
  const [deleting, setDeleting] = useState<LeaseRow | null>(null)

  const { data, isLoading, isError } = useLeasesList({
    state,
    statusFilter,
    startFrom: startRange.from,
    startTo: startRange.to,
    buildingId,
    tenantId,
    unitId,
  })
  const deleteLease = useDeleteLease()
  const { data: settings } = useSettings()

  const tenantLabel = (l: LeaseRow) =>
    l.tenant
      ? l.tenant.tenant_type === 'company'
        ? l.tenant.last_name
        : [l.tenant.first_name, l.tenant.last_name].filter(Boolean).join(' ')
      : '—'

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (l: LeaseRow) => {
    setEditing(l)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteLease.mutateAsync(deleting.id)
      toast.success('Bail supprimé')
      setDeleting(null)
    } catch (error) {
      toast.error('Échec de la suppression', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const hasActiveFilters =
    statusFilter.length > 0 || Boolean(startRange.from || startRange.to)

  const resetFilters = () => {
    setStatusFilter([])
    setStartRange({ from: null, to: null })
    setState({ page: 1 })
  }

  const columns = useMemo<ColumnDef<LeaseRow>[]>(() => {
    const cols: ColumnDef<LeaseRow>[] = []

    if (!hideUnitColumn) {
      cols.push({
        accessorKey: 'unit_id',
        header: 'Unité',
        enableSorting: false,
        cell: ({ row }) => {
          const unit = row.original.unit
          if (!unit) return '—'
          return (
            <span>
              <span className="font-medium">{unit.reference}</span>
              {unit.building && (
                <>
                  {' — '}
                  <Link
                    to="/buildings/$id"
                    params={{ id: unit.building.id }}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:underline"
                  >
                    {unit.building.name}
                  </Link>
                </>
              )}
            </span>
          )
        },
      })
    }

    if (!hideTenantColumn) {
      cols.push({
        accessorKey: 'tenant_id',
        header: 'Locataire',
        enableSorting: false,
        cell: ({ row }) => {
          const tenant = row.original.tenant
          if (!tenant) return '—'
          return (
            <Link
              to="/tenants/$id"
              params={{ id: tenant.id }}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline"
            >
              {tenantLabel(row.original)}
            </Link>
          )
        },
      })
    }

    cols.push(
      {
        accessorKey: 'start_date',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Début" />
        ),
        cell: ({ row }) => formatDate(row.original.start_date),
      },
      {
        accessorKey: 'end_date',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fin" />
        ),
        cell: ({ row }) => formatDate(row.original.end_date),
      },
      {
        accessorKey: 'rent_incl_tax',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Loyer TTC" align="right" />
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatAmount(row.original.rent_incl_tax, settings)}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        enableSorting: false,
        cell: ({ row }) => <LeaseStatusBadge status={row.original.status} />,
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
  }, [settings, hideUnitColumn, hideTenantColumn])

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
          navigate({ to: '/leases/$id', params: { id: row.id } })
        }
        emptyMessage={
          hasActiveFilters
            ? 'Aucun bail ne correspond aux filtres.'
            : 'Aucun bail enregistré. Créez-en un pour commencer.'
        }
        toolbar={
          <>
            <DataTableFacetedFilter
              title="Statut"
              options={statusOptions}
              selected={statusFilter}
              onChange={(v) => setStatusFilter(v as Enums<'lease_status'>[])}
            />
            <DataTableDateRangeFilter
              title="Début entre"
              value={startRange}
              onChange={setStartRange}
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
            Nouveau bail
          </Button>
        }
      />

      <LeaseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lease={editing}
      />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteLease.isPending}
        title="Supprimer ce bail ?"
        description={
          deleting
            ? `Le bail ${tenantLabel(deleting)} sera définitivement supprimé. Les paiements liés bloqueront la suppression si présents.`
            : ''
        }
      />
    </>
  )
}
