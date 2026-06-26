import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/lib/db'
import type { PaymentFormOutput } from '@/schemas/payment.schema'

export type Payment = Tables<'payments'>

const paymentsKey = ['payments'] as const

export function usePaymentsForRentDue(rentDueId: string | null | undefined) {
  return useQuery({
    enabled: Boolean(rentDueId),
    queryKey: [...paymentsKey, 'rent-due', rentDueId],
    queryFn: async (): Promise<Payment[]> => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('rent_due_id', rentDueId!)
        .order('payment_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreatePayment(rentDueId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: PaymentFormOutput): Promise<Payment> => {
      const payload: TablesInsert<'payments'> = {
        ...values,
        rent_due_id: rentDueId,
      }
      const { data, error } = await supabase
        .from('payments')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // The DB trigger flipped rent_dues.status — invalidate both lists.
      queryClient.invalidateQueries({ queryKey: paymentsKey })
      queryClient.invalidateQueries({ queryKey: ['rent_dues'] })
    },
  })
}

export function useDeletePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('payments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentsKey })
      queryClient.invalidateQueries({ queryKey: ['rent_dues'] })
    },
  })
}
