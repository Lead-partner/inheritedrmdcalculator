import {readFileSync} from 'node:fs';
const singleLife=JSON.parse(readFileSync(new URL('../data/irs-tables.json',import.meta.url),'utf8')).rmd_single_life;
const singleLifeRows=Object.entries(singleLife).map(([age,divisor])=>`<tr><th scope="row">${age==='120'?'120+':age}</th><td>${divisor.toFixed(1)}</td></tr>`).join('');
// Build-time content only. Evidence IDs map to verbatim primary-source passages
// in sources-ref/article-evidence.json; no article JavaScript is shipped.
export const checked='14 Nov 2026';
export const published='2026-11-14';
export const references={
 pub:{name:'IRS Publication 590-B (2025)',url:'https://www.irs.gov/publications/p590b',file:'p590b.txt'},
 regs:{name:'Treasury final regulations, T.D. 10001',url:'https://www.govinfo.gov/content/pkg/FR-2024-07-19/html/2024-14542.htm',file:'fr.txt'},
 beneficiary:{name:'IRS Retirement topics — Beneficiary',url:'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-beneficiary',file:'benef.txt'},
 faq:{name:'IRS required minimum distribution FAQs',url:'https://www.irs.gov/retirement-plans/retirement-plan-and-ira-required-minimum-distributions-faqs',file:'rmdfaq.txt'},
 n22:{name:'IRS Notice 2022-53',url:'https://www.irs.gov/pub/irs-drop/n-22-53.pdf',file:'n2022-53.txt'},
 n23:{name:'IRS Notice 2023-54',url:'https://www.irs.gov/pub/irs-drop/n-23-54.pdf',file:'n2023-54.txt'},
 n24:{name:'IRS Notice 2024-35',url:'https://www.irs.gov/pub/irs-drop/n-24-35.pdf',file:'n2024-35.txt'},
 pension:{name:'IRS Publication 575 (2025)',url:'https://www.irs.gov/publications/p575',file:'p575.txt'},
 penalty:{name:'IRS Instructions for Form 5329 (2025)',url:'https://www.irs.gov/instructions/i5329',file:'i5329.txt'}
};
const cite=(...ids)=>` <span class="citation">(${ids.map(id=>`<a href="${references[id].url}">${id==='pub'?'Pub. 590-B':id==='regs'?'T.D. 10001':id==='penalty'?'Form 5329 instructions':references[id].name.replace('IRS ','')}</a>`).join('; ')})</span>`;
const fact=(id,text,...refs)=>`<p data-evidence="${id}">${text}${cite(...refs)}</p>`;
const prefill=(query,text)=>`<p><a class="prefill" href="/?${query.replaceAll('&','&amp;')}">${text}</a></p>`;

