# AOLar Holding AS: logo files

Put this `brand/` folder where your site serves static files from (for example `public/` in Vite, Astro or Next.js, or the site root for plain HTML). The snippets below assume the files are reachable at `/brand/`.

## Files

| File | Use it for |
| --- | --- |
| `aolar-emblem.svg` | Full emblem on light backgrounds (96 px and up) |
| `aolar-emblem-dark.svg` | Full emblem on dark backgrounds |
| `aolar-emblem-themeable.svg` | Full emblem to paste inline when your site has its own light/dark toggle (colors come from CSS variables) |
| `aolar-emblem-small.svg` / `-small-dark.svg` | Simplified emblem for small sizes (under 96 px), such as the header logo |
| `app-icon.svg` / `app-icon-dark.svg` | Rounded app tile |
| `favicon.svg` | Browser tab icon; switches to the brass tile when the browser is in dark mode |
| `favicon.ico` | Favicon fallback for older browsers (16, 32 and 48 px) |
| `apple-touch-icon.png` | iPhone/iPad home screen icon (180 px, square, iOS rounds the corners) |
| `icon-192.png`, `icon-512.png` | Web app manifest icons |
| `aolar-emblem-1024.png`, `aolar-emblem-dark-1024.png` | Raster copies for documents, email signatures and social profiles |

## Favicons: in `<head>`

```html
<link rel="icon" href="/brand/favicon.ico" sizes="48x48">
<link rel="icon" href="/brand/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png">
```

## Header logo (small emblem + name)

The name is real text, not an image. It stays sharp, is readable by screen readers and search engines, and "AOL" is set a little heavier than the rest.

```html
<a class="aolar-logo" href="/">
  <img src="/brand/aolar-emblem-small.svg" width="44" height="44" alt="">
  <span class="aolar-wordmark"><span class="aolar-initials">AOL</span>ar Holding AS</span>
</a>
```

```css
.aolar-logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #1D3B30;
  text-decoration: none;
}
.aolar-wordmark {
  font-family: "Schibsted Grotesk", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-weight: 600;
  font-size: 19px;
  letter-spacing: 0.01em;
}
.aolar-initials { font-weight: 760; }
```

For a large, stacked version (the one on the design board), use `aolar-emblem.svg` at about 250 px with the name centered underneath at 25 px.

### The font

Schibsted Grotesk is a variable font, so the 760 weight needs the weight range, not just fixed weights:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@600..800&display=swap">
```

For a Norwegian site, consider self-hosting the font files instead (for example via Fontsource). Loading fonts from Google's servers sends visitors' IP addresses to Google, which has been treated as a privacy problem under GDPR.

## Dark mode

If the site follows the visitor's system setting:

```html
<picture>
  <source srcset="/brand/aolar-emblem-dark.svg" media="(prefers-color-scheme: dark)">
  <img src="/brand/aolar-emblem.svg" width="250" height="250" alt="AOLar Holding AS">
</picture>
```

If the site has its own theme toggle, paste the contents of `aolar-emblem-themeable.svg` inline in the HTML and set the colors in CSS:

```css
:root              { --aolar-ink: #1D3B30; --aolar-accent: #A77B27; }
[data-theme="dark"] { --aolar-ink: #ECE8DD; --aolar-accent: #D6AA52; }
```

Remember to switch the wordmark color too (`#1D3B30` on light, `#ECE8DD` on dark).

## Colors

| Role | On light backgrounds | On dark backgrounds |
| --- | --- | --- |
| Letters and Ø (ink) | `#1D3B30` | `#ECE8DD` |
| Ticks (brass) | `#A77B27` | `#D6AA52` |
| Ø on the green app tile | `#F1EDE3` | n/a |
