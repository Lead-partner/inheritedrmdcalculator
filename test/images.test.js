import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {guides} from '../src/guides.mjs';
import {table,example} from '../scripts/figures.mjs';
async function files(dir){const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?files(join(dir,e.name)):join(dir,e.name)))).flat();}
const htmlFiles=()=>files('public').then(paths=>paths.filter(p=>p.endsWith('.html')));
const attr=(s,name)=>s.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const localFile=url=>resolve('public','.'+new URL(url,'https://inheritedrmdcalculator.com').pathname);
const words=s=>s.replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]*>/g,' ').trim().split(/\s+/).length;
const schema=html=>Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)).flatMap(m=>JSON.parse(m[1])['@graph']);

test('every image and responsive source resolves locally and img dimensions and alternative text are explicit',async()=>{
 for(const path of await htmlFiles()){
  const html=await readFile(path,'utf8');
  for(const [tag] of html.matchAll(/<(?:img|source)\b[^>]*>/g)){
   const refs=[attr(tag,'src'),...(attr(tag,'srcset')||'').split(',').map(x=>x.trim().split(/\s+/)[0])].filter(Boolean);
   assert.ok(refs.length,`${path}: image source missing`);
   for(const url of refs)assert.ok((await stat(localFile(url))).isFile(),`${path}: ${url}`);
   if(tag.startsWith('<img'))for(const name of ['alt','width','height'])assert.ok(attr(tag,name),`${path}: missing ${name}`);
  }
  for(const [tag] of html.matchAll(/<svg\b[^>]*>/g)){
   assert.ok(attr(tag,'width')&&attr(tag,'height'));assert.equal(attr(tag,'role'),'img');assert.ok(attr(tag,'aria-label'));
  }
 }
});

test('every page has its own real 1200×630 OG image, matching Twitter image and JSON-LD ImageObject',async()=>{
 const seen=new Set();
 for(const path of await htmlFiles()){
  const html=await readFile(path,'utf8'),og=html.match(/<meta property="og:image" content="([^"]+)"/)[1];
  assert.ok(!seen.has(og),`Reused social card: ${og}`);seen.add(og);
  const png=await readFile(localFile(og));assert.equal(png.toString('ascii',1,4),'PNG');
  assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
  assert.ok(html.includes(`<meta name="twitter:image" content="${og}">`));
  assert.match(html,/<meta property="og:image:alt" content="[^"]+">/);
  const entities=schema(html).filter(x=>['Article','WebApplication','WebPage'].includes(x['@type']));
  assert.ok(entities.length,`${path}: no page schema`);
  for(const item of entities){assert.equal(item.image['@type'],'ImageObject');assert.equal(item.image.url,og);assert.equal(item.image.width,1200);assert.equal(item.image.height,630);assert.ok(item.image.caption);}
 }
});

test('all guides have a lead figure and an in-body teaching figure with credits',async()=>{
 for(const g of guides){
  const html=await readFile(`public/guides/${g.slug}/index.html`,'utf8');
  const figures=[...html.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/g)];assert.ok(figures.length>=2,g.slug);
  assert.ok(figures[0][0].includes('lead-figure'));assert.ok(figures[0].index<html.indexOf('<section>'));
  assert.match(html,/<section>[\s\S]*?<figure/);
  for(const [f] of figures){assert.match(f,/<figcaption>[\s\S]*?Source:/);assert.match(f,/Lead Partner AS/);}
 }
});

test('sitemap content images resolve and cover each illustrated page',async()=>{
 const xml=await readFile('public/sitemap.xml','utf8');assert.match(xml,/xmlns:image="http:\/\/www.google.com\/schemas\/sitemap-image\/1.1"/);
 for(const [,url,body] of xml.matchAll(/<url><loc>(.*?)<\/loc>([\s\S]*?)<\/url>/g)){
  const html=await readFile(localFile(url+'index.html'),'utf8'),images=[...body.matchAll(/<image:loc>(.*?)<\/image:loc>/g)];
  assert.equal(images.length,(html.match(/<figure\b/g)||[]).length-(url.endsWith('.com/')?1:0),url); // Home reuses the worked example twice.
  for(const [,src] of images)assert.ok((await stat(localFile(src))).isFile());
 }
});

test('home has substantial initial-HTML prose, matching FAQ schema and exact IRS example arithmetic',async()=>{
 const html=await readFile('public/index.html','utf8'),main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
 const copy=main.slice(main.indexOf('<article')).replace(/<figure[\s\S]*?<\/figure>/g,'');
 assert.ok(words(copy)>=1200&&words(copy)<=1800,`${words(copy)} prose words`);
 assert.equal(table[57],29.8);assert.equal(example.minimum,'3355.71');
 assert.ok(html.includes('IRS example · preview'));assert.doesNotMatch(html,/\$—|class="result placeholder"/);
 assert.ok(html.includes('<h1>Inherited IRA RMD Calculator</h1>'));
 const visible=[...html.matchAll(/<details><summary>([^<]+)<\/summary><p(?: data-evidence="[^"]+")?>([^<]+)<\/p><\/details>/g)].map(([,name,text])=>({name,text}));
 const questions=schema(html).find(x=>x['@type']==='FAQPage').mainEntity.map(x=>({name:x.name,text:x.acceptedAnswer.text}));
 assert.deepEqual(visible,questions);assert.ok(questions.length>=8);
});

test('all new home and figure rule claims map to exact saved primary-source evidence',async()=>{
 const {claims}=JSON.parse(await readFile('sources-ref/article-evidence.json','utf8'));
 const sourceCache=new Map();
 for(const path of await htmlFiles()){
  const html=await readFile(path,'utf8');
  for(const [,id] of html.matchAll(/data-evidence="([^"]+)"/g)){
   assert.ok(claims[id]?.length,`${path}: missing ${id}`);
   for(const {file,quote} of claims[id]){
    if(!sourceCache.has(file))sourceCache.set(file,(await readFile('sources-ref/'+file,'utf8')).replace(/\s+/g,' '));
    assert.ok(sourceCache.get(file).includes(quote),`${id}: quote not in ${file}`);
   }
  }
 }
 const chart=await readFile('public/img/single-life-chart.svg','utf8');
 const points=chart.match(/<polyline points="([^"]+)"/)[1].split(' ');assert.equal(points.length,121);
 for(const [age,point] of points.entries()){
  const [x,y]=point.split(',').map(Number);assert.ok(Math.abs(x-(65+age/120*590))<.006);assert.ok(Math.abs(y-(366-table[age]/85*230))<.006);
 }
});
