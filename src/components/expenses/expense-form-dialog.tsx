import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Building2, DoorOpen } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Combobox, type ComboboxOption } from '@/components/shared/combobox'
import { DatePicker } from '@/components/shared/date-picker'
import {
  expenseSchema,
  type ExpenseFormValues,
  type ExpenseFormOutput,
} from '@/schemas/expense.schema'
import {
  useCreateExpense,
  useUpdateExpense,
  type Expense,
} from '@/hooks/use-expenses'
import { useBuildings } from '@/hooks/use-buildings'
import { useUnitsWithBuilding } from '@/hooks/use-units'
import {
  enumOptions,
  expenseTypeLabels,
  unitTypeLabels,
} from '@/lib/enums'
import { todayIso } from '@/lib/format'
import { cn } from '@/lib/utils'

type ExpenseFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense | null
  /** When set, pre-selects building target with this id; user can change. */
  defaultBuildingId?: string
  /** When set, pre-selects unit target with this id; user can change. */
  defaultUnitId?: string
}

const typeOptions = enumOptions(expenseTypeLabels)

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  defaultBuildingId,
  defaultUnitId,
}: ExpenseFormDialogProps) {
  const isEdit = Boolean(expense)
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const { data: buildings } = useBuildings()
  const { data: units } = useUnitsWithBuilding()

  const emptyValues = (): ExpenseFormValues => ({
    target: defaultUnitId ? 'unit' : 'building',
    building_id: defaultBuildingId ?? null,
    unit_id: defaultUnitId ?? null,
    type: 'other',
    label: '',
    amount: 0,
    expense_date: todayIso(),
    billable: false,
    notes: '',
  })

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: emptyValues(),
  })

  const target = useWatch({ control: form.control, name: 'target' })

  useEffect(() => {
    if (open) {
      form.reset(
        expense
          ? {
              target: expense.unit_id ? 'unit' : 'building',
              building_id: expense.building_id,
              unit_id: expense.unit_id,
              type: expense.type,
              label: expense.label,
              amount: Number(expense.amount),
              expense_date: expense.expense_date,
              billable: expense.billable ?? false,
              notes: expense.notes ?? '',
            }
          : emptyValues()
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expense, defaultBuildingId, defaultUnitId])

  const buildingOptions: ComboboxOption[] = useMemo(
    () =>
      (buildings ?? []).map((b) => ({
        value: b.id,
        label: b.name,
      })),
    [buildings]
  )

  const unitOptions: ComboboxOption[] = useMemo(
    () =>
      (units ?? []).map((u) => ({
        value: u.id,
        label: `${u.reference} — ${u.building?.name ?? '—'} (${unitTypeLabels[u.type]})`,
      })),
    [units]
  )

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = values as unknown as ExpenseFormOutput
    try {
      if (expense) {
        await updateExpense.mutateAsync({ id: expense.id, values: payload })
        toast.success('Dépense mise à jour')
      } else {
        await createExpense.mutateAsync(payload)
        toast.success('Dépense créée')
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Modifier la dépense' : 'Nouvelle dépense'}
          </DialogTitle>
          <DialogDescription>
            Charges, factures et autres dépenses liées à un immeuble ou à un
            local.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attribuer à</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v)
                        // Clear the unselected side so a stale combobox value
                        // doesn't sneak into the submit payload.
                        if (v === 'building') {
                          form.setValue('unit_id', null)
                        } else {
                          form.setValue('building_id', null)
                        }
                      }}
                      className="grid grid-cols-2 gap-2"
                    >
                      <TargetOption
                        value="building"
                        selected={field.value === 'building'}
                        icon={Building2}
                        label="Immeuble"
                      />
                      <TargetOption
                        value="unit"
                        selected={field.value === 'unit'}
                        icon={DoorOpen}
                        label="Local"
                      />
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {target === 'building' ? (
              <FormField
                control={form.control}
                name="building_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Immeuble *</FormLabel>
                    <FormControl>
                      <Combobox
                        options={buildingOptions}
                        value={field.value ?? null}
                        onChange={field.onChange}
                        placeholder="Choisir un immeuble"
                        emptyMessage="Aucun immeuble enregistré."
                        clearable={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local *</FormLabel>
                    <FormControl>
                      <Combobox
                        options={unitOptions}
                        value={field.value ?? null}
                        onChange={field.onChange}
                        placeholder="Choisir un local"
                        emptyMessage="Aucun local enregistré."
                        clearable={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {typeOptions.map((opt) => (
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant (FCFA) *</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Libellé *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Facture SDE, Travaux peinture…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expense_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? todayIso())}
                      clearable={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billable"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">
                      Refacturable au locataire
                    </FormLabel>
                    <FormDescription>
                      À répercuter dans les charges du locataire.
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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

function TargetOption({
  value,
  selected,
  icon: Icon,
  label,
}: {
  value: string
  selected: boolean
  icon: typeof Building2
  label: string
}) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors',
        selected
          ? 'border-primary bg-accent/30'
          : 'border-input hover:bg-accent/30'
      )}
    >
      <RadioGroupItem value={value} className="sr-only" />
      <Icon
        className={cn(
          'size-5 shrink-0',
          selected ? 'text-primary' : 'text-muted-foreground'
        )}
      />
      <span
        className={cn(
          'text-sm font-medium',
          selected ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </label>
  )
}
