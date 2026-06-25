import { z } from 'zod'
import { tenantTypeValues } from '@/lib/enums'

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))

export const tenantSchema = z
  .object({
    tenant_type: z.enum(tenantTypeValues).default('individual'),
    last_name: z.string().trim().min(1, 'Le nom est obligatoire'),
    first_name: optionalText,
    email: z
      .string()
      .trim()
      .email("Adresse e-mail invalide")
      .optional()
      .or(z.literal(''))
      .transform((v) => (v ? v : null)),
    phone: z.string().trim().min(1, 'Le téléphone est obligatoire'),
    national_id: optionalText,
    tax_id: optionalText,
    previous_address: optionalText,
    notes: optionalText,
  })
  .transform((data) => {
    // Companies don't carry a first name — drop any leftover value from a
    // switched-from-individual form so the DB row stays consistent.
    if (data.tenant_type === 'company') {
      return { ...data, first_name: null }
    }
    return data
  })

export type TenantFormValues = z.input<typeof tenantSchema>
export type TenantFormOutput = z.output<typeof tenantSchema>
