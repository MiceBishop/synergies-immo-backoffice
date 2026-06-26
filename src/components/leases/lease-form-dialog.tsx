import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Combobox, type ComboboxOption } from '@/components/shared/combobox'
import { DatePicker } from '@/components/shared/date-picker'
import {
  leaseSchema,
  type LeaseFormValues,
  type LeaseFormOutput,
} from '@/schemas/lease.schema'
import {
  useCreateLease,
  useUpdateLease,
  type LeaseRow,
} from '@/hooks/use-leases'
import { useUnitsWithBuilding } from '@/hooks/use-units'
import { useTenants } from '@/hooks/use-tenants'
import { useSettings } from '@/hooks/use-settings'
import {
  enumOptions,
  leaseStatusLabels,
  unitTypeLabels,
} from '@/lib/enums'
import { formatAmount } from '@/lib/format'
import type { Enums } from '@/lib/db'

type LeaseFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lease?: LeaseRow | null
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyValues = (): LeaseFormValues => ({
  unit_id: '',
  tenant_id: '',
  start_date: today(),
  end_date: null,
  rent_excl_tax: 0,
  vat_rate: 0,
  deposit: null,
  deposit_returned: false,
  auto_renew: true,
  status: 'draft',
  special_conditions: '',
})

const statusOptions = enumOptions(leaseStatusLabels)
const COMMERCIAL_UNIT_TYPES: Enums<'unit_type'>[] = ['office', 'shop']

export function LeaseFormDialog({
  open,
  onOpenChange,
  lease,
}: LeaseFormDialogProps) {
  const isEdit = Boolean(lease)
  const createLease = useCreateLease()
  const updateLease = useUpdateLease()

  const { data: units } = useUnitsWithBuilding()
  const { data: tenants } = useTenants()
  const { data: settings } = useSettings()

  const form = useForm<LeaseFormValues>({
    resolver: zodResolver(leaseSchema),
    defaultValues: emptyValues(),
  })

  useEffect(() => {
    if (open) {
      form.reset(
        lease
          ? {
              unit_id: lease.unit_id,
              tenant_id: lease.tenant_id,
              start_date: lease.start_date,
              end_date: lease.end_date,
              rent_excl_tax: Number(lease.rent_excl_tax),
              vat_rate: Number(lease.vat_rate ?? 0),
              deposit: lease.deposit !== null ? Number(lease.deposit) : null,
              deposit_returned: lease.deposit_returned ?? false,
              auto_renew: lease.auto_renew ?? true,
              status: lease.status ?? 'draft',
              special_conditions: lease.special_conditions ?? '',
            }
          : emptyValues()
      )
    }
  }, [open, lease, form])

  const unitOptions: ComboboxOption[] = useMemo(
    () =>
      (units ?? []).map((u) => ({
        value: u.id,
        label: `${u.reference} — ${u.building?.name ?? '—'} (${unitTypeLabels[u.type]})`,
      })),
    [units]
  )

  const tenantOptions: ComboboxOption[] = useMemo(
    () =>
      (tenants ?? []).map((t) => ({
        value: t.id,
        label:
          t.tenant_type === 'company'
            ? t.last_name
            : [t.first_name, t.last_name].filter(Boolean).join(' '),
      })),
    [tenants]
  )

  // Smart defaults when a unit is selected on create
  const selectedUnitId = useWatch({ control: form.control, name: 'unit_id' })
  useEffect(() => {
    if (isEdit || !selectedUnitId || !units) return
    const unit = units.find((u) => u.id === selectedUnitId)
    if (!unit) return
    if (unit.base_rent !== null) {
      form.setValue('rent_excl_tax', Number(unit.base_rent), {
        shouldDirty: true,
      })
    }
    const isCommercial = COMMERCIAL_UNIT_TYPES.includes(unit.type)
    const defaultRate = isCommercial
      ? Number(settings?.vat_rate_commercial_standard ?? 18)
      : Number(settings?.vat_rate_residential ?? 0)
    form.setValue('vat_rate', defaultRate, { shouldDirty: true })
  }, [selectedUnitId, isEdit, units, settings, form])

  // Live VAT preview
  const rentExclTax = useWatch({ control: form.control, name: 'rent_excl_tax' })
  const vatRate = useWatch({ control: form.control, name: 'vat_rate' })
  const vatAmount = (Number(rentExclTax) || 0) * (Number(vatRate) || 0) / 100
  const rentInclTax = (Number(rentExclTax) || 0) + vatAmount

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = values as unknown as LeaseFormOutput
    try {
      if (lease) {
        await updateLease.mutateAsync({ id: lease.id, values: payload })
        toast.success('Bail mis à jour')
      } else {
        await createLease.mutateAsync(payload)
        toast.success('Bail créé')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error("Échec de l'enregistrement", {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le bail' : 'Nouveau bail'}</DialogTitle>
          <DialogDescription>
            Renseignez l'unité, le locataire, et les conditions financières.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-sm font-medium">Unité et locataire</h3>
              <FormField
                control={form.control}
                name="unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité *</FormLabel>
                    <FormControl>
                      <Combobox
                        options={unitOptions}
                        value={field.value || null}
                        onChange={(v) => field.onChange(v ?? '')}
                        placeholder="Choisir une unité"
                        emptyMessage="Aucune unité enregistrée."
                        clearable={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tenant_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Locataire *</FormLabel>
                    <FormControl>
                      <Combobox
                        options={tenantOptions}
                        value={field.value || null}
                        onChange={(v) => field.onChange(v ?? '')}
                        placeholder="Choisir un locataire"
                        emptyMessage="Aucun locataire enregistré."
                        clearable={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <Separator />

            <section className="space-y-4">
              <h3 className="text-sm font-medium">Conditions financières</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rent_excl_tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loyer HT (FCFA) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="1000"
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === '' ? 0 : Number(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vat_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taux de TVA (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === '' ? 0 : Number(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Résidentiel : 0 %. Commercial standard : 18 %.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="rounded-md border bg-muted/30 p-3 text-sm grid grid-cols-3 gap-2">
                <div>
                  <div className="text-muted-foreground text-xs">Loyer HT</div>
                  <div className="font-medium">
                    {formatAmount(Number(rentExclTax) || 0, settings)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">TVA</div>
                  <div className="font-medium">
                    {formatAmount(vatAmount, settings)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Loyer TTC</div>
                  <div className="font-semibold">
                    {formatAmount(rentInclTax, settings)}
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="deposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dépôt de garantie (FCFA)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="1000"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Habituellement 2 mois (résidentiel) ou 3 mois (commercial).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <Separator />

            <section className="space-y-4">
              <h3 className="text-sm font-medium">Dates et reconduction</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début *</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={(v) => field.onChange(v ?? '')}
                          clearable={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de fin</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value ?? null}
                          onChange={field.onChange}
                          placeholder="Aucune"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="auto_renew"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Reconduction automatique</FormLabel>
                      <FormDescription>
                        Le bail se renouvelle automatiquement à l'échéance.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </section>

            <Separator />

            <section className="space-y-4">
              <h3 className="text-sm font-medium">Statut et conditions</h3>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="special_conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions particulières</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
