import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,singleLife,uniformLife,applicableAge,rbdInfo,followups,parseBalance} from '../src/rules.js';
const today=new Date('2026-11-13T12:00:00Z');
const example={r:'parent',t:'ira',ob:1944,od:2023,b:1971,bal:412600};
const calc=(changes={},year=2026)=>calculate({...example,...changes},{today:new Date(`${year}-11-13T12:00:00Z`)});
test('Table I and Table III anchor values and P590B Justin example',()=>{
 // Pub 590-B Appendix B: 55=31.6, 57=29.8; Justin: $34,800 / 26.5 = $1,313 rounded.
 assert.equal(singleLife(55),31.6);assert.equal(singleLife(57),29.8);assert.equal(singleLife(0),84.6);assert.equal(singleLife(120),1);assert.equal(singleLife(125),1);
 assert.equal(uniformLife(73),26.5);assert.equal(Math.round(34800/26.5),1313);
});
test('P590B reset example retains elapsed years',()=>{
 // Beneficiary age 55 in 2022: 2026 denominator = 31.6 - (2026-2022) = 27.6.
 assert.equal(calc({od:2021,b:1967}).thisYear.divisor,27.6);
});
test('Applicable age including 1949 halves and proposed 1959 rule',()=>{
 // FR2024 -2(b)(2): 70.5 / 72 / 73 / 75 by birth cohort.
 for(const [birth,early,age] of [[1948,'no',70.5],[1949,'yes',70.5],[1949,'no',72],[1950,'no',72],[1951,'no',73],[1958,'no',73],[1959,'no',73],[1960,'no',75]])assert.equal(applicableAge(birth,early),age);
});
test('RBD year triggers a question; uncertainty never produces a guessed amount',()=>{
 // Born 1950 -> 72 in 2022 -> RBD April 1, 2023.
 const a={...example,ob:1950};assert.equal(rbdInfo(a).status,'tie');assert.ok(followups(a).includes('rbd'));
 assert.equal(calc({ob:1950}).rule,'unsupported');assert.equal(calc({ob:1950,rbd:'unsure'}).rule,'unsupported');
 assert.equal(calc({ob:1950,rbd:'yes'}).rule,'ten-year-no-annual');assert.equal(calc({ob:1950,rbd:'no'}).rule,'ten-year-annual');
 // Early 1949 -> RBD 2020, late 1949 -> 2022. Death 2021 changes the answer.
 assert.equal(calc({ob:1949,od:2021,early:'unsure'}).rule,'unsupported');
 assert.equal(calc({ob:1949,od:2024,early:'unsure'}).rule,'ten-year-annual');
 // 1948 birthday half unknown -> RBD 2019 or 2020: don't assume April 2020 is the only RBD.
 assert.equal(calc({ob:1948,od:2020,rbd:'yes'}).rule,'unsupported');assert.equal(calc({ob:1948,od:2020,rbd:'no'}).rule,'ten-year-annual');
 assert.equal(rbdInfo({...a,t:'roth'}).status,'before');assert.ok(!followups({...a,t:'roth'}).includes('rbd'));
});
test('Approved example: annual rule, longer divisor, amount, deadline',()=>{
 // F=2024; beneficiary 53: 33.4-2=31.4. Owner 79:11.9-3=8.9. 412600/31.4=13140.127...
 const r=calc();assert.equal(r.rule,'ten-year-annual');assert.equal(r.thisYear.divisor,31.4);assert.equal(r.thisYear.amount.toFixed(2),'13140.13');assert.equal(r.emptyBy,2033);assert.equal(r.deadline,'2026-12-31');
 assert.equal(r.schedule.find(x=>x.year===2033).divisor,1);assert.ok(r.sources.some(x=>x.title.includes('final regulations')));
});
test('2021 death: relief years, 2025 start, no divisor reset',()=>{
 // F=2022; age 51=35.3. In 2025:35.3-3=32.3; in 2026:31.3.
 const r=calc({od:2021});for(const y of [2022,2023,2024]){const row=r.schedule.find(x=>x.year===y);assert.equal(row.status,'not required (IRS relief)');assert.equal(row.required,false);assert.equal(row.amount,0);}
 assert.equal(r.schedule.find(x=>x.year===2025).divisor,32.3);assert.equal(r.thisYear.divisor,31.3);assert.equal(r.sources.length,5);
 const past=calculate({...example,od:2021},{today:new Date('2024-06-01')});assert.equal(past.thisYear.required,false);
});
test('Before RBD and Roth: zero annually, everything in final year',()=>{
 // Owner born 1960 -> age75 in2035. Death2024 beforeRBD. Empty2034; annual2026=0.
 for(const c of [{ob:1960,od:2024},{t:'roth'}]){const r=calc(c);assert.equal(r.rule,'ten-year-no-annual');assert.equal(r.thisYear.amount,0);assert.equal(r.thisYear.required,false);}
 const final=calc({ob:1960,od:2024},2034);assert.equal(final.thisYear.amount,412600);assert.equal(final.thisYear.divisor,1);
});
test('EDB within ten years compares both life expectancies',()=>{
 // Owner1950 died2024 age74=15.6; owner2026=13.6. Benef1955 age70in2025=18.8 ->17.8. Longer17.8.
 const r=calc({r:'other',ob:1950,od:2024,b:1955});assert.equal(r.rule,'edb-life-expectancy');assert.equal(r.thisYear.divisor,17.8);assert.equal(r.emptyBy,null);
 // Older beneficiary: beneficiary age91in2025=5.3-1=4.3, ownerage74=15.6-2=13.6 -> owner13.6.
 assert.equal(calc({r:'other',ob:1950,od:2024,b:1934}).thisYear.divisor,13.6);
});
test('Minor child: yearly payments continue after majority, empty in 2041',()=>{
 // Child2010: F2024 age14=70.9; 2026=68.9. Turns21in2031 -> empty2031+10=2041.
 const r=calc({ob:1975,b:2010});assert.equal(r.rule,'minor-child');assert.equal(r.thisYear.divisor,68.9);assert.equal(r.emptyBy,2041);assert.equal(r.schedule.find(x=>x.year===2032).divisor,62.9);assert.equal(r.schedule.at(-1).divisor,1);
 // Grandchildren/others age13 are not minor-child EDBs.
 assert.equal(calc({r:'other',ob:1975,b:2010}).rule,'ten-year-no-annual');
});
test('Spouse: own IRA and inherited IRA after RBD',()=>{
 // Owner1944 death2023. Spouse1953 age73in2026: own Uniform26.5; inherited TableI73=16.4 vs owner8.9 ->16.4.
 const r=calc({r:'spouse',b:1953,bal:34800});assert.equal(r.rule,'spouse');assert.equal(r.options[0].thisYear.divisor,26.5);assert.equal(Math.round(r.options[0].thisYear.amount),1313);assert.equal(r.options[0].deadline,'2027-04-01');assert.equal(r.options[1].thisYear.divisor,16.4);assert.equal(r.options[1].deadline,'2026-12-31');
 // Spouse is much older: owner longer denominator used for inherited option.
 assert.equal(calc({r:'spouse',b:1920}).thisYear.divisor,8.9);
});
test('Spouse before RBD can defer; own IRA uses beneficiary age',()=>{
 // Owner1960 -> would reach75in2035. Spouse1962 -> reaches75in2037; inherited first2035, own first2037.
 const r=calc({r:'spouse',ob:1960,od:2024,b:1962});assert.equal(r.firstYear,2035);assert.equal(r.options[0].firstYear,2037);assert.equal(r.thisYear.amount,0);assert.equal(r.schedule.find(x=>x.year===2035).divisor,16.4);
 // P590B Example1 spouse born1957, dies2022 -> would reach73in2030.
 assert.equal(calc({r:'spouse',ob:1957,od:2022,b:1960}).firstYear,2030);
});
test('Spouse Roth: own exempt for life, inherited yearly when deferral ends',()=>{
 // Owner1944 hypothetical RMD age reached before death, inherited firstD+1=2024, spouse1953 age73 divisor16.4.
 const r=calc({r:'spouse',t:'roth',b:1953});assert.equal(r.options[0].thisYear.required,false);assert.match(r.options[0].deadline,/while you're alive/);assert.equal(r.options[1].thisYear.divisor,16.4);
});
test('Death this year: no beneficiary minimum; unfinished owner RMD note',()=>{
 // F=2027, so no 2026 beneficiary RMD. Owner already pastRBD -> remaining death-year RMD still due.
 for(const c of [{od:2026},{r:'spouse',od:2026,b:1953}]){const r=calc(c);assert.equal(r.thisYear.amount,0);assert.equal(r.thisYear.required,false);assert.equal(r.schedule[0].year,2027);assert.match(r.notes.join(' '),/hadn't taken their 2026 RMD/);}
 assert.ok(!calc({t:'roth',od:2026}).notes.join(' ').includes("hadn't taken"));
});
test('Unsupported old deaths and trusts; no fabricated amount',()=>{
 // Scope:2020+ individual beneficiaries only.
 for(const c of [{od:2019},{r:'trust'}]){const r=calc(c);assert.equal(r.rule,'unsupported');assert.equal(r.thisYear.amount,null);assert.deepEqual(r.schedule,[]);assert.ok(r.sources.length);}
});
test('Exact ten-year gap asks follow-up, avoids uncertainty, accepts older beneficiary',()=>{
 // 1960-1950=10 needs birthday check; yesEDB, no10year; 1940-1950=-10EDB.
 const a={...example,r:'other',ob:1950,od:2024,b:1960};assert.ok(followups(a).includes('gap'));
 assert.equal(calc({...a,gap:'yes'}).rule,'edb-life-expectancy');assert.equal(calc({...a,gap:'no'}).rule,'ten-year-annual');assert.equal(calc({...a,gap:'unsure'}).rule,'unsupported');assert.equal(calc({...a,b:1940}).rule,'edb-life-expectancy');
});
test('Divisor <=1 means entire balance; skip yields percentage-ready divisor',()=>{
 // 1900 beneficiary age124atF ->TableI120+=1; elapsed2 -> <=1 -> full balance.
 const r=calc({r:'other',t:'roth',b:1900});assert.equal(r.thisYear.divisor,1);assert.equal(r.thisYear.amount,412600);
 const skip=calc({bal:null});assert.equal(skip.thisYear.amount,null);assert.equal(skip.thisYear.divisor,31.4);assert.equal(skip.schedule.find(x=>x.year===2026).startBalance,null);
});
test('Invalid balances and years never yield NaN; zero and blank',()=>{
 // Negative, Infinity and >1trillion reject; blank means skipped. Zero is an actual balance.
 for(const bal of [-1,'-2','Infinity','1e9',1e15,'abc']){const r=calc({bal});assert.equal(r.rule,'unsupported');assert.equal(r.thisYear.amount,null);}
 assert.equal(parseBalance(''),null);assert.equal(calc({bal:''}).thisYear.amount,null);assert.equal(calc({bal:0}).thisYear.amount,0);assert.equal(parseBalance('1,234.50'),1234.5);
 for(const x of [{b:2030},{ob:2050},{od:'abc'},{b:''}])assert.equal(calc(x).rule,'unsupported');
});
test('Workplace and assumptions notes stay within three; sources on every supported branch',()=>{
 // Plan with old owner: both stricter plan and still-employed warnings; shared assumption always.
 const r=calc({t:'plan'});assert.match(r.notes.join(' '),/still working/);assert.match(r.notes.join(' '),/stricter/);assert.ok(r.notes.length<=3);
 for(const c of [{},{t:'roth'},{r:'spouse',b:1953},{ob:1975,b:2010},{ob:1950,od:2024,b:1955}]){const r=calc(c);assert.ok(r.sources.every(s=>s.url.startsWith('https://')));assert.ok(r.notes.length<=3);assert.match(r.notes.join(' '),/separate inherited accounts/);}
});
