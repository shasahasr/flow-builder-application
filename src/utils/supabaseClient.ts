import { createClient } from '@supabase/supabase-js'

// The Supabase URL and anon key should come from your environment variables
// You'll need to create a .env file with these values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Type for the saved workflow structure
export interface SavedWorkflow {
  id?: string
  user_id: string
  name: string
  flow_data: string // JSON stringified flow data
  created_at?: string
  updated_at?: string
}

// Create a Supabase client with the URL and anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to make sure we have the credentials
export const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey
}

/**
 * Debug helper to check RLS policies and user isolation
 * This function can be used to test if RLS is working correctly
 */
export const debugSupabaseRLS = async (
  currentUserId: string
): Promise<void> => {
  console.group('Supabase RLS Debug')
  console.log(`Testing Supabase RLS with user ID: ${currentUserId}`)

  try {
    // First, check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured - skipping RLS debug')
      console.groupEnd()
      return
    }

    // Attempt to fetch all workflows without user filtering
    const { data: allData, error: allError } = await supabase
      .from('workflows')
      .select('id, user_id, name')

    console.log('All workflows that can be accessed:', allData?.length || 0)
    console.log('Data:', allData)

    if (allError) {
      console.error('Error fetching all workflows:', allError.message)
    }

    // Attempt to fetch only this user's workflows
    const { data: userData, error: userError } = await supabase
      .from('workflows')
      .select('id, user_id, name')
      .eq('user_id', currentUserId)

    console.log(`User's workflows (${currentUserId}):`, userData?.length || 0)
    console.log('Data:', userData)

    if (userError) {
      console.error(
        `Error fetching user workflows for ${currentUserId}:`,
        userError.message
      )
    }

    // If we get here without errors, RLS might be bypassed or not correctly set up
    if ((allData?.length || 0) > (userData?.length || 0)) {
      console.warn(
        "WARNING: User can see other users' data! RLS may not be functioning correctly."
      )
    } else {
      console.log('User isolation seems to be working at the application level')
    }
  } catch (error) {
    console.error('Error in RLS debug:', error)
  }

  console.groupEnd()
}
