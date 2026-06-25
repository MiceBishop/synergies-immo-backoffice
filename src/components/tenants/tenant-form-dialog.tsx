import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Building, User } from 'lucide-react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  tenantSchema,
  type TenantFormValues,
  type TenantFormOutput,
} from '@/schemas/tenant.schema'
import {
  useCreateTenant,
  useUpdateTenant,
  type Tenant,
} from '@/hooks/use-tenants'
import { cn } from '@/lib/utils'

type TenantFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant?: Tenant | null
}

const emptyValues: TenantFormValues = {
  tenant_type: 'individual',
  last_name: '',
  first_name: '',
  email: '',
  phone: '',
  national_id: '',
  tax_id: '',
  previous_address: '',
  notes: '',
}

export function TenantFormDialog({
  open,
  onOpenChange,
  tenant,
}: TenantFormDialogProps) {
  const isEdit = Boolean(tenant)
  const createTenant = useCreateTenant()
  const updateTenant = useUpdateTenant()

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: emptyValues,
  })

  // Re-render the field labels when tenant_type changes.
  const currentType = useWatch({
    control: form.control,
    name: 'tenant_type',
  })
  const isCompany = currentType === 'company'

  useEffect(() => {
    if (open) {
      form.reset(
        tenant
          ? {
              tenant_type:
                tenant.tenant_type === 'company' ? 'company' : 'individual',
              last_name: tenant.last_name,
              first_name: tenant.first_name ?? '',
              email: tenant.email ?? '',
              phone: tenant.phone,
              national_id: tenant.national_id ?? '',
              tax_id: tenant.tax_id ?? '',
              previous_address: tenant.previous_address ?? '',
              notes: tenant.notes ?? '',
            }
          : emptyValues
      )
    }
  }, [open, tenant, form])

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = values as unknown as TenantFormOutput
    try {
      if (tenant) {
        await updateTenant.mutateAsync({ id: tenant.id, values: payload })
        toast.success('Locataire mis à jour')
      } else {
        await createTenant.mutateAsync(payload)
        toast.success('Locataire créé')
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
          <DialogTitle>
            {isEdit ? 'Modifier le locataire' : 'Nouveau locataire'}
          </DialogTitle>
          <DialogDescription>
            Renseignez les informations du locataire (particulier ou entreprise).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="tenant_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 gap-2"
                    >
                      <TypeOption
                        value="individual"
                        selected={field.value === 'individual'}
                        icon={User}
                        label="Personne physique"
                      />
                      <TypeOption
                        value="company"
                        selected={field.value === 'company'}
                        icon={Building}
                        label="Personne morale"
                      />
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div
              className={cn(
                'grid gap-4',
                isCompany ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
              )}
            >
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isCompany ? 'Raison sociale *' : 'Nom *'}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isCompany && (
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
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone *</FormLabel>
                    <FormControl>
                      <Input placeholder="+221 77 …" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="national_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isCompany ? 'RC (Registre de Commerce)' : 'CIN'}
                    </FormLabel>
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
                    <FormLabel>NINEA</FormLabel>
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
              name="previous_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isCompany ? 'Siège social' : 'Adresse précédente'}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
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

type TypeOptionProps = {
  value: string
  selected: boolean
  icon: typeof User
  label: string
}

function TypeOption({ value, selected, icon: Icon, label }: TypeOptionProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors',
        selected
          ? 'border-primary bg-accent/30'
          : 'border-input hover:bg-accent/30'
      )}
    >
      <RadioGroupItem value={value} className="sr-only" />
      <Icon
        className={cn(
          'size-5 shrink-0',
          selected ? 'text-primary' : 'text-muted-foreground'
        )}
      />
      <span
        className={cn(
          'text-sm font-medium',
          selected ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </label>
  )
}
