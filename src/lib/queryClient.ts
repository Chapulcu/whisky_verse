import { QueryClient } from '@tanstack/react-query'

// Create a client with optimized defaults for our app
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Background refetch settings
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,

      // Cache settings
      staleTime: 30 * 1000, // 30 seconds - data considered fresh
      gcTime: 5 * 60 * 1000, // 5 minutes - cache garbage collection

      // Retry settings (works with our existing retry logic)
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Network mode
      networkMode: 'online',
    },
    mutations: {
      // Mutation settings
      retry: 1,
      networkMode: 'online',
    },
  },
})

// Query keys factory for consistency
export const queryKeys = {
  // Whiskies
  whiskies: {
    all: ['whiskies'] as const,
    lists: () => [...queryKeys.whiskies.all, 'list'] as const,
    list: (filters: {
      limit?: number
      offset?: number
      searchTerm?: string
      countryFilter?: string
      typeFilter?: string
    }) => [...queryKeys.whiskies.lists(), filters] as const,
    details: () => [...queryKeys.whiskies.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.whiskies.details(), id] as const,
  },

  // User collection
  collection: {
    all: ['collection'] as const,
    lists: () => [...queryKeys.collection.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.collection.lists(), userId] as const,
  },

  // User profile
  user: {
    all: ['user'] as const,
    profile: (userId: string) => [...queryKeys.user.all, 'profile', userId] as const,
  },
} as const