import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
    site: 'https://aolar.no',
    integrations: [preact()],
    i18n: {
        defaultLocale: 'en',
        locales: ['en', 'nb'],
        routing: {
            prefixDefaultLocale: false,
        },
    },
});
