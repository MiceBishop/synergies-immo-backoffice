import { useState } from 'react'
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { OwnerFormDialog } from '@/components/owners/owner-form-dialog'
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog'
import { useOwners, useDeleteOwner, type Owner } from '@/hooks/use-owners'

export function OwnersPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Owner | null>(null)
  const [deleting, setDeleting] = useState<Owner | null>(null)

  const { data: owners, isLoading, isError } = useOwners(search)
  const deleteOwner = useDeleteOwner()

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (owner: Owner) => {
    setEditing(owner)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteOwner.mutateAsync(deleting.id)
      toast.success('Propriétaire supprimé')
      setDeleting(null)
    } catch (error) {
      toast.error('Échec de la suppression', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const fullName = (o: Owner) =>
    [o.first_name, o.last_name].filter(Boolean).join(' ')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propriétaires</h1>
          <p className="text-muted-foreground">
            Gérez les propriétaires des immeubles.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Ajouter un propriétaire
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>NINEA</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-destructive py-8">
                  Erreur lors du chargement des propriétaires.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && owners?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Aucun propriétaire trouvé.
                </TableCell>
              </TableRow>
            )}
            {owners?.map((owner) => (
              <TableRow key={owner.id}>
                <TableCell className="font-medium">{fullName(owner)}</TableCell>
                <TableCell>{owner.email ?? '—'}</TableCell>
                <TableCell>{owner.phone ?? '—'}</TableCell>
                <TableCell>{owner.tax_id ?? '—'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openEdit(owner)}>
                        <Pencil className="mr-2 size-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setDeleting(owner)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 size-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <OwnerFormDialog open={formOpen} onOpenChange={setFormOpen} owner={editing} />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteOwner.isPending}
        title="Supprimer ce propriétaire ?"
        description={
          deleting
            ? `${fullName(deleting)} sera définitivement supprimé. Les immeubles liés ne seront pas supprimés mais perdront leur propriétaire.`
            : ''
        }
      />
    </div>
  )
}
