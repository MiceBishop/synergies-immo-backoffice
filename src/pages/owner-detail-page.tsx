import { useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Mail, MapPin, Pencil, Phone, Trash2 } from 'lucide-react'
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
import { OwnerFormDialog } from '@/components/owners/owner-form-dialog'
import { BuildingsList } from '@/components/buildings/buildings-list'
import { useOwner, useDeleteOwner } from '@/hooks/use-owners'

export function OwnerDetailPage() {
  const { id } = useParams({ from: '/app/owners/$id' })
  const navigate = useNavigate()
  const { data: owner, isLoading, isError } = useOwner(id)
  const deleteOwner = useDeleteOwner()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const confirmDelete = async () => {
    if (!owner) return
    try {
      await deleteOwner.mutateAsync(owner.id)
      toast.success('Propriétaire supprimé')
      navigate({ to: '/owners' })
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

  if (isError || !owner) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive">Propriétaire introuvable.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayName = [owner.first_name, owner.last_name]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
          {owner.email && (
            <p className="text-muted-foreground flex items-center gap-1.5">
              <Mail className="size-4" />
              {owner.email}
            </p>
          )}
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
            <div>
              <dt className="text-muted-foreground flex items-center gap-1.5">
                <Phone className="size-3.5" />
                Téléphone
              </dt>
              <dd className="font-medium mt-0.5">{owner.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3.5" />
                E-mail
              </dt>
              <dd className="font-medium mt-0.5">{owner.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">NINEA</dt>
              <dd className="font-medium mt-0.5">{owner.tax_id ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                Adresse
              </dt>
              <dd className="font-medium mt-0.5">{owner.address ?? '—'}</dd>
            </div>
          </dl>
          {owner.address && owner.address.length > 60 && (
            <>
              <Separator className="my-4" />
              <div>
                <dt className="text-muted-foreground text-sm">
                  Adresse complète
                </dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap">
                  {owner.address}
                </dd>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Immeubles</h2>
          <CardDescription>
            Patrimoine détenu par ce propriétaire.
          </CardDescription>
        </div>
        <BuildingsList ownerId={owner.id} hideOwnerColumn />
      </div>

      <OwnerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        owner={owner}
      />
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        loading={deleteOwner.isPending}
        title="Supprimer ce propriétaire ?"
        description={`${displayName} sera définitivement supprimé. Les immeubles liés conservés mais sans propriétaire.`}
      />
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/owners"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Retour aux propriétaires
    </Link>
  )
}
