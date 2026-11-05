import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { getSecret } from 'astro:env/server';

/**
 * Sign-in for /radgiver without any stored state: an e-mailed link and a session
 * cookie, both signed with RADGIVER_HEMMELIGHET. Rotating that secret signs
 * everyone out. Removing an address from RADGIVER_EPOST takes effect at once,
 * because the allow-list is checked on every request.
 */
const OKT_COOKIE = 'radgiver_okt';
const LENKE_SEKUNDER = 15 * 60;
const OKT_SEKUNDER = 30 * 24 * 60 * 60;
const MIN_HEMMELIGHET = 32;
/** Per address. Best effort: each warm function has its own map. */
const VENT_MS = 60_000;
const FRA = 'AOLar Rådgiver <innlogging@login.aolar.no>';

const sisteSending = new Map<string, number>();

/** Signed separately per purpose, so a link can't be used as a session cookie or the reverse. */
type Formaal = 'lenke' | 'okt';

function hemmelighet(): string | null {
    const verdi = getSecret('RADGIVER_HEMMELIGHET');
    return verdi && verdi.length >= MIN_HEMMELIGHET ? verdi : null;
}

function signer(formaal: Formaal, data: string, nokkel: string): string {
    return createHmac('sha256', nokkel).update(`${formaal}:${data}`).digest('base64url');
}

function lagToken(formaal: Formaal, epost: string, sekunder: number): string {
    const nokkel = hemmelighet();
    if (!nokkel) throw new Error(`RADGIVER_HEMMELIGHET må være satt, med minst ${MIN_HEMMELIGHET} tegn`);
    const utloper = Math.floor(Date.now() / 1000) + sekunder;
    const data = Buffer.from(JSON.stringify({ epost, utloper })).toString('base64url');
    return `${data}.${signer(formaal, data, nokkel)}`;
}

/** The address in a valid, unexpired token for this purpose, if it may still use /radgiver. */
function lesToken(formaal: Formaal, token: string | null | undefined): string | null {
    const nokkel = hemmelighet();
    if (!nokkel || !token) return null;
    const [data, signatur, ...rest] = token.split('.');
    if (!data || !signatur || rest.length) return null;

    const fikk = Buffer.from(signatur);
    const ventet = Buffer.from(signer(formaal, data, nokkel));
    if (fikk.length !== ventet.length || !timingSafeEqual(fikk, ventet)) return null;

    // The signature matched, so this is a payload we wrote ourselves.
    const { epost, utloper } = JSON.parse(Buffer.from(data, 'base64url').toString()) as {
        epost: string;
        utloper: number;
    };
    return utloper > Date.now() / 1000 && harTilgang(epost) ? epost : null;
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
 * E-mails a sign-in link to an allowed address. Returns false when it was asked
 * too recently. The link can be reused until it expires, so a mail scanner that
 * opens it first doesn't use it up.
 */
export async function sendInnloggingslenke(epost: string, side: URL): Promise<boolean> {
    const adresse = epost.trim().toLowerCase();
    if (Date.now() - (sisteSending.get(adresse) ?? 0) < VENT_MS) return false;

    const nokkel = getSecret('RESEND_API_KEY');
    if (!nokkel) throw new Error('RESEND_API_KEY er ikke satt');

    const lenke = new URL('/radgiver/auth/bekreft', side);
    lenke.searchParams.set('token', lagToken('lenke', adresse, LENKE_SEKUNDER));

    const svar = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${nokkel}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: FRA,
            to: [adresse],
            subject: 'Logg inn på AOLar Rådgiver',
            text: `Åpne denne lenken for å logge inn:\n\n${lenke}\n\nLenken virker i 15 minutter. Har du ikke bedt om den, kan du se bort fra denne e-posten.`,
            html: `<p><a href="${lenke}">Logg inn på AOLar Rådgiver</a></p><p>Lenken virker i 15 minutter. Har du ikke bedt om den, kan du se bort fra denne e-posten.</p>`,
        }),
        signal: AbortSignal.timeout(10_000),
    });
    if (svar.status === 429) return false;
    // Resend's error text doesn't contain the key, so it's safe in the function log.
    if (!svar.ok) throw new Error(`Resend svarte HTTP ${svar.status}: ${await svar.text()}`);

    sisteSending.set(adresse, Date.now());
    return true;
}

export function lesLenke(token: string | null): string | null {
    return lesToken('lenke', token);
}

export function startOkt(cookies: AstroCookies, epost: string) {
    cookies.set(OKT_COOKIE, lagToken('okt', epost, OKT_SEKUNDER), {
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        path: '/',
        maxAge: OKT_SEKUNDER,
    });
}

export function avsluttOkt(cookies: AstroCookies) {
    cookies.delete(OKT_COOKIE, { path: '/' });
}

/** The signed-in user's e-mail if they may use /radgiver. A cookie that fails is removed. */
export function innloggetEpost(cookies: AstroCookies): string | null {
    const cookie = cookies.get(OKT_COOKIE)?.value;
    if (!cookie) return null;
    const epost = lesToken('okt', cookie);
    if (!epost) avsluttOkt(cookies);
    return epost;
}
