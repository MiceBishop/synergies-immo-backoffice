import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/db'
import type { OwnerFormOutput } from '@/schemas/owner.schema'

export type Owner = Tables<'owners'>

const ownersKey = ['owners'] as const

export function useOwners(search?: string) {
  return useQuery({
    queryKey: [...ownersKey, { search: search ?? '' }],
    queryFn: async (): Promise<Owner[]> => {
      let query = supabase
        .from('owners')
        .select('*')
        .order('last_name', { ascending: true })

      if (search && search.trim()) {
        const term = `%${search.trim()}%`
        query = query.or(
          `last_name.ilike.${term},first_name.ilike.${term},email.ilike.${term}`
        )
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useCreateOwner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: OwnerFormOutput): Promise<Owner> => {
      const { data, error } = await supabase
        .from('owners')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownersKey })
    },
  })
}

export function useUpdateOwner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: OwnerFormOutput
    }): Promise<Owner> => {
      const { data, error } = await supabase
        .from('owners')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownersKey })
    },
  })
}

export function useDeleteOwner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('owners').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownersKey })
    },
  })
}
