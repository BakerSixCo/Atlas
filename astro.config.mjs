// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';

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
  },
});
