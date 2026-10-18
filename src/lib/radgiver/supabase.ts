import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import { getSecret } from 'astro:env/server';

/** A fresh Supabase client per request, with the session kept in httpOnly cookies. */
export function lagSupabase(request: Request, cookies: AstroCookies) {
    const url = getSecret('VITE_SUPABASE_URL');
    const nokkel = getSecret('VITE_SUPABASE_PUBLISHABLE_KEY');
    if (!url || !nokkel) throw new Error('VITE_SUPABASE_URL og VITE_SUPABASE_PUBLISHABLE_KEY må være satt');
    return createServerClient(url, nokkel, {
        // Nothing in the browser talks to Supabase, so the session cookies can be httpOnly.
        cookieOptions: { httpOnly: true, secure: import.meta.env.PROD, sameSite: 'lax', path: '/' },
        cookies: {
            getAll() {
                return parseCookieHeader(request.headers.get('Cookie') ?? '').map(({ name, value }) => ({
                    name,
                    value: value ?? '',
                }));
            },
            setAll(cookiesToSet) {
                for (const { name, value, options } of cookiesToSet) {
                    cookies.set(name, value, options);
                }
            },
        },
    });
}
