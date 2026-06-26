import { LeasesList } from '@/components/leases/leases-list'

export function LeasesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contrats</h1>
        <p className="text-muted-foreground">
          Contrats de location liant un local à un locataire.
        </p>
      </div>

      <LeasesList />
    </div>
  )
}
