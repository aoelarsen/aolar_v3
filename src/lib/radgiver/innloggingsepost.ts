/** The sign-in e-mail, in the same look as the stock tool's e-mails (varsel.py in aolarAksjeVerktoy). */
const BLEKK = '#1d3b30';
const FLATE = '#f1ede3';
const KORT = '#e9e6dc';
const KANT = '#cccec4';
const DEMPET = '#617469';
const LENKE = '#7f5c1c';
const SKRIFT = "'Schibsted Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif";
const LOGO_URL = 'https://aolar.no/brand/aolar-emblem-1024.png';

const EMNE = 'Logg inn på AOLar Rådgiver';

function escape(tekst: string): string {
    return tekst.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function lagInnloggingsepost(lenke: string, minutter: number) {
    const adresse = escape(lenke);
    const utlop = `Lenken virker i ${minutter} minutter.`;
    const ikkeDeg = 'Har du ikke bedt om denne e-posten, kan du se bort fra den. Ingen kommer inn uten lenken.';

    const html = `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${EMNE}</title>
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400..800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${FLATE}">
<div style="display:none;max-height:0;overflow:hidden">Lenken din til AOLar Rådgiver. ${utlop}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FLATE}">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
 style="max-width:480px;font-family:${SKRIFT};font-size:15px;line-height:1.5;color:${BLEKK}">
<tr><td style="padding:0 0 20px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:12px"><img src="${LOGO_URL}" width="40" height="40" alt="" style="display:block"></td>
<td><div style="font-size:17px;font-weight:600;letter-spacing:0.01em"><span style="font-weight:800">AOL</span>ar Holding AS</div>
<div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${LENKE}">Rådgiver</div></td>
</tr></table>
</td></tr>
<tr><td style="padding:28px 28px 24px;background:${KORT};border:1px solid ${KANT};border-radius:8px">
<h1 style="margin:0 0 8px;font-size:24px;line-height:1.25;font-weight:700">Logg inn</h1>
<p style="margin:0 0 20px">Trykk på knappen for å logge inn på Rådgiver. ${utlop}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr>
<td style="background:${BLEKK};border-radius:6px">
<a href="${adresse}" style="display:inline-block;padding:12px 20px;color:${FLATE};font-weight:700;font-size:15px;text-decoration:none">Logg inn på Rådgiver</a>
</td></tr></table>
<p style="margin:0 0 4px;font-size:13px;color:${DEMPET}">Virker ikke knappen? Bruk denne lenken:</p>
<p style="margin:0;font-size:13px;word-break:break-all"><a href="${adresse}" style="color:${LENKE}">${adresse}</a></p>
</td></tr>
<tr><td style="padding:16px 0 0;font-size:12px;color:${DEMPET}">${ikkeDeg}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    const tekst = `Logg inn på AOLar Rådgiver:\n\n${lenke}\n\n${utlop} ${ikkeDeg}`;
    return { emne: EMNE, tekst, html };
}
