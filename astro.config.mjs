// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * After the build, glue every " — " to the word before it (non-breaking space) so a line
 * never starts with a dash. Only text between tags is touched, never attributes, scripts or
 * styles, and it works on CMS text too, so editors don't have to think about it.
 */
/** @returns {import('astro').AstroIntegration} */
const keepDashesWithText = () => ({
  name: 'keep-dashes-with-text',
  hooks: {
    'astro:build:done': ({ dir }) => {
      /** @param {string} d @returns {string[]} */
      const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : []; });
      for (const file of walk(fileURLToPath(dir))) {
        const html = readFileSync(file, 'utf8');
        const out = html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>)/g)
          .map((part) => (part.startsWith('<') ? part : part.replace(/ \u2014 /g, '\u00a0\u2014 ')))
          .join('');
        if (out !== html) writeFileSync(file, out);
      }
    },
  },
});

export default defineConfig({
  site: 'https://atlas-jiujitsu.com',
  // Pages are built as about.html and served at /about. Canonical URLs, the sitemap and
  // internal links all use this form, so there are no redirect hops.
  trailingSlash: 'never',
  adapter: cloudflare({
    // Optimize every image at build time; nothing is resized at request time.
    imageService: 'compile',
    // Pages read content from disk at build time via the Keystatic reader.
    prerenderEnvironment: 'node',
  }),
  integrations: [
    react(),
    keystatic(),
    keepDashesWithText(),
    sitemap({ filter: (page) => !page.includes('/keystatic') && !/\/free-trial\/(thanks|error)$/.test(page) }),
  ],
  build: {
    format: 'file',
    // Keep every script and stylesheet in external files so the
    // Content-Security-Policy in public/_headers never needs 'unsafe-inline' for scripts.
    inlineStylesheets: 'never',
  },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
  redirects: {
    '/about-atlas-jiu-jitsu-meridian': '/about',
    '/jiu-jitsu-schedule-meridian': '/schedule',
    '/contacts': '/contact',
    '/team': '/about#instructors',
    '/member': '/about#instructors',
    '/blog': '/news',
    '/appointment': '/contact',
    '/shop': '/',
    '/cart': '/',
    '/checkout': '/',
    '/my-account': '/',
    '/events': '/news',
    '/pricing': '/membership',
    '/join': '/membership',
  },
});
