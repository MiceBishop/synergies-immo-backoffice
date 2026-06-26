import { StyleSheet } from '@react-pdf/renderer'

/**
 * Shared @react-pdf/renderer styles used across invoice + receipt templates.
 * Layout: A4, single column, French formal-document conventions.
 *
 * react-pdf doesn't accept Tailwind classes — these are inline styles. Keep
 * the visual language close to our app's neutral shadcn theme so PDFs feel
 * consistent with the screen.
 */
export const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#0a0a0a',
  },

  // Header — landlord identity (top-left), invoice identifier (top-right).
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: { flex: 1 },
  headerRight: { textAlign: 'right' },
  companyName: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  companyDetail: { color: '#525252', marginTop: 1 },

  // Document title block.
  titleBlock: {
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold' },
  titleSub: { color: '#525252', marginTop: 2 },

  // Parties: tenant + property side-by-side.
  parties: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  party: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 4,
    padding: 10,
  },
  partyHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#525252',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  partyLine: { marginTop: 1 },
  partyName: { fontFamily: 'Helvetica-Bold' },

  // Amount table.
  amountTable: { marginBottom: 16 },
  row: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rowLabel: { flex: 1 },
  rowValue: { width: 120, textAlign: 'right' },
  rowTotal: {
    flexDirection: 'row',
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: '#0a0a0a',
  },
  rowTotalLabel: { flex: 1, fontFamily: 'Helvetica-Bold' },
  rowTotalValue: {
    width: 120,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },

  // Payments table (used on receipts only).
  paymentsTable: { marginBottom: 16 },
  paymentsHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#0a0a0a',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#525252',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentsCellDate: { width: 80 },
  paymentsCellMethod: { width: 90 },
  paymentsCellRef: { flex: 1 },
  paymentsCellAmount: { width: 100, textAlign: 'right' },

  // Footer with legal text and signature line.
  footer: { marginTop: 'auto', paddingTop: 12 },
  legal: { color: '#737373', fontSize: 8, marginBottom: 24 },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  signatureBlock: { width: '45%' },
  signatureLabel: { fontSize: 9, color: '#525252', marginBottom: 24 },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#0a0a0a',
    paddingTop: 4,
    fontSize: 9,
  },
})
