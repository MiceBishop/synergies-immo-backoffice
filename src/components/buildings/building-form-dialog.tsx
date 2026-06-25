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
import { Combobox } from '@/components/shared/combobox'
import {
  buildingSchema,
  type BuildingFormValues,
} from '@/schemas/building.schema'
import {
  useCreateBuilding,
  useUpdateBuilding,
  type Building,
} from '@/hooks/use-buildings'
import { useOwners } from '@/hooks/use-owners'

type BuildingFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  building?: Building | null
}

const emptyValues: BuildingFormValues = {
  name: '',
  address: '',
  city: '',
  owner_id: null,
  floor_count: 1,
  notes: '',
}

export function BuildingFormDialog({
  open,
  onOpenChange,
  building,
}: BuildingFormDialogProps) {
  const isEdit = Boolean(building)
  const createBuilding = useCreateBuilding()
  const updateBuilding = useUpdateBuilding()
  const { data: owners } = useOwners()

  const form = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        building
          ? {
              name: building.name,
              address: building.address,
              city: building.city,
              owner_id: building.owner_id,
              floor_count: building.floor_count ?? 1,
              notes: building.notes ?? '',
            }
          : emptyValues
      )
    }
  }, [open, building, form])

  const ownerOptions =
    owners?.map((o) => ({
      label: [o.first_name, o.last_name].filter(Boolean).join(' '),
      value: o.id,
    })) ?? []

  const onSubmit = form.handleSubmit(async (values) => {
    const parsed = buildingSchema.parse(values)
    try {
      if (building) {
        await updateBuilding.mutateAsync({ id: building.id, values: parsed })
        toast.success('Immeuble mis à jour')
      } else {
        await createBuilding.mutateAsync(parsed)
        toast.success('Immeuble créé')
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'immeuble" : 'Nouvel immeuble'}
          </DialogTitle>
          <DialogDescription>
            Renseignez les informations de l'immeuble.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="floor_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre d'étages</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
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

            <FormField
              control={form.control}
              name="owner_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propriétaire</FormLabel>
                  <FormControl>
                    <Combobox
                      options={ownerOptions}
                      value={field.value ?? null}
                      onChange={field.onChange}
                      placeholder="Sélectionner un propriétaire"
                      emptyMessage="Aucun propriétaire enregistré."
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
