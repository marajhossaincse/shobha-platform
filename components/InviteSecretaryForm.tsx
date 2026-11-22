'use client'

import { useState } from 'react'
import { inviteSecretaryAction } from '@/app/auth/actions/invite-secretary'

export default function InviteSecretaryForm({
  companyId,
  userId,
}: {
  companyId: string
  userId: string
}) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setInviteUrl(null)

    try {
      const result = await inviteSecretaryAction({
        email,
        companyId,
        invitedBy: userId,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      setMessage({ type: 'success', text: result.message || 'Invitation sent successfully' })
      setInviteUrl(result.inviteUrl || null)
      setEmail('')
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to send invitation' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleInvite} className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="secretary@company.com"
          required
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Inviting...' : 'Invite Secretary'}
        </button>
      </form>

      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
          }`}
        >
          <p
            className={`text-sm ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {inviteUrl && (
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">
            Share this invitation link with your secretary:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded text-sm text-blue-900"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteUrl)
                setMessage({ type: 'success', text: 'Link copied to clipboard!' })
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
