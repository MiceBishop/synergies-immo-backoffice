import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, X } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DataTable,
  DataTableColumnHeader,
  DataTableDateRangeFilter,
  DataTableFacetedFilter,
  useDataTableState,
  type DateRangeValue,
  type FacetOption,
} from '@/components/shared/data-table'
import { GenerateRentDuesDialog } from '@/components/rent-dues/generate-rent-dues-dialog'
import { RentDueDetailSheet } from '@/components/rent-dues/rent-due-detail-sheet'
import { RentDueStatusBadge } from '@/components/rent-dues/rent-due-status-badge'
import {
  useRentDuesList,
  type RentDueRow,
} from '@/hooks/use-rent-dues'
import { useBuildings } from '@/hooks/use-buildings'
import { useTenants } from '@/hooks/use-tenants'
import { useSettings } from '@/hooks/use-settings'
import { formatAmount, formatMonthYear } from '@/lib/format'
import { enumOptions, paymentStatusLabels } from '@/lib/enums'
import type { Enums } from '@/lib/db'

const statusOptions: FacetOption[] = enumOptions(paymentStatusLabels)

type RentDuesListProps = {
  /** Scope rows to a single lease — used by the lease detail page. */
  leaseId?: string
  /** Hide the Locataire column when redundant (e.g. inside a tenant detail). */
  hideTenantColumn?: boolean
  /** Hide the Local column when redundant (e.g. inside a unit / lease detail). */
  hideUnitColumn?: boolean
  /** Hide the "Générer les quittances" toolbar button (e.g. when embedded). */
  hideGenerateButton?: boolean
}

export function RentDuesList({
  leaseId,
  hideTenantColumn = false,
  hideUnitColumn = false,
  hideGenerateButton = false,
}: RentDuesListProps) {
  const scoped = Boolean(leaseId)

  const [state, setState] = useDataTableState()
  const [statusFilter, setStatusFilter] = useState<Enums<'payment_status'>[]>(
    []
  )
  const [buildingFilter, setBuildingFilter] = useState<string[]>([])
  const [tenantFilter, setTenantFilter] = useState<string[]>([])
  const [monthRange, setMonthRange] = useState<DateRangeValue>({
    from: null,
    to: null,
  })

  const [generateOpen, setGenerateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data, isLoading, isError } = useRentDuesList({
    page: state.page,
    pageSize: state.pageSize,
    sorting: state.sorting.map((s) => ({ id: s.id, desc: s.desc })),
    statusFilter,
    monthFrom: monthRange.from,
    monthTo: monthRange.to,
    leaseId,
    buildingIds: scoped ? undefined : buildingFilter,
    tenantIds: scoped ? undefined : tenantFilter,
  })
  const { data: buildings } = useBuildings()
  const { data: tenants } = useTenants()
  const { data: settings } = useSettings()

  const buildingOptions: FacetOption[] = (buildings ?? []).map((b) => ({
    value: b.id,
    label: b.name,
  }))

  const tenantOptions: FacetOption[] = (tenants ?? []).map((t) => ({
    value: t.id,
    label:
      t.tenant_type === 'company'
        ? t.last_name
        : [t.first_name, t.last_name].filter(Boolean).join(' '),
  }))

  const tenantLabel = (row: RentDueRow) => {
    const t = row.lease?.tenant
    if (!t) return '—'
    return t.tenant_type === 'company'
      ? t.last_name
      : [t.first_name, t.last_name].filter(Boolean).join(' ')
  }

  const hasActiveFilters =
    statusFilter.length > 0 ||
    (!scoped && buildingFilter.length > 0) ||
    (!scoped && tenantFilter.length > 0) ||
    Boolean(monthRange.from || monthRange.to)

  const resetFilters = () => {
    setStatusFilter([])
    if (!scoped) {
      setBuildingFilter([])
      setTenantFilter([])
    }
    setMonthRange({ from: null, to: null })
    setState({ page: 1 })
  }

  const columns = useMemo<ColumnDef<RentDueRow>[]>(() => {
    const cols: ColumnDef<RentDueRow>[] = [
      {
        accessorKey: 'due_month',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Mois" />
        ),
        cell: ({ row }) => (
          <span className="font-medium capitalize">
            {formatMonthYear(row.original.due_month)}
          </span>
        ),
      },
    ]

    if (!hideTenantColumn) {
      cols.push({
        id: 'tenant',
        header: 'Locataire',
        enableSorting: false,
        cell: ({ row }) => {
          const t = row.original.lease?.tenant
          if (!t) return '—'
          return (
            <Link
              to="/tenants/$id"
              params={{ id: t.id }}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline"
            >
              {tenantLabel(row.original)}
            </Link>
          )
        },
      })
    }

    if (!hideUnitColumn) {
      cols.push({
        id: 'unit',
        header: 'Local',
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original.lease?.unit
          if (!u) return '—'
          return (
            <span>
              <span className="font-medium">{u.reference}</span>
              {u.building && (
                <>
                  {' — '}
                  <Link
                    to="/buildings/$id"
                    params={{ id: u.building.id }}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:underline"
                  >
                    {u.building.name}
                  </Link>
                </>
              )}
            </span>
          )
        },
      })
    }

    cols.push(
      {
        accessorKey: 'amount_incl_tax',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Montant TTC"
            align="right"
          />
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {formatAmount(row.original.amount_incl_tax, settings)}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        enableSorting: false,
        cell: ({ row }) => (
          <RentDueStatusBadge
            status={row.original.status}
            dueMonth={row.original.due_month}
          />
        ),
      }
    )

    return cols
  }, [settings, hideTenantColumn, hideUnitColumn])

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
            ? 'Aucune quittance ne correspond aux filtres.'
            : scoped
              ? 'Aucune quittance générée pour ce contrat.'
              : 'Aucune quittance générée. Cliquez sur « Générer les quittances » pour le mois en cours.'
        }
        toolbar={
          <>
            <DataTableFacetedFilter
              title="Statut"
              options={statusOptions}
              selected={statusFilter}
              onChange={(v) => setStatusFilter(v as Enums<'payment_status'>[])}
            />
            {!scoped && buildingOptions.length > 0 && (
              <DataTableFacetedFilter
                title="Immeuble"
                options={buildingOptions}
                selected={buildingFilter}
                onChange={setBuildingFilter}
              />
            )}
            {!scoped && tenantOptions.length > 0 && (
              <DataTableFacetedFilter
                title="Locataire"
                options={tenantOptions}
                selected={tenantFilter}
                onChange={setTenantFilter}
              />
            )}
            <DataTableDateRangeFilter
              title="Mois entre"
              value={monthRange}
              onChange={setMonthRange}
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
          !hideGenerateButton && (
            <Button onClick={() => setGenerateOpen(true)}>
              <Plus className="size-4" />
              Générer les quittances
            </Button>
          )
        }
      />

      <GenerateRentDuesDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
      />
      <RentDueDetailSheet
        rentDueId={detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
    </>
  )
}
