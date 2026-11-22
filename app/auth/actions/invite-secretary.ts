'use server'

import { createServerClient } from '@supabase/ssr'
import { randomBytes } from 'crypto'

export async function inviteSecretaryAction(formData: {
  email: string
  companyId: string
  invitedBy: string
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

    // Generate unique token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        email: formData.email,
        role: 'secretary',
        company_id: formData.companyId,
        invited_by: formData.invitedBy,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (inviteError) throw inviteError

    // TODO: Send email with invitation link
    // For now, we'll just return the token so it can be shared manually
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/auth/accept-invite?token=${token}`

    return {
      success: true,
      inviteUrl,
      message: 'Secretary invitation created successfully'
    }
  } catch (error: any) {
    console.error('Invite secretary error:', error)
    return { success: false, error: error.message }
  }
}
