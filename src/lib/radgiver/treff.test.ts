import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Kursserie, Loggrad, Rad, Vurdering } from './data';
import { PERIODER, nyeRad, oppsummer, radgiverTreff, utfall } from './treff.ts';

const [uke, maned] = PERIODER;

function rad(dato: string, ticker: string, r: Rad, kursdato: string | null = dato): Loggrad {
    return { dato, ticker, rad: r, sikkerhet: 3, kurs: 100, kursdato, begrunnelse: '' };
}

const serie = (...punkter: [string, number][]): Kursserie => punkter;

// A stock that rose 10 %, one that rose 2 %: the average is +6 %.
const serier = {
    OPP: serie(['2026-10-02', 100], ['2026-10-09', 110]),
    SVAK: serie(['2026-10-02', 100], ['2026-10-09', 102]),
};

test('hits are judged against the average, not against zero', () => {
    const [kjop, ikkeKjop] = utfall([rad('2026-10-02', 'SVAK', 'kjop'), rad('2026-10-02', 'SVAK', 'ikke_kjop')], serier, uke);
    assert.ok(Math.abs(kjop.maling!.avkastning - 2) < 1e-9);
    assert.ok(Math.abs(kjop.maling!.marked - 6) < 1e-9);
    assert.ok(Math.abs(kjop.maling!.mer + 4) < 1e-9);
    // The stock rose, but less than the rest: a bad buy and a good don't-buy.
    assert.equal(kjop.maling!.treff, false);
    assert.equal(ikkeKjop.maling!.treff, true);
});

test('a fixed period waits until it is over, and then stays put', () => {
    const lang = { ...serier, OPP: serie(['2026-10-02', 100], ['2026-10-09', 110], ['2026-11-30', 500]) };
    const r = rad('2026-10-02', 'OPP', 'kjop');
    assert.equal(utfall([r], serier, maned)[0].maling, null);
    assert.ok(Math.abs(utfall([r], lang, uke)[0].maling!.avkastning - 10) < 1e-9);
    assert.ok(utfall([r], lang)[0].maling!.avkastning > 300);
});

test('the last close counts when the end date is a closed day', () => {
    const helg = { A: serie(['2026-10-02', 100], ['2026-10-08', 120], ['2026-10-12', 130]) };
    assert.ok(Math.abs(utfall([rad('2026-10-02', 'A', 'kjop')], helg, uke)[0].maling!.avkastning - 20) < 1e-9);
});

test('advice without a price is left out', () => {
    const [ukjent, utenKurs] = utfall([rad('2026-10-02', 'BORTE', 'kjop'), rad('2026-10-02', 'OPP', 'kjop', null)], serier, uke);
    assert.equal(ukjent.maling, null);
    assert.equal(utenKurs.maling, null);
});

test('repeated advice counts once, and a change starts a new one', () => {
    const logg = [
        rad('2026-10-02', 'A', 'kjop'),
        rad('2026-10-09', 'A', 'kjop'),
        rad('2026-10-09', 'B', 'ikke_kjop'),
        rad('2026-10-16', 'A', 'ikke_kjop'),
        rad('2026-10-16', 'B', 'ikke_kjop'),
        rad('2026-10-23', 'A', 'kjop'),
    ];
    assert.deepEqual(
        nyeRad(logg).map((r) => [r.dato, r.ticker]),
        [
            ['2026-10-02', 'A'],
            ['2026-10-09', 'B'],
            ['2026-10-16', 'A'],
            ['2026-10-23', 'A'],
        ],
    );
});

test('the summary splits the difference from the average by side', () => {
    const s = oppsummer(utfall([rad('2026-10-02', 'OPP', 'kjop'), rad('2026-10-02', 'SVAK', 'selg')], serier, uke));
    assert.equal(s.vurdert, 2);
    assert.equal(s.treff, 2);
    assert.ok(Math.abs(s.snittPositiv! - 4) < 1e-9);
    assert.ok(Math.abs(s.snittNegativ! + 4) < 1e-9);
});

test('specialists are measured per signal, skipping neutral and repeats', () => {
    const vurdering = (signal: 'positiv' | 'noytral' | 'negativ') =>
        ({
            nyheter: [],
            teknisk: [{ ticker: 'OPP', trend: 'stigende', signal, begrunnelse: '' }],
            fundamental: [],
            makro: { oppsummering: '', sektorer: [{ sektor: 'Bank', signal: 'negativ', begrunnelse: '' }] },
            portefolje: { markedskommentar: '', anbefalinger: [] },
        }) as Vurdering;
    const uker = [
        { dato: '2026-10-03', vurdering: vurdering('positiv') },
        { dato: '2026-10-04', vurdering: vurdering('positiv') },
        { dato: '2026-10-05', vurdering: vurdering('noytral') },
    ];
    const logg = uker.map((u) => rad(u.dato, 'OPP', 'hold', '2026-10-02'));
    const aksjer = [{ ticker: 'SVAK', navn: 'Svak', sektor: 'Bank', antall: 0 }];
    const svar = Object.fromEntries(radgiverTreff(uker, aksjer, logg, serier, uke).map((r) => [r.radgiver, r]));
    assert.deepEqual([svar.teknisk.antall, svar.teknisk.vurdert, svar.teknisk.treff], [1, 1, 1]);
    assert.deepEqual([svar.makro.antall, svar.makro.treff], [1, 1]);
    assert.equal(svar.portefolje.antall, 1);
    assert.equal(svar.nyheter.antall, 0);
});
