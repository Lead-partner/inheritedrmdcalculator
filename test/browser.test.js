import test from 'node:test';
import assert from 'node:assert/strict';
import {launchChrome} from '../scripts/chrome.mjs';
import {startServer} from '../scripts/local-server.mjs';

test('completed normal and unsupported results show exactly one editable answer set at mobile and desktop widths',async()=>{
 const server=await startServer();const browser=await launchChrome();
 try {
  for(const width of [390,1280])for(const query of ['r=parent&t=ira&ob=1944&od=2023&b=1971&bal=skip','r=trust']) {
   const page=await browser.page(width);
   try {
    await page.navigate(server.url+'/?'+query);
    await page.until("document.querySelector('#tool').classList.contains('complete')");
    const sets=await page.evaluate(`Array.from(document.querySelectorAll('.chips')).filter(e=>e.checkVisibility()).map(e=>({panel:e.closest('#flow')?'answers':'result',count:e.querySelectorAll('[data-edit]').length}))`);
    assert.equal(sets.length,1,`${width}: ${query}`);
    assert.equal(sets[0].panel,width<900?'result':'answers');assert.ok(sets[0].count>0);
    await page.evaluate("Array.from(document.querySelectorAll('.chip')).find(e=>e.checkVisibility()).click()");
    await page.until("!!document.querySelector('#question-title') && !document.querySelector('#tool').classList.contains('complete')");
    assert.deepEqual(page.errors,[]);
   } finally {await page.close();}
  }
 } finally {await browser.close();await server.close();}
});

test('article prefill links resume at the next unanswered question',async()=>{
 const server=await startServer();const browser=await launchChrome();
 try {
  const page=await browser.page(390);
  for(const query of ['r=parent&t=ira','r=parent&t=roth','r=spouse&t=ira','r=other&t=ira']) {
   await page.navigate(server.url+'/?'+query);
   assert.equal(await page.evaluate("document.querySelector('#question-title').textContent"),'What year were they born?');
   assert.equal(await page.evaluate("document.querySelector('.qs-hd .subtle').textContent"),'3 of 6');
  }
  await page.close();
 } finally {await browser.close();await server.close();}
});

test('the initial question is visible immediately and reset restores the labelled example',async()=>{
 const server=await startServer(),browser=await launchChrome();
 try{
  for(const width of [320,390,768,1280]){
   const page=await browser.page(width,844);
   await page.navigate(server.url+'/');
   assert.ok(await page.evaluate("document.querySelector('#question-title').getBoundingClientRect().bottom<innerHeight"));
   assert.equal(await page.evaluate("document.querySelector('.example-preview').checkVisibility()"),width>=900);
   await page.evaluate("document.querySelector('[data-value=trust]').click()");
   await page.until("!!document.querySelector('#result-title')");
   await page.evaluate("document.querySelector('[data-action=reset]').click()");
   await page.until("document.querySelector('#question-title')?.textContent==='Who left you the account?'");
   assert.ok(await page.evaluate("document.querySelector('.example-preview').textContent.includes('IRS example')"));
   assert.deepEqual(page.errors,[]);await page.close();
  }
 }finally{await browser.close();await server.close();}
});
