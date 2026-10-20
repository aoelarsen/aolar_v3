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

/** Whether an address is on the RADGIVER_EPOST allow-list. Fails closed when the list is unset. */
export function harTilgang(epost: unknown): epost is string {
    const tillatt = (getSecret('RADGIVER_EPOST') ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    return typeof epost === 'string' && tillatt.includes(epost.trim().toLowerCase());
}

/**
 * The signed-in user's e-mail if they may use /radgiver, otherwise null.
 * A valid Supabase session alone isn't enough: anyone who manages to create a
 * user in the project (if sign-ups were ever left on) would have one. A session
 * that fails the allow-list is signed out so it can't linger in the browser.
 */
export async function innloggetEpost(supabase: ReturnType<typeof lagSupabase>): Promise<string | null> {
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims) return null;
    if (claims.is_anonymous !== true && harTilgang(claims.email)) return claims.email as string;
    await supabase.auth.signOut({ scope: 'local' });
    return null;
}
