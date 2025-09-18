/**
 * API Response Types and Validation
 * Provides runtime type checking for API responses
 */

import { z } from 'zod'

// Install zod for runtime validation
// npm install zod

// Whisky schema
export const WhiskySchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  country: z.string(),
  region: z.string().nullable(),
  alcohol_percentage: z.number(),
  rating: z.number().nullable(),
  age_years: z.number().nullable(),
  color: z.string().nullable(),
  aroma: z.string().nullable(),
  taste: z.string().nullable(),
  finish: z.string().nullable(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().nullable(),
})

export type WhiskyType = z.infer<typeof WhiskySchema>

// User collection item schema
export const UserWhiskySchema = z.object({
  id: z.number(),
  user_id: z.string(),
  whisky_id: z.number(),
  tasted: z.boolean(),
  rating: z.number().nullable(),
  personal_notes: z.string().nullable(),
  tasted_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  whisky: WhiskySchema.nullable().optional(),
})

export type UserWhiskyType = z.infer<typeof UserWhiskySchema>

// Profile schema
export const ProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string(),
  role: z.enum(['user', 'vip', 'admin']),
  language: z.enum(['tr', 'en']),
  avatar_url: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  preferences: z.any().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type ProfileType = z.infer<typeof ProfileSchema>

// API Error schema
export const ApiErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
  details: z.string().optional(),
  hint: z.string().optional(),
})

export type ApiErrorType = z.infer<typeof ApiErrorSchema>

// Generic API Response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.nullable(),
    error: ApiErrorSchema.nullable(),
    count: z.number().optional(),
    status: z.number().optional(),
    statusText: z.string().optional(),
  })

// Helper function to validate API responses
export function validateApiResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    console.error(`API Validation Error ${context ? `in ${context}` : ''}:`, error)
    console.error('Invalid data:', data)

    if (error instanceof z.ZodError) {
      throw new Error(`Invalid API response ${context ? `in ${context}` : ''}: ${error.issues.map(e => e.message).join(', ')}`)
    }

    throw new Error(`API validation failed ${context ? `in ${context}` : ''}`)
  }
}

// Helper function to validate arrays
export function validateApiArray<T>(
  itemSchema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T[] {
  const arraySchema = z.array(itemSchema)
  return validateApiResponse(arraySchema, data, context)
}

// Common query parameter schemas
export const PaginationSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
})

export const WhiskiesFilterSchema = z.object({
  searchTerm: z.string().optional(),
  countryFilter: z.string().optional(),
  typeFilter: z.string().optional(),
}).merge(PaginationSchema)

export type WhiskiesFilterType = z.infer<typeof WhiskiesFilterSchema>

// Supabase specific error types
export const SupabaseErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
  details: z.string().optional(),
  hint: z.string().optional(),
  status: z.number().optional(),
})

export type SupabaseErrorType = z.infer<typeof SupabaseErrorSchema>

// Type guards for runtime checking
export function isWhisky(data: any): data is WhiskyType {
  return WhiskySchema.safeParse(data).success
}

export function isUserWhisky(data: any): data is UserWhiskyType {
  return UserWhiskySchema.safeParse(data).success
}

export function isProfile(data: any): data is ProfileType {
  return ProfileSchema.safeParse(data).success
}

export function isApiError(data: any): data is ApiErrorType {
  return ApiErrorSchema.safeParse(data).success
}

// Helper for handling API errors safely
export function handleApiError(error: unknown, context?: string): string {
  if (isApiError(error)) {
    return error.message
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return `An error occurred ${context ? `in ${context}` : ''}`
}

// Environment variable validation
export const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
})

// Validate environment variables
export function validateEnv() {
  try {
    return EnvSchema.parse({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    })
  } catch (error) {
    console.error('Environment validation failed:', error)
    throw new Error('Invalid environment configuration')
  }
}