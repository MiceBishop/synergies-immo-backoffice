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
import { useSettings } from '@/hooks/use-settings'
import { formatAmount, formatMonthYear } from '@/lib/format'
import { enumOptions, paymentStatusLabels } from '@/lib/enums'
import type { Enums } from '@/lib/db'

const statusOptions: FacetOption[] = enumOptions(paymentStatusLabels)

export function RentDuesPage() {
  const [state, setState] = useDataTableState()
  const [statusFilter, setStatusFilter] = useState<Enums<'payment_status'>[]>(
    []
  )
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
  })
  const { data: settings } = useSettings()

  const tenantLabel = (row: RentDueRow) => {
    const t = row.lease?.tenant
    if (!t) return '—'
    return t.tenant_type === 'company'
      ? t.last_name
      : [t.first_name, t.last_name].filter(Boolean).join(' ')
  }

  const hasActiveFilters =
    statusFilter.length > 0 || Boolean(monthRange.from || monthRange.to)

  const resetFilters = () => {
    setStatusFilter([])
    setMonthRange({ from: null, to: null })
    setState({ page: 1 })
  }

  const columns = useMemo<ColumnDef<RentDueRow>[]>(
    () => [
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
      {
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
      },
      {
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
      },
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
      },
    ],
    [settings]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loyers</h1>
          <p className="text-muted-foreground">
            Quittances mensuelles et statut de paiement par contrat.
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
        onRowClick={(row) => setDetailId(row.id)}
        emptyMessage={
          hasActiveFilters
            ? 'Aucune quittance ne correspond aux filtres.'
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
          <Button onClick={() => setGenerateOpen(true)}>
            <Plus className="size-4" />
            Générer les quittances
          </Button>
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
    </div>
  )
}
