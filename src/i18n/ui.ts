export const locales = ['en', 'nb'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const ui = {
    en: {
        skipToContent: 'Skip to main content',
        nav: {
            home: 'Home',
            about: 'About',
            contact: 'Contact',
        },
        openMenu: 'Open main menu',
        switchLanguageLabel: 'Norsk',
        switchLanguageHint: 'View this page in Norwegian Bokmål',
        themeLabel: 'Colour theme',
        themeSystem: 'System',
        themeLight: 'Light',
        themeDark: 'Dark',
    },
    nb: {
        skipToContent: 'Hopp til hovedinnhold',
        nav: {
            home: 'Hjem',
            about: 'Om',
            contact: 'Kontakt',
        },
        openMenu: 'Åpne hovedmeny',
        switchLanguageLabel: 'English',
        switchLanguageHint: 'Se denne siden på engelsk',
        themeLabel: 'Fargetema',
        themeSystem: 'System',
        themeLight: 'Lyst',
        themeDark: 'Mørkt',
    },
} as const;

export function getUi(locale: string | undefined) {
    return ui[locale === 'nb' ? 'nb' : 'en'];
}
