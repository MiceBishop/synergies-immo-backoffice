import { useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog'
import { UnitFormDialog } from '@/components/units/unit-form-dialog'
import { UnitStatusBadge } from '@/components/units/unit-status-badge'
import { LeasesList } from '@/components/leases/leases-list'
import { ExpensesList } from '@/components/expenses/expenses-list'
import { useUnit, useDeleteUnit } from '@/hooks/use-units'
import { useSettings } from '@/hooks/use-settings'
import { formatAmount, formatDate } from '@/lib/format'
import { unitTypeLabels } from '@/lib/enums'

export function UnitDetailPage() {
  const { id } = useParams({ from: '/app/units/$id' })
  const navigate = useNavigate()
  const { data: unit, isLoading, isError } = useUnit(id)
  const { data: settings } = useSettings()
  const deleteUnit = useDeleteUnit()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const confirmDelete = async () => {
    if (!unit) return
    try {
      await deleteUnit.mutateAsync(unit.id)
      toast.success('Local supprimé')
      navigate({
        to: unit.building_id ? '/buildings/$id' : '/buildings',
        params: unit.building_id ? { id: unit.building_id } : undefined,
      })
    } catch (error) {
      toast.error('Échec de la suppression', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BackLink buildingId={null} />
        <p className="text-muted-foreground">Chargement…</p>
      </div>
    )
  }

  if (isError || !unit) {
    return (
      <div className="space-y-6">
        <BackLink buildingId={null} />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive">Local introuvable.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink buildingId={unit.building_id} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">
              {unit.reference}
            </h1>
            <UnitStatusBadge status={unit.status} />
          </div>
          <p className="text-muted-foreground">
            {unitTypeLabels[unit.type]}
            {unit.building && (
              <>
                {' · '}
                <Link
                  to="/buildings/$id"
                  params={{ id: unit.building.id }}
                  className="hover:underline"
                >
                  {unit.building.name}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Modifier
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <Field label="Étage" value={unit.floor ?? '—'} />
            <Field
              label="Surface"
              value={unit.area_sqm !== null ? `${unit.area_sqm} m²` : '—'}
            />
            <Field label="Nombre de pièces" value={unit.room_count ?? '—'} />
            <Field
              label="Loyer de base"
              value={formatAmount(unit.base_rent, settings)}
            />
            <Field
              label="Charges mensuelles"
              value={formatAmount(unit.monthly_charges, settings)}
            />
            <Field label="Créé le" value={formatDate(unit.created_at)} />
            <Field label="Mis à jour" value={formatDate(unit.updated_at)} />
          </dl>
          {unit.description && (
            <>
              <Separator className="my-4" />
              <div>
                <dt className="text-muted-foreground text-sm">Description</dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap">
                  {unit.description}
                </dd>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Contrats</h2>
          <CardDescription>
            Contrats de location actuels et passés sur ce local.
          </CardDescription>
        </div>
        <LeasesList unitId={unit.id} hideUnitColumn />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Dépenses</h2>
          <CardDescription>
            Factures et charges propres à ce local.
          </CardDescription>
        </div>
        <ExpensesList unitId={unit.id} hideTargetColumn />
      </div>

      <UnitFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        buildingId={unit.building_id}
        unit={unit}
      />
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        loading={deleteUnit.isPending}
        title="Supprimer ce local ?"
        description={`${unit.reference} sera définitivement supprimé. Les contrats liés bloqueront la suppression si présents.`}
      />
    </div>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium mt-0.5">{value}</dd>
    </div>
  )
}

function BackLink({ buildingId }: { buildingId: string | null }) {
  if (buildingId) {
    return (
      <Link
        to="/buildings/$id"
        params={{ id: buildingId }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour à l'immeuble
      </Link>
    )
  }
  return (
    <Link
      to="/buildings"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Retour aux immeubles
    </Link>
  )
}

