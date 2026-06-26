import { ExpensesList } from '@/components/expenses/expenses-list'

export function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dépenses</h1>
        <p className="text-muted-foreground">
          Factures et charges liées aux immeubles et locaux du portefeuille.
        </p>
      </div>

      <ExpensesList />
    </div>
  )
}
