/**
 * How well the advice has held up. Each advice is measured against the average
 * of all followed stocks over the same dates, so a rising market doesn't make
 * every buy a hit and every don't-buy a miss. No site imports here, so
 * `npm test` can run it directly.
 */
import type { Aksje, Kursserie, Loggrad, Rad, Signal, Vurdering } from './data';

export interface Periode {
    id: string;
    tekst: string;
    dager: number;
}

export const PERIODER: Periode[] = [
    { id: '1u', tekst: '1 uke', dager: 7 },
    { id: '1m', tekst: '1 måned', dager: 30 },
    { id: '3m', tekst: '3 måneder', dager: 91 },
];

type Serier = Record<string, Kursserie>;

export interface Maling {
    /** The stock's change over the period, in percent. */
    avkastning: number;
    /** The average change of all followed stocks over the same dates. */
    marked: number;
    /** The stock's change minus the average, in percentage points. */
    mer: number;
    treff: boolean;
}

/** Null while the period isn't over, or if a price is missing. */
export interface Malt {
    positiv: boolean;
    maling: Maling | null;
}

export interface Utfall extends Malt {
    rad: Loggrad;
}

export interface Treffsammendrag {
    antall: number;
    vurdert: number;
    treff: number;
    /** Mean difference from the average, for the positive and the negative advice. */
    snittPositiv: number | null;
    snittNegativ: number | null;
}

/** Buy and hold expect to beat the average, sell and don't-buy to trail it. */
export function erPositiv(rad: Rad): boolean {
    return rad === 'kjop' || rad === 'hold';
}

function plussDager(iso: string, dager: number): string {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + dager);
    return d.toISOString().slice(0, 10);
}

/** The close on a date, or the last one before it when the market was shut. */
function kursPa(serie: Kursserie, dato: string): number | null {
    return serie.findLast(([d]) => d <= dato)?.[1] ?? null;
}

function endring(serie: Kursserie, fra: string, til: string): number | null {
    const start = kursPa(serie, fra);
    const slutt = kursPa(serie, til);
    return start && slutt ? (slutt / start - 1) * 100 : null;
}

function snitt(tall: number[]): number | null {
    return tall.length ? tall.reduce((sum, t) => sum + t, 0) / tall.length : null;
}

function nyesteDato(serier: Serier): string | null {
    const siste = Object.values(serier).map((s) => s.at(-1)?.[0] ?? '');
    return siste.length ? siste.reduce((a, b) => (a > b ? a : b)) : null;
}

/** Measures from `fra` over a fixed period, or up to the newest close without one. */
function mal(ticker: string, positiv: boolean, fra: string, serier: Serier, periode?: Periode): Maling | null {
    const siste = nyesteDato(serier);
    const serie = serier[ticker];
    if (!siste || !serie) return null;
    const til = periode ? plussDager(fra, periode.dager) : siste;
    if (til > siste || til <= fra) return null;

    const avkastning = endring(serie, fra, til);
    const marked = snitt(
        Object.values(serier)
            .map((s) => endring(s, fra, til))
            .filter((e) => e != null),
    );
    if (avkastning == null || marked == null) return null;
    const mer = avkastning - marked;
    return { avkastning, marked, mer, treff: positiv ? mer > 0 : mer < 0 };
}

/** Keeps an entry only when it differs from the same ticker's previous one. */
function bareNye<T extends { dato: string; ticker: string }>(liste: T[], verdi: (x: T) => string): T[] {
    const forrige = new Map<string, string>();
    return [...liste]
        .sort((a, b) => a.dato.localeCompare(b.dato))
        .filter((x) => {
            const ny = forrige.get(x.ticker) !== verdi(x);
            forrige.set(x.ticker, verdi(x));
            return ny;
        });
}

/** Advice repeated week after week is one bet, so only the first time counts. */
export function nyeRad(logg: Loggrad[]): Loggrad[] {
    return bareNye(logg, (r) => r.rad);
}

export function utfall(logg: Loggrad[], serier: Serier, periode?: Periode): Utfall[] {
    return logg.map((rad) => {
        const positiv = erPositiv(rad.rad);
        return { rad, positiv, maling: rad.kursdato ? mal(rad.ticker, positiv, rad.kursdato, serier, periode) : null };
    });
}

export function oppsummer(liste: Malt[]): Treffsammendrag {
    const vurdert = liste.filter((m) => m.maling);
    const snittFor = (positiv: boolean) => snitt(vurdert.filter((m) => m.positiv === positiv).map((m) => m.maling!.mer));
    return {
        antall: liste.length,
        vurdert: vurdert.length,
        treff: vurdert.filter((m) => m.maling!.treff).length,
        snittPositiv: snittFor(true),
        snittNegativ: snittFor(false),
    };
}

export type Radgiver = 'portefolje' | 'nyheter' | 'teknisk' | 'fundamental' | 'makro';

export const RADGIVER_TEKST: Record<Radgiver, string> = {
    portefolje: 'Porteføljeleder',
    nyheter: 'Nyheter',
    teknisk: 'Teknisk',
    fundamental: 'Fundamental',
    makro: 'Makro',
};

/** One summary per adviser. Neutral signals predict nothing, so they aren't judged. */
export function radgiverTreff(
    uker: { dato: string; vurdering: Vurdering }[],
    aksjer: Aksje[],
    logg: Loggrad[],
    serier: Serier,
    periode: Periode,
): ({ radgiver: Radgiver } & Treffsammendrag)[] {
    const kursdato = new Map(logg.filter((r) => r.kursdato).map((r) => [r.dato, r.kursdato!]));

    const spesialist = (hent: (v: Vurdering) => { ticker: string; signal: Signal }[]) => {
        const rader = uker.flatMap(({ dato, vurdering }) => hent(vurdering).map((s) => ({ ...s, dato })));
        return oppsummer(
            bareNye(rader, (r) => r.signal)
                .filter((r) => r.signal !== 'noytral')
                .map((r) => {
                    const positiv = r.signal === 'positiv';
                    const fra = kursdato.get(r.dato);
                    return { positiv, maling: fra ? mal(r.ticker, positiv, fra, serier, periode) : null };
                }),
        );
    };

    return [
        { radgiver: 'portefolje', ...oppsummer(utfall(nyeRad(logg), serier, periode)) },
        {
            radgiver: 'nyheter',
            ...spesialist((v) => v.nyheter.map((n) => ({ ticker: n.ticker, signal: n.samlet_signal }))),
        },
        { radgiver: 'teknisk', ...spesialist((v) => v.teknisk) },
        { radgiver: 'fundamental', ...spesialist((v) => v.fundamental) },
        {
            radgiver: 'makro',
            ...spesialist((v) =>
                (v.makro?.sektorer ?? []).flatMap((s) =>
                    aksjer.filter((a) => a.sektor === s.sektor).map((a) => ({ ticker: a.ticker, signal: s.signal })),
                ),
            ),
        },
    ];
}
