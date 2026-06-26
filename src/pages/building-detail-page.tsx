import { useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Building2, MapPin, Pencil, Trash2, UserSquare } from 'lucide-react'
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
import { BuildingFormDialog } from '@/components/buildings/building-form-dialog'
import { LeasesList } from '@/components/leases/leases-list'
import { RentDuesList } from '@/components/rent-dues/rent-dues-list'
import { UnitsList } from '@/components/units/units-list'
import { useBuilding, useDeleteBuilding } from '@/hooks/use-buildings'
import { formatDate } from '@/lib/format'

export function BuildingDetailPage() {
  const { id } = useParams({ from: '/app/buildings/$id' })
  const navigate = useNavigate()
  const { data: building, isLoading, isError } = useBuilding(id)
  const deleteBuilding = useDeleteBuilding()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const confirmDelete = async () => {
    if (!building) return
    try {
      await deleteBuilding.mutateAsync(building.id)
      toast.success('Immeuble supprimé')
      navigate({ to: '/buildings' })
    } catch (error) {
      toast.error('Échec de la suppression', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BackLink />
        <p className="text-muted-foreground">Chargement…</p>
      </div>
    )
  }

  if (isError || !building) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive">Immeuble introuvable.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const ownerName = building.owner
    ? [building.owner.first_name, building.owner.last_name]
        .filter(Boolean)
        .join(' ')
    : null

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{building.name}</h1>
          <p className="text-muted-foreground flex items-center gap-1.5">
            <MapPin className="size-4" />
            {building.address}, {building.city}
          </p>
        </div>
        <div className="flex gap-2">
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
            <div>
              <dt className="text-muted-foreground flex items-center gap-1.5">
                <UserSquare className="size-3.5" />
                Propriétaire
              </dt>
              <dd className="font-medium mt-0.5">
                {building.owner ? (
                  <Link
                    to="/owners/$id"
                    params={{ id: building.owner.id }}
                    className="hover:underline"
                  >
                    {ownerName}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                Étages
              </dt>
              <dd className="font-medium mt-0.5">{building.floor_count ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Créé le</dt>
              <dd className="font-medium mt-0.5">
                {formatDate(building.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Mis à jour</dt>
              <dd className="font-medium mt-0.5">
                {formatDate(building.updated_at)}
              </dd>
            </div>
          </dl>
          {building.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <dt className="text-muted-foreground text-sm">Notes</dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap">
                  {building.notes}
                </dd>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Locaux</h2>
          <CardDescription>
            Appartements, bureaux, commerces et autres locaux de cet immeuble.
          </CardDescription>
        </div>
        <UnitsList buildingId={building.id} />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Contrats</h2>
          <CardDescription>
            Contrats de location actifs et passés sur cet immeuble.
          </CardDescription>
        </div>
        <LeasesList buildingId={building.id} />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Quittances</h2>
          <CardDescription>
            Loyers mensuels générés pour les contrats de cet immeuble.
          </CardDescription>
        </div>
        <RentDuesList buildingId={building.id} hideGenerateButton />
      </div>

      <BuildingFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        building={building}
      />
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        loading={deleteBuilding.isPending}
        title="Supprimer cet immeuble ?"
        description={`${building.name} sera définitivement supprimé. Tous les locaux liés seront également supprimés.`}
      />
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/buildings"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Retour à la liste
    </Link>
  )
}
