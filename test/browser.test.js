import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {launchChrome} from '../scripts/chrome.mjs';
import {startServer} from '../scripts/local-server.mjs';

test('completed normal and unsupported results show exactly one editable answer set at mobile and desktop widths',async()=>{
 execFileSync(process.execPath,['scripts/build.mjs']);
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
