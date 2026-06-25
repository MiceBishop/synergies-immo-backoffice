import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Configurez l'identité de l'entreprise, la devise et les taux de TVA.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Société</CardTitle>
          <CardDescription>Informations affichées sur les factures et reçus.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Formulaire d'édition à venir — sera connecté à la table{' '}
            <code className="font-mono text-xs">settings</code> dès le déploiement
            du schéma.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Devise et TVA</CardTitle>
          <CardDescription>Devise par défaut : XOF (FCFA). Taux de TVA configurables.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Édition à venir.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
