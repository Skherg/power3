import { supabaseAdmin } from '../lib/supabase'

/**
 * Script to create an admin user
 * This should be run with proper service role credentials
 */
export async function createAdminUser(email: string, password: string) {
  try {
    // First, create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      throw authError
    }

    if (!authData.user) {
      throw new Error('Failed to create user')
    }

    // Then, add them to the admin_users table
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        user_id: authData.user.id,
        email: email,
        is_active: true
      })
      .select()
      .single()

    if (adminError) {
      // If admin user creation fails, clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw adminError
    }

    console.log('Admin user created successfully:', {
      id: adminData.id,
      email: adminData.email,
      user_id: adminData.user_id
    })

    return adminData
  } catch (error) {
    console.error('Error creating admin user:', error)
    throw error
  }
}

/**
 * Script to add existing user as admin
 */
export async function makeUserAdmin(userId: string, email: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .insert({
        user_id: userId,
        email: email,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    console.log('User promoted to admin successfully:', data)
    return data
  } catch (error) {
    console.error('Error promoting user to admin:', error)
    throw error
  }
}

// Example usage (uncomment and modify as needed):
// createAdminUser('admin@example.com', 'secure-password-123')
//   .then(() => console.log('Admin created'))
//   .catch(console.error)