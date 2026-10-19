import { getSecret } from 'astro:env/server';

const REPO = 'aoelarsen/aolarAksjeVerktoy';
/** How long a file is trusted before GitHub is asked again. A new commit shows up within this. */
const FERSK_MS = 60_000;

interface Lagret {
    etag: string | null;
    tekst: string;
    hentet: number;
}

// Survives between requests while the Netlify function stays warm. Revalidating
// with ETag gives a 304, which GitHub doesn't count against the rate limit.
const lager = new Map<string, Lagret>();

export class GithubFeil extends Error {}

function topptekster(accept: string): Record<string, string> {
    const token = getSecret('GITHUB_TOKEN_VERKTOY');
    if (!token) throw new GithubFeil('GITHUB_TOKEN_VERKTOY er ikke satt');
    return {
        Accept: accept,
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'aolar.no',
    };
}

async function hent(sti: string, accept: string): Promise<string> {
    const lagret = lager.get(sti);
    if (lagret && Date.now() - lagret.hentet < FERSK_MS) return lagret.tekst;

    const headers = topptekster(accept);
    if (lagret?.etag) headers['If-None-Match'] = lagret.etag;

    const svar = await fetch(`https://api.github.com/repos/${REPO}/contents/${sti}`, { headers });
    if (svar.status === 304 && lagret) {
        lagret.hentet = Date.now();
        return lagret.tekst;
    }
    if (svar.status === 404) throw new GithubFeil(`Fant ikke ${sti}`);
    if (!svar.ok) throw new GithubFeil(`GitHub svarte ${svar.status} for ${sti}`);

    const tekst = await svar.text();
    lager.set(sti, { etag: svar.headers.get('ETag'), tekst, hentet: Date.now() });
    return tekst;
}

/** Raw file content from the stock tool repo. */
export function hentFil(sti: string): Promise<string> {
    return hent(sti, 'application/vnd.github.raw+json');
}

/** File names in a folder of the stock tool repo. */
export async function listMappe(sti: string): Promise<string[]> {
    const innhold = JSON.parse(await hent(sti, 'application/vnd.github+json')) as { name: string; type: string }[];
    return innhold.filter((f) => f.type === 'file').map((f) => f.name);
}

// GitHub sends and takes file content as base64 of the UTF-8 bytes.
const tilBase64 = (tekst: string) => btoa(Array.from(new TextEncoder().encode(tekst), (b) => String.fromCharCode(b)).join(''));
const fraBase64 = (b64: string) =>
    new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

/**
 * Reads a file fresh, lets `endre` change it and commits the result to main.
 * The file's sha makes GitHub refuse the write if someone else changed it in
 * between; then it is read and changed once more.
 */
export async function endreFil(sti: string, endre: (tekst: string) => string, melding: string): Promise<void> {
    const url = `https://api.github.com/repos/${REPO}/contents/${sti}`;
    for (let forsok = 0; forsok < 2; forsok++) {
        const svar = await fetch(`${url}?ref=main`, { headers: topptekster('application/vnd.github+json') });
        if (!svar.ok) throw new GithubFeil(`GitHub svarte ${svar.status} for ${sti}`);
        const fil = (await svar.json()) as { sha: string; content: string };
        const ny = endre(fraBase64(fil.content));

        const lagre = await fetch(url, {
            method: 'PUT',
            headers: { ...topptekster('application/vnd.github+json'), 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: melding,
                content: tilBase64(ny),
                sha: fil.sha,
                branch: 'main',
            }),
        });
        if (lagre.ok) {
            lager.delete(sti);
            return;
        }
        if (lagre.status === 403 || lagre.status === 404) {
            throw new GithubFeil(`GitHub nektet å lagre ${sti} (${lagre.status}). Tokenet trenger skrivetilgang.`);
        }
        if (lagre.status !== 409) throw new GithubFeil(`GitHub svarte ${lagre.status} da ${sti} skulle lagres`);
    }
    throw new GithubFeil(`${sti} ble endret samtidig. Prøv igjen.`);
}
