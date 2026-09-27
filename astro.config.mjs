import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    site: 'https://aolar.no',
    i18n: {
        defaultLocale: 'en',
        locales: ['en', 'nb'],
        routing: {
            prefixDefaultLocale: false,
        },
    },
});
