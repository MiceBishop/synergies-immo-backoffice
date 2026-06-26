import { Link } from '@tanstack/react-router'
import {
  Building2,
  CreditCard,
  FileText,
  Home,
  Receipt,
  Settings,
  UserSquare,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  to: string
  label: string
  icon: typeof Home
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: Home },
  { to: '/owners', label: 'Propriétaires', icon: UserSquare },
  { to: '/buildings', label: 'Immeubles', icon: Building2 },
  { to: '/tenants', label: 'Locataires', icon: Users },
  { to: '/leases', label: 'Contrats', icon: FileText },
  { to: '/payments', label: 'Paiements', icon: CreditCard },
  { to: '/expenses', label: 'Dépenses', icon: Receipt },
  { to: '/settings', label: 'Paramètres', icon: Settings },
]

type NavLinksProps = {
  onNavigate?: () => void
}

export function NavLinks({ onNavigate }: NavLinksProps) {
  return (
    <nav className="p-3 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === '/' }}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
              'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
            activeProps={{
              className: 'bg-accent text-accent-foreground',
            }}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppSidebar() {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 border-r bg-card flex-col">
      <div className="h-14 px-6 flex items-center border-b">
        <span className="font-semibold tracking-tight">Synergies Immo</span>
      </div>
      <div className="flex-1">
        <NavLinks />
      </div>
    </aside>
  )
}
