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
import { TenantFormDialog } from '@/components/tenants/tenant-form-dialog'
import { TenantTypeBadge } from '@/components/tenants/tenant-type-badge'
import { LeasesList } from '@/components/leases/leases-list'
import {
  useTenant,
  useDeleteTenant,
} from '@/hooks/use-tenants'

export function TenantDetailPage() {
  const { id } = useParams({ from: '/app/tenants/$id' })
  const navigate = useNavigate()
  const { data: tenant, isLoading, isError } = useTenant(id)
  const deleteTenant = useDeleteTenant()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const confirmDelete = async () => {
    if (!tenant) return
    try {
      await deleteTenant.mutateAsync(tenant.id)
      toast.success('Locataire supprimé')
      navigate({ to: '/tenants' })
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

  if (isError || !tenant) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive">Locataire introuvable.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCompany = tenant.tenant_type === 'company'
  const displayName = isCompany
    ? tenant.last_name
    : [tenant.first_name, tenant.last_name].filter(Boolean).join(' ')

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">
              {displayName}
            </h1>
            <TenantTypeBadge type={tenant.tenant_type} />
          </div>
          {tenant.email && (
            <p className="text-muted-foreground flex items-center gap-1.5">
              <Mail className="size-4" />
              {tenant.email}
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
              <dd className="font-medium mt-0.5">{tenant.phone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3.5" />
                E-mail
              </dt>
              <dd className="font-medium mt-0.5">{tenant.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {isCompany ? 'RC' : 'CIN'}
              </dt>
              <dd className="font-medium mt-0.5">{tenant.national_id ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">NINEA</dt>
              <dd className="font-medium mt-0.5">{tenant.tax_id ?? '—'}</dd>
            </div>
          </dl>
          {tenant.previous_address && (
            <>
              <Separator className="my-4" />
              <div>
                <dt className="text-muted-foreground text-sm flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {isCompany ? 'Siège social' : 'Adresse précédente'}
                </dt>
                <dd className="mt-1 text-sm">{tenant.previous_address}</dd>
              </div>
            </>
          )}
          {tenant.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <dt className="text-muted-foreground text-sm">Notes</dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap">
                  {tenant.notes}
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
            Contrats de location signés par ce locataire.
          </CardDescription>
        </div>
        <LeasesList tenantId={tenant.id} hideTenantColumn />
      </div>

      <TenantFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        tenant={tenant}
      />
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        loading={deleteTenant.isPending}
        title="Supprimer ce locataire ?"
        description={`${displayName} sera définitivement supprimé. Les contrats liés bloqueront la suppression si présents.`}
      />
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/tenants"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Retour aux locataires
    </Link>
  )
}
