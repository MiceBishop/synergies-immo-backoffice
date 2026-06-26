import { useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import {
  ArrowLeft,
  CheckCircle2,
  Pencil,
  Trash2,
  XCircle,
} from 'lucide-react'
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
import { LeaseFormDialog } from '@/components/leases/lease-form-dialog'
import { LeaseStatusBadge } from '@/components/leases/lease-status-badge'
import { RentDuesList } from '@/components/rent-dues/rent-dues-list'
import {
  useLease,
  useDeleteLease,
  useUpdateLeaseStatus,
} from '@/hooks/use-leases'
import { useSettings } from '@/hooks/use-settings'
import { formatAmount, formatDate } from '@/lib/format'

export function LeaseDetailPage() {
  const { id } = useParams({ from: '/app/leases/$id' })
  const navigate = useNavigate()
  const { data: lease, isLoading, isError } = useLease(id)
  const { data: settings } = useSettings()
  const deleteLease = useDeleteLease()
  const updateStatus = useUpdateLeaseStatus()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const confirmDelete = async () => {
    if (!lease) return
    try {
      await deleteLease.mutateAsync(lease.id)
      toast.success('Contrat supprimé')
      navigate({ to: '/leases' })
    } catch (error) {
      toast.error('Échec de la suppression', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const changeStatus = async (status: 'active' | 'terminated') => {
    if (!lease) return
    try {
      await updateStatus.mutateAsync({ id: lease.id, status })
      toast.success(
        status === 'active' ? 'Contrat activé' : 'Contrat résilié'
      )
    } catch (error) {
      toast.error('Échec de la mise à jour', {
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

  if (isError || !lease) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive">Contrat introuvable.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tenantName = lease.tenant
    ? lease.tenant.tenant_type === 'company'
      ? lease.tenant.last_name
      : [lease.tenant.first_name, lease.tenant.last_name]
          .filter(Boolean)
          .join(' ')
    : '—'

  const unitLabel = lease.unit
    ? `${lease.unit.reference}${lease.unit.building ? ` — ${lease.unit.building.name}` : ''}`
    : '—'

  const canActivate = lease.status === 'draft'
  const canTerminate = lease.status === 'active'

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">
              Contrat —{' '}
              {lease.tenant ? (
                <Link
                  to="/tenants/$id"
                  params={{ id: lease.tenant.id }}
                  className="hover:underline"
                >
                  {tenantName}
                </Link>
              ) : (
                tenantName
              )}
            </h1>
            <LeaseStatusBadge status={lease.status} />
          </div>
          <p className="text-muted-foreground">
            {lease.unit ? (
              <>
                <Link
                  to="/units/$id"
                  params={{ id: lease.unit.id }}
                  className="font-medium hover:underline"
                >
                  {lease.unit.reference}
                </Link>
                {lease.unit.building && (
                  <>
                    {' — '}
                    <Link
                      to="/buildings/$id"
                      params={{ id: lease.unit.building.id }}
                      className="hover:underline"
                    >
                      {lease.unit.building.name}
                    </Link>
                  </>
                )}
              </>
            ) : (
              unitLabel
            )}
            {' · '}
            {formatDate(lease.start_date)}
            {lease.end_date ? ` → ${formatDate(lease.end_date)}` : ' (sans fin)'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canActivate && (
            <Button
              onClick={() => changeStatus('active')}
              disabled={updateStatus.isPending}
            >
              <CheckCircle2 className="size-4" />
              Activer le contrat
            </Button>
          )}
          {canTerminate && (
            <Button
              variant="outline"
              onClick={() => changeStatus('terminated')}
              disabled={updateStatus.isPending}
            >
              <XCircle className="size-4" />
              Résilier
            </Button>
          )}
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
          <CardTitle className="text-base">Conditions financières</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <Field
              label="Loyer HT"
              value={formatAmount(lease.rent_excl_tax, settings)}
            />
            <Field label="Taux TVA" value={`${lease.vat_rate ?? 0} %`} />
            <Field
              label="TVA"
              value={formatAmount(lease.vat_amount, settings)}
            />
            <Field
              label="Loyer TTC"
              value={formatAmount(lease.rent_incl_tax, settings)}
              emphasize
            />
            <Field
              label="Dépôt de garantie"
              value={formatAmount(lease.deposit, settings)}
            />
            <Field
              label="Dépôt retourné"
              value={lease.deposit_returned ? 'Oui' : 'Non'}
            />
            <Field
              label="Reconduction auto"
              value={lease.auto_renew ? 'Oui' : 'Non'}
            />
            <Field
              label="Créé le"
              value={formatDate(lease.created_at)}
            />
          </dl>
          {lease.special_conditions && (
            <>
              <Separator className="my-4" />
              <div>
                <dt className="text-muted-foreground text-sm">
                  Conditions particulières
                </dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap">
                  {lease.special_conditions}
                </dd>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Quittances</h2>
          <CardDescription>
            Loyers mensuels générés pour ce contrat et statut de paiement.
          </CardDescription>
        </div>
        <RentDuesList
          leaseId={lease.id}
          hideTenantColumn
          hideUnitColumn
          hideGenerateButton
        />
      </div>

      <LeaseFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        lease={lease}
      />
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        loading={deleteLease.isPending}
        title="Supprimer ce contrat ?"
        description="Cette action est irréversible. Les paiements liés bloqueront la suppression si présents."
      />
    </div>
  )
}

function Field({
  label,
  value,
  emphasize,
}: {
  label: string
  value: React.ReactNode
  emphasize?: boolean
}) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={emphasize ? 'font-semibold mt-0.5' : 'font-medium mt-0.5'}>
        {value}
      </dd>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/leases"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Retour aux contrats
    </Link>
  )
}
