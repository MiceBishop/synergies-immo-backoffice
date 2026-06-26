import { z } from 'zod'

export const expenseTypeValues = [
  'water',
  'electricity',
  'syndicate',
  'maintenance',
  'tax',
  'other',
] as const

export const expenseTargetValues = ['building', 'unit'] as const
export type ExpenseTarget = (typeof expenseTargetValues)[number]

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))

// The DB has a CHECK constraint requiring exactly one of building_id / unit_id
// to be set. We model that on the form via a `target` discriminator the user
// chooses, plus the corresponding id field. The final transform writes only
// the relevant column and nulls the other.
export const expenseSchema = z
  .object({
    target: z.enum(expenseTargetValues, { message: 'Cible requise' }),
    building_id: z.string().uuid().nullable().optional(),
    unit_id: z.string().uuid().nullable().optional(),
    type: z.enum(expenseTypeValues, { message: 'Type requis' }),
    label: z.string().trim().min(1, 'Le libellé est obligatoire'),
    amount: z
      .number({ message: 'Montant requis' })
      .positive('Le montant doit être positif'),
    expense_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
    billable: z.boolean().default(false),
    notes: optionalText,
  })
  .superRefine((data, ctx) => {
    if (data.target === 'building' && !data.building_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['building_id'],
        message: "Sélectionnez l'immeuble",
      })
    }
    if (data.target === 'unit' && !data.unit_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['unit_id'],
        message: 'Sélectionnez le local',
      })
    }
  })
  .transform((data) => ({
    // Strip the discriminator and null the unused side so the DB check passes.
    building_id: data.target === 'building' ? data.building_id ?? null : null,
    unit_id: data.target === 'unit' ? data.unit_id ?? null : null,
    type: data.type,
    label: data.label,
    amount: data.amount,
    expense_date: data.expense_date,
    billable: data.billable,
    notes: data.notes,
  }))

export type ExpenseFormValues = z.input<typeof expenseSchema>
export type ExpenseFormOutput = z.output<typeof expenseSchema>
