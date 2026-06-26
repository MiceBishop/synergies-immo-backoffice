import { Document, Page, Text, View } from '@react-pdf/renderer'
import { pdfStyles } from './styles'
import { formatMoneyForPdf, type PdfData } from './data'
import type { SettingsMap } from '@/hooks/use-settings'

/**
 * Facture (invoice) — issued for a rent due to ask the tenant for payment.
 * Shows breakdown of HT / TVA / TTC and the remaining-to-pay amount.
 */
export function InvoiceDocument({
  data,
  settings,
}: {
  data: PdfData
  settings: SettingsMap | undefined
}) {
  const fmt = (v: number) => formatMoneyForPdf(v, settings)

  return (
    <Document
      title={`Facture ${data.documentNumber}`}
      author={data.company.name}
      subject={`Facture de loyer ${data.period}`}
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
          <Text style={pdfStyles.title}>Facture de loyer</Text>
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
            <Text style={pdfStyles.rowTotalLabel}>Total à régler TTC</Text>
            <Text style={pdfStyles.rowTotalValue}>{fmt(data.amountInclTax)}</Text>
          </View>
          {data.totalPaid > 0 ? (
            <>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.rowLabel}>Déjà encaissé</Text>
                <Text style={pdfStyles.rowValue}>−{fmt(data.totalPaid)}</Text>
              </View>
              <View style={pdfStyles.rowTotal}>
                <Text style={pdfStyles.rowTotalLabel}>Reste à percevoir</Text>
                <Text style={pdfStyles.rowTotalValue}>{fmt(data.remaining)}</Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={pdfStyles.footer}>
          <Text style={pdfStyles.legal}>
            Cette facture est exigible à réception. Tout retard de paiement
            pourra entraîner des pénalités conformément aux termes du contrat
            de location.
          </Text>
          <View style={pdfStyles.signatureRow}>
            <View style={pdfStyles.signatureBlock}>
              <Text style={pdfStyles.signatureLabel}>Le bailleur</Text>
              <Text style={pdfStyles.signatureLine}>{data.company.name}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
