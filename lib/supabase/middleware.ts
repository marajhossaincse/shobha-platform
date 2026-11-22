import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/md') ||
    request.nextUrl.pathname.startsWith('/secretary') ||
    request.nextUrl.pathname.startsWith('/director')

  // Redirect logic
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    // Get user role and redirect accordingly
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const url = request.nextUrl.clone()

    if (userProfile?.role === 'md') {
      url.pathname = '/md'
    } else if (userProfile?.role === 'secretary') {
      url.pathname = '/secretary'
    } else if (userProfile?.role === 'director') {
      url.pathname = '/director'
    } else {
      url.pathname = '/md' // Default fallback
    }

    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
