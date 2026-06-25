import { z } from 'zod'

// Optional text field that normalizes empty strings to null for the DB.
const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))

export const ownerSchema = z.object({
  last_name: z.string().trim().min(1, 'Le nom est obligatoire'),
  first_name: optionalText,
  email: z
    .string()
    .trim()
    .email("Adresse e-mail invalide")
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : null)),
  phone: optionalText,
  address: optionalText,
  tax_id: optionalText,
})

export type OwnerFormValues = z.input<typeof ownerSchema>
export type OwnerFormOutput = z.output<typeof ownerSchema>
