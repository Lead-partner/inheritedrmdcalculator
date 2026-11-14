# Primary source checks

Checked 14 Nov 2026. Fetched with curl for the November 2026 guides update; HTML text extracted with BeautifulSoup, PDF text with pdftotext. These saved copies support the evidence tests. No secondary sources were used.

- [IRS Publication 590-B (2025)](https://www.irs.gov/publications/p590b) — `p590b.txt`; checked 14 Nov 2026; fetched.
- [Treasury T.D. 10001 (Federal Register via GPO)](https://www.govinfo.gov/content/pkg/FR-2024-07-19/html/2024-14542.htm) — `fr.txt`; checked 14 Nov 2026; fetched.
- [IRS Retirement topics — Beneficiary](https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-beneficiary) — `benef.txt`; checked 14 Nov 2026; fetched.
- [IRS Retirement topics — Beneficiary: inherited IRA FAQs](https://www.irs.gov/retirement-plans/retirement-topics-beneficiary) — `inherited-ira-faq.txt`; checked 14 Nov 2026; unavailable.
- [IRS Retirement plan and IRA required minimum distributions FAQs](https://www.irs.gov/retirement-plans/retirement-plan-and-ira-required-minimum-distributions-faqs) — `rmdfaq.txt`; checked 14 Nov 2026; fetched.
- [IRS Instructions for Form 5329 (2025)](https://www.irs.gov/instructions/i5329) — `i5329.txt`; checked 14 Nov 2026; fetched.
- [IRS Notice 2022-53](https://www.irs.gov/pub/irs-drop/n-22-53.pdf) — `n2022-53.txt`; checked 14 Nov 2026; fetched.
- [IRS Notice 2023-54](https://www.irs.gov/pub/irs-drop/n-23-54.pdf) — `n2023-54.txt`; checked 14 Nov 2026; fetched.
- [IRS Notice 2024-35](https://www.irs.gov/pub/irs-drop/n-24-35.pdf) — `n2024-35.txt`; checked 14 Nov 2026; fetched.
- [Treasury proposed regulations REG-103529-23 (1959 birth cohort assumption)](https://www.govinfo.gov/content/pkg/FR-2024-07-19/pdf/2024-14543.pdf) — `proposed-1959.txt`; checked 14 Nov 2026; fetched.
- [IRS Publication 575 (2025)](https://www.irs.gov/publications/p575) — `p575.txt`; checked 14 Nov 2026; fetched.

`article-evidence.json` maps article claim IDs to whitespace-normalized source passages. Table I is independently parsed from `p590b.txt` in the page tests, then compared with the repository data and every rendered row.

- [IRS RMD comparison chart: IRAs vs. defined contribution plans](https://www.irs.gov/retirement-plans/rmd-comparison-chart-iras-vs-defined-contribution-plans) — `plan-comparison.txt`; checked 14 Nov 2026; fetched with curl.
