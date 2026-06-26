import type { RentDueRow } from '@/hooks/use-rent-dues'
import type { Payment } from '@/hooks/use-payments'
import type { SettingsMap } from '@/hooks/use-settings'

/**
 * The flattened data shape both PDF templates render. Computed from the
 * RentDueRow + payments + settings so the React-PDF tree is a plain
 * function of this object and can be re-rendered in unit tests.
 */
export type PdfData = {
  // Landlord / company info — comes from the settings table.
  company: {
    name: string
    address: string
    phone: string
    email: string
    taxId: string
  }
  // Tenant.
  tenant: {
    name: string
    isCompany: boolean
    taxId: string | null
  }
  // Property.
  property: {
    unitReference: string
    buildingName: string | null
    unitDescription: string | null
  }
  // The billed period.
  period: string // "juin 2026"
  dueMonthIso: string // "2026-06-01"
  // Amounts.
  amountExclTax: number
  vatRate: number
  vatAmount: number
  amountInclTax: number
  totalPaid: number
  remaining: number
  // For receipts only: linked payments.
  payments: Payment[]
  // Today's date (for the issuance line). Already formatted.
  issuedOn: string
  // Document identifier.
  documentNumber: string
}

function tenantDisplayName(t: RentDueRow['lease'] extends infer L
  ? L extends { tenant: infer T }
    ? T
    : never
  : never): { name: string; isCompany: boolean } {
  if (!t) return { name: '—', isCompany: false }
  if (t.tenant_type === 'company') return { name: t.last_name, isCompany: true }
  return {
    name: [t.first_name, t.last_name].filter(Boolean).join(' '),
    isCompany: false,
  }
}

export function buildPdfData(args: {
  rentDue: RentDueRow
  payments: Payment[]
  settings: SettingsMap | undefined
  periodLabel: string
  issuedOn: string
}): PdfData {
  const { rentDue, payments, settings, periodLabel, issuedOn } = args

  const tenant = rentDue.lease?.tenant ?? null
  const display = tenantDisplayName(tenant)
  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0)
  const ttc = Number(rentDue.amount_incl_tax)

  const docPrefix = `${rentDue.due_month.slice(0, 7).replace('-', '')}`
  const docId = `${docPrefix}-${rentDue.id.slice(0, 8).toUpperCase()}`

  return {
    company: {
      name: settings?.company_name ?? 'Synergies Immo',
      address: settings?.company_address ?? '',
      phone: settings?.company_phone ?? '',
      email: settings?.company_email ?? '',
      taxId: settings?.company_tax_id ?? '',
    },
    tenant: {
      name: display.name,
      isCompany: display.isCompany,
      taxId: tenant?.tenant_type === 'company' ? null : null,
    },
    property: {
      unitReference: rentDue.lease?.unit?.reference ?? '—',
      buildingName: rentDue.lease?.unit?.building?.name ?? null,
      unitDescription: null,
    },
    period: periodLabel,
    dueMonthIso: rentDue.due_month,
    amountExclTax: Number(rentDue.amount_excl_tax),
    // vat_rate lives on the lease (the rate at signing), not the rent_due.
    vatRate: Number(rentDue.lease?.vat_rate ?? 0),
    vatAmount: Number(rentDue.vat_amount ?? 0),
    amountInclTax: ttc,
    totalPaid,
    remaining: Math.max(0, ttc - totalPaid),
    payments,
    issuedOn,
    documentNumber: docId,
  }
}

/**
 * Money formatter that returns strings safe for embedding in a PDF (no
 * non-breaking spaces from Intl that mess with PDF line breaks).
 */
export function formatMoneyForPdf(
  value: number,
  settings: SettingsMap | undefined
): string {
  const currency = settings?.currency_code ?? 'XOF'
  const locale = settings?.currency_locale ?? 'fr-SN'
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
  // Replace non-breaking and narrow no-break spaces with regular spaces — PDF
  // renderers can otherwise drop them or layout the numbers oddly.
  return formatted.replace(/[  ]/g, ' ')
}
