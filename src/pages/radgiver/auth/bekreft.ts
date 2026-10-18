import type { APIRoute } from 'astro';
import { lagSupabase } from '../../../lib/radgiver/supabase';

export const prerender = false;

/**
 * Where the e-mail link lands. Supports both the token_hash link from the
 * custom e-mail template (works on any device) and Supabase's default PKCE
 * `code` link (only works in the browser that asked for it).
 */
export const GET: APIRoute = async ({ url, request, cookies, redirect }) => {
    const supabase = lagSupabase(request, cookies);
    const tokenHash = url.searchParams.get('token_hash');
    const code = url.searchParams.get('code');

    let ok = false;
    if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
        ok = !error;
    } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        ok = !error;
    }

    return redirect(ok ? '/radgiver' : '/radgiver/logg-inn?feil=lenke', 303);
};
