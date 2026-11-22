'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { acceptInvitationAction } from '../actions/accept-invitation'

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<any>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    // Verify invitation token
    const verifyToken = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('invitations')
        .select('*, companies(name)')
        .eq('token', token)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !data) {
        setError('Invalid or expired invitation link')
      } else {
        setInvitation(data)
      }
      setLoading(false)
    }

    verifyToken()
  }, [token])

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)

    try {
      const result = await acceptInvitationAction({
        token: token!,
        fullName: formData.fullName,
        password: formData.password,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      // Sign in the newly created user
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password: formData.password,
      })

      if (signInError) throw signInError

      // Redirect to secretary dashboard
      router.push('/secretary')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Invalid Invitation</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">SHOBHA</h1>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Accept Invitation
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You've been invited to join <strong>{invitation?.companies?.name}</strong> as a Company Secretary
          </p>
        </div>

        <form onSubmit={handleAccept} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={invitation?.email || ''}
                disabled
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-900 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Re-enter password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating account...' : 'Accept & Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
