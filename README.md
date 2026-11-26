# QGS client approval preview

Preview: https://jay-rtl.github.io/Quality-general-services/

This repository contains only the approved Astro frontend, its public website assets, preview tests and a GitHub Pages workflow. It does not contain the PHP backend, SMTP credentials/configuration, environment files, uploaded applications, private client documents, mock email captures or Hostinger packages.

## Build

```sh
npm ci
npm run build:github
```

Node 24 is used for builds. `dist-github/` is the only Pages artifact. The build fixes the site origin to `https://jay-rtl.github.io`, the exact case-sensitive base to `/Quality-general-services/`, and preview/demo mode to true. It copies only public brand/OG assets, rewrites root-relative HTML links/assets/srcset candidates, and validates the output. Generated stylesheet/font/image URLs use Astro's base setting. All 14 routes are checked before publication. Use `npm run test:github` for the local Chrome/Playwright verification; set `CHROME_PATH` if needed.

All forms display **Client preview — demo form** before submission. Sample file selection stays in the browser; no API request, upload, email, reference or persistent browser storage is created. Confirmation explicitly states that nothing was sent/uploaded/stored. The no-JavaScript version has non-submitting buttons to prevent native GET submissions. Do not enter real applicant information or documents during review.

## Publish

GitHub Pages uses **GitHub Actions**, the manual **Publish client preview** workflow, and the preview branch. Workflow actions are pinned to verified commit SHAs. Publishing uploads only `dist-github`; the workflow has no SMTP/Hostinger secrets and cannot deploy PHP. Trigger it manually after reviewing a new preview commit. No custom domain or `CNAME` is configured.

Every preview HTML page has `noindex, nofollow, noarchive` for robots and Googlebot. Preview sitemaps and LocalBusiness structured data are omitted. Canonical links identify the corresponding production-domain paths. A restrictive project `robots.txt` is supplied, but GitHub project sites do not control the account origin's root `/robots.txt`; per-page noindex is the main exclusion signal. These directives request search-engine exclusion; they do not make a public GitHub Pages site private or guarantee search-engine behavior. A source repository and its publicly accessible files are not made private by page robots tags. Include public website material only.

## Production separation

The intended production domain remains **https://qualitygeneralservices.net** on **Hostinger Premium**. Its private PHP application, private environment template and separately validated archives remain in the original local workspace; they are excluded from this repository and the Pages artifact. No DNS/Hostinger changes are part of this preview.

The workspace's normal `npm run build` still targets `dist/`, root `/`, the production domain, normal production SEO and live same-origin API behavior. `npm run build:github` targets `dist-github/` and forces demo/noindex regardless of the normal form settings. Preview settings cannot overwrite the production archive as part of the preview command.

## Known inherited findings

The approved visuals/GSAP were preserved. The earlier backend audit found transient Careers reveal-image overflow at 390/768 px and existing form-label/upload-hint contrast issues. They remain disclosed under the visual freeze. Placeholder photography/OG imagery and service-copy confirmations remain the client's content decisions. This preview is for approval and is not a declaration that the production site is launch-ready.

References: [Astro GitHub Pages deployment](https://docs.astro.build/en/guides/deploy/github/), [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
