import type { APIRoute } from 'astro';
import { avsluttOkt } from '../../lib/radgiver/innlogging';

export const prerender = false;

// POST only, so a link or prefetch can't sign you out. Astro's checkOrigin blocks cross-site posts.
export const POST: APIRoute = ({ cookies, redirect }) => {
    avsluttOkt(cookies);
    return redirect('/radgiver/logg-inn', 303);
};
