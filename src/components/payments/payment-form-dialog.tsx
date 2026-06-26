import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/shared/date-picker'
import {
  paymentSchema,
  type PaymentFormValues,
  type PaymentFormOutput,
} from '@/schemas/payment.schema'
import { useCreatePayment } from '@/hooks/use-payments'
import { useSettings } from '@/hooks/use-settings'
import { paymentMethodLabels, enumOptions } from '@/lib/enums'
import { formatAmount, todayIso } from '@/lib/format'

type PaymentFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rentDueId: string
  amountDue: number
  amountAlreadyPaid: number
}

const methodOptions = enumOptions(paymentMethodLabels)

export function PaymentFormDialog({
  open,
  onOpenChange,
  rentDueId,
  amountDue,
  amountAlreadyPaid,
}: PaymentFormDialogProps) {
  const createPayment = useCreatePayment(rentDueId)
  const { data: settings } = useSettings()
  const remaining = Math.max(0, amountDue - amountAlreadyPaid)

  const emptyValues = (): PaymentFormValues => ({
    amount: remaining > 0 ? remaining : amountDue,
    payment_date: todayIso(),
    method: 'bank_transfer',
    payment_reference: '',
    notes: '',
  })

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: emptyValues(),
  })

  useEffect(() => {
    if (open) {
      form.reset(emptyValues())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rentDueId, remaining])

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = values as unknown as PaymentFormOutput
    try {
      await createPayment.mutateAsync(payload)
      toast.success('Paiement enregistré')
      onOpenChange(false)
    } catch (error) {
      toast.error("Échec de l'enregistrement", {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <DialogDescription>
            Montant restant à régler :{' '}
            <span className="font-medium">
              {formatAmount(remaining, settings)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
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
                  <FormDescription>
                    Pour un paiement total, saisissez {formatAmount(remaining, settings)}.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_date"
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
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Méthode *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {methodOptions.map((opt) => (
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
            </div>

            <FormField
              control={form.control}
              name="payment_reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Référence</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="N° de chèque, virement…"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
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
