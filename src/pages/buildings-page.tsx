import { BuildingsList } from '@/components/buildings/buildings-list'

export function BuildingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Immeubles</h1>
        <p className="text-muted-foreground">
          Gérez le portefeuille d'immeubles et leurs propriétaires.
        </p>
      </div>

      <BuildingsList />
    </div>
  )
}
