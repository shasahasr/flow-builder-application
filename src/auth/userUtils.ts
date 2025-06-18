// Import necessary types from Clerk
import { useAuth } from '@clerk/clerk-react'

// Hook to get the current authenticated user ID
export const useCurrentUserId = () => {
  const { userId } = useAuth()
  return userId
}

// Default user ID for development/fallback (can be used when testing without auth)
export const DEFAULT_USER_ID = 'development-user-id'

// Helper to get a user ID, falling back to the default if not authenticated
export const getUserIdOrDefault = (
  userId: string | null | undefined
): string => {
  // Ensure we're using a consistent format for the user ID
  // This helps ensure that filtering works correctly
  const id = userId || DEFAULT_USER_ID

  // Log the user ID being used for tracking/debugging purposes
  console.log(`Using user ID: ${id} for database operations`)

  return id
}
