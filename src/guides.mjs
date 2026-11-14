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
 penalty:{name:'IRS Instructions for Form 5329 (2025)',url:'https://www.irs.gov/instructions/i5329',file:'i5329.txt'}
};
const cite=(...ids)=>` <span class="citation">(${ids.map(id=>`<a href="${references[id].url}">${id==='pub'?'Pub. 590-B':id==='regs'?'T.D. 10001':id==='penalty'?'Form 5329 instructions':references[id].name.replace('IRS ','')}</a>`).join('; ')})</span>`;
const fact=(id,text,...refs)=>`<p data-evidence="${id}">${text}${cite(...refs)}</p>`;
const prefill=(query,text)=>`<p><a class="prefill" href="/?${query.replaceAll('&','&amp;')}">${text}</a></p>`;

export const guides=[{
 slug:'inherited-ira-rules',
 title:'Inherited IRA rules: beneficiaries, RMDs and deadlines',
 h1:'Inherited IRA rules',
 description:'Who follows the inherited IRA 10-year rule, who can stretch withdrawals, spouse options, inherited Roth IRAs and missed RMD penalties.',
 summary:'The 10-year rule, eligible beneficiaries, spouse options and yearly withdrawal requirements.',
 prefill:{r:'parent',t:'ira'},
 sources:['pub','regs','beneficiary','n22','n23','n24','penalty'],
 intro:fact('rules-intro','For deaths in 2020 or later, most individual beneficiaries must empty an inherited IRA within 10 years. Eligible designated beneficiaries can generally stretch withdrawals over life expectancy. Surviving spouses can generally keep a beneficiary IRA or treat it as their own, subject to the spouse rules.','pub','regs'),
 body:`
 <section><h2>Who follows the 10-year rule?</h2>
 ${fact('ten-year','An individual beneficiary who is not an eligible designated beneficiary must withdraw everything by December 31 of the year containing the tenth anniversary of the owner’s death. That deadline applies whether the owner died before or after their required beginning date.','pub')}
 ${prefill('r=parent&t=ira','Continue with a parent’s traditional IRA')}
 </section>
 <section><h2>Who can use life-expectancy payments?</h2>
 ${fact('edb','The five eligible designated beneficiary categories, determined at the owner’s death, are:','pub','regs')}
 <ul data-evidence="edb"><li>The owner’s surviving spouse.</li><li>The owner’s child under age 21.</li><li>A disabled individual under the IRS definition.</li><li>A chronically ill individual under the IRS definition.</li><li>An individual not more than 10 years younger than the owner.</li></ul>
 ${fact('minor','The minor-child exception is for the owner’s child; being a grandchild under 21 does not qualify on its own. Life-expectancy payments generally continue after the child turns 21, but the account must be emptied by December 31 of the tenth year after that birthday.','pub','regs')}
 <p>The calculator does not determine disability or chronic-illness eligibility; check those cases with a tax professional.</p>
 ${prefill('r=other&t=ira','Continue with another individual beneficiary')}
 </section>
 <section><h2>What can a surviving spouse do?</h2>
 ${fact('spouse','A spouse can generally remain a beneficiary or roll the IRA into their own IRA. Designating themselves as the IRA owner requires being the sole beneficiary with an unlimited right to withdraw; the withdrawal schedule depends on the option selected.','pub')}
 ${prefill('r=spouse&t=ira','Compare the spouse options')}
 </section>
 <section><h2>Inherited Roth IRA rules</h2>
 ${fact('roth-rule','An inherited Roth IRA is treated as though the owner died before the required beginning date. For a beneficiary subject to the 10-year rule, there is no yearly minimum before the final year, but the account must still be emptied by the deadline.','pub')}
 ${prefill('r=parent&t=roth','Continue with a parent’s Roth IRA')}
 </section>
 <section><h2>Are yearly RMDs required within the 10 years?</h2>
 ${fact('annual','Yes, generally, if the owner died on or after the required beginning date: T.D. 10001 requires annual RMDs as well as full distribution by year 10. The required beginning date is the date the owner’s first RMD was due.','regs','beneficiary')}
 ${fact('relief','Notices 2022-53, 2023-54 and 2024-35 provided relief for certain missed annual beneficiary RMDs in 2021–2024. Annual RMDs apply from 2025 under the final regulations; the relief did not extend the 10-year deadline.','regs')}
 ${prefill('r=parent&t=ira','Check the owner’s dates in the calculator')}
 <div class="table-wrap" data-evidence="rule-table"><table class="guide-table"><caption>Individual beneficiaries: general rules for deaths from 2020</caption><thead><tr><th scope="col">Beneficiary type</th><th scope="col">Rule</th><th scope="col">Yearly RMD?</th><th scope="col">Deadline</th></tr></thead><tbody>
 <tr><th scope="row">Individual, not eligible</th><td>10 years</td><td>Yes after the owner’s required beginning date; otherwise none before final year</td><td>Dec 31, tenth year after death</td></tr>
 <tr><th scope="row">Eligible individual, other than spouse or child</th><td>Life expectancy</td><td>Generally yes</td><td>Generally begin Dec 31, year after death</td></tr>
 <tr><th scope="row">Owner’s child under 21</th><td>Life expectancy, then 10 years</td><td>Generally yes</td><td>Empty by Dec 31, tenth year after turning 21</td></tr>
 <tr><th scope="row">Sole surviving spouse</th><td>Own IRA or beneficiary IRA</td><td>Depends on choice</td><td>Depends on choice and owner’s dates</td></tr>
 </tbody></table></div>
 </section>
 <section><h2>Missed RMDs and the penalty</h2>
 ${fact('penalty','Under SECURE 2.0, the excise tax is generally 25% of the RMD shortfall, reduced to 10% when the shortfall is distributed and a return reflecting the tax is filed within the correction window. The IRS can waive some or all of the tax for reasonable error when reasonable corrective steps are being taken; a request uses Form 5329 with an explanation.','n24','penalty')}
 <details><summary>How long is the correction window?</summary>
 ${fact('window','It ends at the earliest of a mailed deficiency notice, assessment of the tax, or the last day of the second taxable year beginning after the year the tax is imposed. A waiver is subject to IRS review.','penalty')}
 </details>
 ${prefill('r=parent&t=ira','Check the withdrawal rule and deadline')}
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
 <p>The <a href="/guides/inherited-ira-rules/">inherited IRA rules guide</a> explains who follows each rule, when yearly RMDs apply and what the final deadline means.</p>
 </section>
 <details><summary>Does the calculator cover every inherited account?</summary>
 <p>It covers individual beneficiaries for deaths in 2020 and later. It does not determine trust, estate, disability or chronic-illness eligibility; those cases need review with the custodian or a tax professional.</p>
 <p>The <a href="/how-we-calculate/">calculation method and sources</a> explain its scope and assumptions.</p>
 </details>`
}];
