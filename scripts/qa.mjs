import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchChrome} from './chrome.mjs';
import {startServer} from './local-server.mjs';
import {guides} from '../src/guides.mjs';

const screenshots='/workspace/gold-ira/free-apps/qa';
await mkdir(screenshots,{recursive:true});await mkdir('qa-shots',{recursive:true});
const server=await startServer(),browser=await launchChrome(),report=[];
const paths=['/','/guides/',...guides.map(g=>`/guides/${g.slug}/`),'/how-we-calculate/','/embed-code/','/about/','/contact/','/embed/','/404.html'];
try {
 for(const path of paths)for(const width of [320,390,768,1280,1440]) {
  const page=await browser.page(width,width<800?844:900);
  try {
   await page.navigate(server.url+path,path==='/');
   const metrics=await page.evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1s:document.querySelectorAll('h1').length,navVisible:document.querySelector('.header-nav')?.checkVisibility()??false,menuVisible:document.querySelector('.menu')?.checkVisibility()??false})`);
   assert.ok(metrics.scrollWidth<=width,`${path} overflows at ${width}: ${metrics.scrollWidth}`);
   assert.equal(metrics.h1s,1);assert.equal(metrics.menuVisible,path!='/embed/'&&width<600);assert.equal(metrics.navVisible,path!='/embed/'&&width>=600);
   if(width===390||width===1280) {
    const slug=path==='/'?'home':path.split('/').filter(Boolean).at(-1);
    await page.screenshot(`${screenshots}/rmd-b5-${slug}-${width}.png`);
    if(['home','inherited-ira-10-year-rule','single-life-expectancy-table'].includes(slug))await page.screenshot(`${screenshots}/rmd-b5-${slug}-${width}-full.png`,true);
   }
   if(width<600&&path!='/embed/') {
    await page.evaluate("document.querySelector('.menu summary').click()");
    const links=await page.evaluate(`Array.from(document.querySelectorAll('.menu nav a')).map(e=>({href:e.getAttribute('href'),visible:e.checkVisibility(),height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}))`);
    assert.equal(links.length,3);
    for(const link of links){assert.ok(link.visible);assert.ok(link.height>=44&&link.width>=44);}
    if(width===390&&path==='/')await page.screenshot(`${screenshots}/rmd-b5-menu-390.png`);
    assert.ok(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'));
   }
   assert.ok(await page.evaluate(`Array.from(document.images).every(img=>img.complete&&img.naturalWidth>0)`),'broken image');
   assert.deepEqual(page.errors,[]);report.push({path,...metrics,errors:page.errors});
  } finally {await page.close();}
 }
 // Follow each link from the actual mobile disclosure and verify the destination.
 const page=await browser.page(390);
 for(const target of ['/guides/','/how-we-calculate/','/embed-code/']) {
  await page.navigate(server.url+'/',true);
  await page.evaluate(`document.querySelector('.menu summary').click();document.querySelector('.menu a[href="${target}"]').click()`);
  await page.until(`location.pathname==='${target}'&&document.readyState==='complete'`);
  assert.equal(await page.evaluate('location.pathname'),target);
  assert.ok(await page.evaluate(`!!document.querySelector('.menu a[aria-current="page"]')`));
 }
 // Follow each guide CTA and verify both saved answers in the live calculator.
 for(const g of guides){
  await page.navigate(server.url+`/guides/${g.slug}/`,false);
  await page.evaluate("document.querySelector('[data-article-prefill]').click()");
  await page.until("document.querySelector('#question-title')?.textContent==='What year were they born?'");
  assert.deepEqual(await page.evaluate("Object.fromEntries(new URLSearchParams(location.search))"),g.prefill);
  assert.equal(await page.evaluate("document.querySelector('.qs-hd .subtle').textContent"),'3 of 6');
  assert.deepEqual(page.errors,[]);
 }
 // Also follow the Roth spouse option from its section.
 await page.navigate(server.url+'/guides/inherited-roth-ira-rules/',false);
 await page.evaluate(`document.querySelector('a[href="/?r=spouse&t=roth"]').click()`);
 await page.until("document.querySelector('#question-title')?.textContent==='What year were they born?'");
 assert.deepEqual(await page.evaluate("Object.fromEntries(new URLSearchParams(location.search))"),{r:'spouse',t:'roth'});
 // Follow the article CTA, complete the remaining questions, then edit from the result.
 await page.navigate(server.url+'/guides/what-is-an-inherited-ira/',false);
 await page.evaluate("document.querySelector('[data-article-prefill]').click()");
 await page.until("document.querySelector('#question-title')?.textContent==='What year were they born?'");
 for(const year of ['1944','2023','1971']) {
  await page.evaluate(`(()=>{const input=document.querySelector('#answer');input.value='${year}';input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 }
 await page.until("!!document.querySelector('[data-action=skip]')");
 await page.evaluate("document.querySelector('[data-action=skip]').click()");
 await page.until("document.querySelector('#tool').classList.contains('complete')");
 assert.equal(await page.evaluate("document.querySelector('#result-title').textContent"),'10-year rule');
 await page.screenshot(`${screenshots}/rmd-b5-result-390.png`,true);
 await page.evaluate("document.querySelector('#result .chip[data-edit=r]').click()");
 await page.until("document.querySelector('#question-title')?.textContent==='Who left you the account?'");
 // Verify the human embed page's copy-snippet button.
 await page.navigate(server.url+'/embed-code/',false);
 await page.evaluate("document.querySelector('#copy-embed').click()");
 await page.until("/copied|selected/.test(document.querySelector('#copy-status').textContent)");
 assert.deepEqual(page.errors,[]);
 await page.close();
 for(const width of [390,1280]) {
  const result=await browser.page(width);
  await result.navigate(server.url+'/?r=parent&t=ira&ob=1944&od=2023&b=1971&bal=skip');
  await result.screenshot(`${screenshots}/rmd-b5-result-${width}.png`,true);await result.close();
 }
 await writeFile('qa-shots/rmd-b5-report.json',JSON.stringify({pages:report,menuLinks:'all three followed at 390px',prefills:'all six guide CTAs plus Roth spouse option passed',guideFlow:'article → prefill → completed result → edit',copySnippet:'passed'},null,2)+'\n');
 console.log(`Passed ${report.length} page/width checks, menu links, article-to-result editing and snippet copy. Screenshots: ${screenshots}/rmd-b5-*.png`);
} finally {await browser.close();await server.close();}
