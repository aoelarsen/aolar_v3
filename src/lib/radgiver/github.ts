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

async function hent(sti: string, accept: string): Promise<string> {
    const lagret = lager.get(sti);
    if (lagret && Date.now() - lagret.hentet < FERSK_MS) return lagret.tekst;

    const token = getSecret('GITHUB_TOKEN_VERKTOY');
    if (!token) throw new GithubFeil('GITHUB_TOKEN_VERKTOY er ikke satt');
    const headers: Record<string, string> = {
        Accept: accept,
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'aolar.no',
    };
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
