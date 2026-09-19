export const locales = ['en', 'nb'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** Single source of truth for external URLs referenced from page content below. */
export const links = {
    company: 'https://roykensykkelservice.no/',
    astro: 'https://astro.build',
    netlify: 'https://netlify.com',
    netlifyDeploys: 'https://app.netlify.com/sites/aolar/deploys',
    netlifyBadge: 'https://api.netlify.com/api/v1/badges/4ce45616-d7c6-4d16-bd5c-2eb5c9a5f300/deploy-status',
    claudeCode: 'https://claude.com/claude-code',
    github: 'https://github.com/aoelarsen',
} as const;

/** Proper noun, identical in every locale - centralized so it's edited in one place. */
export const companyName = 'AOLar Holding AS';

interface HomeContent {
    title: string;
    quote: string;
}

interface AboutContent {
    title: string;
    lead: string;
    bodyHtml: string;
    siteIsHeading: string;
    createdWithHtml: string;
    hostedWithHtml: string;
    netlifyBadgeAlt: string;
    helpFromHtml: string;
    workHeading: string;
    workshopText: string;
    githubIntro: string;
    githubHandle: string;
    finePrint: string;
}

interface ContactContent {
    title: string;
    heading: string;
    tagline: string;
    bodyText: string;
    honeypotLabel: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitLabel: string;
}

interface FooterContent {
    orgNumberLabel: string;
    orgNumberValue: string;
}

interface Ui {
    skipToContent: string;
    nav: {
        home: string;
        about: string;
        contact: string;
    };
    openMenu: string;
    switchLanguageLabel: string;
    switchLanguageHint: string;
    themeLabel: string;
    themeLight: string;
    themeDark: string;
    footer: FooterContent;
    pages: {
        home: HomeContent;
        about: AboutContent;
        contact: ContactContent;
    };
}

export const ui: Record<Locale, Ui> = {
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
        themeLight: 'Light',
        themeDark: 'Dark',
        footer: {
            orgNumberLabel: 'Organisation number',
            orgNumberValue: '938 383 529',
        },
        pages: {
            home: {
                title: 'Welcome to AOLar.no',
                quote: 'I consider myself a problem solver regardless of occupation.',
            },
            about: {
                title: `About AOLar.no and ${companyName}`,
                lead: 'Aolar.no is a webspace for exploration, tinkering and testing new stuff.',
                bodyHtml: `AOLar Holding AS is a company owned by Anders Øksendal Larsen; a dude interested in bicycles, frontend-develpment and AI among other things. Current occupation; bicycle mechanic, ski-technician and "him with the beard" for <a class="link" href="${links.company}">Røyken Sykkelservice AS</a>`,
                siteIsHeading: 'This site is:',
                createdWithHtml: `- created with <a class="link" href="${links.astro}">Astro</a>`,
                hostedWithHtml: `- hosted with <a class="link" href="${links.netlify}">Netlify</a>`,
                netlifyBadgeAlt: 'netlify status badge',
                helpFromHtml: `- now also with help from <a class="link" href="${links.claudeCode}">Claude Code</a>`,
                workHeading: 'Things I work on:',
                workshopText: 'Can be found in the workshop at Sport1 Røyken',
                githubIntro: '… or on github:',
                githubHandle: 'aoelarsen',
                finePrint: '[… more will be inserted here as soon as I have the time to update]',
            },
            contact: {
                title: 'Contact AOLar.no',
                heading: 'You found me!',
                tagline: "It's ok to say hi",
                bodyText:
                    "If you serch for my name, I'll probably show up in a few places on the internet. Though the easies way to reach me is to just drop me a message here",
                honeypotLabel: "Don't fill this out if you're human: ",
                nameLabel: 'Name',
                namePlaceholder: 'Name',
                emailLabel: 'E-mail',
                emailPlaceholder: 'something@other.com',
                messageLabel: 'Message',
                messagePlaceholder: 'Say hi and aks me about cycling or skiing, then we can talk for a while.',
                submitLabel: 'Send message',
            },
        },
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
        themeLight: 'Lyst',
        themeDark: 'Mørkt',
        footer: {
            orgNumberLabel: 'Organisasjonsnummer',
            orgNumberValue: '938 383 529',
        },
        pages: {
            home: {
                title: 'Velkommen til AOLar.no',
                quote: 'Jeg anser meg selv som en problemløser, uansett yrke.',
            },
            about: {
                title: `Om AOLar.no og ${companyName}`,
                lead: 'Aolar.no er et nettsted for utforsking, tukling og testing av nye ting.',
                bodyHtml: `AOLar Holding AS er et selskap eid av Anders Øksendal Larsen; en kar som er interessert i sykler, frontend-utvikling og AI, blant annet. Nåværende yrke: sykkelmekaniker, skitekniker og "han med skjegget" hos <a class="link" href="${links.company}">Røyken Sykkelservice AS</a>`,
                siteIsHeading: 'Denne siden er:',
                createdWithHtml: `- laget med <a class="link" href="${links.astro}">Astro</a>`,
                hostedWithHtml: `- hostet med <a class="link" href="${links.netlify}">Netlify</a>`,
                netlifyBadgeAlt: 'Netlify-statusmerke',
                helpFromHtml: `- nå også med hjelp fra <a class="link" href="${links.claudeCode}">Claude Code</a>`,
                workHeading: 'Ting jeg jobber med:',
                workshopText: 'Du finner meg på verkstedet hos Sport1 Røyken',
                githubIntro: '… eller på GitHub:',
                githubHandle: 'aoelarsen',
                finePrint: '[… mer kommer her så snart jeg får tid til å oppdatere]',
            },
            contact: {
                title: 'Kontakt AOLar.no',
                heading: 'Du fant meg!',
                tagline: 'Det er lov å si hei',
                bodyText:
                    'Hvis du søker etter navnet mitt, dukker jeg nok opp noen steder på internett. Men den enkleste måten å nå meg på er å bare legge igjen en melding her',
                honeypotLabel: 'Ikke fyll ut dette feltet hvis du er et menneske: ',
                nameLabel: 'Navn',
                namePlaceholder: 'Navn',
                emailLabel: 'E-post',
                emailPlaceholder: 'etteller@annet.com',
                messageLabel: 'Melding',
                messagePlaceholder: 'Si hei og spør meg gjerne om sykkel eller ski, da kan vi prate lenge.',
                submitLabel: 'Send melding',
            },
        },
    },
};

export function getUi(locale: string | undefined) {
    return ui[locale === 'nb' ? 'nb' : 'en'];
}