export const guides=[{
 slug:'inherited-ira-rules',
 title:'Inherited IRA rules: beneficiaries, RMDs and deadlines',
 h1:'Inherited IRA rules',
 description:'Inherited IRA rules for eligible beneficiaries, spouses, trusts and missed RMD penalties, with links to withdrawal deadlines and Roth IRA rules.',
 summary:'The 10-year rule, eligible beneficiaries, spouse options and yearly withdrawal requirements.',
 prefill:{r:'parent',t:'ira'},
 sources:['pub','regs','beneficiary','n22','n23','n24','penalty'],
 intro:fact('rules-intro','For deaths in 2020 or later, most individual beneficiaries must empty an inherited IRA within 10 years. Eligible designated beneficiaries can generally stretch withdrawals over life expectancy. Surviving spouses can generally keep a beneficiary IRA or treat it as their own, subject to the spouse rules.','pub','regs'),
 body:`
 <section><h2>Who follows the 10-year rule?</h2>
 ${fact('ten-year','Most individual beneficiaries who are not eligible designated beneficiaries must empty the account by December 31 of the tenth year after death. Annual RMDs can also apply.','pub','regs')}
 <p>See the <a href="/guides/inherited-ira-10-year-rule/">inherited IRA 10-year rule guide</a> for the deadline table, annual withdrawals and IRS relief.</p>
 </section>
 <section><h2>Who can use life-expectancy payments?</h2>
 ${fact('edb','The five eligible designated beneficiary categories, determined at the owner’s death, are:','pub','regs')}
 <ul data-evidence="edb"><li>The owner’s surviving spouse.</li><li>The owner’s child under age 21.</li><li>A disabled individual under the IRS definition.</li><li>A chronically ill individual under the IRS definition.</li><li>An individual not more than 10 years younger than the owner.</li></ul>
 ${fact('minor','The minor-child exception is for the owner’s child; being a grandchild under 21 does not qualify on its own. Life-expectancy payments generally continue after the child turns 21, but the account must be emptied by December 31 of the tenth year after that birthday.','pub','regs')}
 <p>The <a href="/guides/single-life-expectancy-table/">Single Life Expectancy Table guide</a> explains the divisor used for beneficiary payments. Eligibility and the withdrawal amount are separate questions; a table factor alone does not establish permission to use life-expectancy payments.</p>
 <p>The calculator does not determine disability or chronic-illness eligibility; check those cases with a tax professional.</p>
 ${prefill('r=other&t=ira','Continue with another individual beneficiary')}
 </section>
 <section><h2>What can a surviving spouse do?</h2>
 ${fact('spouse','A spouse can generally remain a beneficiary or roll the IRA into their own IRA. Designating themselves as the IRA owner requires being the sole beneficiary with an unlimited right to withdraw; the withdrawal schedule depends on the option selected.','pub')}
 ${prefill('r=spouse&t=ira','Compare the spouse options')}
 </section>
 <section><h2>Inherited Roth IRA rules</h2>
 ${fact('roth-rule','A Roth IRA is treated as if the owner died before the required beginning date: a 10-year-rule beneficiary has no yearly RMD before the final year.','pub')}
 <p>See <a href="/guides/inherited-roth-ira-rules/">inherited Roth IRA distribution rules</a> for the deadline, spouse options and five-year tax test.</p>
 </section>
 <section><h2>Missed RMDs and the penalty</h2>
 ${fact('penalty','Under SECURE 2.0, the excise tax is generally 25% of the RMD shortfall, reduced to 10% when the shortfall is distributed and a return reflecting the tax is filed within the correction window. The IRS can waive some or all of the tax for reasonable error when reasonable corrective steps are being taken; a request uses Form 5329 with an explanation.','n24','penalty')}
 <details><summary>How long is the correction window?</summary>
 ${fact('window','It ends at the earliest of a mailed deficiency notice, assessment of the tax, or the last day of the second taxable year beginning after the year the tax is imposed. A waiver is subject to IRS review.','penalty')}
 </details>
 ${prefill('r=parent&t=ira','Check the withdrawal rule and deadline')}
 </section>
 <section><h2>Inherited workplace plans</h2>
 <p>If the account came from an employer, read the <a href="/guides/inherited-401k-rules/">inherited 401(k) rules guide</a> before discussing a transfer with the administrator. Use the plan’s distribution options alongside the general beneficiary rules.</p>
 </section>
 <section><h2>Trusts and estates</h2>
 ${fact('trust','Trust and estate beneficiary rules differ from the individual-beneficiary rules; certain trusts can qualify for look-through treatment. The calculator does not cover trusts or estates; see the custodian or a tax professional.','pub')}
 ${prefill('r=trust&t=ira','Open the calculator’s trust and estate notice')}
 </section>`
},{
 slug:'what-is-an-inherited-ira',
 title:'What is an inherited IRA? A beneficiary’s first steps',
 h1:'What is an inherited IRA?',
 description:'An inherited IRA is an account received after an IRA owner dies. Learn about beneficiary account titles, transfers, taxes and the first steps.',
 summary:'What a beneficiary IRA is, how it is held, transfer limits, taxes and the information to gather first.',
 prefill:{r:'parent',t:'ira'},
 sources:['pub','beneficiary','faq'],
 intro:fact('definition','An inherited IRA, also called a beneficiary IRA, is an individual retirement arrangement received after its owner dies. The beneficiary is the person or entity entitled to receive the account’s benefits. Both traditional and Roth IRAs can be inherited; the beneficiary’s relationship to the owner affects how the account is handled.','pub','beneficiary'),
 body:`
 <section><h2>How is a beneficiary IRA opened and titled?</h2>
 ${fact('title','For a non-spouse beneficiary transferring an inherited IRA, the receiving account must be set up and maintained in the deceased owner’s name for the beneficiary’s benefit. The beneficiary cannot simply treat the inherited IRA as their own IRA.','pub')}
 <p>The account custodian handles the beneficiary account paperwork. A useful starting point is a request to confirm the beneficiary designation, the account title and the documents needed to establish the inherited account.</p>
 <p>The distinction between the deceased owner and the beneficiary matters when discussing a transfer. Keeping both names visible in the account information makes that distinction clear.</p>
 </section>
 <section><h2>Can money be added or moved?</h2>
 ${fact('transfer','A non-spouse beneficiary cannot contribute to the inherited IRA or use a 60-day rollover into or out of it. Assets can move through a trustee-to-trustee transfer into a properly titled inherited IRA, with the receiving custodian keeping the deceased owner’s identity attached to the account.','pub')}
 <p>A transfer request can be discussed with the receiving and current custodians before any money is paid out. “Transfer” and “withdrawal” describe different actions; specifying the intended action helps the custodian identify the relevant paperwork.</p>
 ${fact('spouse-short','Surviving spouses have additional options, including generally keeping an inherited IRA or treating the IRA as their own.','pub')}
 </section>
 <section><h2>How are distributions taxed?</h2>
 ${fact('traditional-tax','Traditional IRA distributions are generally taxable income to the beneficiary. If the deceased owner made nondeductible contributions, the account’s basis remains with the IRA, so a distribution may be partly nontaxable.','pub')}
 ${fact('roth-tax','Inherited Roth IRA contributions can generally be withdrawn tax free. Earnings are also tax free when the distribution is qualified; earnings may be taxable if the owner’s five-tax-year holding period has not been met.','pub','beneficiary')}
 <p>The calculator estimates required withdrawals, not the income tax on a distribution. Records of nondeductible contributions and the Roth IRA’s starting tax year are useful topics for the custodian or tax professional.</p>
 </section>
 <section><h2>First steps: gather the account information</h2>
 <p>This checklist prepares the information used by the calculator and the questions to discuss with the custodian:</p>
 <ol class="checklist">
 <li><strong>Find the beneficiary form.</strong> Locate the designation or ask the custodian to confirm who is listed.</li>
 <li><strong>Find the December 31 balance.</strong> Use the prior year-end statement for the account being calculated.</li>
 <li><strong>Record the owner’s birth and death years.</strong> Also have the beneficiary’s birth year available for the calculator.</li>
 <li><strong>Contact the custodian.</strong> Ask about account opening, transfer forms, beneficiary withdrawal options and the account’s records.</li>
 </ol>
 ${fact('checklist','The IRS bases beneficiary distribution requirements on factors including the owner’s death date, the beneficiary’s relationship and whether death occurred before the required beginning date. A yearly RMD is generally calculated from the prior December 31 balance and an IRS life-expectancy factor.','beneficiary','faq')}
 </section>
 <section><h2>When does the inherited account need to be emptied?</h2>
 ${fact('rules-short','For deaths from 2020, most individual beneficiaries face a 10-year deadline; eligible beneficiaries and spouses have exceptions. Annual withdrawals may also apply.','pub')}
 <p>The <a href="/guides/inherited-ira-rules/">inherited IRA rules guide</a> explains beneficiary categories. See the <a href="/guides/inherited-ira-10-year-rule/">10-year rule deadline guide</a> for the final withdrawal year, or <a href="/guides/inherited-roth-ira-rules/">inherited Roth IRA distribution rules</a> for Roth taxes and withdrawals.</p>
 <p>For annual calculations, see the <a href="/guides/single-life-expectancy-table/">Single Life Expectancy Table</a>. For an employer account, start with <a href="/guides/inherited-401k-rules/">inherited 401(k) rules</a>.</p>
 </section>
 <details><summary>Does the calculator cover every inherited account?</summary>
 <p>It covers individual beneficiaries for deaths in 2020 and later. It does not determine trust, estate, disability or chronic-illness eligibility; those cases need review with the custodian or a tax professional.</p>
 <p>The <a href="/how-we-calculate/">calculation method and sources</a> explain its scope and assumptions.</p>
 </details>`
},{
 slug:'inherited-roth-ira-rules',
 title:'Inherited Roth IRA distribution rules: RMDs and taxes',
 h1:'Inherited Roth IRA distribution rules',
 description:'Inherited Roth IRA rules for the 10-year deadline, annual RMDs, eligible beneficiaries, spouse options and the five-year tax rule.',
 summary:'Roth withdrawal deadlines, spouse choices and when inherited earnings are tax free.',
 prefill:{r:'parent',t:'roth'},
 prefillLabel:'Open the calculator with a parent’s Roth IRA pre-filled',
 sources:['pub','regs','beneficiary'],
 intro:fact('roth-intro','An inherited Roth IRA is treated as if its owner died before the required beginning date. For deaths from 2020, most non-spouse individual beneficiaries must empty it by year 10, with no annual RMD before then. Eligible beneficiaries may use life expectancy; spouses have additional options.','pub','regs'),
 body:`
 <section><h2>The 10-year deadline still applies</h2>
 ${fact('roth-deadline','For a designated beneficiary who is not eligible for an exception, the account must be emptied by December 31 of the year containing the tenth anniversary of death. The year after death is year one; the owner’s death year is not year one.','pub')}
 ${fact('roth-rule','There is no yearly inherited Roth IRA RMD in years one through nine for a beneficiary under the 10-year rule. A tax-free account still has a distribution deadline, and everything remaining must come out in the final year.','pub')}
 <p>The <a href="/guides/inherited-ira-10-year-rule/">10-year rule guide</a> shows deadlines by death year and explains why traditional IRAs can have a different annual withdrawal requirement.</p>
 ${prefill('r=parent&t=roth','Check a parent’s inherited Roth IRA')}
 </section>
 <section><h2>Eligible beneficiaries can use life expectancy</h2>
 ${fact('roth-edb','An eligible designated beneficiary can generally receive payments over life expectancy instead. The categories include a surviving spouse, the owner’s child under 21, a disabled or chronically ill individual under IRS definitions, and someone not more than 10 years younger than the owner.','pub','regs')}
 ${fact('roth-edb-timing','Life-expectancy payments generally begin by December 31 of the year after death, with a special starting rule for a sole surviving spouse. For the owner’s minor child, the account generally must be emptied by the tenth year after turning 21.','pub','regs')}
 <p>The <a href="/guides/inherited-ira-rules/">beneficiary rules hub</a> explains those exceptions, including why being a minor grandchild does not itself qualify.</p>
 </section>
 <section><h2>A spouse can treat the Roth IRA as their own</h2>
 ${fact('roth-spouse','A sole surviving spouse can keep the account inherited or elect to treat the Roth IRA as their own. A Roth IRA owner has no lifetime required minimum distributions, so treating it as their own changes the withdrawal rules.','pub')}
 <p>Keeping beneficiary status and taking ownership are different choices. Confirm the account title and available spouse options with the custodian before requesting a distribution.</p>
 ${prefill('r=spouse&t=roth','Compare spouse options for a Roth IRA')}
 </section>
 <section><h2>Inherited Roth IRA taxes and the five-year rule</h2>
 ${fact('roth-tax','Withdrawals of regular contributions are tax free. Earnings are also tax free when the distribution is qualified; inherited earnings may be taxable if the owner’s five-tax-year holding period has not been satisfied.','pub','beneficiary')}
 ${fact('roth-five','For a qualified distribution after death, the five-tax-year period begins with the first tax year for which a contribution was made to a Roth IRA for the owner. Death satisfies the qualifying-event condition, but it does not remove the holding-period requirement.','pub')}
 <p>Ask the custodian for records of the owner’s first Roth contribution tax year and the account’s contribution and earnings history. The withdrawal deadline and the tax test answer separate questions; the calculator estimates the withdrawal rule, not the tax due.</p>
 </section>
 <details><summary>Does the beneficiary pay the 10% early-distribution tax?</summary>
 ${fact('roth-early','Distributions to a beneficiary because of the IRA owner’s death are exempt from the 10% additional tax on early distributions. That exemption does not make otherwise taxable earnings tax free.','pub')}
 </details>`
},{
 slug:'single-life-expectancy-table',
 title:'Single Life Expectancy Table: IRS beneficiary RMD factors',
 h1:'Single Life Expectancy Table',
 description:'Full IRS Single Life Expectancy Table I for inherited IRA RMDs, with beneficiary divisor steps, spouse rules and a hypothetical calculation.',
 summary:'Full IRS Table I, how to find a beneficiary divisor and a hypothetical RMD example.',
 prefill:{r:'other',t:'ira'},
 prefillLabel:'Open the calculator for another IRA beneficiary',
 sources:['pub','regs'],
 intro:fact('table-intro','The IRS Single Life Expectancy Table supplies age-based divisors for beneficiary RMD calculations. Use it when annual life-expectancy withdrawals apply, not to decide whether a beneficiary qualifies. A non-spouse generally starts with their age in the year after death, then reduces that divisor by one each year.','pub'),
 body:`
 <section><h2>How a beneficiary uses Table I</h2>
 <ol class="checklist" data-evidence="table-steps">
 <li><strong>Find the first-year age.</strong> For beneficiary life-expectancy payments, use the age reached on the beneficiary’s birthday in the calendar year after the owner’s death, then find that age’s divisor below.</li>
 <li><strong>Divide the balance.</strong> Divide the prior December 31 account balance by the applicable divisor to calculate that year’s RMD.</li>
 <li><strong>Update the divisor.</strong> A non-spouse generally subtracts one for each subsequent year; a surviving spouse using Table I looks up their age again each year rather than subtracting one.</li>
 </ol>
 <p>These are the general beneficiary steps. The owner’s death date, the required beginning date and spouse elections can affect the applicable divisor or starting year.${cite('pub','regs')}</p>
 </section>
 <section><h2>Worked example: a hypothetical balance</h2>
 ${fact('table-example',`Assume the owner died before the required beginning date and an eligible non-spouse beneficiary turns 57 in the year after death. With a prior December 31 balance of <strong>$100,000 (example)</strong> and the real age-57 divisor of <strong>${singleLife['57'].toFixed(1)}</strong>, the calculation is $100,000 ÷ ${singleLife['57'].toFixed(1)} = approximately $${(100000/singleLife['57']).toFixed(2)}. The calculator rounds up to $${(Math.ceil(100000/singleLife['57']*100)/100).toFixed(2)} to avoid understating the minimum. The balance is hypothetical; the divisor comes from IRS Table I.`,'pub')}
 ${fact('table-decrement',`For the next year, the non-spouse divisor would generally be ${(singleLife['57']-1).toFixed(1)}, using that next calculation’s prior year-end balance. Looking up age 58 instead would give a different factor and would not follow the non-spouse subtraction method.`,'pub')}
 </section>
 <section><h2>When this inherited IRA RMD table applies</h2>
 ${fact('table-effective','Publication 590-B says the updated life-expectancy tables apply to distribution calendar years beginning on or after January 1, 2022. For payments that began under older tables, the publication describes resetting the initial life expectancy using the new table, then applying the relevant annual reductions.','pub')}
 <p>Start with the <a href="/guides/inherited-ira-rules/">inherited IRA rules hub</a> to identify the beneficiary category. For a beneficiary under the <a href="/guides/inherited-ira-10-year-rule/">10-year rule</a>, a table factor does not replace the final account-emptying deadline.</p>
 ${fact('table-no-annual','If the owner died before the required beginning date and the 10-year rule applies, there is no annual life-expectancy calculation before the final year. Inherited Roth IRAs are treated as though the owner died before that date.','pub')}
 </section>
 <section><h2>Single Life versus Uniform Lifetime</h2>
 ${fact('table-uniform','Table I generally serves beneficiaries; Table III, the Uniform Lifetime Table, generally serves owners taking lifetime IRA RMDs. A spouse’s election to treat the IRA as their own can change which table applies.','pub')}
 </section>
 <section><h2>Full IRS Table I</h2>
 <p>Use the age at the birthday in the relevant calendar year. “120+” is the IRS table’s final age category; the figures are life-expectancy divisors, not withdrawal percentages.</p>
 <div class="table-wrap" data-evidence="single-life-table"><table class="guide-table" id="single-life-table"><caption>IRS Publication 590-B, Appendix B, Table I — Single Life Expectancy (for use by beneficiaries)</caption><thead><tr><th scope="col">Age</th><th scope="col">Life expectancy divisor</th></tr></thead><tbody>${singleLifeRows}</tbody></table></div>
 </section>
 <details><summary>What if the owner died on or after the required beginning date?</summary>
 ${fact('table-after','The annual divisor can depend on the longer of the beneficiary’s life expectancy and the owner’s remaining life expectancy. Confirm that comparison, any spouse election and any transition from older tables before using the basic steps above.','pub','regs')}
 </details>`
},{
 slug:'inherited-ira-10-year-rule',
 title:'Inherited IRA 10-year rule: deadlines and annual RMDs',
 h1:'Inherited IRA 10-year rule',
 description:'Who follows the inherited IRA 10-year rule, deadlines for deaths in 2020–2026, annual RMDs, IRS relief for 2021–2024 and beneficiary exceptions.',
 summary:'Count the ten years, check annual RMDs and understand the eligible-beneficiary exceptions.',
 prefill:{r:'parent',t:'ira'},
 sources:['pub','regs','beneficiary','n22','n23','n24'],
 intro:fact('ten-intro','For IRA owners who died in 2020 or later, a designated beneficiary who is not an eligible designated beneficiary generally must empty the inherited IRA by December 31 of the tenth year after death. Annual RMDs also generally apply if the owner died on or after the required beginning date.','pub','regs'),
 body:`
 <section><h2>Who follows the rule?</h2>
 ${fact('ten-scope','The SECURE Act changed the rules for deaths after 2019. An individual designated beneficiary outside the eligible categories generally follows the 10-year rule, whether the owner died before or after the required beginning date.','pub')}
 <p>Do not infer the withdrawal schedule from “inherited IRA” alone. First establish the death year, the named beneficiary and whether an eligible-beneficiary exception applies; trusts and estates need separate review in the <a href="/guides/inherited-ira-rules/">rules hub</a>.</p>
 </section>
 <section><h2>How to count the ten years</h2>
 ${fact('ten-year','Publication 590-B sets the deadline at December 31 of the year containing the tenth anniversary of the owner’s death. The calendar year after death is year one, so add ten to the death year; do not count the death year as year one.','pub')}
 <div class="table-wrap" data-evidence="ten-deadlines"><table class="guide-table"><caption>10-year-rule deadlines by owner’s year of death</caption><thead><tr><th scope="col">Year of death</th><th scope="col">Must be empty by</th></tr></thead><tbody>${Array.from({length:7},(_,i)=>2020+i).map(year=>`<tr><th scope="row">${year}</th><td>December 31, ${year+10}</td></tr>`).join('')}</tbody></table></div>
 <p>The final-year obligation covers everything left in the account. A schedule of annual minimums, when required, does not by itself satisfy that separate full-distribution deadline.${cite('pub','regs')}</p>
 </section>
 <section><h2>Are annual RMDs required during the ten years?</h2>
 ${fact('annual','Generally yes if the owner died on or after the required beginning date: annual RMDs continue in addition to the year-ten deadline. The required beginning date is the date the owner’s first RMD was due, not simply the date they chose to start withdrawing.','regs','beneficiary')}
 ${fact('ten-before','If death occurred before the required beginning date, the 10-year rule does not require annual minimum withdrawals before the final year. An inherited Roth IRA is treated as if the owner died before that date; see the <a href="/guides/inherited-roth-ira-rules/">Roth distribution rules guide</a>.','pub')}
 <p>For annual calculations, the <a href="/guides/single-life-expectancy-table/">Single Life Expectancy Table guide</a> explains beneficiary divisors. The calculator uses the owner’s dates alongside the beneficiary’s information to identify the general rule.</p>
 </section>
 <section><h2>IRS relief covered certain 2021–2024 annual RMDs</h2>
 ${fact('ten-relief','Notice 2022-53 covered specified missed annual distributions for 2021 and 2022, Notice 2023-54 extended relief to 2023, and Notice 2024-35 covered 2024. This was targeted relief for certain beneficiaries, not cancellation of every beneficiary’s RMD.','n22','n23','n24')}
 ${fact('relief','The final regulations apply from 2025, when annual beneficiary RMDs under these rules apply. The earlier relief did not extend the 10-year account-emptying deadline.','regs')}
 </section>
 <section><h2>Exceptions: eligible designated beneficiaries</h2>
 ${fact('ten-edb','Eligible designated beneficiaries include surviving spouses, the owner’s children under 21, disabled or chronically ill individuals under IRS definitions, and individuals not more than ten years younger than the owner. They can generally use life-expectancy payments, subject to the applicable rules.','pub','regs')}
 <p>The <a href="/guides/inherited-ira-rules/">inherited IRA rules guide</a> explains each category, spouse choices and what happens when the owner’s child turns 21. An exception to the ordinary 10-year schedule does not mean there are no withdrawal requirements.</p>
 </section>
 <details><summary>Can an eligible beneficiary choose the 10-year rule?</summary>
 ${fact('ten-election','An eligible designated beneficiary can elect the 10-year rule when the owner died before the required beginning date. Confirm the election and available options with the custodian.','pub')}
 </details>`
},{
 slug:'inherited-401k-rules',
 title:'Inherited 401k rules: deadlines, rollovers and taxes',
 h1:'Inherited 401(k) rules',
 description:'Inherited 401k rules for spouses and other beneficiaries: 10-year deadlines, plan restrictions, direct inherited IRA rollovers and general tax treatment.',
 summary:'Workplace plan withdrawal rules, direct inherited IRA rollovers, spouse options and taxes.',
 prefill:{t:'plan',r:'parent'},
 prefillLabel:'Open the calculator with an inherited workplace plan',
 sources:['beneficiary','faq','regs','pension'],
 intro:fact('plan-intro','Inherited 401(k) accounts generally follow the SECURE Act beneficiary categories and 10-year rule for deaths from 2020. The plan controls available payout options and may be stricter. Non-spouse designated beneficiaries may move eligible amounts directly to an inherited IRA; spouses have broader rollover choices.','faq','beneficiary','pension'),
 body:`
 <section><h2>The beneficiary categories also apply to 401(k)s</h2>
 ${fact('plan-categories','The SECURE Act’s 10-year distribution rule covers defined contribution plans as well as IRAs for deaths after 2019, with delayed effective dates for certain collectively bargained plans. Eligible designated beneficiaries include surviving spouses, the owner’s minor children, disabled or chronically ill individuals, and people not more than ten years younger than the owner.','faq','regs')}
 <p>See the <a href="/guides/inherited-ira-rules/">beneficiary rules hub</a> for those categories. The account being a workplace plan does not by itself establish which beneficiary exception applies.</p>
 ${fact('plan-annual','For a traditional 401(k) beneficiary subject to the 10-year rule, annual RMDs generally apply if the participant died on or after the required beginning date, as well as full payout by year ten. Check the participant’s required beginning date with the administrator.','regs','beneficiary')}
 </section>
 <section><h2>Check the plan: its payout options can be stricter</h2>
 ${fact('plan-options','The plan document establishes the distribution options available to satisfy the RMD rules. A plan can limit the choice between life-expectancy payments and the 10-year rule for eligible beneficiaries, so it may require a faster payout than an otherwise available life-expectancy schedule.','beneficiary','regs')}
 <p>Ask the administrator for the beneficiary distribution options and any election deadlines in writing. The <a href="/guides/inherited-ira-10-year-rule/">10-year rule guide</a> explains the general final deadline; check the plan before assuming that every legally permitted option is offered.</p>
 </section>
 <section><h2>Non-spouse: a direct rollover to an inherited IRA</h2>
 ${fact('plan-transfer','A non-spouse designated beneficiary may be able to roll over eligible plan amounts through a direct trustee-to-trustee transfer to an IRA set up to receive them. The receiving account is treated as an inherited IRA, rather than the beneficiary’s own retirement account.','pension')}
 ${fact('plan-no-60','This non-spouse route requires a direct transfer; it is not a distribution paid to the beneficiary followed by a 60-day rollover. Required minimum distributions cannot be rolled over, so the administrator must distinguish any current RMD from the eligible transfer amount.','pension')}
 <p>Discuss the receiving account title and transfer instructions with both institutions before requesting payment. For the account basics, read <a href="/guides/what-is-an-inherited-ira/">what an inherited IRA is</a>.</p>
 </section>
 <section><h2>Spouse: broader rollover options</h2>
 ${fact('plan-spouse','A surviving spouse may roll eligible distributions into their own IRA or another qualified retirement plan, with the rollover rules generally applying as if they were the employee. Moving untaxed plan money to a Roth IRA can create taxable income.','pension')}
 <p>Ask the administrator to explain the plan’s spouse options alongside the receiving account’s rules. Keeping beneficiary status and rolling into an owned account can produce different withdrawal schedules.</p>
 </section>
 <section><h2>Inherited 401(k) taxes and Roth accounts</h2>
 ${fact('plan-tax','Beneficiaries include taxable distributions in gross income. Pretax plan amounts are generally taxable when paid out; after-tax employee contributions can make part of a payment nontaxable, and a qualifying direct rollover can defer tax rather than create a cash withdrawal.','beneficiary','pension')}
 ${fact('plan-roth','A Roth 401(k) is a designated Roth account, with its own rules. Publication 575 says a distribution to a beneficiary after death is qualified and excluded from income when the five-tax-year participation requirement is met; a nonqualified payment can include taxable earnings.','pension')}
 <p>Confirm the plan’s participation records before applying the tax test. The separate <a href="/guides/inherited-roth-ira-rules/">inherited Roth IRA guide</a> covers IRA rules; use the administrator’s records for a Roth workplace account.</p>
 </section>
 <details><summary>Does a Roth 401(k) escape beneficiary RMD rules?</summary>
 ${fact('plan-roth-rmd','The IRS says designated Roth accounts have no required distributions while the owner is alive, but their beneficiaries remain subject to RMD rules. Confirm the beneficiary payout option with the plan administrator.','faq')}
 </details>`
}];
