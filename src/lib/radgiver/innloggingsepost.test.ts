import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lagInnloggingsepost } from './innloggingsepost.ts';

test('both versions carry the link and how long it lasts', () => {
    const { html, tekst } = lagInnloggingsepost('https://aolar.no/radgiver/auth/bekreft?token=abc', 15);
    assert.ok(tekst.includes('https://aolar.no/radgiver/auth/bekreft?token=abc'));
    assert.ok(tekst.includes('15 minutter'));
    assert.equal(html.split('href="https://aolar.no/radgiver/auth/bekreft?token=abc"').length, 3);
    assert.ok(html.includes('15 minutter'));
});

test('the link is escaped in the HTML', () => {
    const { html } = lagInnloggingsepost('https://aolar.no/?a=1&b="2"', 15);
    assert.ok(html.includes('href="https://aolar.no/?a=1&amp;b=&quot;2&quot;"'));
});
