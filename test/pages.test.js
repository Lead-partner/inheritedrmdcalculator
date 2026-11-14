import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {guides,references} from '../src/guides.mjs';
import {decodeState} from '../src/state.js';

const read=path=>readFile('public/'+path,'utf8');
const decode=html=>html.replaceAll('&amp;','&');
const schema=html=>Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)).flatMap(m=>JSON.parse(m[1])['@graph']);

test('every sitemap URL has built HTML, a checked date and real shared navigation',async()=>{
 const sitemap=await read('sitemap.xml');
 const urls=Array.from(sitemap.matchAll(/<url><loc>(.*?)<\/loc><lastmod>(.*?)<\/lastmod>[\s\S]*?<\/url>/g));
 assert.equal(urls.length,6+guides.length);
 for(const [,url,lastmod] of urls) {
  const pathname=new URL(url).pathname,html=await read(pathname.slice(1)+'index.html');
  assert.equal(lastmod,'2026-11-14');
  assert.ok(pathname.endsWith('/'));
  assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
  assert.match(html,/<meta name="msvalidate\.01" content="8797DFC86988AA536C562F2F5A70B8DC">/);
  const header=html.match(/<header[\s\S]*?<\/header>/)[0];
  assert.doesNotMatch(header,/href="\/?#(?:how|faq|embed|questions)/);
  for(const path of ['/guides/','/how-we-calculate/','/embed-code/'])assert.ok(header.includes(`href="${path}"`));
  assert.match(header,/<details class="menu">/);
  const footer=html.match(/<footer[\s\S]*?<\/footer>/)[0];
  for(const path of ['/guides/','/how-we-calculate/','/embed-code/','/about/','/contact/'])assert.ok(footer.includes(`href="${path}"`));
  if(['/guides/','/how-we-calculate/','/embed-code/'].includes(pathname))assert.ok(header.includes(`href="${pathname}" aria-current="page"`));
 }
 for(const g of guides)assert.ok(urls.some(([,url])=>url.endsWith(`/guides/${g.slug}/`)));
 assert.equal(schema(await read('guides/index.html'))[0]['@type'],'BreadcrumbList');
});

for(const g of guides)test(`${g.slug}: article SEO, sources, prefill state and related links`,async()=>{
 const html=await read(`guides/${g.slug}/index.html`),title=html.match(/<title>(.*?)<\/title>/)[1],description=html.match(/<meta name="description" content="(.*?)">/)[1];
 assert.equal((html.match(/<h1>/g)||[]).length,1);
 assert.ok(title.length<=60,`${title.length} characters`);assert.ok(description.length<=155);
 assert.equal(title,g.title);assert.equal(new Set(guides.map(x=>x.title)).size,guides.length);assert.doesNotMatch(title,/calculator/i);
 const keyword={'inherited-ira-rules':'inherited IRA rules','what-is-an-inherited-ira':'what is an inherited IRA','inherited-roth-ira-rules':'inherited Roth IRA distribution rules','single-life-expectancy-table':'single life expectancy table','inherited-ira-10-year-rule':'inherited IRA 10-year rule','inherited-401k-rules':'inherited 401k rules'}[g.slug];
 assert.ok(title.toLowerCase().includes(keyword.toLowerCase()));
 assert.doesNotMatch(html,/<script(?! type="application\/ld\+json")/);
 assert.match(html,/<meta property="og:type" content="article">/);
 assert.ok(html.includes(`<meta property="og:image" content="https://inheritedrmdcalculator.com/img/og/${g.slug}.png">`));
 const graph=schema(html),article=graph.find(x=>x['@type']==='Article'),crumbs=graph.find(x=>x['@type']==='BreadcrumbList');
 assert.ok(article&&crumbs);
 assert.equal(article.headline,g.h1);assert.equal(article.datePublished,'2026-11-14');assert.equal(article.dateModified,'2026-11-14');
 assert.equal(article.author.name,'Lead Partner AS');assert.equal(article.publisher.name,'Lead Partner AS');
 assert.equal(article.mainEntityOfPage,`https://inheritedrmdcalculator.com/guides/${g.slug}/`);
 assert.deepEqual(crumbs.itemListElement.map(x=>x.name),['Home','Guides',g.h1]);
 const prefill=html.match(/data-article-prefill href="(.*?)"/)[1];
 assert.deepEqual(decodeState(new URL(decode(prefill),'https://inheritedrmdcalculator.com').search),g.prefill);
 // Every section link is a validated, nonempty calculator state, including the trust notice.
 for(const [,href] of html.matchAll(/href="(\/\?[^\"]+)"/g)) {
  const query=new URL(decode(href),'https://inheritedrmdcalculator.com').search,state=decodeState(query);
  assert.ok(state.r&&state.t);assert.equal(Object.keys(state).length,2);
 }
 assert.match(html,/Checked 14 Nov 2026/);assert.match(html,/not tax, legal or financial advice/);assert.match(html,/custodian or a tax professional/);
 const sourceList=html.match(/<section class="article-sources"[\s\S]*?<\/section>/)[0];
 for(const id of g.sources)assert.ok(sourceList.includes(references[id].url));
 assert.ok(html.includes('href="/guides/"'));
 for(const other of guides.filter(x=>x.slug!==g.slug))assert.ok(html.includes(`href="/guides/${other.slug}/"`));
 assert.ok(html.includes('href="/how-we-calculate/"'));assert.ok(html.includes('href="/embed-code/"'));
 // Count visible article copy without collapsed long-tail answers.
 const articleHtml=html.match(/<article>([\s\S]*?)<\/article>/)[1];
 const visibleWords=articleHtml.replace(/<details[\s\S]*?<\/details>/g,'').replace(/<figure[\s\S]*?<\/figure>/g,'').replace(/<[^>]+>/g,' ').trim().split(/\s+/).length;
 assert.ok(visibleWords>=500&&visibleWords<=900,`${visibleWords} visible words`);
 const intro=html.match(/<h1>.*?<\/h1><p[^>]*>(.*?)<\/p>/)[1].replace(/<[^>]+>/g,' ').trim().split(/\s+/);
 assert.ok(intro.length<=60,`${intro.length} words in first paragraph`);
});

test('every guide evidence ID maps to an exact quote in a source fetched on 14 Nov 2026',async()=>{
 const evidence=JSON.parse(await readFile('sources-ref/article-evidence.json','utf8'));
 const manifest=JSON.parse(await readFile('sources-ref/checked-2026-11-14.json','utf8'));
 for(const g of guides) {
  const html=await read(`guides/${g.slug}/index.html`);
  for(const [,id] of html.matchAll(/data-evidence="([^"]+)"/g)) {
   assert.ok(evidence.claims[id]?.length,`Missing evidence: ${id}`);
   for(const {file,quote} of evidence.claims[id]) {
    assert.ok(manifest.some(s=>s.file===file&&s.checked==='2026-11-14'&&s.status==='fetched'));
    const text=(await readFile(`sources-ref/${file}`,'utf8')).replace(/\s+/g,' ');
    assert.ok(text.includes(quote),`Quote not found for ${id} in ${file}`);
   }
  }
  for(const id of g.sources)await access('sources-ref/'+references[id].file);
 }
});

