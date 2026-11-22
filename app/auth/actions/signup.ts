'use server'

import { createServerClient } from '@supabase/ssr'

export async function signupAction(formData: {
  fullName: string
  email: string
  password: string
  companyName: string
  registrationNumber: string
}) {
  try {
    // Debug: Check environment variables
    console.log('Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('Service role key starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20))
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    // Create Supabase admin client with service role key
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Using service role key for admin operations
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {},
        },
      }
    )

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: formData.fullName,
        role: 'md',
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    // 2. Create company record
    console.log('Attempting to create company for user:', authData.user.id)
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: formData.companyName,
        registration_number: formData.registrationNumber,
        registered_address: '', // Will be filled during onboarding
        company_type: 'Private limited by shares',
        incorporation_date: new Date().toISOString(),
        status: 'draft',
        created_by: authData.user.id,
      })
      .select()
      .single()

    if (companyError) {
      console.error('Company insert error details:', JSON.stringify(companyError, null, 2))
      throw companyError
    }
    console.log('Company created successfully:', companyData.id)

    // 3. Create user profile
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: formData.email,
      full_name: formData.fullName,
      role: 'md',
      company_id: companyData.id,
      account_status: 'active',
    })

    if (userError) throw userError

    return { success: true, userId: authData.user.id }
  } catch (error: any) {
    console.error('Signup error:', error)
    return { success: false, error: error.message }
  }
}
