import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'

const loginSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z
    .string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const signIn = useAuthStore((state) => state.signIn)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginValues) => {
    const { error } = await signIn(values.email, values.password)
    if (error) {
      toast.error('Échec de la connexion', { description: error })
      return
    }
    toast.success('Connexion réussie')
    navigate({ to: '/' })
  }

  return (
    <main className="min-h-svh grid lg:grid-cols-2">
      {/* Brand splash — only shown on lg+ to keep mobile clean */}
      <aside className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-10 relative overflow-hidden">
        {/* Decorative accent circle in the secondary brand color */}
        <div
          aria-hidden
          className="absolute -top-32 -right-32 size-96 rounded-full bg-secondary/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-20 size-[28rem] rounded-full bg-secondary/20 blur-3xl"
        />

        <div className="relative">
          <img
            src="/logo.png"
            alt="Synergies Immo"
            className="h-12 w-auto brightness-0 invert"
          />
        </div>

        <div className="relative space-y-3 max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight">
            Plateforme de gestion immobilière
          </h2>
          <p className="text-primary-foreground/80">
            Pilotez votre portefeuille d'immeubles, vos contrats de location et
            vos paiements depuis une interface unique.
          </p>
        </div>

        <div className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Synergies Immo
        </div>
      </aside>

      {/* Form column */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo above card on mobile only (the splash hides on <lg) */}
          <div className="flex justify-center lg:hidden">
            <img
              src="/logo.png"
              alt="Synergies Immo"
              className="h-10 w-auto"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Connexion</CardTitle>
              <CardDescription>
                Saisissez vos identifiants pour accéder au back-office.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Connexion…' : 'Se connecter'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
