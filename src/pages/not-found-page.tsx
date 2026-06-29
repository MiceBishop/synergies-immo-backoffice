import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const router = useRouter()

  return (
    <main className="min-h-svh flex items-center justify-center p-6 relative overflow-hidden">
      {/* Soft brand-coloured glows in the background */}
      <div
        aria-hidden
        className="absolute -top-32 -right-32 size-96 rounded-full bg-secondary/40 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-20 size-[28rem] rounded-full bg-primary/10 blur-3xl pointer-events-none"
      />

      <div className="relative w-full max-w-md text-center space-y-8">
        <img
          src="/logo.png"
          alt="Synergies Immo"
          className="h-10 w-auto mx-auto"
        />

        <div className="space-y-3">
          <p className="text-7xl font-semibold tracking-tight text-primary">
            404
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Page introuvable
          </h1>
          <p className="text-muted-foreground">
            La page demandée n'existe pas ou a été déplacée. Vérifiez l'adresse
            ou revenez au tableau de bord.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" onClick={() => router.history.back()}>
            <ArrowLeft className="size-4" />
            Retour
          </Button>
          <Button asChild>
            <Link to="/">
              <Home className="size-4" />
              Tableau de bord
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
