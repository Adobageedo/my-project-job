import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware simplifié - uniquement pour le refresh de session Supabase
 * TOUTE la logique de redirection est gérée par AuthContext côté client
 */
export async function middleware(request: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          res = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  
  // Refresh session si nécessaire (important pour garder la session active)
  await supabase.auth.getSession();

  return res;
}

export const config = {
  matcher: [
    // Matcher toutes les routes sauf les fichiers statiques
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
