import type { Enums } from './db'

/**
 * Centralised French labels for DB enum values. Reuse across forms, lists,
 * faceted filters, and badges so the same value always renders the same way.
 */

export const unitTypeLabels: Record<Enums<'unit_type'>, string> = {
  apartment: 'Appartement',
  office: 'Bureau',
  shop: 'Commerce',
  parking: 'Parking',
  storage: 'Stockage',
}

export const unitStatusLabels: Record<Enums<'unit_status'>, string> = {
  vacant: 'Vacant',
  occupied: 'Occupé',
  under_renovation: 'En rénovation',
}

export const leaseStatusLabels: Record<Enums<'lease_status'>, string> = {
  active: 'Actif',
  expired: 'Expiré',
  terminated: 'Résilié',
  draft: 'Brouillon',
}

export const paymentMethodLabels: Record<Enums<'payment_method'>, string> = {
  cash: 'Espèces',
  bank_transfer: 'Virement bancaire',
  check: 'Chèque',
  direct_debit: 'Prélèvement',
}

export const paymentStatusLabels: Record<Enums<'payment_status'>, string> = {
  paid: 'Payé',
  partial: 'Partiel',
  unpaid: 'Impayé',
  overdue: 'En retard',
}

export const expenseTypeLabels: Record<Enums<'expense_type'>, string> = {
  water: 'Eau',
  electricity: 'Électricité',
  syndicate: 'Syndic',
  maintenance: 'Entretien',
  tax: 'Taxe',
  other: 'Autre',
}

/** Turn a label-map into options usable by Select / DataTableFacetedFilter. */
export function enumOptions<T extends string>(
  labels: Record<T, string>
): Array<{ value: T; label: string }> {
  return (Object.entries(labels) as [T, string][]).map(([value, label]) => ({
    value,
    label,
  }))
}
