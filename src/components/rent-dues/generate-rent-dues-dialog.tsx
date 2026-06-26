import { useEffect, useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/shared/date-picker'
import { useGenerateRentDues } from '@/hooks/use-rent-dues'

type GenerateRentDuesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function firstOfCurrentMonth(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
}

function firstOfMonth(iso: string): string {
  // Snap any YYYY-MM-DD to the first day of its month.
  return `${iso.slice(0, 7)}-01`
}

export function GenerateRentDuesDialog({
  open,
  onOpenChange,
}: GenerateRentDuesDialogProps) {
  const [month, setMonth] = useState<string>(firstOfCurrentMonth())
  const generate = useGenerateRentDues()

  useEffect(() => {
    if (open) {
      setMonth(firstOfCurrentMonth())
    }
  }, [open])

  const handleGenerate = async () => {
    try {
      const { created, existed } = await generate.mutateAsync({
        targetMonth: month,
      })
      if (created === 0 && existed === 0) {
        toast.warning('Aucun contrat actif éligible pour ce mois.')
      } else if (created === 0) {
        toast.info(`Aucune nouvelle quittance — ${existed} existaient déjà.`)
      } else {
        toast.success(
          `${created} ${created > 1 ? 'nouvelles quittances créées' : 'nouvelle quittance créée'}${
            existed > 0 ? `, ${existed} existaient déjà.` : '.'
          }`
        )
      }
      onOpenChange(false)
    } catch (error) {
      toast.error('Échec de la génération', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Générer les quittances du mois</DialogTitle>
          <DialogDescription>
            Crée une quittance pour chaque contrat actif sur le mois
            sélectionné. Les quittances déjà existantes ne sont pas
            dupliquées — l'opération est sûre à relancer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="month">Mois à générer</Label>
          <DatePicker
            value={month}
            onChange={(v) => setMonth(v ? firstOfMonth(v) : firstOfCurrentMonth())}
            clearable={false}
          />
          <p className="text-xs text-muted-foreground">
            Le jour sélectionné est ramené au 1er du mois.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generate.isPending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={generate.isPending}
          >
            {generate.isPending ? 'Génération…' : 'Générer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
