import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog'
import { PaymentFormDialog } from '@/components/payments/payment-form-dialog'
import {
  RentDueStatusBadge,
  effectiveRentDueStatus,
} from '@/components/rent-dues/rent-due-status-badge'
import { useRentDue } from '@/hooks/use-rent-dues'
import {
  usePaymentsForRentDue,
  useDeletePayment,
  type Payment,
} from '@/hooks/use-payments'
import { useSettings } from '@/hooks/use-settings'
import { formatAmount, formatDate } from '@/lib/format'
import { paymentMethodLabels } from '@/lib/enums'

type RentDueDetailSheetProps = {
  rentDueId: string | null
  onOpenChange: (open: boolean) => void
}

function frenchMonth(iso: string | null): string {
  if (!iso) return '—'
  const [y, m] = iso.split('-').map(Number)
  const months = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ]
  return `${months[m - 1]} ${y}`
}

export function RentDueDetailSheet({
  rentDueId,
  onOpenChange,
}: RentDueDetailSheetProps) {
  const { data: rentDue, isLoading, isError } = useRentDue(rentDueId)
  const { data: payments } = usePaymentsForRentDue(rentDueId)
  const { data: settings } = useSettings()
  const deletePayment = useDeletePayment()

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null)

  const tenant = rentDue?.lease?.tenant
  const unit = rentDue?.lease?.unit
  const totalPaid =
    payments?.reduce((acc, p) => acc + Number(p.amount), 0) ?? 0
  const remaining = rentDue
    ? Math.max(0, Number(rentDue.amount_incl_tax) - totalPaid)
    : 0

  const tenantName = tenant
    ? tenant.tenant_type === 'company'
      ? tenant.last_name
      : [tenant.first_name, tenant.last_name].filter(Boolean).join(' ')
    : '—'

  const confirmDeletePayment = async () => {
    if (!deletingPayment) return
    try {
      await deletePayment.mutateAsync(deletingPayment.id)
      toast.success('Paiement supprimé')
      setDeletingPayment(null)
    } catch (error) {
      toast.error('Échec de la suppression', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  return (
    <Sheet open={Boolean(rentDueId)} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col overflow-y-auto"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          {isLoading ? (
            <>
              <SheetTitle>Chargement…</SheetTitle>
              <SheetDescription>Récupération de la quittance.</SheetDescription>
            </>
          ) : isError || !rentDue ? (
            <>
              <SheetTitle>Quittance introuvable</SheetTitle>
              <SheetDescription>
                Le détail de cette quittance n'a pas pu être chargé.
              </SheetDescription>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <SheetTitle className="text-xl">
                  Loyer de {frenchMonth(rentDue.due_month)}
                </SheetTitle>
                <RentDueStatusBadge
                  status={rentDue.status}
                  dueMonth={rentDue.due_month}
                />
              </div>
              <SheetDescription className="space-y-1">
                {tenant && (
                  <span className="block">
                    Locataire :{' '}
                    <Link
                      to="/tenants/$id"
                      params={{ id: tenant.id }}
                      className="hover:underline inline-flex items-center gap-1"
                    >
                      {tenantName}
                      <ExternalLink className="size-3" />
                    </Link>
                  </span>
                )}
                {unit && (
                  <span className="block">
                    Local : <span className="font-medium">{unit.reference}</span>
                    {unit.building && (
                      <>
                        {' — '}
                        <Link
                          to="/buildings/$id"
                          params={{ id: unit.building.id }}
                          className="hover:underline"
                        >
                          {unit.building.name}
                        </Link>
                      </>
                    )}
                  </span>
                )}
              </SheetDescription>
              {effectiveRentDueStatus(rentDue.status, rentDue.due_month) !==
                'paid' && (
                <div className="pt-2">
                  <Button size="sm" onClick={() => setPaymentOpen(true)}>
                    <Plus className="size-4" />
                    Enregistrer un paiement
                  </Button>
                </div>
              )}
            </>
          )}
        </SheetHeader>

        {rentDue && (
          <div className="px-6 py-4 space-y-6">
            <section>
              <h3 className="text-sm font-medium mb-3">Montants</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Field
                  label="Loyer HT"
                  value={formatAmount(rentDue.amount_excl_tax, settings)}
                />
                <Field
                  label="TVA"
                  value={formatAmount(rentDue.vat_amount, settings)}
                />
                <Field
                  label="Total TTC"
                  value={formatAmount(rentDue.amount_incl_tax, settings)}
                  emphasize
                />
                <Field
                  label="Encaissé"
                  value={formatAmount(totalPaid, settings)}
                />
                <Field
                  label="Reste à percevoir"
                  value={formatAmount(remaining, settings)}
                  emphasize
                />
              </dl>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-medium">Paiements</h3>
              {payments && payments.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{formatDate(p.payment_date)}</TableCell>
                          <TableCell>
                            {paymentMethodLabels[p.method]}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatAmount(p.amount, settings)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {p.payment_reference ?? '—'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletingPayment(p)}
                              aria-label="Supprimer ce paiement"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun paiement enregistré.
                </p>
              )}
            </section>
          </div>
        )}

        {rentDue && (
          <PaymentFormDialog
            open={paymentOpen}
            onOpenChange={setPaymentOpen}
            rentDueId={rentDue.id}
            amountDue={Number(rentDue.amount_incl_tax)}
            amountAlreadyPaid={totalPaid}
          />
        )}
        <ConfirmDeleteDialog
          open={Boolean(deletingPayment)}
          onOpenChange={(open) => !open && setDeletingPayment(null)}
          onConfirm={confirmDeletePayment}
          loading={deletePayment.isPending}
          title="Supprimer ce paiement ?"
          description="Le statut de la quittance sera recalculé automatiquement."
        />
      </SheetContent>
    </Sheet>
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
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={emphasize ? 'font-semibold mt-0.5' : 'font-medium mt-0.5'}>
        {value}
      </dd>
    </div>
  )
}
