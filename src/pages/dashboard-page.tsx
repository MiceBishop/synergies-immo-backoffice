import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Building2,
  Coins,
  PiggyBank,
  TrendingDown,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { OccupancyChart } from '@/components/dashboard/occupancy-chart'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { RentDueStatusBadge } from '@/components/rent-dues/rent-due-status-badge'
import {
  useDashboardStats,
  useMonthlyRevenue,
  useUnpaidRentDues,
} from '@/hooks/use-dashboard'
import { useSettings } from '@/hooks/use-settings'
import { formatAmount, formatMonthYear } from '@/lib/format'

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: revenue, isLoading: revenueLoading } = useMonthlyRevenue()
  const { data: unpaid, isLoading: unpaidLoading } = useUnpaidRentDues(5)
  const { data: settings } = useSettings()

  const totalUnits = stats?.totalUnits ?? 0
  const occupiedUnits = stats?.occupiedUnits ?? 0
  const occupancyPct =
    totalUnits === 0 ? 0 : Math.round((occupiedUnits / totalUnits) * 100)
  const expectedThisMonth = stats?.expectedRentThisMonth ?? 0
  const collectedThisMonth = stats?.collectedRentThisMonth ?? 0
  const collectionRate =
    expectedThisMonth === 0
      ? 0
      : Math.round((collectedThisMonth / expectedThisMonth) * 100)
  const totalUnpaid = stats?.totalUnpaid ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble du portefeuille et des encaissements du mois.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Taux d'occupation"
          value={statsLoading ? '…' : `${occupancyPct}%`}
          hint={
            statsLoading
              ? null
              : `${occupiedUnits} occupés sur ${totalUnits} locaux`
          }
          icon={Building2}
          tone="emerald"
        />
        <KpiCard
          label="Attendu ce mois"
          value={statsLoading ? '…' : formatAmount(expectedThisMonth, settings)}
          hint="Total TTC des quittances émises"
          icon={Coins}
          tone="neutral"
        />
        <KpiCard
          label="Encaissé ce mois"
          value={
            statsLoading ? '…' : formatAmount(collectedThisMonth, settings)
          }
          hint={
            statsLoading
              ? null
              : `${collectionRate}% du montant attendu`
          }
          icon={PiggyBank}
          tone={collectionRate >= 80 ? 'emerald' : 'amber'}
        />
        <KpiCard
          label="Impayés"
          value={statsLoading ? '…' : formatAmount(totalUnpaid, settings)}
          hint="Quittances ouvertes, tous mois confondus"
          icon={TrendingDown}
          tone={totalUnpaid > 0 ? 'red' : 'neutral'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenus des 12 derniers mois</CardTitle>
            <CardDescription>
              Comparaison entre les quittances émises (attendu) et les
              paiements reçus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueLoading || !revenue ? (
              <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
                Chargement…
              </div>
            ) : (
              <RevenueChart data={revenue} settings={settings} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Occupation des locaux</CardTitle>
            <CardDescription>Répartition par statut.</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading || !stats ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                Chargement…
              </div>
            ) : (
              <OccupancyChart
                occupied={stats.occupiedUnits}
                vacant={stats.vacantUnits}
                underRenovation={stats.underRenovationUnits}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="text-base">À encaisser</CardTitle>
            <CardDescription>
              Quittances impayées ou partielles, du plus ancien au plus récent.
            </CardDescription>
          </div>
          <Link
            to="/rent-dues"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            Tout voir
            <ArrowRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {unpaidLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : !unpaid || unpaid.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune quittance impayée — bravo&nbsp;!
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mois</TableHead>
                    <TableHead>Locataire</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead className="text-right">Montant TTC</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unpaid.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="capitalize">
                        {formatMonthYear(u.due_month)}
                      </TableCell>
                      <TableCell>{u.tenant_name}</TableCell>
                      <TableCell>{u.unit_label}</TableCell>
                      <TableCell className="text-right">
                        {formatAmount(u.amount_incl_tax, settings)}
                      </TableCell>
                      <TableCell>
                        <RentDueStatusBadge
                          status={null}
                          dueMonth={u.due_month}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