test('iframe remains noindex with its original tool and without site navigation',async()=>{
 const html=await read('embed/index.html');assert.match(html,/noindex,follow/);assert.match(html,/id="tool"/);
 assert.doesNotMatch(html,/<header|class="menu"|article-sources/);
 const config=JSON.parse(await readFile('vercel.json','utf8'));
 assert.ok(config.headers.find(x=>x.source==='/embed(/.*)?').headers.some(x=>x.value.includes('frame-ancestors *')));
});


test('all 121 Table I rows match freshly saved Pub 590-B, repository data and accessible HTML',async()=>{
 const source=await readFile('sources-ref/p590b.txt','utf8');
 const start=source.indexOf('Appendix B. Life Expectancy Tables\nTable I\n');
 assert.ok(start>=0,'Appendix B Table I heading');
 const end=source.indexOf('Table II\n(Joint and Last Survivor Life Expectancy)',start);
 assert.ok(end>start,'Table II boundary');
 const sourceRows=Object.fromEntries(Array.from(source.slice(start,end).matchAll(/^(\d+)(\+)?\n(\d+\.\d+)$/gm),m=>[m[1],Number(m[3])]));
 const data=JSON.parse(await readFile('data/irs-tables.json','utf8')).rmd_single_life;
 assert.equal(Object.keys(sourceRows).length,121);
 assert.deepEqual(Object.keys(sourceRows),Array.from({length:121},(_,i)=>String(i)));
 assert.deepEqual(data,sourceRows);
 const html=await read('guides/single-life-expectancy-table/index.html');
 const table=html.match(/<table class="guide-table" id="single-life-table">([\s\S]*?)<\/table>/)[1];
 assert.match(table,/<caption>IRS Publication 590-B, Appendix B, Table I/);
 assert.equal((table.match(/<th scope="col">/g)||[]).length,2);
 const renderedRows=Array.from(table.matchAll(/<tr><th scope="row">(\d+\+?)<\/th><td>(\d+\.\d)<\/td><\/tr>/g));
 assert.equal(renderedRows.length,121);
 for(const [index,[,age,divisor]] of renderedRows.entries()){
  assert.equal(age,index===120?'120+':String(index));
  assert.equal(divisor,sourceRows[index].toFixed(1),`age ${age}`);
 }
 assert.ok(html.includes(`$100,000 (example)</strong>`));
 assert.ok(html.includes(`$100,000 ÷ ${data[57].toFixed(1)} = approximately $${(100000/data[57]).toFixed(2)}`));
 assert.ok(source.includes('New life expectancy tables apply to distribution calendar years beginning on or after January 1, 2022.'));
});

