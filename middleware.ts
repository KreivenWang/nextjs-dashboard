import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // Define public paths (no authentication required)
  const publicPaths = ['/login', '/', '/register']; // Add other public paths as needed
  const isPublicPath = publicPaths.includes(req.nextUrl.pathname);

  // If user is not authenticated and tries to access a non-public path, redirect to login
  if (!req.auth && !isPublicPath) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `callbackUrl=${encodeURIComponent(req.nextUrl.pathname)}`;
    return Response.redirect(url);
  }

  // If user is logged in and tries to access login page, redirect to dashboard
  if (req.auth && req.nextUrl.pathname === '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return Response.redirect(url);
  }
});

// Configure which paths the middleware will be applied to
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};