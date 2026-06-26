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
  { to: '/rent-dues', label: 'Loyers', icon: CreditCard },
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
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm',
              'transition-colors'
            )}
            // Split active vs inactive entirely — no shared color class to
            // avoid the Tailwind specificity tie where text-muted-foreground
            // sometimes wins over text-accent-foreground depending on CSS
            // source order.
            activeProps={{
              className: 'bg-accent text-primary font-semibold',
            }}
            inactiveProps={{
              className: 'text-muted-foreground font-medium hover:bg-accent/60 hover:text-foreground',
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
        <img
          src="/logo.png"
          alt="Synergies Afrique"
          className="h-7 w-auto"
        />
      </div>
      <div className="flex-1">
        <NavLinks />
      </div>
    </aside>
  )
}
