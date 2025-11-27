import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_PATHS = [
  '/auth',
  '/api/auth/send-otp',
  '/api/auth/resend-otp',
  '/api/auth/verify-otp',
  '/api/auth/check-username',
  '/api/auth/check-email',
  '/api/auth/logout',
];

// Token validation cache to reduce backend calls
const tokenCache = new Map<string, { valid: boolean; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

// Get cached token validation result
function getCachedValidation(token: string): boolean | null {
  const cached = tokenCache.get(token);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    tokenCache.delete(token);
    return null;
  }

  return cached.valid;
}

// Cache token validation result
function setCachedValidation(token: string, valid: boolean): void {
  tokenCache.set(token, { valid, timestamp: Date.now() });

  // Cleanup old entries if cache gets too large
  if (tokenCache.size > 1000) {
    const oldestKey = tokenCache.keys().next().value;
    if (oldestKey) tokenCache.delete(oldestKey);
  }
}

// Check if path is public (doesn't require authentication)
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

// Validate token with backend API
async function validateToken(token: string): Promise<boolean> {
  // Check cache first
  const cachedResult = getCachedValidation(token);
  if (cachedResult !== null) {
    return cachedResult;
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_ENDPOINT_URL || 'http://localhost:4000/api';

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      cache: 'no-store'
    });

    clearTimeout(timeoutId);

    const isValid = response.ok;

    // Cache the result
    setCachedValidation(token, isValid);

    return isValid;

  } catch (error) {
    // Backend down, timeout, or network error - fail-closed (deny access)
    console.error('Token validation error:', error);

    // Cache failed validation
    setCachedValidation(token, false);

    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Get auth token from cookies
  const authToken = request.cookies.get('authToken')?.value;

  // No token - redirect to auth page
  if (!authToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  // Validate token with backend
  const isValid = await validateToken(authToken);

  if (!isValid) {
    // Invalid or expired token - clear cookies and redirect to auth
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    const response = NextResponse.redirect(url);

    // Clear auth cookies
    response.cookies.delete('authToken');
    response.cookies.delete('refreshToken');

    return response;
  }

  // Token is valid - allow the request to proceed
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, user.svg (static assets)
     * - *.svg, *.png, *.jpg, *.jpeg, *.gif, *.webp (image files)
     */
    '/((?!_next/static|_next/image|favicon.ico|user.svg|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$).*)',
  ],
};
