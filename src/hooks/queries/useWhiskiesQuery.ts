import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryClient'
import type { SimpleWhiskyDB } from '@/hooks/useSimpleWhiskiesDB'
import toast from 'react-hot-toast'

interface WhiskiesQueryParams {
  limit?: number
  offset?: number
  searchTerm?: string
  countryFilter?: string
  typeFilter?: string
}

// Fetch whiskies function
async function fetchWhiskies(params: WhiskiesQueryParams): Promise<SimpleWhiskyDB[]> {
  let query = supabase
    .from('whiskies')
    .select('*')
    .order('created_at', { ascending: false })

  // Apply filters
  if (params.searchTerm) {
    query = query.or(`name.ilike.%${params.searchTerm}%,type.ilike.%${params.searchTerm}%,country.ilike.%${params.searchTerm}%`)
  }

  if (params.countryFilter) {
    query = query.eq('country', params.countryFilter)
  }

  if (params.typeFilter) {
    query = query.eq('type', params.typeFilter)
  }

  // Apply pagination
  if (params.limit) {
    query = query.range(params.offset || 0, (params.offset || 0) + params.limit - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching whiskies:', error)
    throw error
  }

  return data || []
}

// Add whisky function
async function addWhisky(whiskyData: Partial<SimpleWhiskyDB>): Promise<SimpleWhiskyDB> {
  const { data, error } = await supabase
    .from('whiskies')
    .insert([whiskyData])
    .select()
    .single()

  if (error) {
    console.error('Error adding whisky:', error)
    throw error
  }

  return data
}

// Update whisky function
async function updateWhisky(id: number, updates: Partial<SimpleWhiskyDB>): Promise<SimpleWhiskyDB> {
  const { data, error } = await supabase
    .from('whiskies')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating whisky:', error)
    throw error
  }

  return data
}

// Delete whisky function
async function deleteWhisky(id: number): Promise<void> {
  const { error } = await supabase
    .from('whiskies')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting whisky:', error)
    throw error
  }
}

// Main hook for fetching whiskies
export function useWhiskiesQuery(params: WhiskiesQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.whiskies.list(params),
    queryFn: () => fetchWhiskies(params),
    enabled: true, // Always enabled
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for adding whisky
export function useAddWhiskyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addWhisky,
    onSuccess: (newWhisky) => {
      // Invalidate and refetch all whiskies queries
      queryClient.invalidateQueries({ queryKey: queryKeys.whiskies.all })

      // Optionally, we could also do optimistic updates
      // queryClient.setQueryData(queryKeys.whiskies.lists(), (old) => [newWhisky, ...(old || [])])

      toast.success('Viski başarıyla eklendi!')
    },
    onError: (error: any) => {
      console.error('Error adding whisky:', error)
      toast.error('Viski eklenirken hata oluştu')
    },
  })
}

// Hook for updating whisky
export function useUpdateWhiskyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<SimpleWhiskyDB> }) =>
      updateWhisky(id, updates),
    onSuccess: (updatedWhisky) => {
      // Invalidate and refetch all whiskies queries
      queryClient.invalidateQueries({ queryKey: queryKeys.whiskies.all })

      // Update specific whisky in cache
      queryClient.setQueryData(
        queryKeys.whiskies.detail(updatedWhisky.id),
        updatedWhisky
      )

      toast.success('Viski başarıyla güncellendi!')
    },
    onError: (error: any) => {
      console.error('Error updating whisky:', error)
      toast.error('Viski güncellenirken hata oluştu')
    },
  })
}

// Hook for deleting whisky
export function useDeleteWhiskyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWhisky,
    onSuccess: (_, deletedId) => {
      // Invalidate and refetch all whiskies queries
      queryClient.invalidateQueries({ queryKey: queryKeys.whiskies.all })

      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.whiskies.detail(deletedId) })

      toast.success('Viski başarıyla silindi!')
    },
    onError: (error: any) => {
      console.error('Error deleting whisky:', error)
      toast.error('Viski silinirken hata oluştu')
    },
  })
}