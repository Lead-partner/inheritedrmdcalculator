// Recreate original site assets locally. No image-generation service is used.
import {mkdir,writeFile,rm,copyFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {startServer} from './local-server.mjs';
import {launchChrome} from './chrome.mjs';
import {pageFigures,pageKey,svg} from './figures.mjs';
import {guides} from '../src/guides.mjs';
const server=await startServer(),browser=await launchChrome();
await mkdir('static/img/og',{recursive:true});await mkdir('public/img/og',{recursive:true});
await mkdir('public/_social',{recursive:true});
try{
 const widget=await browser.page(560,640);
 await widget.navigate(server.url+'/embed/');
 await widget.screenshot('public/_social/embed-raw.png');await widget.close();
 execFileSync('python3',['-c',`from PIL import Image
im=Image.open('public/_social/embed-raw.png').convert('RGB')
for w in (480,960):
 r=im.resize((w,round(im.height*w/im.width)),Image.Resampling.LANCZOS)
 r.save(f'static/img/embed-preview-{w}.avif',quality=65)
 r.save(f'static/img/embed-preview-{w}.webp',quality=80,method=6)
`]);
 for(const width of [480,960])for(const type of ['webp','avif'])await copyFile(`static/img/embed-preview-${width}.${type}`,`public/img/embed-preview-${width}.${type}`);
 const titles={'/':'Inherited IRA RMD Calculator','/guides/':'Inherited IRA guides','/how-we-calculate/':'How we calculate','/embed-code/':'Embed the calculator','/about/':'About the calculator','/contact/':'Contact and corrections','/404.html':'Find your next step','/embed/':'Inherited IRA RMD Calculator',...Object.fromEntries(guides.map(g=>[`/guides/${g.slug}/`,g.h1]))};
 for(const [path,title] of Object.entries(titles)){
  const id=pageFigures[path]?.[0];
  const visual=!id&&!['/embed/'].includes(path)?`<div style="padding:36px;font:600 34px/1.4 var(--serif);color:var(--accent)">${path==='/about/'?'Free to use<br>Calculated in your browser<br>Based on IRS sources':path==='/contact/'?'Report an error<br>Leave out account numbers<br>Confirm advice with your custodian':'Return to the calculator<br>Find your rule and deadline'}</div>`:id==='embed-preview'?'<img src="/img/embed-preview-960.webp" width="420" height="480" alt="Actual embedded calculator">':id?svg(id):svg('balance-divisor');
  const description=path==='/'?'Your rule. Your minimum. Your deadline.':path==='/about/'?'Free, browser-based calculations built from IRS sources.':path==='/contact/'?'Report an error or ask about the tool.':path==='/embed-code/'?'A compact widget for your website.':'Clear explanations. Original diagrams. IRS sources.';
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="/style.css"><style>html,body{width:1200px;height:630px;overflow:hidden}body{padding:42px;display:grid;grid-template-columns:510px 570px;gap:36px}.copy-social{display:flex;flex-direction:column;justify-content:center}.copy-social h1{font:600 54px/1.12 var(--serif);color:var(--accent);margin:20px 0}.copy-social p{font-size:22px;line-height:32px}.site-social{border-top:1px solid var(--rule);padding-top:18px;margin-top:32px;font-size:17px;color:var(--accent)}.art-social{height:546px;display:flex;align-items:center;justify-content:center;border:1px solid var(--rule);background:var(--paper)}.art-social svg{width:548px;max-height:532px;height:auto}.art-social img{width:auto;max-width:540px;height:510px;object-fit:contain}svg text{font-family:var(--sans)}svg .serif{font-family:var(--serif)}</style></head><body><div class="copy-social"><span class="ov">Inherited RMD Calculator · IRS reference</span><h1>${title}</h1><p>${description}</p><div class="site-social">inheritedrmdcalculator.com<br>Checked 14 Nov 2026 · Free</div></div><div class="art-social">${visual}</div></body></html>`;
  const file=pageKey(path);await writeFile(`public/_social/${file}.html`,html);
  const page=await browser.page(1200,630);await page.navigate(`${server.url}/_social/${file}.html`,false);
  await page.screenshot(`public/img/og/${file}.png`);await page.close();
  execFileSync('python3',['-c',`from PIL import Image
im=Image.open('public/img/og/${file}.png').convert('RGB');im.save('static/img/og/${file}.png',optimize=True)`]);
  await copyFile(`static/img/og/${file}.png`,`public/img/og/${file}.png`);
 }
 console.log('Created widget AVIF/WebP at 480/960px and 14 page-specific social images.');
}finally{await browser.close();await server.close();await rm('public/_social',{recursive:true,force:true});}
