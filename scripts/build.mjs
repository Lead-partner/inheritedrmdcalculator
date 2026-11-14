import {mkdir,rm,cp,writeFile,readFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {home,page,origin,guideIndex,guidePage,supportingPage} from './pages.mjs';
import {illustrations,svg,pageFigures} from './figures.mjs';
import {guides,published} from '../src/guides.mjs';
await rm('public',{recursive:true,force:true});
await mkdir('public/assets',{recursive:true});
await cp('static','public',{recursive:true});
await cp('data','public/data',{recursive:true});
await mkdir('public/img',{recursive:true});
for(const id of Object.keys(illustrations))await writeFile(`public/img/${id}.svg`,svg(id));
let size=0;
for(const name of ['app','rules','state','calendar','embed-code']) {
 const code=await readFile(`src/${name}.js`,'utf8');
 size+=gzipSync(code).length;await writeFile(`public/assets/${name}.js`,code);
}
if(size>=20*1024)throw new Error(`JS exceeds 20 KB gzip: ${size} bytes`);
for(const path of ['embed','about','contact'])await mkdir(`public/${path}`,{recursive:true});
await writeFile('public/index.html',home());
await writeFile('public/embed/index.html',home(true));
await writeFile('public/about/index.html',page('about'));
await writeFile('public/contact/index.html',page('contact'));
await writeFile('public/404.html',page(404));
const pages=[['guides',guideIndex()],...guides.map(g=>[`guides/${g.slug}`,guidePage(g)]),...['how-we-calculate','embed-code'].map(path=>[path,supportingPage(path)])];
for(const [path,html] of pages) {
 await mkdir(`public/${path}`,{recursive:true});
 await writeFile(`public/${path}/index.html`,html);
}
await writeFile('public/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${['/','/about/','/contact/',...pages.map(([path])=>`/${path}/`)].map(p=>`<url><loc>${origin}${p}</loc><lastmod>${published}</lastmod>${(pageFigures[p]||[]).map(id=>`<image:image><image:loc>${origin}/img/${id==='embed-preview'?'embed-preview-960.webp':id+'.svg'}</image:loc></image:image>`).join('')}</url>`).join('')}</urlset>\n`);
console.log(`Built public/ · total JavaScript: ${(size/1024).toFixed(2)} KB gzip (limit: 20 KB)`);