test('10-year deadline rows count the calendar year after death as year one',async()=>{
 const html=await read('guides/inherited-ira-10-year-rule/index.html');
 const rows=Array.from(html.matchAll(/<tr><th scope="row">(202[0-6])<\/th><td>December 31, (\d{4})<\/td><\/tr>/g));
 assert.equal(rows.length,7);
 for(const [,death,deadline] of rows)assert.equal(Number(deadline),Number(death)+10);
 assert.match(html,/calendar year after death is year one/);
});

test('new guide prefills and contextual hub links stay aligned with the account type',async()=>{
 const expected={
  'inherited-roth-ira-rules':['r=parent&t=roth','r=spouse&t=roth'],
  'single-life-expectancy-table':['r=other&t=ira'],
  'inherited-ira-10-year-rule':['r=parent&t=ira'],
  'inherited-401k-rules':['t=plan&r=parent']
 };
 for(const [slug,queries] of Object.entries(expected)){
  const html=decode(await read(`guides/${slug}/index.html`));
  for(const query of queries)assert.ok(html.includes(`href="/?${query}"`));
 }
 for(const hub of ['inherited-ira-rules','what-is-an-inherited-ira']){
  const html=await read(`guides/${hub}/index.html`);
  const body=html.slice(html.indexOf('<article>'),html.indexOf('<aside class="related"'));
  for(const slug of Object.keys(expected))assert.ok(body.includes(`href="/guides/${slug}/"`));
 }
 const hub=await read('guides/inherited-ira-rules/index.html');
 for(const heading of ['Who follows the 10-year rule?','Inherited Roth IRA rules']){
  const section=hub.slice(hub.indexOf(`<section><h2>${heading}</h2>`)).split('</section>')[0];
  assert.equal((section.replace(/<figure[\s\S]*?<\/figure>/g,'').match(/<p/g)||[]).length,2,'brief hub section');
 }
});
