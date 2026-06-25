const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error(
    'Configuration manquante : définissez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans .env.local'
  )
}

export const env = {
  supabaseUrl: url,
  supabasePublishableKey: publishableKey,
} as const
