import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LogOut, Menu, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { NavLinks } from './app-sidebar'
import { useAuthStore } from '@/stores/auth-store'

export function AppHeader() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    toast.success('Déconnecté')
    navigate({ to: '/login' })
  }

  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase()

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 lg:px-6 gap-2">
      <div className="flex items-center gap-2">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <SheetHeader className="h-14 px-6 border-b flex flex-row items-center">
              <SheetTitle className="sr-only">Synergies Afrique</SheetTitle>
              <img
                src="/logo.png"
                alt="Synergies Afrique"
                className="h-7 w-auto"
              />
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <NavLinks onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <img
          src="/logo.png"
          alt="Synergies Afrique"
          className="h-6 w-auto lg:hidden"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="size-7">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm">{user?.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <User className="mr-2 size-4" />
            Profil
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSignOut}>
            <LogOut className="mr-2 size-4" />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
