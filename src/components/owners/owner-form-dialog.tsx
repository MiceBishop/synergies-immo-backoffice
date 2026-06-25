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
import {
  ownerSchema,
  type OwnerFormValues,
  type OwnerFormOutput,
} from '@/schemas/owner.schema'
import { useCreateOwner, useUpdateOwner, type Owner } from '@/hooks/use-owners'

type OwnerFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  owner?: Owner | null
}

const emptyValues: OwnerFormValues = {
  last_name: '',
  first_name: '',
  email: '',
  phone: '',
  address: '',
  tax_id: '',
}

export function OwnerFormDialog({ open, onOpenChange, owner }: OwnerFormDialogProps) {
  const isEdit = Boolean(owner)
  const createOwner = useCreateOwner()
  const updateOwner = useUpdateOwner()

  const form = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        owner
          ? {
              last_name: owner.last_name,
              first_name: owner.first_name ?? '',
              email: owner.email ?? '',
              phone: owner.phone ?? '',
              address: owner.address ?? '',
              tax_id: owner.tax_id ?? '',
            }
          : emptyValues
      )
    }
  }, [open, owner, form])

  const onSubmit = form.handleSubmit(async (values) => {
    // zodResolver returns the transformed output as `values` at runtime,
    // but RHF's types still treat it as the input shape — cast to bridge.
    const payload = values as unknown as OwnerFormOutput
    try {
      if (owner) {
        await updateOwner.mutateAsync({ id: owner.id, values: payload })
        toast.success('Propriétaire mis à jour')
      } else {
        await createOwner.mutateAsync(payload)
        toast.success('Propriétaire créé')
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
            {isEdit ? 'Modifier le propriétaire' : 'Nouveau propriétaire'}
          </DialogTitle>
          <DialogDescription>
            Renseignez les informations du propriétaire.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="last_name"
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
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tax_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NINEA / Identifiant fiscal</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
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
