import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {launchChrome} from './chrome.mjs';
import {startServer} from './local-server.mjs';
import {guides} from '../src/guides.mjs';

// Runs in Chrome. Borders are checked against actual layout tracks/content boxes.
// Intrinsic controls may end within a column; their bounds and text clearance are
// still checked. Collapsed table edges paint once, so are not double borders.
export function inspectLines() {
 const tolerance=1,round=n=>Math.round(n*100)/100;
 const sides=['top','right','bottom','left'];
 const selector=e=>{
  const part=e=>e.id?`#${CSS.escape(e.id)}`:`${e.tagName.toLowerCase()}${[...e.classList].map(c=>'.'+CSS.escape(c)).join('')}:nth-child(${[...e.parentElement.children].indexOf(e)+1})`;
  let path=part(e);
  while(e.parentElement&&document.querySelectorAll(path).length>1){e=e.parentElement;path=part(e)+' > '+path;}
  return path;
 };
 const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
 const visible=e=>e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&e.getClientRects().length&&rect(e).width>0&&rect(e).height>0;
 const content=e=>{const r=rect(e),s=getComputedStyle(e);return {left:r.left+parseFloat(s.borderLeftWidth)+parseFloat(s.paddingLeft),right:r.right-parseFloat(s.borderRightWidth)-parseFloat(s.paddingRight)};};
 const main=document.querySelector('main.wrap'),container=content(main),findings=[];
 const report=(type,element,extra={})=>findings.push({type,element,...extra});
 const elements=[...document.querySelectorAll('body *')].filter(e=>e instanceof HTMLElement&&visible(e));
 const texts=[];
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()) {
  const node=walker.currentNode,parent=node.parentElement;
  if(!node.textContent.trim()||!(parent instanceof HTMLElement)||!visible(parent)||parent.closest('script,style,textarea'))continue;
  const range=document.createRange();range.selectNodeContents(node);
  for(const r of range.getClientRects())if(r.width&&r.height)texts.push({element:selector(parent),left:r.left,right:r.right,top:r.top,bottom:r.bottom});
 }
 // Native input/textarea values are not DOM text nodes. Conservatively use
 // their padded content boxes (and the vertically centred input line box).
 for(const e of elements.filter(e=>e.matches('input,textarea')&&(e.value||e.placeholder))) {
  const r=rect(e),s=getComputedStyle(e),lineHeight=parseFloat(s.lineHeight),top=r.top+parseFloat(s.borderTopWidth),bottom=r.bottom-parseFloat(s.borderBottomWidth);
  texts.push({element:selector(e)+' (native value)',left:r.left+parseFloat(s.borderLeftWidth)+parseFloat(s.paddingLeft),right:r.right-parseFloat(s.borderRightWidth)-parseFloat(s.paddingRight),top:e.matches('input')?(top+bottom-lineHeight)/2:top+parseFloat(s.paddingTop),bottom:e.matches('input')?(top+bottom+lineHeight)/2:bottom-parseFloat(s.paddingBottom)});
 }
 const borders=[];
 for(const e of elements) {
  const r=rect(e),s=getComputedStyle(e),id=selector(e);
  const isWrap=e.matches('.wrap');
  // Wrappers include their gutters. All their descendants must stay within them.
  if(!isWrap&&!e.matches('.skip')&&e.closest('.wrap')) {
   const local=content(e.closest('.wrap'));
   if(r.left<local.left-tolerance||r.right>local.right+tolerance)report('container-overflow',id,{left:round(r.left),right:round(r.right),container:local});
  }
  if(e.scrollWidth>e.clientWidth+1&&!e.matches('textarea')&&s.overflowX!=='visible')report('clipped-overflow',id,{scrollWidth:e.scrollWidth,clientWidth:e.clientWidth});
  const painted=Object.fromEntries(sides.map(side=>[side,parseFloat(s[`border-${side}-width`])>0&&!['none','hidden'].includes(s[`border-${side}-style`])&&!/^(transparent|rgba\(.*?, 0\))$/.test(s[`border-${side}-color`])?parseFloat(s[`border-${side}-width`]):0]));
  if(Object.values(painted).some(Boolean)||e.tagName==='HR') {
   const control=e.matches('button,input,textarea,.btn,.money');
   const cell=e.matches('th,td'),table=cell?e.closest('table'):null;
   const parent=e.parentElement;
   const grid=s.position!=='absolute'&&getComputedStyle(parent).display==='grid';
   let alignment=content(s.position==='absolute'?e.offsetParent:parent),kind=control?'control':cell?'table-cell':'card';
   if(grid) {
    // Explicit CSS grid track boundaries, calculated independently of the item.
    const ps=getComputedStyle(parent),tracks=ps.gridTemplateColumns.split(' ').map(parseFloat),gap=parseFloat(ps.columnGap)||0;
    let x=alignment.left;const trackEdges=[x];
    for(const width of tracks){trackEdges.push(x+width);x+=width+gap;trackEdges.push(x);}
    if(!trackEdges.some(x=>Math.abs(x-r.left)<=tolerance)||!trackEdges.some(x=>Math.abs(x-r.right)<=tolerance))report('unaligned-border',id,{left:round(r.left),right:round(r.right),trackEdges:trackEdges.map(round)});
    alignment={left:trackEdges.find(x=>Math.abs(x-r.left)<=tolerance)??alignment.left,right:trackEdges.find(x=>Math.abs(x-r.right)<=tolerance)??alignment.right};
   } else if(cell) {
    const row=[...table.rows].find(row=>row.cells.length===e.parentElement.cells.length);
    const column=rect(row.cells[e.cellIndex]);alignment={left:column.left,right:column.right};
   } else if(!control) {
    if(Math.abs(r.left-alignment.left)>tolerance||Math.abs(r.right-alignment.right)>tolerance)report('unaligned-border',id,{left:round(r.left),right:round(r.right),column:alignment});
   }
   if(e.tagName==='HR')report('decorative-rule',id);
   // A single sided CSS border outside a table/control is a section divider.
   if(!control&&!cell&&Object.values(painted).filter(Boolean).length<4)report('decorative-divider',id,{sides:painted});
   const segments=sides.filter(side=>painted[side]).map(side=>({side,axis:['top','bottom'].includes(side)?'h':'v',at:r[side]+(table&&getComputedStyle(table).borderCollapse==='collapse'?0:painted[side]/2*(['top','left'].includes(side)?1:-1)),start:['top','bottom'].includes(side)?r.left:r.top,end:['top','bottom'].includes(side)?r.right:r.bottom}));
   let nearest=Infinity,nearestText=null;
   for(const line of segments)for(const t of texts) {
    const start=line.axis==='h'?t.left:t.top,end=line.axis==='h'?t.right:t.bottom;
    if(Math.min(end,line.end)-Math.max(start,line.start)<=1)continue;
    const near=line.axis==='h'?t.top:t.left,far=line.axis==='h'?t.bottom:t.right;
    const distance=Math.max(near-line.at,line.at-far,0)-painted[line.side]/2;
    if(distance<nearest){nearest=distance;nearestText=t.element;}
   }
   if(nearest<8)report('text-clearance',id,{clearance:round(nearest),text:nearestText});
   borders.push({element:id,kind,...Object.fromEntries(Object.entries(r).map(([k,v])=>[k,round(v)])),container:{left:round(container.left),right:round(container.right)},column:alignment,offsetFromContainer:{left:round(r.left-container.left),right:round(container.right-r.right)},sides:painted,textClearance:Number.isFinite(nearest)?round(nearest):null,segments,table,collapse:table&&getComputedStyle(table).borderCollapse==='collapse'});
  }
  for(const pseudo of ['::before','::after']) {
   const style=getComputedStyle(e,pseudo);
   const painted=sides.filter(side=>parseFloat(style[`border-${side}-width`])>0&&!['none','hidden'].includes(style[`border-${side}-style`]));
   if(style.content==='none'||style.display==='none'||!painted.length)continue;
   const icon=e.matches('summary')&&pseudo==='::after'&&parseFloat(style.width)<=12&&parseFloat(style.height)<=12;
   if(!icon)report('pseudo-border',id+pseudo);
   // Existing disclosure chevron is a functional icon, not a horizontal rule.
   borders.push({element:id+pseudo,kind:icon?'disclosure-icon':'pseudo',host:{left:round(r.left),right:round(r.right)},container,column:content(e),sides:painted,declaredSize:{width:style.width,height:style.height}});
  }
 }
 for(let i=0;i<borders.length;i++)for(let j=i+1;j<borders.length;j++) {
  const a=borders[i],b=borders[j];
  if(a.collapse&&b.collapse&&a.table===b.table)continue;
  for(const x of a.segments||[])for(const y of b.segments||[])if(x.axis===y.axis&&x.side!==y.side&&Math.abs(x.at-y.at)<=2&&Math.min(x.end,y.end)-Math.max(x.start,y.start)>8)report('double-border',a.element,{adjacent:b.element,sides:[x.side,y.side]});
 }
 for(const b of borders){delete b.segments;delete b.table;delete b.collapse;}
 const wrappers=[...document.querySelectorAll('.wrap')].filter(visible).map(e=>({element:selector(e),...content(e)}));
 for(const wrapper of wrappers)if(Math.abs(wrapper.left-container.left)>tolerance||Math.abs(wrapper.right-container.right)>tolerance)report('container-mismatch',wrapper.element,wrapper);
 for(const e of document.querySelectorAll('.home-content,.prose-body,.intro,#tool'))if(visible(e)&&Math.abs(rect(e).left-container.left)>tolerance)report('column-mismatch',selector(e),{left:rect(e).left,container});
 const eyebrows=elements.filter(e=>e.matches('.ov')&&!e.closest('#flow'));
 if(eyebrows.length>2)report('eyebrow-count','main',{count:eyebrows.length});
 if(document.documentElement.scrollWidth>innerWidth)report('viewport-overflow','html',{scrollWidth:document.documentElement.scrollWidth,width:innerWidth});
 return {container,wrappers,scrollWidth:document.documentElement.scrollWidth,borders,findings};
}

