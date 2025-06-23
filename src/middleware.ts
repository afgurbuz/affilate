import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/settings']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Admin routes
  const adminRoutes = ['/admin']
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  // Auth routes (login, register)
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.includes(pathname)

  // Redirect to login if trying to access protected route without auth
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if already logged in and trying to access auth routes
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check admin permissions for admin routes
  if (isAdminRoute && user) {
    const { data: userData } = await supabase
      .from('users')
      .select('*, role:user_roles!inner(*)')
      .eq('id', user.id)
      .single()

    if (!userData || !userData.role || userData.role.name !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Check subscription limits for certain actions
  if (user && (pathname.startsWith('/dashboard/posts/new') || pathname.startsWith('/api/posts'))) {
    const { data: userData } = await supabase
      .from('users')
      .select('*, plan:subscription_plans!inner(*)')
      .eq('id', user.id)
      .single()

    if (userData && userData.plan && userData.plan.max_posts !== -1) {
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      if (count && count >= userData.plan.max_posts) {
        // If this is an API request, return error
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Post limit reached for your plan' },
            { status: 403 }
          )
        }
        // If this is a page request, redirect to upgrade page
        const upgradeUrl = new URL('/dashboard/upgrade', request.url)
        upgradeUrl.searchParams.set('reason', 'post_limit')
        return NextResponse.redirect(upgradeUrl)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}