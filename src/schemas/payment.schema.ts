import { z } from 'zod'

export const paymentMethodValues = [
  'cash',
  'bank_transfer',
  'check',
  'direct_debit',
] as const

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))

export const paymentSchema = z.object({
  amount: z
    .number({ message: 'Montant requis' })
    .positive('Le montant doit être positif'),
  payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  method: z.enum(paymentMethodValues, { message: 'Méthode requise' }),
  payment_reference: optionalText,
  notes: optionalText,
})

export type PaymentFormValues = z.input<typeof paymentSchema>
export type PaymentFormOutput = z.output<typeof paymentSchema>
