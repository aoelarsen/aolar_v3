import { defineConfig, envField } from 'astro/config';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
    site: 'https://aolar.no',
    // The site stays static; only /radgiver opts out with `prerender = false`,
    // so the reports never end up as public files in dist/.
    // No edge functions here, so skip the Deno emulator that `astro dev` would otherwise start.
    adapter: netlify({ devFeatures: { edgeFunctions: false } }),
    // Norwegian at the root, English under /en/. Visitors whose browser prefers
    // English are sent there by the inline script in Layout.astro.
    i18n: {
        defaultLocale: 'nb',
        locales: ['nb', 'en'],
        routing: {
            prefixDefaultLocale: false,
        },
    },
    // Norwegian used to live under /nb/; keep old links and search results working.
    redirects: {
        '/nb': '/',
        '/nb/about': '/about',
        '/nb/contact': '/contact',
    },
    env: {
        // Set in the Netlify project. Read at request time, never sent to the browser.
        // Optional so the static pages build without them; /radgiver checks them on use.
        schema: {
            VITE_SUPABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
            VITE_SUPABASE_PUBLISHABLE_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
            GITHUB_TOKEN_VERKTOY: envField.string({ context: 'server', access: 'secret', optional: true }),
            // Comma-separated e-mail addresses allowed into /radgiver. Unset means nobody.
            RADGIVER_EPOST: envField.string({ context: 'server', access: 'secret', optional: true }),
        },
    },
});
