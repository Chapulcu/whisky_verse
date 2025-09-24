import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import type { UserWhiskyDB } from '@/hooks/useUserCollection'
import toast from 'react-hot-toast'

// Fetch user collection function
async function fetchUserCollection(userId: string): Promise<UserWhiskyDB[]> {
  const { data, error } = await supabase
    .from('user_whiskies')
    .select(`
      *,
      whisky:whiskies (
        id, name, type, country, region, alcohol_percentage,
        color, aroma, taste, finish, description, image_url,
        age_years, rating
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user collection:', error)
    throw error
  }

  return data || []
}

// Add to collection function
async function addToCollection(userId: string, whiskyId: number): Promise<UserWhiskyDB> {
  const { data, error } = await supabase
    .from('user_whiskies')
    .insert([{
      user_id: userId,
      whisky_id: whiskyId,
      tasted: false
    }])
    .select(`
      *,
      whisky:whiskies (
        id, name, type, country, region, alcohol_percentage,
        color, aroma, taste, finish, description, image_url,
        age_years, rating
      )
    `)
    .single()

  if (error) {
    console.error('Error adding to collection:', error)
    throw error
  }

  return data
}

// Update collection item function
async function updateCollectionItem(
  id: number,
  updates: Partial<UserWhiskyDB>
): Promise<UserWhiskyDB> {
  const { data, error } = await supabase
    .from('user_whiskies')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      whisky:whiskies (
        id, name, type, country, region, alcohol_percentage,
        color, aroma, taste, finish, description, image_url,
        age_years, rating
      )
    `)
    .single()

  if (error) {
    console.error('Error updating collection item:', error)
    throw error
  }

  return data
}

// Remove from collection function
async function removeFromCollection(id: number): Promise<void> {
  const { error } = await supabase
    .from('user_whiskies')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error removing from collection:', error)
    throw error
  }
}

// Main hook for fetching user collection
export function useCollectionQuery() {
  const { user } = useAuth()

  return useQuery({
    queryKey: user ? queryKeys.collection.list(user.id) : [],
    queryFn: () => user ? fetchUserCollection(user.id) : Promise.resolve([]),
    enabled: !!user, // Only run if user is logged in
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for adding to collection
export function useAddToCollectionMutation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (whiskyId: number) => {
      if (!user) throw new Error('User not authenticated')
      return addToCollection(user.id, whiskyId)
    },
    onMutate: async (whiskyId) => {
      if (!user) return

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.collection.list(user.id) })

      // Snapshot the previous value
      const previousCollection = queryClient.getQueryData(queryKeys.collection.list(user.id))

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.collection.list(user.id), (old: UserWhiskyDB[] = []) => {
        // Create optimistic item
        const optimisticItem: UserWhiskyDB = {
          id: Date.now(), // Temporary ID
          user_id: user.id,
          whisky_id: whiskyId,
          tasted: false,
          rating: null,
          personal_notes: null,
          tasted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          whisky: null // Will be filled by the server response
        }
        return [optimisticItem, ...old]
      })

      // Return a context object with the snapshotted value
      return { previousCollection }
    },
    onError: (err, whiskyId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCollection && user) {
        queryClient.setQueryData(queryKeys.collection.list(user.id), context.previousCollection)
      }
      toast.error('Koleksiyona eklenemedi')
    },
    onSuccess: () => {
      toast.success('Koleksiyona eklendi!')
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have correct data
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.collection.list(user.id) })
      }
    },
  })
}

// Hook for updating collection item
export function useUpdateCollectionMutation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<UserWhiskyDB> }) =>
      updateCollectionItem(id, updates),
    onSuccess: () => {
      // Invalidate and refetch collection
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.collection.list(user.id) })
      }
      toast.success('Durum güncellendi!')
    },
    onError: (error: any) => {
      console.error('Error updating collection item:', error)
      toast.error('Güncelleme sırasında hata oluştu')
    },
  })
}

// Hook for removing from collection
export function useRemoveFromCollectionMutation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeFromCollection,
    onMutate: async (removedId) => {
      if (!user) return

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.collection.list(user.id) })

      // Snapshot the previous value
      const previousCollection = queryClient.getQueryData(queryKeys.collection.list(user.id))

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.collection.list(user.id), (old: UserWhiskyDB[] = []) =>
        old.filter(item => item.id !== removedId)
      )

      // Return a context object with the snapshotted value
      return { previousCollection }
    },
    onError: (err, removedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCollection && user) {
        queryClient.setQueryData(queryKeys.collection.list(user.id), context.previousCollection)
      }
      toast.error('Koleksiyondan çıkarılamadı')
    },
    onSuccess: () => {
      toast.success('Koleksiyondan çıkarıldı!')
    },
    onSettled: () => {
      // Always refetch after error or success
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.collection.list(user.id) })
      }
    },
  })
}