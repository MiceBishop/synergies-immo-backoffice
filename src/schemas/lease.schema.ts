import { z } from 'zod'

export const leaseStatusValues = [
  'active',
  'expired',
  'terminated',
  'draft',
] as const

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide')

const optionalIsoDate = isoDate.nullable().optional().transform((v) =>
  v === undefined ? null : v
)

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))

export const leaseSchema = z
  .object({
    unit_id: z.string().uuid("Sélectionnez un local"),
    tenant_id: z.string().uuid("Sélectionnez un locataire"),
    start_date: isoDate,
    end_date: optionalIsoDate,
    rent_excl_tax: z
      .number({ message: 'Montant requis' })
      .min(0, 'Doit être positif'),
    vat_rate: z
      .number({ message: 'Taux requis' })
      .min(0)
      .max(100)
      .default(0),
    deposit: z
      .number()
      .min(0)
      .nullable()
      .optional()
      .transform((v) => (v === undefined ? null : v)),
    deposit_returned: z.boolean().default(false),
    auto_renew: z.boolean().default(true),
    status: z.enum(leaseStatusValues).default('draft'),
    special_conditions: optionalText,
  })
  .refine(
    (data) =>
      !data.end_date || data.end_date > data.start_date,
    {
      path: ['end_date'],
      message: "La date de fin doit être après le début",
    }
  )

export type LeaseFormValues = z.input<typeof leaseSchema>
export type LeaseFormOutput = z.output<typeof leaseSchema>
