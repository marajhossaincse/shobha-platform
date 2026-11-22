'use server'

import { createServerClient } from '@supabase/ssr'

export async function acceptInvitationAction(formData: {
  token: string
  fullName: string
  password: string
}) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {},
        },
      }
    )

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', formData.token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (inviteError || !invitation) {
      throw new Error('Invalid or expired invitation')
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password: formData.password,
      email_confirm: true,
      user_metadata: {
        full_name: formData.fullName,
        role: 'secretary',
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    // Create user profile
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: invitation.email,
      full_name: formData.fullName,
      role: 'secretary',
      company_id: invitation.company_id,
      account_status: 'active',
    })

    if (userError) throw userError

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    if (updateError) throw updateError

    return { success: true }
  } catch (error: any) {
    console.error('Accept invitation error:', error)
    return { success: false, error: error.message }
  }
}
