import { z } from 'zod'

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))

const optionalNumber = (opts?: { min?: number; max?: number; int?: boolean }) => {
  let n = z.number({ message: 'Doit être un nombre' })
  if (opts?.int) n = n.int()
  if (opts?.min !== undefined) n = n.min(opts.min)
  if (opts?.max !== undefined) n = n.max(opts.max)
  return n
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? null : v))
}

export const unitTypeValues = [
  'apartment',
  'office',
  'shop',
  'parking',
  'storage',
] as const

export const unitStatusValues = [
  'vacant',
  'occupied',
  'under_renovation',
] as const

export const unitSchema = z.object({
  reference: z.string().trim().min(1, 'La référence est obligatoire'),
  floor: optionalNumber({ int: true, min: -10, max: 200 }),
  type: z.enum(unitTypeValues, { message: 'Le type est obligatoire' }),
  area_sqm: optionalNumber({ min: 0, max: 100000 }),
  room_count: optionalNumber({ int: true, min: 0, max: 100 }),
  status: z.enum(unitStatusValues).default('vacant'),
  base_rent: optionalNumber({ min: 0 }),
  monthly_charges: optionalNumber({ min: 0 }),
  description: optionalText,
})

export type UnitFormValues = z.input<typeof unitSchema>
export type UnitFormOutput = z.output<typeof unitSchema>
