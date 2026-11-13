import tables from '../data/irs-tables.json' with { type: 'json' };

export const SOURCES = {
  P590B: {title:'IRS Publication 590-B (2025)',url:'https://www.irs.gov/publications/p590b'},
  FR2024: {title:'2024 final regulations, T.D. 10001',url:'https://www.federalregister.gov/documents/2024/07/19/2024-14542/required-minimum-distributions'},
  N2022: {title:'IRS Notice 2022-53',url:'https://www.irs.gov/pub/irs-drop/n-22-53.pdf'},
  N2023: {title:'IRS Notice 2023-54',url:'https://www.irs.gov/pub/irs-drop/n-23-54.pdf'},
  N2024: {title:'IRS Notice 2024-35',url:'https://www.irs.gov/pub/irs-drop/n-24-35.pdf'},
  BENEFICIARY: {title:'IRS Retirement topics — Beneficiary',url:'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-beneficiary'},
  FAQ: {title:'IRS RMD FAQs',url:'https://www.irs.gov/retirement-plans/retirement-plan-and-ira-required-minimum-distributions-faqs'},
  PROPOSED: {title:'Proposed regulations REG-103529-23 (1959 birth year)',url:'https://www.govinfo.gov/content/pkg/FR-2024-07-19/pdf/2024-14543.pdf'}
};
const yearOf = today => new Date(today).getFullYear();
export const validYear = (x, max) => /^\d{4}$/.test(String(x)) && +x >= 1900 && +x <= max;
export function parseBalance(value) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).replaceAll(',', '');
  return /^\d{1,13}(\.\d{1,2})?$/.test(text) && +text <= 1e12 ? +text : NaN;
}
// P590B Appendix B: Table I caps at age 120+, Table III at 120+.
export const singleLife = age => age >= 0 ? tables.rmd_single_life[Math.min(120, Math.floor(age))] ?? null : null;
export const uniformLife = age => tables.rmd_uniform_lifetime[Math.min(120, Math.floor(age))] ?? null;
// FR2024 §1.401(a)(9)-2(b)(2); 1959 is reserved, proposed REG-103529-23 uses 73.
export function applicableAge(birth, early = 'no') {
  birth = +birth;
  if (birth < 1949 || (birth === 1949 && early === 'yes')) return 70.5;
  if (birth <= 1950) return 72;
  return birth <= 1959 ? 73 : 75;
}
export function attainmentYears(birth, early) {
  birth = +birth;
  if (birth === 1949 && !['yes','no'].includes(early)) return [2019,2021];
  const age = applicableAge(birth, early);
  if (age === 70.5) return birth === 1949 ? [2019] : [birth+70,birth+71];
  return [birth+age];
}
// FR2024 §1.401(a)(9)-2(b): RBD April 1 after applicable-age year.
// P590B, Beneficiaries of a Roth IRA: always treated as death before RBD.
export function rbdInfo(a) {
  if (a.t === 'roth') return {status:'before',years:[]};
  const years = attainmentYears(a.ob,a.early).map(y=>y+1), d=+a.od;
  const statuses = years.map(y => d<y ? 'before' : d>y ? 'after' : a.rbd==='yes' ? 'before' : a.rbd==='no' ? 'after' : 'tie');
  const status = statuses.every(x=>x===statuses[0]) ? statuses[0] : 'uncertain';
  return {status,years,questionYear:years.find(y=>y===d)};
}
// FR2024 §1.401(a)(9)-4(e): only the owner's child qualifies as a minor;
// birthday, rather than birth-year difference alone, settles a 10-year age gap.
export function followups(a) {
  const out=[];
  if(a.t!=='roth' && +a.ob===1949) out.push('early');
  const info=rbdInfo(a);
  if(a.t!=='roth' && info.questionYear && !((+a.ob===1949) && !['yes','no'].includes(a.early))) out.push('rbd');
  if(a.r!=='spouse' && !(a.r==='parent' && +a.od- +a.b<21) && +a.b- +a.ob===10) out.push('gap');
  return out;
}
function unsupported(why, sources=[SOURCES.P590B]) {
  return {rule:'unsupported',why,thisYear:{amount:null,divisor:null,required:false},deadline:'Ask the account custodian or a tax professional.',emptyBy:null,schedule:[],notes:[],sources};
}
const roundDivisor = x=> Math.round(x*10)/10;
// P590B Figuring the Beneficiary's RMD; FR2024 §1.401(a)(9)-5(d)(3).
export function inheritedDivisor(a,t,after) {
  const f=+a.od+1;
  const beneficiary = a.r==='spouse' ? singleLife(t- +a.b) : roundDivisor(singleLife(f- +a.b)-(t-f));
  const owner = roundDivisor(singleLife(+a.od- +a.ob)-(t- +a.od));
  return Math.max(1,after ? Math.max(beneficiary,owner) : beneficiary);
}
export function calculate(a, {today=new Date(), growth=Number(a.g||0)} = {}) {
  const Y=yearOf(today), D=+a.od, OB=+a.ob, BB=+a.b;
  // P590B Trust as beneficiary and pre-2020 rules are outside this tool's scope.
  if(a.r==='trust') return unsupported("A trust or estate follows special rules this tool doesn't cover. Ask the account custodian or a tax professional.");
  if(validYear(a.od,Y) && D<2020) return unsupported('Deaths before 2020 follow the older rules. This tool covers 2020 and later. Ask the account custodian or a tax professional.');
  if(!['parent','spouse','other'].includes(a.r) || !['ira','roth','plan'].includes(a.t) || ![a.ob,a.od,a.b].every(x=>validYear(x,Y)) || OB>D || BB>D) return unsupported('Check the birth and death years. Both people must have been born by the year of death.');
  const balance=parseBalance(a.bal);
  if(Number.isNaN(balance)) return unsupported('Enter a balance from $0 to $1,000,000,000,000, or skip the balance.');
  if(![0,.03,.05,.07].includes(growth)) growth=0;
  const info=rbdInfo(a), after=info.status==='after';
  if(info.status==='tie' || info.status==='uncertain') return unsupported("We can't be sure which rule applies without their required beginning date. Ask the custodian to confirm whether they died before that date.",[SOURCES.P590B,SOURCES.FR2024]);
  const minor=a.r==='parent' && D-BB<21;
  if(a.r!=='spouse' && !minor && BB-OB===10 && !['yes','no'].includes(a.gap)) return unsupported("We can't be sure whether you qualify for life-expectancy payments without the exact birthday gap. Ask the custodian or a tax professional.",[SOURCES.P590B,SOURCES.FR2024]);
  const edb=minor || BB-OB<=9 || (BB-OB===10 && a.gap==='yes');
  // P590B Eligible designated beneficiary, 10-year rule; FR2024 §1.401(a)(9)-5(e)(4).
  const rule=a.r==='spouse'?'spouse':minor?'minor-child':edb?'edb-life-expectancy':after?'ten-year-annual':'ten-year-no-annual';
  const ten=rule.startsWith('ten-year');
  const emptyBy=ten?D+10:minor?BB+31:null;
  const F=D+1;
  const sources=[SOURCES.P590B,SOURCES.FR2024];
  // P590B spouse first distribution year, Example 1 (attainment year, not next April).
  const firstYear=rule==='spouse' && !after ? Math.max(F,...attainmentYears(OB,a.early)) : F;
  const assumptions="Assumes you're the only beneficiary, or separate inherited accounts were set up by Dec 31 of the year after death.";
  const notes=[assumptions];
  if(a.t==='plan') notes.push("Workplace plans can have stricter rules than the law; check the plan's rules."+(D>=Math.min(...attainmentYears(OB,a.early))?" If they were still working for this employer, their required beginning date may have been later — the plan can confirm.":''));
  if(ten) notes.push("If you're disabled or chronically ill under IRS definitions, you may qualify for longer payouts — ask a tax professional.");
  else if(rule!=='spouse' && !after) notes.push('You may be able to choose the 10-year rule instead; most plans default to yearly payouts — ask the custodian.');
  if(minor) notes.push('Yearly payments continue after age 21; the account must be emptied ten years after you turn 21.');
  if((OB===1959 && (Y>=2032 || rule==='spouse')) || (rule==='spouse' && BB===1959)) {
    notes.push('The age-73 starting age for people born in 1959 is based on proposed regulations.');
    sources.push(SOURCES.PROPOSED);
  }
  if(D===Y && after) notes.push(`If they hadn't taken their ${Y} RMD yet, it still has to come out by Dec 31, ${Y} — ask the custodian for the amount.`);
  // Notices 2022-53 IV, 2023-54 III, 2024-35 III–IV: specified RMD relief,
  // 2021–2024 only; divisor still decreases from F, never resets in 2025.
  const relief = t=>rule==='ten-year-annual' && t>=F && t<=2024 && t>=2021 && D<=2023;
  if(rule==='ten-year-annual' && D<=2023) sources.push(SOURCES.N2022,SOURCES.N2023,SOURCES.N2024);
  function requirement(t, bal) {
    if(t<=D || t<firstYear || relief(t)) return {required:false,amount:0,divisor:null};
    if(emptyBy && t>=emptyBy) return {required:true,amount:bal,divisor:1};
    if(rule==='ten-year-no-annual') return {required:false,amount:0,divisor:null};
    const divisor=inheritedDivisor(a,t,after);
    return {required:true,amount:bal===null?null:bal/divisor,divisor};
  }
  let thisYear=requirement(Y,balance);
  let why = rule==='spouse'?'As the surviving spouse, you can use your own IRA rules or keep the account inherited.':minor?"You were the owner's child and under 21 when they died, so life-expectancy payments apply first.":edb?'You are not more than 10 years younger than the owner, so life-expectancy payments apply.':after?'The owner died after their required beginning date, so yearly withdrawals and the 10-year deadline both apply.':a.t==='roth'?'An inherited Roth IRA follows the 10-year rule, with no yearly minimum before the final year.':'The owner died before their required beginning date, so no yearly minimum applies before the final year.';
  if(D===Y) why=`No withdrawal is required from you in ${Y}. ${why}`;
  let deadline=thisYear.required?`${Y}-12-31`:`No beneficiary withdrawal required in ${Y}.`;
  if(emptyBy && Y>emptyBy) {why=`The account's empty-by deadline was Dec 31, ${emptyBy}. Ask a tax professional about any remaining balance and missed withdrawals.`;deadline=`${emptyBy}-12-31`;}
  // Only current/future balances are projected. Historical balances are unknown.
  const schedule=[];
  let projected=balance;
  const end=emptyBy ?? Math.max(Y,BB+120,D+Math.ceil(singleLife(D-OB)));
  if(D===Y && projected!==null) projected*=1+growth;
  for(let t=F;t<=end;t++) {
    const row=requirement(t,t<Y?null:projected);
    schedule.push({year:t,age:t-BB,startBalance:t<Y?null:projected,...row,status:relief(t)?'not required (IRS relief)':emptyBy && t===emptyBy?'Entire balance':row.required?'Yearly minimum':'Not required'});
    if(t>=Y && projected!==null) projected=Math.max(0,(projected-(row.amount||0))*(1+growth));
    if(t>=Y && row.divisor===1 && !emptyBy) break;
  }
  const result={rule,why,thisYear,deadline,emptyBy,schedule,notes:notes.length<=3?notes:[notes[0],notes[1],notes.slice(2).join(' ')],sources,firstYear,ownerRbd:info.status,year:Y,balance};
  if(rule==='spouse') {
    // P590B Treating it as your own; IRS Beneficiary: rollover; Table III.
    // P590B Additional tax exceptions: beneficiary withdrawals exempt, own IRA not.
    sources.push(SOURCES.BENEFICIARY);
    const start=Math.max(...attainmentYears(BB,a.bearly)), ownRequired=a.t!=='roth' && Y>=start && D<Y;
    const divisor=ownRequired?uniformLife(Y-BB):null;
    const own={required:ownRequired,divisor,amount:ownRequired?(balance===null?null:balance/divisor):0};
    const firstDeadline=Y===start?`${Y+1}-04-01`:`${Y}-12-31`;
    result.options=[
      {title:'Treat it as your own IRA',thisYear:own,firstYear:start,deadline:ownRequired?firstDeadline:a.t==='roth'?"No required withdrawals while you're alive.":`No withdrawal required until ${start}.`,note:'Withdrawals before age 59½ from your own IRA can face the 10% additional tax.'},
      {title:'Keep it as an inherited IRA',thisYear,firstYear,deadline,note:`Inherited-IRA withdrawals are not subject to the 10% additional tax.${Y<firstYear?` First required in ${firstYear}.`:''}`}
    ];
  }
  return result;
}
