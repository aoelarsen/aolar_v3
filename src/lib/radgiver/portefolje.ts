/**
 * The capital register (config/kapital.json in the stock tool) and the allocation
 * built from it. Mirrors Kapital in modeller.py and lag_fordeling in fordeling.py
 * there, so the site and the weekly report give the same numbers.
 *
 * Pure functions with type-only imports, so they run outside Astro too.
 */
import type { Aksje, Anbefaling, Kursoppsummering, Makroserie } from './data';

export const KAPITALFIL = 'config/kapital.json';

export type Kilde = 'egenkapital' | 'lan';
export type Handelstype = 'kjop' | 'salg';

export interface Innskudd {
    dato: string;
    /** NOK. */
    belop: number;
    kilde: Kilde;
    notat: string;
}

export interface Handel {
    dato: string;
    ticker: string;
    type: Handelstype;
    antall: number;
    /** NOK that left (buy) or reached (sell) the account, brokerage included. */
    belop: number;
}

export interface Kapital {
    kurtasje_min: number;
    kurtasje_pst: number;
    minste_post: number;
    innskudd: Innskudd[];
    handler: Handel[];
}

export const KILDE_TEKST: Record<Kilde, string> = { egenkapital: 'Egenkapital', lan: 'Lån' };

export function kontanter(k: Kapital): number {
    const inn = k.innskudd.reduce((sum, i) => sum + i.belop, 0);
    return inn + k.handler.reduce((sum, h) => sum + (h.type === 'salg' ? h.belop : -h.belop), 0);
}

export function beholdning(k: Kapital): Record<string, number> {
    const antall: Record<string, number> = {};
    for (const h of k.handler) antall[h.ticker] = (antall[h.ticker] ?? 0) + (h.type === 'kjop' ? h.antall : -h.antall);
    return Object.fromEntries(Object.entries(antall).filter(([, n]) => n > 0));
}

export function kurtasje(k: Kapital, belop: number): number {
    return Math.max(k.kurtasje_min, (belop * k.kurtasje_pst) / 100);
}

// Currency -> (macro series, units per quote), for converting to NOK.
const VALUTASERIER: Record<string, [string, number]> = { SEK: ['seknok', 100], DKK: ['dkknok', 100], EUR: ['eurnok', 1] };

/** NOK per one unit of each currency, from the newest Norges Bank point in the week's data. */
export function valutakurser(serier: Makroserie[] = []): Record<string, number> {
    const siste = new Map(serier.filter((s) => s.punkter.length).map((s) => [s.navn, s.punkter.at(-1)![1]]));
    const kurser: Record<string, number> = { NOK: 1 };
    for (const [valuta, [serie, per]] of Object.entries(VALUTASERIER)) {
        const verdi = siste.get(serie);
        if (verdi != null) kurser[valuta] = verdi / per;
    }
    return kurser;
}

export interface Post {
    ticker: string;
    handling: 'kjop' | 'selg' | 'hold';
    antall: number;
    /** In the stock's own currency. */
    kurs: number;
    kursNok: number;
    kurtasje: number;
}

export interface Fordeling {
    kontanter: number;
    /** Cash plus what sales bring in after brokerage. */
    tilgjengelig: number;
    poster: Post[];
    kjopt: number;
    igjen: number;
    merknader: string[];
}

interface Marked {
    aksjer: Aksje[];
    kurser: Record<string, Kursoppsummering>;
    makroserier?: Makroserie[];
}

const kr = (verdi: number) => `${new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(verdi)} kr`;

/**
 * Sell what has sell advice, hold the rest of what is owned, and split the cash
 * equally over the buy advice with the highest confidence, no smaller than
 * minste_post each. Whole shares only; leftover cash tops up the smallest buy.
 */
