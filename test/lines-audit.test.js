import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectLines} from '../scripts/lines-audit.mjs';
import {launchChrome} from '../scripts/chrome.mjs';
import {startServer} from '../scripts/local-server.mjs';

test('line audit detects shifted dividers, double borders, tight text and container overflow',async()=>{
 const server=await startServer(),browser=await launchChrome();
 try {
  const page=await browser.page(1280);
  await page.navigate(server.url+'/');
  const inspect=()=>page.evaluate(`(${inspectLines.toString()})()`);
  assert.deepEqual((await inspect()).findings,[]);
  await page.evaluate(`document.querySelector('main').insertAdjacentHTML('beforeend',\`
   <div style="margin-top:40px">
    <section id="shifted-line" style="border-top:1px solid black;width:calc(100% - 10px);margin-left:5px">Too close to a shifted line</section>
    <div id="overhang" style="height:20px;width:calc(100% + 24px)"></div>
    <div id="double-above" style="height:20px;border-bottom:1px solid black"></div>
    <div id="double-below" style="height:20px;border-top:1px solid black"></div>
    <hr id="decorative-rule">
   </div>\`)`);
  const {findings}=await inspect();
  for(const type of ['unaligned-border','decorative-divider','text-clearance','double-border','container-overflow','decorative-rule'])assert.ok(findings.some(f=>f.type===type),`Missed ${type}`);
  assert.ok(findings.some(f=>f.element==='#shifted-line'&&f.type==='unaligned-border'));
  assert.ok(findings.some(f=>f.element==='#overhang'&&f.type==='container-overflow'));
  await page.close();
 } finally {await browser.close();await server.close();}
});