export async function runAudit() {
 const server=await startServer(),browser=await launchChrome(),pages=[],responsiveFindings=[];
 let responsiveChecks=0;
 const paths=['/','/guides/',...guides.map(g=>`/guides/${g.slug}/`),'/how-we-calculate/','/embed-code/','/about/','/contact/','/404.html','/embed/'];
 const states=[['annual','r=parent&t=ira&ob=1944&od=2023&b=1971&bal=412600'],['spouse','r=spouse&t=ira&ob=1944&od=2023&b=1971&bal=412600'],['roth','r=parent&t=roth&ob=1944&od=2023&b=1971&bal=skip'],['unsupported','r=trust']];
 try {
  for(const width of [320,390,768,1280,1440]) {
   const page=await browser.page(width,width<800?844:900);
   const capture=async(path,state)=>{
    await page.until("!!document.querySelector('main.wrap')");
    const result=await page.evaluate(`(${inspectLines.toString()})()`);
    pages.push({path,state,width,...result,errors:[...page.errors]});
   };
   for(const path of paths) {
    await page.navigate(server.url+path,path==='/'||path==='/embed/');
    await capture(path,'initial');
    await page.evaluate("document.querySelectorAll('main details').forEach(e=>e.open=true)");
    await capture(path,'accordions-open');
    if(width<600&&path!='/embed/') {
     await page.evaluate("document.querySelector('.menu').open=true");await capture(path,'menu-open');
    }
   }
   for(const path of ['/','/embed/'])for(const [state,query] of states) {
    await page.navigate(server.url+path+'?'+query);
    await page.until("document.querySelector('#tool').classList.contains('complete')");
    await page.evaluate("document.querySelectorAll('main details').forEach(e=>e.open=true)");
    await capture(path,state);
   }
   // Every input/choice step, including the balance field, uses the same grid.
   for(const [state,query] of [['account','r=parent'],['year','r=parent&t=ira'],['balance','r=parent&t=ira&ob=1944&od=2023&b=1971']]) {
    await page.navigate(server.url+'/?'+query);
    if(state==='year'||state==='balance')await page.evaluate(`document.querySelector('#answer').value='${state==='year'?'1944':'412,600'}'`);
    await capture('/',state);
   }
   await page.close();
  }
  // Check the example and both result layouts at every integer width, including
  // either side of each CSS breakpoint, rather than just the audit viewports.
  const sweep=await browser.page(320);
  for(const [state,query] of [['initial',''],...states.filter(([state])=>['annual','spouse'].includes(state))]) {
   await sweep.navigate(server.url+'/?'+query);
   for(let width=320;width<=1440;width++) {
    await sweep.command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<=700});
    const result=await sweep.evaluate(`(()=>{
     const main=document.querySelector('main'),s=getComputedStyle(main),r=main.getBoundingClientRect(),left=r.left+parseFloat(s.paddingLeft),right=r.right-parseFloat(s.paddingRight);
     return {scrollWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('#tool,#tool *')].filter(e=>e instanceof HTMLElement&&e.checkVisibility()).flatMap(e=>{const b=e.getBoundingClientRect();return b.left<left-1||b.right>right+1?[{element:e.id||e.className,left:b.left,right:b.right}]:[]})};
    })()`);
    responsiveChecks++;
    if(result.scrollWidth>width||result.overflow.length)responsiveFindings.push({state,width,...result});
   }
  }
  await sweep.close();
 } finally {await browser.close();await server.close();}
 const findings=pages.flatMap(p=>p.findings.map(f=>({path:p.path,state:p.state,width:p.width,...f}))),errors=pages.flatMap(p=>p.errors);
 const report={checked:new Date().toISOString(),chrome:'/usr/bin/google-chrome',widths:[320,390,768,1280,1440],policy:{tolerancePx:1,minTextClearancePx:8,nativeValues:'Native input and textarea values use their padded content boxes and vertically centred input line boxes; DOM text uses Range rectangles.',intrinsicControls:'Functional controls may end within a column. All are checked for containment and text clearance.',tableEdges:'Collapsed table borders paint once; column edges are measured from the first row.',pseudoBorders:'Only the existing 9px disclosure chevron is allowed as a functional border icon.',figures:'SVG strokes are figure content, not CSS section dividers. Figure bounds are audited; SVG text bounds use npm run qa:figures.'},summary:{routes:paths.length,checks:pages.length,borders:pages.reduce((n,p)=>n+p.borders.length,0),findings:findings.length,browserErrors:errors.length,responsiveWidths:responsiveChecks,responsiveFindings:responsiveFindings.length},responsiveSweep:{from:320,to:1440,step:1,states:['initial','annual','spouse'],findings:responsiveFindings},findings,pages};
 await mkdir('docs/qa',{recursive:true});
 // Keep the full per-element evidence while avoiding hundreds of thousands of
 // lines of mechanical JSON indentation: one border record per line.
 const pageJson=pages.map(({borders,...page})=>JSON.stringify(page).slice(0,-1)+',"borders":[\n'+borders.map(b=>JSON.stringify(b)).join(',\n')+'\n]}').join(',\n');
 const {pages:allPages,...metadata}=report;
 await writeFile('docs/qa/lines-audit.json',JSON.stringify(metadata,null,2).slice(0,-1)+',"pages":[\n'+pageJson+'\n]}\n');
 console.log(JSON.stringify(report.summary));
 if(findings.length){console.log(JSON.stringify(findings.slice(0,30),null,2));process.exitCode=1;}
 if(errors.length||responsiveFindings.length)process.exitCode=1;
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await runAudit();
