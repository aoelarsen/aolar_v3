import type { APIRoute } from 'astro';
import { lesLenke, startOkt } from '../../../lib/radgiver/innlogging';

export const prerender = false;

/** Where the e-mail link lands. */
export const GET: APIRoute = ({ url, cookies, redirect }) => {
    const epost = lesLenke(url.searchParams.get('token'));
    if (!epost) return redirect('/radgiver/logg-inn?feil=lenke', 303);
    startOkt(cookies, epost);
    return redirect('/radgiver', 303);
};
