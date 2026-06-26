import { Link } from '@tanstack/react-router'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ExpensesList } from '@/components/expenses/expenses-list'
import { LeasesList } from '@/components/leases/leases-list'
import { UnitStatusBadge } from '@/components/units/unit-status-badge'
import { useUnit, type Unit } from '@/hooks/use-units'
import { useSettings } from '@/hooks/use-settings'
import { formatAmount, formatDate } from '@/lib/format'
import { unitTypeLabels } from '@/lib/enums'

type UnitDetailSheetProps = {
  unitId: string | null
  onOpenChange: (open: boolean) => void
  onEdit: (unit: Unit) => void
  onDelete: (unit: Unit) => void
}

export function UnitDetailSheet({
  unitId,
  onOpenChange,
  onEdit,
  onDelete,
}: UnitDetailSheetProps) {
  const { data: unit, isLoading, isError } = useUnit(unitId)
  const { data: settings } = useSettings()

  return (
    <Sheet open={Boolean(unitId)} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col overflow-y-auto"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          {isLoading ? (
            <>
              <SheetTitle>Chargement…</SheetTitle>
              <SheetDescription>Récupération du local.</SheetDescription>
            </>
          ) : isError || !unit ? (
            <>
              <SheetTitle>Local introuvable</SheetTitle>
              <SheetDescription>
                Le détail de ce local n'a pas pu être chargé.
              </SheetDescription>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <SheetTitle className="text-xl">{unit.reference}</SheetTitle>
                <UnitStatusBadge status={unit.status} />
              </div>
              <SheetDescription>
                {unitTypeLabels[unit.type]}
                {unit.building && (
                  <>
                    {' · '}
                    <Link
                      to="/buildings/$id"
                      params={{ id: unit.building.id }}
                      className="hover:underline inline-flex items-center gap-1"
                    >
                      {unit.building.name}
                      <ExternalLink className="size-3" />
                    </Link>
                  </>
                )}
              </SheetDescription>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(unit)}
                >
                  <Pencil className="size-4" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(unit)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </Button>
              </div>
            </>
          )}
        </SheetHeader>

        {unit && (
          <div className="px-6 py-4 space-y-6">
            <section>
              <h3 className="text-sm font-medium mb-3">Informations</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Field label="Étage" value={unit.floor ?? '—'} />
                <Field
                  label="Surface"
                  value={unit.area_sqm !== null ? `${unit.area_sqm} m²` : '—'}
                />
                <Field label="Pièces" value={unit.room_count ?? '—'} />
                <Field
                  label="Loyer de base"
                  value={formatAmount(unit.base_rent, settings)}
                />
                <Field
                  label="Charges mensuelles"
                  value={formatAmount(unit.monthly_charges, settings)}
                />
                <Field label="Créé le" value={formatDate(unit.created_at)} />
              </dl>
              {unit.description && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <dt className="text-muted-foreground text-sm">
                      Description
                    </dt>
                    <dd className="mt-1 text-sm whitespace-pre-wrap">
                      {unit.description}
                    </dd>
                  </div>
                </>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">Contrats</h3>
                <p className="text-xs text-muted-foreground">
                  Contrats de location sur ce local.
                </p>
              </div>
              <LeasesList unitId={unit.id} hideUnitColumn />
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">Dépenses</h3>
                <p className="text-xs text-muted-foreground">
                  Factures et charges propres à ce local.
                </p>
              </div>
              <ExpensesList unitId={unit.id} hideTargetColumn />
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium mt-0.5">{value}</dd>
    </div>
  )
}
