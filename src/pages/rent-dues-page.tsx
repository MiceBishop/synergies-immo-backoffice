import { RentDuesList } from '@/components/rent-dues/rent-dues-list'

export function RentDuesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Loyers</h1>
        <p className="text-muted-foreground">
          Quittances mensuelles et statut de paiement par contrat.
        </p>
      </div>

      <RentDuesList />
    </div>
  )
}
