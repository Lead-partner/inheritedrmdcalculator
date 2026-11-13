import {mkdir,rm,cp,writeFile,readFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {home,page,origin} from './pages.mjs';
await rm('public',{recursive:true,force:true});
await mkdir('public/assets',{recursive:true});
await cp('static','public',{recursive:true});
await cp('data','public/data',{recursive:true});
let size=0;
for(const name of ['app','rules','state','calendar']) {
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
await writeFile('public/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/about/','/contact/'].map(p=>`<url><loc>${origin}${p}</loc></url>`).join('')}</urlset>\n`);
console.log(`Built public/ · total JavaScript: ${(size/1024).toFixed(2)} KB gzip (limit: 20 KB)`);
