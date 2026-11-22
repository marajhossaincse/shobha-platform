import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InviteSecretaryForm from '@/components/InviteSecretaryForm'

export const dynamic = 'force-dynamic'

export default async function MDDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile and company data
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select(`
      *,
      company:companies(*)
    `)
    .eq('id', user.id)
    .single() as any

  console.log('User ID:', user.id)
  console.log('User Profile:', userProfile)
  console.log('Profile Error:', profileError)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">SHOBHA</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{userProfile?.full_name}</span>
              <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Managing Director
              </span>
              <form action="/auth/signout" method="post">
                <button className="text-sm text-gray-700 hover:text-gray-900">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to SHOBHA
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Company Information
                </h3>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {userProfile?.company?.name || 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Registration Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {userProfile?.company?.registration_number || 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                        {userProfile?.company?.status || 'Draft'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Invite Company Secretary
                </h3>
                <InviteSecretaryForm
                  companyId={userProfile?.company_id || ''}
                  userId={user.id}
                />
              </div>

              <div className="border-t border-gray-200 pt-4 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Next Steps
                </h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                  <li>Invite your Company Secretary to complete the setup</li>
                  <li>Upload company founding documents</li>
                  <li>Confirm director information</li>
                  <li>Publish company profile</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
