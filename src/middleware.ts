import { defineMiddleware } from 'astro:middleware';
import { innloggetEpost, lagSupabase } from './lib/radgiver/supabase';

const BESKYTTET = '/radgiver';
/** Under /radgiver, but reachable without a session. */
const APNE = ['/radgiver/logg-inn', '/radgiver/auth/'];

export const onRequest = defineMiddleware(async (context, next) => {
    const { pathname } = context.url;
    const iRadgiver = pathname === BESKYTTET || pathname.startsWith(`${BESKYTTET}/`);
    if (!iRadgiver || context.isPrerendered) return next();

    if (!APNE.some((p) => pathname.startsWith(p))) {
        // getClaims (inside innloggetEpost) verifies the JWT signature, unlike getSession.
        const epost = await innloggetEpost(lagSupabase(context.request, context.cookies));
        if (!epost) return context.redirect('/radgiver/logg-inn', 303);
        context.locals.epost = epost;
    }

    const response = await next();
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
});
