# Inherited RMD Calculator

A standalone, free static calculator for inherited IRA withdrawal rules at **inheritedrmdcalculator.com**. Vanilla JavaScript, no runtime dependencies, no advertising or affiliate links. The operator appears only on About and Contact (and in required publisher structured data).

## Run locally

Requires Node.js 24 or newer and a static HTTP server:

```sh
npm test
npm run build
python3 -m http.server 4173 --directory public
```

Open http://localhost:4173/. `public/` is the deployable output. The build copies only explicitly selected source and static assets; `design-ref/`, `sources-ref/`, `qa-shots/`, scripts and tests never ship. The build checks that the combined gzipped JavaScript stays below 20 KB. No table refresh or network request happens during a build.

Routes: `/`, `/about/`, `/contact/`, `/embed/`, `/404.html`. `vercel.json` supplies the output directory, URL conventions and security headers. No deployment is performed by the build. CI runs the dependency-free Node tests and the static build.

**Before launch:** set up and test the `hello@inheritedrmdcalculator.com` mailbox, which is displayed on Contact. Confirm the production domain and all security headers, especially the route-specific framing policy, on the chosen host. The local preview is a static server, not a Vercel deployment.

## Rules and data

`src/rules.js` is pure and independent of the DOM. `calculate(answers, { today, growth })` accepts a supplied date for tests and returns the rule, reason, amount/divisor, deadlines, schedule, up to three notes, and applicable source links. The supported answer keys match the query parameters below.

It covers individual beneficiaries for deaths from 2020 onward. Trusts, estates, pre-2020 deaths and unresolved dates get a referral rather than a guessed amount. Disability and chronic illness are not determined by this tool. Spousal options assume a sole beneficiary. Workplace calculations use IRA-style age-based RBDs and clearly flag stricter plan terms and the still-employed exception.

Sources are IRS Publication 590-B (2025), T.D. 10001 (2024 final regulations), Notices 2022-53, 2023-54 and 2024-35, the IRS beneficiary page and RMD FAQs. Each rules branch has a source comment and returned citations. Final-regulation §1.401(a)(9)-5(d), (e)(4), and its preamble confirm continued annual payments after a minor child turns 21, with complete distribution ten years after majority. The reserved 1959 applicable-age provision is treated as 73 based on proposed REG-103529-23 and flagged when relevant.

The verified tables are vendored in `data/irs-tables.json`, with source URLs and a 2026-11-13 retrieval date. Initial values came from the supplied IRS Single Life extract and Uniform Lifetime CSV. Age 120 and above uses the 120+ row. A beneficiary divisor decreases from the original first distribution year, including years with IRS relief; it does not restart in 2025. A spouse's life expectancy is recalculated annually. Historical balances are not reconstructed from today's balance.

To check for updates manually:

```sh
npm run sync-tables
```

This fetches `rmd_single_life` and `rmd_uniform_lifetime` from the [open-source data repository](https://github.com/Lead-partner/retirement-limits-data). Missing tables, changed schemas, added/removed ages or changed values stop the refresh before writing. Verify changes against the IRS source and review the baseline manually. An identical dataset updates only the retrieval date. The refresh is never part of a build.

## URL state and privacy

Example:

```text
/?r=parent&t=ira&ob=1944&od=2023&b=1971&bal=412600&g=0
```

- `r`: `parent`, `spouse`, `other`, `trust`
- `t`: `ira`, `roth`, `plan` (workplace, treated as traditional)
- `ob`, `od`, `b`: owner birth, death and beneficiary birth years
- `bal`: prior December 31 balance, or `skip`
- `g`: `0`, `0.03`, `0.05`, `0.07` (illustration only)
- `early`, `rbd`, `gap`: conditional answers `yes`, `no`, `unsure`

Answers are calculated locally and update the address through `replaceState`. Shared URLs include the answers and balance; a URL request can appear in the hosting provider's access logs and browser history. There is no analytics, cookie storage or external font request. Input values are validated and URL text is not interpolated unescaped into markup. Balance input is limited to $1 trillion and two decimal places. The highlighted minimum rounds upward to the next cent; schedule figures round to whole dollars and are illustrations.

The calendar download follows RFC 5545: all-day deadline, exclusive next-day end, UTC DTSTAMP, UID, CRLF, UTF-8 folding at 75 octets, text escaping and a 14-day reminder. Spouse options have separate calendar actions. With no annual minimum, a 10-year beneficiary can save the final empty-by deadline. Printing expands the schedule and includes the result, answers, generation date and disclaimer.

## Design and QA

The approved reference supplies the paper/ink/navy/yellow/rust palette, Source Serif 4 (600), Public Sans (400/600), focus/error states and result-letter styling. Fonts are self-hosted with their SIL Open Font Licenses. The application has one question per step, keyboard number shortcuts, native Enter actions, heading focus on each transition, and inline validation. Mobile results replace the question flow; answer chips reopen a step.

Browser QA uses `/usr/bin/google-chrome`. Screenshots and local audit reports belong in ignored `qa-shots/`. Check start, result, open schedule and conditional paths at widths 320, 390, 768 and 1280. Use a local browser automation installation for optional QA; it is not a site or test dependency. The 1200×630 OG PNG was rendered in headless Chrome from `scripts/og-template.html`; generated brand icons live under `static/`.

To re-render the OG image from this checkout:

```sh
google-chrome --headless=new --no-sandbox --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=1500 --screenshot=static/og.png "file://$PWD/scripts/og-template.html"
```

The embed page is noindex and is the only frameable route. The homepage includes the exact iframe attribution snippet; the embed footer links back with `target="_blank" rel="noopener"`.

## License

Application code: MIT, see [LICENSE](LICENSE). IRS table facts are from public government sources. Font licenses are in `static/fonts/`.
