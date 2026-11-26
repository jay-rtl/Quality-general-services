import { cp, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { parse, serialize } from 'parse5';
import assert from 'node:assert/strict';

export const ROOT = path.resolve(import.meta.dirname, '..');
export const BASE = '/Quality-general-services/';
export const PREVIEW_ORIGIN = 'https://jay-rtl.github.io';
export const OUTPUT = path.join(ROOT, 'dist-github');

export async function filesBelow(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes:true })) {
    const file = path.join(directory,entry.name);
    if (entry.isSymbolicLink()) throw new Error('Symlinks are not allowed in preview output');
    if (entry.isDirectory()) found.push(...await filesBelow(file));
    else found.push(file);
  }
  return found;
}

function rewriteUrl(value) {
  return value.startsWith('/') && !value.startsWith('//') && !value.startsWith(BASE) ? BASE.slice(0,-1)+value : value;
}

export async function verifyPreview(directory = OUTPUT) {
  const files = await filesBelow(directory);
  const html = files.filter(f=>f.endsWith('.html'));
  assert.equal(html.length,14);
  for (const file of files) {
    const name = path.relative(directory,file).replaceAll('\\','/');
    assert(!/(?:^|\/)(?:api|backend|vendor|qgs-private|node_modules)(?:\/|$)|(?:^|\/)\.env|\.(?:php|docx?|pdf|eml|log|ini|bak|zip)$/i.test(name),name);
    assert(!/sitemap|CNAME/.test(name),name);
  }
  for (const file of html) {
    const body = await readFile(file,'utf8');
    assert.match(body, /name="robots" content="noindex, nofollow, noarchive"/);
    assert.match(body, /name="googlebot" content="noindex, nofollow, noarchive"/);
    assert(!body.includes('application/ld+json'));
    const walk = async node => {
      for (const attr of node.attrs || []) {
        if (['href','src','poster','action'].includes(attr.name) && attr.value.startsWith('/') && !attr.value.startsWith('//')) assert(attr.value.startsWith(BASE),`${file}: ${attr.value}`);
        if (node.tagName === 'link' && attr.name === 'href' && node.attrs.some(a=>a.name==='rel'&&a.value==='canonical')) {
          assert(attr.value.startsWith('https://qualitygeneralservices.net/'));
          assert(!attr.value.includes(BASE));
        }
      }
      for (const child of node.childNodes || []) await walk(child);
    };
    await walk(parse(body));
    if (body.includes('data-form=')) assert(body.includes('data-demo-notice'));
  }
  assert.equal(await readFile(path.join(directory,'robots.txt'),'utf8'),'User-agent: *\nDisallow: /\n');
  return { pages:html.length, files:files.length, base:BASE, noindex:true, backendIncluded:false };
}

async function build() {
  await mkdir(path.join(ROOT,'.local'),{recursive:true});
  const publicDir = await mkdtemp(path.join(ROOT,'.local/github-public-'));
  // Positive allowlist; public/api and all private/runtime files never enter the build.
  for (const folder of ['brand','og']) await cp(path.join(ROOT,'public',folder),path.join(publicDir,folder),{recursive:true});
  await writeFile(path.join(publicDir,'robots.txt'),'User-agent: *\nDisallow: /\n');
  const env = { ...process.env, QGS_BUILD_TARGET:'github-preview', PUBLIC_PREVIEW:'true', PUBLIC_API_MOCK:'true', PUBLIC_API_BASE_URL:'', QGS_PREVIEW_PUBLIC_DIR:publicDir };
  const packageFile = path.join(ROOT,'node_modules/astro/package.json');
  const astroPackage = JSON.parse(await readFile(packageFile,'utf8'));
  const astroBin = typeof astroPackage.bin === 'string' ? astroPackage.bin : astroPackage.bin.astro;
  const result = spawnSync(process.execPath,[path.resolve(path.dirname(packageFile),astroBin),'build'],{cwd:ROOT,env,stdio:'inherit',windowsHide:true});
  if (result.status !== 0) throw new Error('Astro preview build failed');
  for (const file of (await filesBelow(OUTPUT)).filter(f=>f.endsWith('.html'))) {
    const doc = parse(await readFile(file,'utf8'));
    const walk = node => {
      for (const attr of node.attrs || []) {
        if (['href','src','poster','action'].includes(attr.name)) attr.value = rewriteUrl(attr.value);
        if (attr.name === 'srcset') attr.value = attr.value.split(',').map(v=>v.trim().replace(/^\S+/,rewriteUrl)).join(', ');
      }
      for (const child of node.childNodes || []) walk(child);
    };
    walk(doc);
    await writeFile(file,serialize(doc));
  }
  await writeFile(path.join(OUTPUT,'.nojekyll'),'');
  const verification = await verifyPreview();
  await writeFile(path.join(ROOT,'.local/github-build-result.json'),JSON.stringify(verification,null,2));
  console.log('Preview verified:',JSON.stringify(verification));
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) await build();