export function lagFordeling(k: Kapital, anbefalinger: Anbefaling[], marked: Marked): Fordeling | null {
    const eide = beholdning(k);
    const kasse = kontanter(k);
    if (kasse <= 0 && !Object.keys(eide).length) return null;

    const valuta = new Map(marked.aksjer.map((a) => [a.ticker, a.valuta ?? 'NOK']));
    const nok = valutakurser(marked.makroserier);
    const merknader: string[] = [];
    const kursFor = (ticker: string): [number, number] | null => {
        const siste = marked.kurser[ticker]?.siste_kurs;
        if (siste == null) {
            merknader.push(`${ticker}: mangler kurs, så aksjen er holdt utenfor fordelingen.`);
            return null;
        }
        const v = valuta.get(ticker) ?? 'NOK';
        if (!(v in nok)) {
            merknader.push(`${ticker}: mangler valutakurs for ${v}, så aksjen er holdt utenfor fordelingen.`);
            return null;
        }
        return [siste, siste * nok[v]];
    };

    const eidePoster: Post[] = [];
    let tilgjengelig = kasse;
    for (const a of anbefalinger) {
        const antall = eide[a.ticker];
        const kurs = antall ? kursFor(a.ticker) : null;
        if (!antall || !kurs) continue;
        // Bought after the advice was given, so it still carries buy advice: hold it.
        const handling = a.rad === 'selg' ? 'selg' : 'hold';
        const post: Post = { ticker: a.ticker, handling, antall, kurs: kurs[0], kursNok: kurs[1], kurtasje: 0 };
        if (handling === 'selg') {
            post.kurtasje = kurtasje(k, antall * post.kursNok);
            tilgjengelig += antall * post.kursNok - post.kurtasje;
        }
        eidePoster.push(post);
    }

    const kandidater = anbefalinger
        .map((a, i) => ({ a, i }))
        .filter(({ a }) => a.rad === 'kjop' && !eide[a.ticker])
        .sort((x, y) => y.a.sikkerhet - x.a.sikkerhet || x.i - y.i)
        .flatMap(({ a }) => {
            const kurs = kursFor(a.ticker);
            return kurs ? [{ ticker: a.ticker, kurs: kurs[0], kursNok: kurs[1] }] : [];
        });

    const antallPoster = Math.min(kandidater.length, Math.floor(tilgjengelig / k.minste_post));
    const maal = antallPoster ? tilgjengelig / antallPoster : 0;
    const kjop: Post[] = kandidater.slice(0, antallPoster).map((c) => ({
        ...c,
        handling: 'kjop',
        antall: Math.max(0, Math.floor((maal - kurtasje(k, maal)) / c.kursNok)),
        kurtasje: 0,
    }));
    const kostnad = (p: Post, antall: number) => antall * p.kursNok + (antall ? kurtasje(k, antall * p.kursNok) : 0);
    for (;;) {
        const brukt = kjop.reduce((sum, p) => sum + kostnad(p, p.antall), 0);
        const mulige = kjop.filter((p) => brukt - kostnad(p, p.antall) + kostnad(p, p.antall + 1) <= tilgjengelig);
        if (!mulige.length) break;
        mulige.reduce((min, p) => (kostnad(p, p.antall) < kostnad(min, min.antall) ? p : min)).antall += 1;
    }
    const kjopte = kjop.filter((p) => p.antall > 0);
    for (const p of kjopte) p.kurtasje = kurtasje(k, p.antall * p.kursNok);

    const utenfor = kandidater.filter((c) => !kjopte.some((p) => p.ticker === c.ticker)).map((c) => c.ticker);
    if (utenfor.length) {
        merknader.push(
            `Ikke kjøpt nå: ${utenfor.join(', ')}. Pengene rekker ikke til minst ${kr(k.minste_post)} per kjøp, ` +
                'og kjøpsrådene med høyest sikkerhet går først.',
        );
    }
    const kjopt = kjopte.reduce((sum, p) => sum + p.antall * p.kursNok + p.kurtasje, 0);
    return { kontanter: kasse, tilgjengelig, poster: [...kjopte, ...eidePoster], kjopt, igjen: tilgjengelig - kjopt, merknader };
}

export interface Beholdningslinje {
    ticker: string;
    antall: number;
    kurs: number | null;
    /** null when the price or exchange rate is missing. */
    verdiNok: number | null;
}

export interface Oversikt {
    kontanter: number;
    aksjeverdi: number;
    total: number;
    innskutt: number;
    egenkapital: number;
    lan: number;
    /** Value now minus everything paid in. */
    resultat: number;
    linjer: Beholdningslinje[];
}

export function lagOversikt(k: Kapital, marked: Marked): Oversikt {
    const valuta = new Map(marked.aksjer.map((a) => [a.ticker, a.valuta ?? 'NOK']));
    const nok = valutakurser(marked.makroserier);
    const linjer = Object.entries(beholdning(k)).map(([ticker, antall]) => {
        const kurs = marked.kurser[ticker]?.siste_kurs ?? null;
        const fx = nok[valuta.get(ticker) ?? 'NOK'];
        return { ticker, antall, kurs, verdiNok: kurs != null && fx != null ? antall * kurs * fx : null };
    });
    const sum = (kilde?: Kilde) =>
        k.innskudd.filter((i) => !kilde || i.kilde === kilde).reduce((s, i) => s + i.belop, 0);
    const kasse = kontanter(k);
    const aksjeverdi = linjer.reduce((s, l) => s + (l.verdiNok ?? 0), 0);
    const innskutt = sum();
    return {
        kontanter: kasse,
        aksjeverdi,
        total: kasse + aksjeverdi,
        innskutt,
        egenkapital: sum('egenkapital'),
        lan: sum('lan'),
        resultat: kasse + aksjeverdi - innskutt,
        linjer,
    };
}

/** Parses and checks the register file; throws on anything unexpected. */
export function tolkKapital(tekst: string): Kapital {
    const k = JSON.parse(tekst) as Partial<Kapital>;
    return {
        kurtasje_min: k.kurtasje_min ?? 39,
        kurtasje_pst: k.kurtasje_pst ?? 0.15,
        minste_post: k.minste_post ?? 3000,
        innskudd: k.innskudd ?? [],
        handler: k.handler ?? [],
    };
}

/** The file as the stock tool writes it: settings first, one entry per line. */
export function skrivKapital(k: Kapital): string {
    const liste = (rader: object[]) =>
        rader.length ? `[\n${rader.map((r) => `    ${JSON.stringify(r)}`).join(',\n')}\n  ]` : '[]';
    return [
        '{',
        `  "kurtasje_min": ${k.kurtasje_min},`,
        `  "kurtasje_pst": ${k.kurtasje_pst},`,
        `  "minste_post": ${k.minste_post},`,
        `  "innskudd": ${liste(k.innskudd)},`,
        `  "handler": ${liste(k.handler)}`,
        '}',
        '',
    ].join('\n');
}
