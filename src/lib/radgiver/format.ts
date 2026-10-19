const kursFormat = new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pstFormat = new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
});
const langDato = new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const kortDato = new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** A price, with its currency when known (older weeks were all NOK and carry none). */
export function kurs(verdi: number | null | undefined, valuta?: string): string {
    if (verdi == null) return '–';
    return valuta ? `${kursFormat.format(verdi)} ${valuta}` : kursFormat.format(verdi);
}

export function prosent(verdi: number | null | undefined): string {
    return verdi == null ? '–' : `${pstFormat.format(verdi)} %`;
}

/** 'opp', 'ned' or 'flat', for colouring a change. */
export function retning(verdi: number | null | undefined): 'opp' | 'ned' | 'flat' {
    if (verdi == null || Math.abs(verdi) < 0.05) return 'flat';
    return verdi > 0 ? 'opp' : 'ned';
}

export function dato(iso: string): string {
    return langDato.format(new Date(`${iso}T00:00:00Z`));
}

export function kortdato(iso: string): string {
    return kortDato.format(new Date(`${iso}T00:00:00Z`));
}

export function ukenummer(iso: string): number {
    const d = new Date(`${iso}T00:00:00Z`);
    // ISO week: the week containing that week's Thursday.
    d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
    const forsteTorsdag = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    return 1 + Math.round(((d.getTime() - forsteTorsdag.getTime()) / 86_400_000 - 3 + ((forsteTorsdag.getUTCDay() + 6) % 7)) / 7);
}
