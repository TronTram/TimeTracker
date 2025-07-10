import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Basic middleware setup for future authentication integration
export function middleware(request: NextRequest) {
  // For now, just pass through all requests
  // Authentication middleware will be added in Step 5
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
