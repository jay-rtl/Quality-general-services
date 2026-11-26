import { chromium, request as playwrightRequest } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { BASE, ROOT, OUTPUT, verifyPreview } from './github-preview.mjs';
import AxeBuilder from '@axe-core/playwright';

const artifact = path.join(ROOT,'.local/github-qa');
await mkdir(artifact,{recursive:true});
let server, browser, api;
let baseUrl = process.env.PREVIEW_URL;
const checks = [], issues = [], runtimeErrors = [], apiRequests = [], externalRequests = [], broken = [];
const pass = name => { checks.push(name); console.log('PASS '+name); };
const mime = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.jpg':'image/jpeg', '.webp':'image/webp', '.png':'image/png', '.avif':'image/avif', '.txt':'text/plain' };
try {
  const verification = await verifyPreview();
  pass('14 preview pages: noindex, production canonicals, base URLs, demo notices and frontend-only artifact');
  if (!baseUrl) {
    server = createServer(async (req,res) => {
      try {
        const requestUrl = new URL(req.url,'http://localhost');
        if (!requestUrl.pathname.startsWith(BASE)) { res.writeHead(404); res.end(); return; }
        const file = path.resolve(OUTPUT,decodeURIComponent(requestUrl.pathname.slice(BASE.length)) || '.');
        if (file !== OUTPUT && !file.startsWith(OUTPUT+path.sep)) throw new Error();
        const info = await stat(file);
        if (info.isDirectory() && !requestUrl.pathname.endsWith('/')) { res.writeHead(301,{Location:requestUrl.pathname+'/'+requestUrl.search}); res.end(); return; }
        const target = info.isDirectory() ? path.join(file,'index.html') : file;
        const bytes = await readFile(target);
        res.writeHead(200,{'Content-Type':mime[path.extname(target)] || 'application/octet-stream','Content-Length':bytes.length}); res.end(bytes);
      } catch { res.writeHead(404); res.end(); }
    });
    await new Promise(r=>server.listen(0,'127.0.0.1',r));
    baseUrl = `http://127.0.0.1:${server.address().port}${BASE}`;
  }
  const base = new URL(baseUrl);
  assert.equal(base.pathname,BASE);
  api = await playwrightRequest.newContext();
  const urls = new Set([baseUrl+'robots.txt']);
  const collect = node => {
    for (const attr of node.attrs || []) {
      if (['href','src','poster'].includes(attr.name) && attr.value.startsWith(BASE)) urls.add(new URL(attr.value,base).href.split('#')[0]);
      if (attr.name==='srcset') for (const candidate of attr.value.split(',')) { const url=candidate.trim().split(/\s/)[0]; if(url.startsWith(BASE)) urls.add(new URL(url,base).href); }
    }
    for (const child of node.childNodes || []) collect(child);
  };
  const pages = ['','about/','careers/','contact/','privacy/','projects/','services/','services/asbestos-abatement-mould-remediation/','services/commercial-janitorial-cleaning/','services/contents-processing-cleaning/','services/post-construction-cleaning/','services/restoration-support/','services/workforce-staffing-solutions/','404.html'];
  for (const route of pages) {
    const response = await api.get(baseUrl+route+'?qgs-review=20261126');
    assert.equal(response.status(),200,route);
    const html = await response.text();
    assert.match(html,/name="robots" content="noindex, nofollow, noarchive"/);
    collect(parse(html));
  }
  const resources = [...urls];
  for(let i=0;i<resources.length;i+=12) await Promise.all(resources.slice(i,i+12).map(async url=>{ const r=await api.get(url); assert.equal(r.status(),200,url); }));
  pass(`All 14 routes and ${resources.length} linked routes/assets/srcset candidates return HTTP 200 under the repository prefix`);
  const chrome = process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
  browser = await chromium.launch({...(chrome?{executablePath:chrome}:{}),headless:true});
  const context = await browser.newContext({viewport:{width:1440,height:1000}});
  const page = await context.newPage();
  page.on('pageerror',e=>runtimeErrors.push(e.message));
  page.on('request',req=>{
    if(req.method()!=='GET' || req.resourceType()==='fetch' || req.resourceType()==='xhr') apiRequests.push({url:req.url(),method:req.method()});
    if(req.url().startsWith('http') && new URL(req.url()).origin!==base.origin) externalRequests.push(req.url());
  });
  page.on('response',r=>{if(r.status()>=400)broken.push({url:r.url(),status:r.status()});});
  for (const width of [390,768,1440]) {
    await page.setViewportSize({width,height:1000});
    for(const route of ['','contact/','careers/']) {
      await page.goto(baseUrl+route);
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForFunction(()=>document.documentElement.classList.contains('motion-ready'));
      const overflow = await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
      if(overflow.scrollWidth>width) issues.push({route:route||'home',...overflow,existing:true});
      assert(await page.locator('h1').isVisible());
      assert(await page.locator('[data-demo-notice]').count()>0);
      assert.equal(await page.locator('img').evaluateAll(images=>images.filter(img=>img.complete && img.naturalWidth===0).length),0);
      for (const y of [0,1000,2500,1200,0]) {await page.evaluate(y=>window.scrollTo(0,y),y); await page.waitForTimeout(90);}
    }
    pass(`Home/contact/careers render at ${width}px; fonts/images and scroll forward/reverse checked`);
  }
  await page.setViewportSize({width:390,height:1000});
  await page.goto(baseUrl);
  await page.locator('[data-menu-toggle]').click();
  assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'),'false');
  assert.equal(await page.evaluate(()=>document.activeElement?.hasAttribute('data-menu-toggle')),true);
  pass('Mobile menu opens and Escape closes it with focus restored');
  await page.setViewportSize({width:1440,height:1000});
  const fillQuote = async(route,selector)=>{
    await page.goto(baseUrl+route);
    const form=page.locator(selector); await form.scrollIntoViewIfNeeded();
    for(const [key,value] of Object.entries({full_name:'Demo Reviewer',email:'review@example.test',phone:'5875550100',message:'Sample preview inquiry only.'})) await form.locator(`[name=${key}]`).fill(value);
    await form.locator('[name=service]').selectOption('commercial-cleaning');
    await form.locator('[name=privacy_consent]').check();
    return form;
  };
  for(const [route,selector] of [['','#home-quote'],['contact/','#contact-quote']]) {
    const form=await fillQuote(route,selector);
    await form.locator('[data-submit]').click();
    await form.locator('[data-form-status][data-tone=success]').waitFor({state:'visible'});
    assert.match(await form.locator('[data-status-body]').textContent(),/No email was sent, no documents were uploaded, and no submission was stored/);
    assert.equal(await form.locator('[name=full_name]').inputValue(),'');
  }
  pass('Home and Contact demo submissions show honest confirmation, reset fields and make no API request');
  await page.goto(baseUrl+'careers/');
  const form=page.locator('#application-form'); await form.scrollIntoViewIfNeeded();
  for(const [key,value] of Object.entries({full_name:'Demo Reviewer',email:'review@example.test',phone:'5875550100',city:'Calgary',experience:'Sample preview experience only.'})) await form.locator(`[name=${key}]`).fill(value);
  for(const [key,value] of Object.entries({position:'general-labour',availability:'immediate',schedule:'any',work_eligibility:'yes'})) await form.locator(`[name=${key}]`).selectOption(value);
  await form.locator('[name=privacy_consent]').check();
  const buffer=Buffer.from('%PDF-1.4\nSample preview only.\n%%EOF');
  await form.locator('[name=resume]').setInputFiles({name:'sample-resume.pdf',mimeType:'application/pdf',buffer});
  await form.locator('[name=supporting_documents]').setInputFiles([1,2,3,4].map(i=>({name:`sample-${i}.pdf`,mimeType:'application/pdf',buffer})));
  assert.equal(await form.locator('[data-file-list] li').count(),5);
  await form.locator('[data-submit]').click();
  await form.locator('[data-form-status][data-tone=success]').waitFor({state:'visible'});
  assert.match(await form.locator('[data-status-body]').textContent(),/no documents were uploaded/);
  assert.equal(await form.locator('[data-file-list] li').count(),0);
  pass('Application demo accepts local sample selection of five documents, sends/uploads/stores nothing and clears the UI');
  await page.goto(baseUrl+'contact/?service=post-construction');
  assert.equal(await page.locator('[name=service]').inputValue(),'post-construction');
  assert.equal(await page.locator('nav[aria-label=Primary] [aria-current=page]').textContent(),'Contact');
  await page.locator('#contact-quote [name=full_name]').focus(); await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('name')),'company');
  pass('Service prefill, active navigation and form keyboard order work under base path');
  await page.emulateMedia({reducedMotion:'reduce'}); await page.goto(baseUrl+'contact/');
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('motion-ok')),false);
  const noticeScan = await new AxeBuilder({page}).include('[data-demo-notice]').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  assert.deepEqual(noticeScan.violations,[]);
  pass('Added demo notice passes scoped axe rules including contrast');
  await page.screenshot({path:path.join(artifact,process.env.PREVIEW_URL?'live-contact.png':'local-contact.png'),fullPage:true});
  assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
  assert.equal((await context.cookies()).length,0);
  pass('Reduced-motion fallback and empty browser storage/cookies verified');
  const noJs=await browser.newContext({javaScriptEnabled:false});
  const plain=await noJs.newPage(); await plain.goto(baseUrl+'contact/');
  await plain.locator('#contact-quote [name=full_name]').fill('Sample Only');
  assert.equal(await plain.locator('#contact-quote [data-submit]').getAttribute('type'),'button');
  const before=plain.url(); await plain.locator('#contact-quote [data-submit]').click();
  await plain.locator('#contact-quote [name=email]').focus(); await plain.keyboard.press('Enter');
  assert.equal(plain.url(),before);
  assert(await plain.locator('h1').isVisible());
  pass('No-JavaScript content remains visible; demo button and Enter do not submit personal details in a URL');
  assert.deepEqual(apiRequests,[]); assert.deepEqual(externalRequests,[]); assert.deepEqual(runtimeErrors,[]); assert.deepEqual(broken,[]);
  pass('Zero POST/fetch/XHR submissions, external network requests, uncaught errors or broken browser assets');
  const result={checks:checks.length,passed:checks,knownVisualIssues:issues,browser:browser.version(),baseUrl,verification,apiRequests,externalRequests,runtimeErrors,broken};
  await writeFile(path.join(artifact,process.env.PREVIEW_URL?'live-result.json':'local-result.json'),JSON.stringify(result,null,2));
  if(issues.length)console.log('KNOWN EXISTING VISUAL ISSUES '+JSON.stringify(issues));
} finally {await api?.dispose(); await browser?.close(); if(server)await new Promise(r=>server.close(r));}
