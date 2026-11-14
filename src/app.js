import {calculate,followups,rbdInfo,validYear,parseBalance} from './rules.js';
import {encodeState,decodeState} from './state.js';
import {makeCalendar} from './calendar.js';
const today=new Date(),Y=today.getFullYear(),flow=document.querySelector('#flow'),panel=document.querySelector('#result'),tool=document.querySelector('#tool');
let a=decodeState(location.search,today),index=0,editing=false,done=false,currentResult;
const labels={r:'Who left you the account?',t:'What kind of account?',ob:'What year were they born?',od:'What year did they die?',b:'What year were you born?',early:'Were they born before July 1, 1949?',rbd:'',gap:'Is your birthday less than 10 years after theirs?',bal:`What was the account balance on December 31, ${Y-1}?`};
const choices={r:[['parent','My parent'],['spouse','My spouse'],['other','Someone else','Sibling, friend, other relative'],['trust','A trust or estate inherited it']],t:[['ira','Traditional IRA'],['roth','Roth IRA'],['plan','401(k), 403(b) or similar workplace plan']],early:[['yes','Yes'],['no','No'],['unsure','Not sure']],rbd:[['yes','Yes'],['no','No'],['unsure','Not sure']],gap:[['yes','Yes'],['no','No'],['unsure','Not sure']]};
const dollar=x=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(x);
const whole=x=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(x);
const minimum=x=>dollar(Math.ceil(x*100-1e-7)/100);
const escape=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const has=k=>Object.hasOwn(a,k);
function keys(){return ['r','t','ob','od','b',...((a.ob&&a.od&&a.b)?followups(a):[]),'bal'];}
function missing(){return keys().findIndex(k=>!has(k));}
function save(){history.replaceState(null,'',location.pathname+(encodeState(a)?'?'+encodeState(a):'')+location.hash);}
function dateLabel(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return escape(date);const [y,m,d]=date.split('-');return `${m==='04'?'Apr':'Dec'} ${+d}, ${y}`;}
function chipLabel(k){if(choices[k])return `${({r:'',t:'',early:'Born before July 1, 1949: ',rbd:'Died before April 1: ',gap:'Birthday gap under 10 years: '})[k]}${choices[k].find(c=>c[0]===a[k])?.[1]||''}`;return k==='bal'?(a.bal===null?'Balance skipped':dollar(a.bal)):`${({ob:'Owner born',od:'Died',b:'You were born'})[k]} ${a[k]}`;}
function chipHtml(){return `<div class="chips">${keys().filter(k=>has(k)).map(k=>`<button class="chip" data-edit="${k}" aria-label="Edit: ${escape(chipLabel(k))}">${escape(chipLabel(k))}</button>`).join('')}</div>`;}
function renderFlow(focus=false){
 if(done){flow.innerHTML=`<div class="qs-hd"><span class="ov">Your answers</span><span class="subtle">Complete</span></div><h2 class="result-heading">Here’s what you told us.</h2>${chipHtml()}<p class="hint">Choose an answer to change it.</p><button class="txt" data-action="reset">Start over</button>`;return;}
 const list=keys(),k=list[index];if(!k){finish(focus);return;}
 labels.rbd=`Did they die before April 1, ${rbdInfo(a).questionYear || a.od}?`;
 const hint=k==='bal'?"It's on the year-end statement.":k==='rbd'?"That's when their first required withdrawal was due. The custodian can confirm.":k==='gap'?'For example: they were born in March 1950 and you in May 1960 → No.':k==='od'?`This tool covers deaths in 2020–${Y}.`:choices[k]?'Choose one to continue.':'Type four digits to continue automatically.';
 flow.innerHTML=`<div class="qs-hd"><span class="ov">Your answers</span><span class="subtle">${index+1} of ${list.length}</span></div><div class="progress" aria-hidden="true"><span style="--progress:${(index+1)/list.length*100}%"></span></div><div class="question" aria-live="polite"><h2 id="question-title" tabindex="-1">${labels[k]}</h2><p class="hint" id="question-hint">${hint}</p>${choices[k]?`<div class="choices">${choices[k].map(([v,l,s],i)=>`<button class="choice" data-value="${v}" aria-pressed="${a[k]===v}" aria-describedby="question-hint"><span class="key" aria-hidden="true">${i+1}</span><span>${l}${s?`<small>${s}</small>`:''}</span></button>`).join('')}</div>`:`<form id="step-form" novalidate><label class="field-label" for="answer">${k==='bal'?'Balance in US dollars':'Year'}</label>${k==='bal'?`<div class="money"><span aria-hidden="true">$</span><input id="answer" aria-labelledby="question-title" name="balance" autocomplete="off" inputmode="decimal" aria-describedby="question-hint field-error" value="${a.bal===null?'':escape(has('bal')?Number(a.bal).toLocaleString('en-US',{maximumFractionDigits:2}):'')}"></div>`:`<input class="field year" id="answer" aria-labelledby="question-title" name="year" type="text" inputmode="numeric" autocomplete="off" maxlength="4" pattern="[0-9]{4}" aria-describedby="question-hint field-error" value="${escape(a[k])}">`}<p class="error" id="field-error" aria-live="polite"></p><button class="btn" type="submit">${k==='bal'?'Show my result':'Next'}</button>${k==='bal'?'<button class="txt" type="button" data-action="skip">Skip — show me the rule only</button>':''}</form>`}<div class="step-actions">${index?'<button class="txt" data-action="back">← Back</button>':''}</div></div><p class="subtle flow-foot">Calculated in your browser. Shareable links include your answers and balance.</p>`;
 const input=document.querySelector('#answer');
 if(input){input.addEventListener('input',()=>{
  if(k==='bal') {const value=input.value; if(/^[\d,]*(\.\d{0,2})?$/.test(value)) {const pos=input.selectionStart,after=value.slice(pos).replaceAll(',','').length;const [integer,decimal]=value.replaceAll(',','').split('.');input.value=(integer?Number(integer).toLocaleString('en-US'):'')+(decimal!==undefined?'.'+decimal:'');const next=Math.max(0,input.value.length-after);input.setSelectionRange(next,next);}showError(validate(k,input.value));}
  else {const err=validate(k,input.value);showError(input.value.length===4?err:'');if(input.value.length===4&&!err)answer(k,input.value);}
 });input.addEventListener('blur',()=>{if(document.contains(input))showError(validate(k,input.value));});document.querySelector('#step-form').addEventListener('submit',e=>{e.preventDefault();const err=validate(k,input.value);showError(err);if(!err)answer(k,k==='bal'?parseBalance(input.value):input.value);});}
 if(focus)(input||document.querySelector('#question-title')).focus({preventScroll:true});
}
function validate(k,v){
 if(k==='bal')return v.trim()===''?'Enter a balance, or choose “Skip”.':Number.isNaN(parseBalance(v))?'Enter a balance between $0 and $1,000,000,000,000 (up to two decimal places).':'';
 if(!validYear(v,Y))return `Enter a year between 1900 and ${Y}.`;
 if(k==='ob' && a.od && +v>+a.od)return 'Their birth year must be on or before the year they died.';
 if(k==='od' && +v<+a.ob)return 'The death year must be on or after their birth year.';
 if(k==='b' && +v>+a.od)return 'Your birth year must be on or before the year they died.';
 return '';
}
function showError(msg){const e=document.querySelector('#field-error');if(e)e.textContent=msg;const input=document.querySelector('#answer');input?.setAttribute('aria-invalid',String(!!msg));}
function answer(k,v){
 if(['ob','od','t'].includes(k) && a[k]!==v){delete a.early;delete a.rbd;}if(['ob','b','r'].includes(k) && a[k]!==v)delete a.gap;
 a[k]=v;
 // A newly edited death year can make previously valid birth years impossible.
 if(k==='od' && +a.b>+v)delete a.b;
 if(k==='ob' && a.od && +v>+a.od)delete a.od;
 save();
 if(a.r==='trust'||(has('od')&&+a.od<2020)){finish(true);return;}
 if((k==='early' && v==='unsure' && ['tie','uncertain'].includes(rbdInfo(a).status)) || (k==='rbd' && ['tie','uncertain'].includes(rbdInfo(a).status)) || (k==='gap' && v==='unsure')){finish(true);return;}
 const firstMissing=missing();
 if(editing && firstMissing===-1){editing=false;finish(true);return;}
 if(firstMissing===-1 && k==='bal'){finish(true);return;}
 index=firstMissing!==-1?firstMissing:keys().indexOf(k)+1;
 renderFlow(true);if(missing()===-1)renderResult(false);
}
function finish(focus){done=true;tool.classList.add('complete');currentResult=calculate(a,{today});renderFlow();renderResult(focus);save();}
function edit(k){editing=true;done=false;index=keys().indexOf(k);tool.classList.remove('complete');renderFlow(true);if(matchMedia('(max-width:899px)').matches)tool.scrollIntoView({block:'start'});}
function amountHtml(req){
 if(!req.required)return `<div class="amt words"><span>Nothing required</span></div><p class="calc">No beneficiary withdrawal required in ${Y}.</p>`;
 if(req.amount===null)return `<div class="amt"><span>${(100/req.divisor).toFixed(2)}%</span></div><p class="calc">Of the prior December 31 balance${req.divisor?` ÷ ${req.divisor.toFixed(1)} divisor`:''}.</p>`;
 return `<div class="amt"><span>${minimum(req.amount)}</span></div><p class="calc">${whole(currentResult.balance)} ÷ ${req.divisor.toFixed(1)} (IRS life-expectancy divisor)</p>`;
}
function heroes(req,deadline,emptyBy=null){return `<div class="heroes"><div><div class="lbl">${req.required?`Take out at least this much in ${Y}`:`Nothing required in ${Y}`}</div>${amountHtml(req)}</div><div class="due"><div class="lbl">${req.required?'Deadline':'Your timing'}</div><div class="date">${dateLabel(deadline)}</div>${emptyBy?`<p>Account must be empty by <b>Dec 31, ${emptyBy}</b></p>`:''}</div></div>`;}
function renderResult(focus=false){
 currentResult=calculate(a,{today});const r=currentResult;
 if(r.rule==='unsupported'){panel.innerHTML=`<section class="result"><div class="ov">Your result</div><h2 id="result-title" class="result-heading" tabindex="-1">Check with the custodian</h2><p class="why">${escape(r.why)}</p><p class="hint"><a href="https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-beneficiary">IRS guidance for beneficiaries</a></p><div class="r-acts"><button class="btn sec" data-action="reset">Start over</button></div><div class="edit result-answer-edit"><div class="answers-title">Edit answers</div>${chipHtml()}</div></section>`;}
 else {
  const title=r.rule==='spouse'?'You have a choice':r.rule==='minor-child'?'Yearly payments, then a 10-year deadline':r.rule==='edb-life-expectancy'?'Life-expectancy payments':'10-year rule';
  panel.innerHTML=`<section class="result" aria-labelledby="result-title"><div class="r-top"><span class="ov">Your result · ${Y}</span></div><h2 id="result-title" class="rule-badge" tabindex="-1">${title}</h2><p class="why">${escape(r.why)}</p>${r.options?r.options.map((o,i)=>`<section class="option"><h3>${i?'B':'A'}. ${o.title}</h3>${heroes(o.thisYear,o.deadline)}<p class="calc">${escape(o.note)}</p><button class="txt" data-calendar="${i}"${!/^\d{4}-\d{2}-\d{2}$/.test(o.deadline)?' disabled':''}>Add this deadline to calendar</button></section>`).join(''):heroes(r.thisYear,r.deadline,r.emptyBy)}<div class="r-acts">${!r.options&&/^\d{4}-\d{2}-\d{2}$/.test(r.deadline)?'<button class="btn sec" data-action="calendar">Add deadline to calendar</button>':!r.options&&r.emptyBy?'<button class="btn sec" data-action="empty-calendar">Add final deadline to calendar</button>':''}<button class="btn sec" data-action="print">Print / save PDF</button><button class="btn sec" data-action="copy">Copy link</button><button class="btn sec" data-action="reset">Start over</button></div><p class="status-message" id="action-status" role="status"></p><div class="edit result-answer-edit"><div class="answers-title">Edit answers</div>${chipHtml()}</div><ul class="notes">${r.notes.map(n=>`<li>${escape(n)}</li>`).join('')}</ul><details class="schedule" id="schedule"><summary>Show year-by-year schedule</summary>${r.rule==='spouse'?'<p class="table-note">Option B — keep it as an inherited IRA.</p>':''}<p class="growth-label" id="growth-label">Assumed growth (illustration only) <span class="print-only" id="print-growth">${Math.round((a.g||0)*100)}%</span></p><div class="growth" role="group" aria-labelledby="growth-label">${[0,.03,.05,.07].map(g=>`<button data-growth="${g}" aria-pressed="${+(a.g||0)===g}">${Math.round(g*100)}%</button>`).join('')}</div><div id="schedule-table">${scheduleHtml(r)}</div></details><details class="result-sources"><summary>Sources for your result</summary><ul class="sources">${r.sources.map(s=>`<li><a href="${s.url}">${s.title}</a></li>`).join('')}</ul></details><div class="print-meta">Generated ${today.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})} · inheritedrmdcalculator.com<br>${escape('This calculator explains IRS rules in plain words. It is not tax, legal or financial advice. Check your result with the account custodian or a tax professional before you act.')}</div></section>`;
 }
 if(focus){document.querySelector('#result-title').focus({preventScroll:true});if(matchMedia('(max-width:899px)').matches)tool.scrollIntoView({block:'start'});}
}
function scheduleHtml(r){return `<table><caption class="subtle">${r.emptyBy?`Through the empty-by deadline in ${r.emptyBy}`:'Illustration of life-expectancy payments'}</caption><thead><tr><th scope="col">Year</th><th scope="col" class="c-age">Age</th><th scope="col">Balance,<br>Jan 1</th><th scope="col">Divisor</th><th scope="col">Take out</th></tr></thead><tbody>${r.schedule.map(row=>`<tr${row.year===Y?' class="now"':row.year===r.emptyBy?' class="end"':''}><td>${row.year}</td><td class="c-age">${row.age}</td>${row.year<Y?`<td>—</td><td>${row.divisor?.toFixed(1)||'—'}</td><td class="status">${row.status==='not required (IRS relief)'?'Not required (IRS relief)':row.required?'Check past balance':'Not required'}</td>`:`<td>${row.startBalance===null?'—':whole(row.startBalance)}</td><td>${row.divisor===1?'All':row.divisor?.toFixed(1)||'—'}</td><td>${!row.required?'$0':row.amount===null?`${(100/row.divisor).toFixed(2)}%`:whole(row.amount)}</td>`}</tr>`).join('')}</tbody></table><p class="table-note">${r.balance===null?'Percentages apply to each prior year-end balance. ':''}The current minimum rounds up to the next cent; schedule dollars round to the nearest dollar. Future balances assume the minimum is taken before growth; they are illustrations. Past balances are unknown. ${r.emptyBy?'The final year requires everything left.':''}</p>`;}
function calendar(date,req,final=false){const description=`${final?'Empty the inherited account. ':''}${req.required?(req.amount===null?`${(100/req.divisor).toFixed(2)}% of the prior December 31 balance`:dollar(req.amount)):'No yearly minimum; check the final account-emptying deadline.'} ${currentResult.why} Verify with your custodian. https://inheritedrmdcalculator.com/`;const content=makeCalendar({date,description});const url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='inherited-ira-deadline.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.addEventListener('click',async e=>{
 const el=e.target.closest('button');if(!el)return;
 if(el.dataset.value)answer(keys()[index],el.dataset.value);
 else if(el.dataset.edit)edit(el.dataset.edit);
 else if(el.dataset.growth!==undefined){a.g=+el.dataset.growth;save();document.querySelector('#print-growth').textContent=Math.round(a.g*100)+'%';currentResult=calculate(a,{today});document.querySelector('#schedule-table').innerHTML=scheduleHtml(currentResult);document.querySelectorAll('[data-growth]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.growth===a.g)));}
 else if(el.dataset.calendar!==undefined){const o=currentResult.options[+el.dataset.calendar];calendar(o.deadline,o.thisYear);}
 else if(el.dataset.action==='back'){index=Math.max(0,index-1);renderFlow(true);}
 else if(el.dataset.action==='skip')answer('bal',null);
 else if(el.dataset.action==='reset'){a={};index=0;editing=false;done=false;tool.classList.remove('complete');panel.innerHTML='<div class="result placeholder"><div class="ov">Your result</div><h2>Your rule. Your amount.<br>Your deadline.</h2><div class="amt" aria-hidden="true">$—</div><p>Start with who left you the account.<br>We’ll ask only what we need.</p></div>';save();renderFlow(true);}
 else if(el.dataset.action==='print'){document.querySelector('#schedule')?.setAttribute('open','');window.print();}
 else if(el.dataset.action==='calendar')calendar(currentResult.deadline,currentResult.thisYear);
 else if(el.dataset.action==='empty-calendar')calendar(`${currentResult.emptyBy}-12-31`,{required:true,amount:null,divisor:1},true);
 else if(el.dataset.action==='copy'){const status=document.querySelector('#action-status');try{await navigator.clipboard.writeText(location.href);status.textContent='Link copied. It includes your answers and balance.';}catch{status.textContent='Copy the address from your browser to share these answers.';}}
});
document.addEventListener('keydown',e=>{if(done||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea'))return;const buttons=flow.querySelectorAll('.choice');if(/^[1-4]$/.test(e.key)&&buttons[+e.key-1]){e.preventDefault();buttons[+e.key-1].click();}else if(e.key==='Enter' && e.target.id==='question-title'){e.preventDefault();(flow.querySelector('.choice[aria-pressed=true]')||buttons[0]||flow.querySelector('input'))?.focus();}});
window.addEventListener('beforeprint',()=>document.querySelector('#schedule')?.setAttribute('open',''));
if(a.r==='trust'||(a.od&&+a.od<2020)||missing()===-1)finish(false);else{index=Math.max(0,missing());renderFlow();}
