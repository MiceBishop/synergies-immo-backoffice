import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus, X } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DataTable,
  DataTableColumnHeader,
  DataTableFacetedFilter,
  useDataTableState,
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

const MONTH_OPTIONS: FacetOption[] = Array.from({ length: 12 }, (_, i) => {
  const name = format(new Date(2000, i, 1), 'LLLL', { locale: fr })
  return {
    value: String(i + 1),
    label: name.charAt(0).toUpperCase() + name.slice(1),
  }
})

function buildYearOptions(): FacetOption[] {
  const current = new Date().getFullYear()
  return Array.from({ length: 11 }, (_, i) => {
    const y = current - i
    return { value: String(y), label: String(y) }
  })
}

/** Last 3 months ending at the current month, clamped to the current year. */
function defaultMonths(): string[] {
  const m = new Date().getMonth() + 1 // 1-12
  const start = Math.max(1, m - 2)
  const result: string[] = []
  for (let i = start; i <= m; i++) result.push(String(i))
  return result
}

function defaultYears(): string[] {
  return [String(new Date().getFullYear())]
}

type RentDuesListProps = {
  /** Scope rows to a single lease — used by the lease detail page. */
  leaseId?: string
  /** Scope rows to a single building — used by the building detail page. */
  buildingId?: string
  /** Hide the Locataire column when redundant (e.g. inside a tenant detail). */
  hideTenantColumn?: boolean
  /** Hide the Local column when redundant (e.g. inside a unit / lease detail). */
  hideUnitColumn?: boolean
  /** Hide the "Générer les quittances" toolbar button (e.g. when embedded). */
  hideGenerateButton?: boolean
}

export function RentDuesList({
  leaseId,
  buildingId,
  hideTenantColumn = false,
  hideUnitColumn = false,
  hideGenerateButton = false,
}: RentDuesListProps) {
  const scoped = Boolean(leaseId) || Boolean(buildingId)

  const [state, setState] = useDataTableState()
  const [statusFilter, setStatusFilter] = useState<Enums<'payment_status'>[]>(
    []
  )
  const [buildingFilter, setBuildingFilter] = useState<string[]>([])
  const [tenantFilter, setTenantFilter] = useState<string[]>([])
  // Defaults: current year + last 3 months (clamped to current year). When the
  // list is scoped to a single lease, we leave the time filter empty so the
  // user sees every quittance for that lease without surprise.
  const [monthFilter, setMonthFilter] = useState<string[]>(() =>
    Boolean(leaseId) ? [] : defaultMonths()
  )
  const [yearFilter, setYearFilter] = useState<string[]>(() =>
    Boolean(leaseId) ? [] : defaultYears()
  )

  const yearOptions = useMemo(() => buildYearOptions(), [])

  const [generateOpen, setGenerateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data, isLoading, isError } = useRentDuesList({
    page: state.page,
    pageSize: state.pageSize,
    sorting: state.sorting.map((s) => ({ id: s.id, desc: s.desc })),
    statusFilter,
    months: monthFilter.map(Number),
    years: yearFilter.map(Number),
    leaseId,
    buildingIds: buildingId
      ? [buildingId]
      : scoped
        ? undefined
        : buildingFilter,
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
    monthFilter.length > 0 ||
    yearFilter.length > 0

  const resetFilters = () => {
    setStatusFilter([])
    if (!scoped) {
      setBuildingFilter([])
      setTenantFilter([])
    }
    setMonthFilter([])
    setYearFilter([])
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
            <DataTableFacetedFilter
              title="Mois"
              options={MONTH_OPTIONS}
              selected={monthFilter}
              onChange={setMonthFilter}
            />
            <DataTableFacetedFilter
              title="Année"
              options={yearOptions}
              selected={yearFilter}
              onChange={setYearFilter}
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
