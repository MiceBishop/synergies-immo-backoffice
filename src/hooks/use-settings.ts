import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type SettingsMap = Record<string, string>

/**
 * Loads the key-value `settings` table into a flat map and caches it.
 * Currency, VAT rates and company info all live here so the deployment
 * can be reconfigured (e.g. resold to a MAD client) without code changes.
 */
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<SettingsMap> => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
      if (error) throw error
      return Object.fromEntries(data.map((row) => [row.key, row.value]))
    },
  })
}
