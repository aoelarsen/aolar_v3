import type { APIRoute } from 'astro';
import { lagSupabase } from '../../lib/radgiver/supabase';

export const prerender = false;

// POST only, so a link or prefetch can't sign you out. Astro's checkOrigin blocks cross-site posts.
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
    await lagSupabase(request, cookies).auth.signOut();
    return redirect('/radgiver/logg-inn', 303);
};
