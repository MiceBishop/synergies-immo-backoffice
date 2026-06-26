import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useAuthStore } from '@/stores/auth-store'
import { AppShell } from '@/components/layout/app-shell'
import { LoginPage } from '@/pages/login-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { OwnersPage } from '@/pages/owners-page'
import { OwnerDetailPage } from '@/pages/owner-detail-page'
import { BuildingsPage } from '@/pages/buildings-page'
import { BuildingDetailPage } from '@/pages/building-detail-page'
import { UnitDetailPage } from '@/pages/unit-detail-page'
import { TenantsPage } from '@/pages/tenants-page'
import { TenantDetailPage } from '@/pages/tenant-detail-page'
import { LeasesPage } from '@/pages/leases-page'
import { LeaseDetailPage } from '@/pages/lease-detail-page'
import { RentDuesPage } from '@/pages/rent-dues-page'
import { ExpensesPage } from '@/pages/expenses-page'
import { SettingsPage } from '@/pages/settings-page'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  ),
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: () => {
    if (useAuthStore.getState().session) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: () => {
    if (!useAuthStore.getState().session) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: DashboardPage,
})

const ownersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/owners',
  component: OwnersPage,
})

const ownerDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/owners/$id',
  component: OwnerDetailPage,
})

const buildingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/buildings',
  component: BuildingsPage,
})

const buildingDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/buildings/$id',
  component: BuildingDetailPage,
})

const unitDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/units/$id',
  component: UnitDetailPage,
})

const tenantsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/tenants',
  component: TenantsPage,
})

const tenantDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/tenants/$id',
  component: TenantDetailPage,
})

const leasesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/leases',
  component: LeasesPage,
})

const leaseDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/leases/$id',
  component: LeaseDetailPage,
})

const rentDuesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/rent-dues',
  component: RentDuesPage,
})

const expensesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/expenses',
  component: ExpensesPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  appLayoutRoute.addChildren([
    dashboardRoute,
    ownersRoute,
    ownerDetailRoute,
    buildingsRoute,
    buildingDetailRoute,
    unitDetailRoute,
    tenantsRoute,
    tenantDetailRoute,
    leasesRoute,
    leaseDetailRoute,
    rentDuesRoute,
    expensesRoute,
    settingsRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
