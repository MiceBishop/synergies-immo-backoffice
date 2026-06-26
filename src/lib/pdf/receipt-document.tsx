import { Document, Page, Text, View } from '@react-pdf/renderer'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { pdfStyles } from './styles'
import { formatMoneyForPdf, type PdfData } from './data'
import { paymentMethodLabels } from '@/lib/enums'
import type { SettingsMap } from '@/hooks/use-settings'

/**
 * Quittance de loyer (receipt) — issued AFTER a rent due is fully paid.
 * Acts as proof of payment for the tenant: shows the breakdown and lists
 * every payment that contributed to the total.
 */
export function ReceiptDocument({
  data,
  settings,
}: {
  data: PdfData
  settings: SettingsMap | undefined
}) {
  const fmt = (v: number) => formatMoneyForPdf(v, settings)
  const fmtDate = (iso: string) =>
    format(parseISO(iso), 'd MMM yyyy', { locale: fr })

  return (
    <Document
      title={`Quittance ${data.documentNumber}`}
      author={data.company.name}
      subject={`Quittance de loyer ${data.period}`}
    >
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLeft}>
            <Text style={pdfStyles.companyName}>{data.company.name}</Text>
            {data.company.address ? (
              <Text style={pdfStyles.companyDetail}>{data.company.address}</Text>
            ) : null}
            {data.company.phone ? (
              <Text style={pdfStyles.companyDetail}>{data.company.phone}</Text>
            ) : null}
            {data.company.email ? (
              <Text style={pdfStyles.companyDetail}>{data.company.email}</Text>
            ) : null}
            {data.company.taxId ? (
              <Text style={pdfStyles.companyDetail}>NINEA {data.company.taxId}</Text>
            ) : null}
          </View>
          <View style={pdfStyles.headerRight}>
            <Text style={pdfStyles.companyDetail}>Numéro</Text>
            <Text>{data.documentNumber}</Text>
            <Text style={[pdfStyles.companyDetail, { marginTop: 4 }]}>
              Émise le
            </Text>
            <Text>{data.issuedOn}</Text>
          </View>
        </View>

        <View style={pdfStyles.titleBlock}>
          <Text style={pdfStyles.title}>Quittance de loyer</Text>
          <Text style={pdfStyles.titleSub}>
            Période : <Text style={{ textTransform: 'capitalize' }}>{data.period}</Text>
          </Text>
        </View>

        <View style={pdfStyles.parties}>
          <View style={pdfStyles.party}>
            <Text style={pdfStyles.partyHeader}>Locataire</Text>
            <Text style={[pdfStyles.partyLine, pdfStyles.partyName]}>
              {data.tenant.name}
            </Text>
          </View>
          <View style={pdfStyles.party}>
            <Text style={pdfStyles.partyHeader}>Bien loué</Text>
            <Text style={[pdfStyles.partyLine, pdfStyles.partyName]}>
              {data.property.unitReference}
            </Text>
            {data.property.buildingName ? (
              <Text style={pdfStyles.partyLine}>{data.property.buildingName}</Text>
            ) : null}
          </View>
        </View>

        <Text style={{ marginBottom: 8 }}>
          Nous reconnaissons avoir reçu de{' '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{data.tenant.name}</Text>
          {' '}la somme de{' '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>
            {fmt(data.totalPaid)}
          </Text>
          {' '}au titre du loyer et charges de la période ci-dessus.
        </Text>

        <View style={pdfStyles.amountTable}>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.rowLabel}>Loyer hors taxes</Text>
            <Text style={pdfStyles.rowValue}>{fmt(data.amountExclTax)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.rowLabel}>
              TVA ({data.vatRate.toString()} %)
            </Text>
            <Text style={pdfStyles.rowValue}>{fmt(data.vatAmount)}</Text>
          </View>
          <View style={pdfStyles.rowTotal}>
            <Text style={pdfStyles.rowTotalLabel}>Total TTC</Text>
            <Text style={pdfStyles.rowTotalValue}>{fmt(data.amountInclTax)}</Text>
          </View>
        </View>

        {data.payments.length > 0 ? (
          <View style={pdfStyles.paymentsTable}>
            <Text
              style={{
                fontFamily: 'Helvetica-Bold',
                marginBottom: 4,
                fontSize: 11,
              }}
            >
              Paiements reçus
            </Text>
            <View style={pdfStyles.paymentsHeader}>
              <Text style={pdfStyles.paymentsCellDate}>Date</Text>
              <Text style={pdfStyles.paymentsCellMethod}>Méthode</Text>
              <Text style={pdfStyles.paymentsCellRef}>Référence</Text>
              <Text style={pdfStyles.paymentsCellAmount}>Montant</Text>
            </View>
            {data.payments.map((p) => (
              <View key={p.id} style={pdfStyles.row}>
                <Text style={pdfStyles.paymentsCellDate}>
                  {fmtDate(p.payment_date)}
                </Text>
                <Text style={pdfStyles.paymentsCellMethod}>
                  {paymentMethodLabels[p.method]}
                </Text>
                <Text style={pdfStyles.paymentsCellRef}>
                  {p.payment_reference ?? '—'}
                </Text>
                <Text style={pdfStyles.paymentsCellAmount}>
                  {fmt(Number(p.amount))}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={pdfStyles.footer}>
          <Text style={pdfStyles.legal}>
            La présente quittance vaut acquit pour la période indiquée. Elle
            annule et remplace tous reçus partiels antérieurement délivrés
            pour la même période.
          </Text>
          <View style={pdfStyles.signatureRow}>
            <View style={pdfStyles.signatureBlock}>
              <Text style={pdfStyles.signatureLabel}>Le bailleur</Text>
              <Text style={pdfStyles.signatureLine}>{data.company.name}</Text>
            </View>
            <View style={pdfStyles.signatureBlock}>
              <Text style={pdfStyles.signatureLabel}>Le locataire</Text>
              <Text style={pdfStyles.signatureLine}> </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
