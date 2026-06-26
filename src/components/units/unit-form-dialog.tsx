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
import {
  unitSchema,
  type UnitFormValues,
  type UnitFormOutput,
} from '@/schemas/unit.schema'
import {
  useCreateUnit,
  useUpdateUnit,
  type Unit,
} from '@/hooks/use-units'
import { unitTypeLabels, unitStatusLabels, enumOptions } from '@/lib/enums'

type UnitFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  buildingId: string
  unit?: Unit | null
}

const emptyValues: UnitFormValues = {
  reference: '',
  floor: null,
  type: 'apartment',
  area_sqm: null,
  room_count: null,
  status: 'vacant',
  base_rent: null,
  monthly_charges: 0,
  description: '',
}

const typeOptions = enumOptions(unitTypeLabels)
const statusOptions = enumOptions(unitStatusLabels)

export function UnitFormDialog({
  open,
  onOpenChange,
  buildingId,
  unit,
}: UnitFormDialogProps) {
  const isEdit = Boolean(unit)
  const createUnit = useCreateUnit(buildingId)
  const updateUnit = useUpdateUnit()

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        unit
          ? {
              reference: unit.reference,
              floor: unit.floor,
              type: unit.type,
              area_sqm: unit.area_sqm,
              room_count: unit.room_count,
              status: unit.status ?? 'vacant',
              base_rent: unit.base_rent,
              monthly_charges: unit.monthly_charges,
              description: unit.description ?? '',
            }
          : emptyValues
      )
    }
  }, [open, unit, form])

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = values as unknown as UnitFormOutput
    try {
      if (unit) {
        await updateUnit.mutateAsync({ id: unit.id, values: payload })
        toast.success('Local mis à jour')
      } else {
        await createUnit.mutateAsync(payload)
        toast.success('Local créé')
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le local' : 'Nouveau local'}</DialogTitle>
          <DialogDescription>
            Renseignez les informations du local (appartement, bureau, commerce…).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Référence *</FormLabel>
                    <FormControl>
                      <Input placeholder="A-301" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Étage</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={-10}
                        max={200}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="area_sqm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surface (m²)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? null : Number(e.target.value)
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
                name="room_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de pièces</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="base_rent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loyer de base (FCFA)</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monthly_charges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charges mensuelles (FCFA)</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ''} />
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
