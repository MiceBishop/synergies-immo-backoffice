import { z } from 'zod'

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))

export const buildingSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est obligatoire'),
  address: z.string().trim().min(1, "L'adresse est obligatoire"),
  city: z.string().trim().min(1, 'La ville est obligatoire'),
  owner_id: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
  floor_count: z
    .number({ message: 'Doit être un nombre' })
    .int()
    .min(0)
    .max(200)
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? null : v)),
  notes: optionalText,
})

export type BuildingFormValues = z.input<typeof buildingSchema>
export type BuildingFormOutput = z.output<typeof buildingSchema>
