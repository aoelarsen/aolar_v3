/**
 * Reads the stock tool's files (aolarAksjeVerktoy) from GitHub. The shapes mirror
 * the Pydantic models in src/aksjeverktoy/modeller.py there.
 */
import { GithubFeil, hentFil, listMappe } from './github';
import { KAPITALFIL, tolkKapital, type Kapital } from './portefolje';
import { erPositiv, type Utfall } from './treff';

export type Rad = 'kjop' | 'hold' | 'selg' | 'ikke_kjop';
export type Signal = 'positiv' | 'noytral' | 'negativ';

export interface Aksje {
    ticker: string;
    navn: string;
    sektor: string;
    antall: number;
    /** Missing in weeks from before the Nordic stocks were added; those are all Oslo. */
    bors?: 'OL' | 'ST' | 'CO' | 'HE';
    land?: string;
    valuta?: string;
}

export interface Kursoppsummering {
    siste_dato: string;
    siste_kurs: number;
    endring_1_uke_pst: number | null;
    endring_1_mnd_pst: number | null;
    endring_3_mnd_pst: number | null;
    hoy_52_uker: number;
    lav_52_uker: number;
    snitt_50_dager: number | null;
    snitt_200_dager: number | null;
    rsi_14: number | null;
}

export interface Borsmelding {
    id: string;
    tittel: string;
    publisert: string;
    lenke: string;
}

export interface Makroserie {
    navn: string;
    enhet: string;
    /** (period, value), oldest first. */
    punkter: [string, number][];
}

export interface Ukedata {
    dato: string;
    aksjer: Aksje[];
    kurser: Record<string, Kursoppsummering>;
    meldinger: Record<string, Borsmelding[]>;
    makroserier?: Makroserie[];
    feil: string[];
}

export interface Anbefaling {
    ticker: string;
    rad: Rad;
    sikkerhet: number;
    begrunnelse: string;
    risikoer: string[];
    kilder: string[];
}

export interface NyhetsAnalyse {
    ticker: string;
    oppsummering: string;
    samlet_signal: Signal;
    vurderinger: { melding_id: string; type: string; betydning: Signal; viktighet: number; begrunnelse: string }[];
}

export interface TekniskVurdering {
    ticker: string;
    trend: 'stigende' | 'sidelengs' | 'fallende';
    signal: Signal;
    begrunnelse: string;
}

export interface FundamentalAnalyse {
    ticker: string;
    oppsummering: string;
    signal: Signal;
    styrker: string[];
    svakheter: string[];
}

export interface Vurdering {
    nyheter: NyhetsAnalyse[];
    teknisk: TekniskVurdering[];
    fundamental: FundamentalAnalyse[];
    makro: { oppsummering: string; sektorer: { sektor: string; signal: Signal; begrunnelse: string }[] } | null;
    portefolje: { markedskommentar: string; anbefalinger: Anbefaling[] };
}

export interface Loggrad {
    dato: string;
    ticker: string;
    rad: Rad;
    sikkerhet: number;
    kurs: number | null;
    kursdato: string | null;
    begrunnelse: string;
}

/** (date, closing price), oldest first. */
export type Kursserie = [string, number][];

export interface Uke {
    dato: string;
    ukedata: Ukedata;
    vurdering: Vurdering;
}

export { GithubFeil };

const DATO_I_FILNAVN = /^(?:vurdering|kurser)-(\d{4}-\d{2}-\d{2})\.json$/;

function datoer(filer: string[], prefiks: string): string[] {
    return filer
        .filter((f) => f.startsWith(prefiks))
        .map((f) => DATO_I_FILNAVN.exec(f)?.[1])
        .filter((d): d is string => Boolean(d))
        .sort()
        .reverse();
}

/** Every week with a finished assessment, newest first. */
export async function ukeDatoer(): Promise<string[]> {
    return datoer(await listMappe('rapporter'), 'vurdering-');
}

export function erGyldigDato(dato: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(dato);
}

export async function hentUke(dato: string): Promise<Uke> {
    const [ukedata, vurdering] = await Promise.all([
        hentFil(`ukedata/ukedata-${dato}.json`),
        hentFil(`rapporter/vurdering-${dato}.json`),
    ]);
    return { dato, ukedata: JSON.parse(ukedata), vurdering: JSON.parse(vurdering) };
}

/** Just the assessment, for listings that don't need prices or news. */
export async function hentVurdering(dato: string): Promise<Vurdering> {
    return JSON.parse(await hentFil(`rapporter/vurdering-${dato}.json`));
}

/** The latest week, or null before the first report exists. */
export async function hentSisteUke(): Promise<Uke | null> {
    const [siste] = await ukeDatoer();
    return siste ? hentUke(siste) : null;
}

interface Kursfil {
    kurser: Record<string, Kursserie>;
    /** Adjusted for dividends and splits. Missing in files from before it was added. */
    justert?: Record<string, Kursserie>;
}

/** The newest kurser-*.json. It holds the full history, so older weeks need no file of their own. */
async function hentKursfil(): Promise<Kursfil> {
    const [siste] = datoer(await listMappe('ukedata'), 'kurser-');
    return siste ? JSON.parse(await hentFil(`ukedata/kurser-${siste}.json`)) : { kurser: {} };
}

