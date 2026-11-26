// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const SITE_URL = 'https://qualitygeneralservices.net';
const preview = process.env.QGS_BUILD_TARGET === 'github-preview';

export default defineConfig({
  site: preview ? 'https://jay-rtl.github.io' : SITE_URL,
  base: preview ? '/Quality-general-services' : '/',
  outDir: preview ? './dist-github' : './dist',
  publicDir: preview ? process.env.QGS_PREVIEW_PUBLIC_DIR : './public',
  trailingSlash: 'ignore',
  integrations: preview ? [] : [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
