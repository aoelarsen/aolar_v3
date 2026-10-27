import type { ImageMetadata } from 'astro';
import type { Locale } from '../i18n/ui';
import baglerlarsen from '../assets/projects/baglerlarsen.webp';
import bryggepraten from '../assets/projects/bryggepraten.webp';
import fotografmortenflaten from '../assets/projects/fotografmortenflaten.webp';
import roykensykkelservice from '../assets/projects/roykensykkelservice.webp';

export interface Project {
    name: string;
    url: string;
    /** Screenshot of the site's front page, 1280×800. */
    image: ImageMetadata;
    description: Record<Locale, string>;
}

/** Shown on /projects in this order. */
export const projects: Project[] = [
    {
        name: 'Røyken Sykkelservice AS',
        url: 'https://roykensykkelservice.no/',
        image: roykensykkelservice,
        description: {
            nb: 'Sykkel- og skiverkstedet i Røyken, i samarbeid med Sport 1 Røyken og Slemmestad. Kundene booker sykkelservice, skiservice og skøyteslip på nett og ser ventetiden i sanntid.',
            en: 'The bike and ski workshop in Røyken, run together with Sport 1 Røyken and Slemmestad. Customers book bike service, ski service and skate sharpening online and see the current waiting time.',
        },
    },
    {
        name: 'Baglerlarsen.no',
        url: 'https://baglerlarsen.no/',
        image: baglerlarsen,
        description: {
            nb: 'Nettstedet til musiker, forfatter og maler Birger D. Larsen. Her samles sangene, skriveriene, maleriene og tegningene hans, fra Sandefjord og Frigiliana.',
            en: 'The home of musician, writer and painter Birger D. Larsen, collecting his songs, writing, paintings and drawings from Sandefjord and Frigiliana.',
        },
    },
    {
        name: 'Bryggepraten.no',
        url: 'https://bryggepraten.no/',
        image: bryggepraten,
        description: {
            nb: 'Nettsiden til Bryggekanten forlag og Bryggepraten-bøkene om Hansens og Larsens forunderlige verden, med utgivelser, nyheter og bestilling fra bryggebutikken.',
            en: "The site for the publisher Bryggekanten forlag and the Bryggepraten books about Hansen and Larsen's peculiar world, with releases, news and ordering from the shop.",
        },
    },
    {
        name: 'Fotografmortenflaten.no',
        url: 'https://www.fotografmortenflaten.no/',
        image: fotografmortenflaten,
        description: {
            nb: 'Portefølje for fotograf Morten Flaten med studio på Tranby. Gallerier med bryllup, barne- og portrettfoto, arkitektur og flyfoto, pluss priser og tjenester.',
            en: 'Portfolio for photographer Morten Flaten, whose studio is at Tranby. Galleries of weddings, children and portraits, architecture and aerial photos, plus prices and services.',
        },
    },
];
