import {startServer} from './local-server.mjs';
import {launchChrome} from './chrome.mjs';
import {guides} from '../src/guides.mjs';
const server=await startServer(),browser=await launchChrome();
let bad=[];
try{
 const page=await browser.page(1280,900);
 for(const path of ['/',...guides.map(g=>`/guides/${g.slug}/`),'/how-we-calculate/','/guides/']){
  await page.navigate(server.url+path,path==='/');
  const overflow=await page.evaluate(`Array.from(document.querySelectorAll('figure svg text')).flatMap(t=>{const b=t.getBBox(),s=t.closest('svg').viewBox.baseVal;return b.x<s.x||b.x+b.width>s.x+s.width||b.y<s.y||b.y+b.height>s.y+s.height?[{figure:t.closest('figure').dataset.figure,text:t.textContent,right:b.x+b.width,max:s.width}]:[]})`);
  if(overflow.length)bad.push({path,overflow});
 }
 await page.close();console.log(JSON.stringify(bad,null,2));if(bad.length)process.exitCode=1;
}finally{await browser.close();await server.close();}