/** Daily closes for the charts. Empty until the first Ukedata run that writes the file. */
export async function hentKurshistorikk(): Promise<Record<string, Kursserie>> {
    return (await hentKursfil()).kurser;
}

/** Prices for measuring returns: with dividends once the newest file has adjusted closes. */
export async function hentAvkastningskurser(): Promise<{ serier: Record<string, Kursserie>; medUtbytte: boolean }> {
    const { kurser, justert } = await hentKursfil();
    const medUtbytte = Object.keys(justert ?? {}).length > 0;
    return { serier: medUtbytte ? justert! : kurser, medUtbytte };
}

/** The capital register, or null before the stock tool has one. */
export async function hentKapital(): Promise<Kapital | null> {
    try {
        return tolkKapital(await hentFil(KAPITALFIL));
    } catch (e) {
        if (e instanceof GithubFeil && e.message.startsWith('Fant ikke')) return null;
        throw e;
    }
}

export async function hentLogg(): Promise<Loggrad[]> {
    let tekst: string;
    try {
        tekst = await hentFil('rapporter/beslutningslogg.jsonl');
    } catch (e) {
        if (e instanceof GithubFeil) return [];
        throw e;
    }
    return tekst
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => JSON.parse(l) as Loggrad);
}

// --- Derived values ---

export const RAD_TEKST: Record<Rad, string> = { kjop: 'Kjøp', hold: 'Hold', selg: 'Selg', ikke_kjop: 'Ikke kjøp' };
export const SIGNAL_TEKST: Record<Signal, string> = { positiv: 'Positiv', noytral: 'Nøytral', negativ: 'Negativ' };

/** Country for the market filter. Older weeks only had Oslo stocks. */
export function land(aksje: Aksje | undefined): string {
    return aksje?.land ?? 'Norge';
}

/** Buy and hold first, then by confidence, so the actionable advice leads. */
export function sorterAnbefalinger<T extends { rad: Rad; sikkerhet: number }>(anbefalinger: T[]): T[] {
    const rekkefolge: Record<Rad, number> = { kjop: 0, selg: 1, hold: 2, ikke_kjop: 3 };
    return [...anbefalinger].sort((a, b) => rekkefolge[a.rad] - rekkefolge[b.rad] || b.sikkerhet - a.sikkerhet);
}

/**
 * The portfolio manager opens buy advice with "Risikonivå: lav." and so on.
 * Split it off so it can be shown as its own label.
 */
export function delRisiko(begrunnelse: string): { risiko: string | null; tekst: string } {
    const treff = /^Risikonivå:\s*([^.]+)\.\s*/i.exec(begrunnelse);
    if (!treff) return { risiko: null, tekst: begrunnelse };
    return { risiko: treff[1].trim().toLowerCase(), tekst: begrunnelse.slice(treff[0].length) };
}

/** Simple moving average, null until there are `n` points. */
export function glidendeSnitt(serie: Kursserie, n: number): (number | null)[] {
    let sum = 0;
    return serie.map(([, kurs], i) => {
        sum += kurs;
        if (i >= n) sum -= serie[i - n][1];
        return i >= n - 1 ? sum / n : null;
    });
}

/**
 * How the advice has moved over the rounds. 'opp' and 'ned' mean it switched
 * between the buy/hold and sell/don't-buy sides, 'skiftet' that it changed
 * within one side (e.g. buy to hold after buying).
 */
export type Utvikling = 'opp' | 'ned' | 'skiftet' | 'stabil';

export interface Historikkrad {
    ticker: string;
    /** One per round, oldest first; null where the stock got no advice that round. */
    runder: (Utfall | null)[];
    utvikling: Utvikling;
}

/** Each stock's advice across the given rounds, ordered by its newest advice. */
export function historikk(alle: Utfall[], runder: string[]): Historikkrad[] {
    const perTicker = Map.groupBy(
        alle.filter((u) => runder.includes(u.rad.dato)),
        (u) => u.rad.ticker,
    );
    const rader = [...perTicker].map(([ticker, liste]) => {
        const iRunde = runder.map((d) => liste.find((u) => u.rad.dato === d) ?? null);
        const gitt = iRunde.filter((u): u is Utfall => u != null).map((u) => u.rad.rad);
        const forst = gitt[0];
        const sist = gitt[gitt.length - 1];
        let utvikling: Utvikling = 'stabil';
        if (erPositiv(forst) !== erPositiv(sist)) utvikling = erPositiv(sist) ? 'opp' : 'ned';
        else if (gitt.some((r, i) => i > 0 && r !== gitt[i - 1])) utvikling = 'skiftet';
        return { ticker, runder: iRunde, utvikling };
    });

    // Stocks with advice in the newest round first, in the usual advice order.
    const nyeste = (r: Historikkrad) => r.runder[r.runder.length - 1]?.rad;
    const medNyeste = sorterAnbefalinger(
        rader.filter((r) => nyeste(r)).map((r) => ({ ...nyeste(r)!, historikk: r })),
    ).map((x) => x.historikk);
    return [...medNyeste, ...rader.filter((r) => !nyeste(r)).sort((a, b) => a.ticker.localeCompare(b.ticker))];
}
