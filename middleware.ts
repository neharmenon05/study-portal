import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/api/auth/login',
  '/api/auth/register',
];

// API routes that require authentication
const protectedApiRoutes = [
  '/api/documents',
  '/api/materials',
  '/api/notes',
  '/api/flashcards',
  '/api/assignments',
  '/api/classes',
  '/api/subjects',
  '/api/analytics',
  '/api/dashboard',
  '/api/ai',
  '/api/submissions',
  '/api/files',
  '/api/upload',
];

// Pages that require authentication
const protectedPages = [
  '/dashboard',
  '/documents',
  '/materials',
  '/notes',
  '/flashcards',
  '/assignments',
  '/classes',
  '/analytics',
  '/ai-chat',
  '/calendar',
  '/timer',
  '/settings',
  '/submissions',
];

function isProtectedRoute(pathname: string): boolean {
  return protectedPages.some(route => pathname.startsWith(route)) ||
         protectedApiRoutes.some(route => pathname.startsWith(route));
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.includes(pathname) || pathname.startsWith('/api/auth/');
}

async function verifyToken(token: string): Promise<any> {
  try {
    const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret');
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get auth token from cookies
  const token = request.cookies.get('auth-token')?.value;
  const user = token ? await verifyToken(token) : null;

  // Handle root route
  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.next(); // Will show auth page
    }
  }

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!user) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // For pages, redirect to home (auth page)
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Handle public routes when authenticated
  if (isPublicRoute(pathname) && user && pathname !== '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};