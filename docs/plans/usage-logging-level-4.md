# Usage statistics level 4: diagnostics, an opt-in switch

Status: proposed 2026-11-25, and gone through with the user on 2026-11-26 and 2026-11-27 (the
decisions round in the slice log). Nothing is built.

- Decided: what a report holds (N3), that level 4 is a plain switch (N4), what the Premium Assist
  agreement means for it (N5), how the customer is informed (N6), the footer mark (N7), retention
  (N12), who reads reports (N13) and the release (N15).
- Still proposals, not yet put to the user: N1, N2, N8 to N11, N14 and N16 to N20.
- The legal checks L7 to L13 are a gate of the release.

Parent plan: `docs/plans/usage-logging.md` (levels 0 to 3, decisions D1 to D9 and P1 to P25, shipped
in 1.15.0, which was published on 2026-11-18 as tag `v1.15.0` on `e8397b018` with level 3 as the
default). Everything in the parent plan stands unless this plan says otherwise.

Written in the worktree `.claude/worktrees/logging` at `8062fd5a2`, ten commits behind `main`. None
of the ten touches the telemetry module, the catalog's telemetry service, the install scripts or
the settings template. The Assist facts are from prosjektportalen-assist `main` at `6156845`.

Target: 1.16.0, on `releases/1.16` (N15). Assist deploys first, as for every contract change.

## What the user asked for (2026-11-25)

- **G1.** A level 4 above Extended.
- **G2.** It is opt-in: never a default, never switched on by an installation or an upgrade.
- **G3.** It is offered to customers with the agreement "Prosjektportalen Premium assist". The
  walk-through settled what that means: the agreement does not gate the switch (N4, N5).
- **G4.** Its purpose is better insight into error messages. When it is on, what is sent can hold
  sensitive data.
- **G5.** The customer must be told clearly what it is.
- **G6.** Other signals that give more insight are welcome as proposals (the candidate table).

## What changes in principle

Levels 0 to 3 rest on one promise: we count usage, never people or content, and no free text leaves
the tenant. Level 4 breaks that promise on purpose, for the hubs that switch it on. Four things
follow.

1. **The never-list holds for levels 0 to 3 only.** The rule in the guide and in `AGENTS.md`
   ("never reads or sends an error's message, only its code") gets a level. Each item of the
   never-list is restated for level 4 in "Levels and the data contract".
2. **A second flow, not a bigger batch.** Diagnostics get their own endpoint, contract, tables,
   retention and access (N2). The usage flow keeps its shape, so its promise stays true by
   construction and not only by discipline.
3. **The roles are a new question.** For levels 1 to 3 the controller is SoftwareOne, on legitimate
   interest (L2, approved; see the slice log). Error text about an organisation's users and
   projects is that organisation's data, and it can come from an organisation with no agreement
   (N5). Who is controller and who is processor, and on what footing, is L7.
4. **One list value is the whole switch.** Nothing from the team is needed to turn level 4 on
   (N4). So the information where the value is set (N6), the mark the administrators see (N7) and
   the legal footing carry the weight, and the legal checks gate the release, not the first
   customer (N15).

## Inventory (2026-11-25)

Prosjektportalen 365:
- `shared-library/src/telemetry/gate.ts`: rule 7 closes the gate for any value other than `0` to
  `3`. A hub set to `4` on 1.15 apps therefore sends nothing at all.
- `telemetry/track.ts`: `trackError(component, errorOrCode)` is the one place errors are counted.
  About eighty call sites pass the caught error itself (`telemetry.trackError(error)`). Four can
  pass only a code: the three error boundaries (`render_failed` in `baseProjectWebPart/index.tsx`,
  `basePortfolioWebPart/index.tsx` and `baseProgramWebPart/index.ts`) and `setupTelemetry.ts`
  (`provisioning_failed`).
- `telemetry/errorCode.ts` never reads a message. PnPjs' `HttpRequestError` carries the status, the
  `Response` (with the `sprequestguid` header and the request URL) and a message that includes
  SharePoint's own answer.
- `telemetry/store.ts`: one store on `window.__pp365UsageV1`, shared by every bundle on the page. A
  change to its shape needs a new name.
- `telemetry/flush.ts`: the client never reads a response and never retries (P2).
- `PortfolioExtensions/src/services/TelemetryService.ts` sends the gate's level with every catalog
  event, and adds the error code only when the level is exactly `3`. Assist's catalog validator
  answers 400 to a level other than `2` or `3`. Unchanged, a hub at level 4 would lose its catalog
  events.
- `projectSetup/tasks/@BaseTask/engineLog.ts`: `captureEngineLog` already collects the provisioning
  engine's warnings and errors while a setup runs.
- `shared-library/src/logging/ListLogger.ts` writes errors to the hub's `Logg` list. The never-list
  says nothing from that list is sent.
- `Templates/Portfolio/Objects/Lists/Globale innstillinger.xml`: the level row is seeded `3`. The
  list has a title, a key, a value, an enabled flag, a category and an id, and no column that
  explains a setting. Rows are added with Skip, so an existing row is never rewritten: existing
  hubs keep the title "(0 = av, 1 = grunnleggende, 2 = standard, 3 = utvidet)".
- The list's columns are site fields, one file each under `Templates/Portfolio/Objects/SiteFields`.
- `Install/Scripts/SharedFunctions.ps1`: `Convert-UsageStatisticsLevel`,
  `Get-EffectiveUsageStatisticsLevel` and `Format-UsageStatisticsSummary` know `0` to `3` and call
  anything else invalid. `Install.ps1 -UsageStatisticsLevel` takes `Off`, `Basic`, `Standard` and
  `Extended`.
- `PortfolioExtensions/src/components/Footer/Configuration` shows a link to site administrators
  only (`legacyPageContext.isSiteAdmin`): the pattern for something only they see in the footer.
- Texts that say error messages are never sent: the wiki page Bruksstatistikk (never-list item 6),
  `releasenotes/1.15.0.md`, `.development-guide/spfx/bruksstatistikk.md`, `AGENTS.md` gotcha 9.

Prosjektportalen Assist. Its repository is private and this one is public: this plan names what
level 4 needs from Assist, and leaves how Assist is run to the brief for the Assist work.
- `src/lib/pp-usage-telemetry.ts`: level 4 gets 400, and so does any unknown field, for example
  `message` in `errors[]`. The whole batch is lost, since the client never reads the answer.
- `src/lib/telemetry-http.ts`: Origin must be `https://*.sharepoint.com`, and each host has a daily
  cap of batches (`src/lib/pp-usage-store.ts`).
- `src/db/schema.ts`: the `pp_usage_*` tables hold counts and enumerations only, kept without a
  time limit (D9). The nightly job (`src/lib/pp-usage-maintenance.ts`) deletes only site hashes and
  batch ids.
- Deletion on request is an admin action per host (`src/lib/actions/pp-usage.ts`).
- **Assist has no notion of a Premium agreement.** A customer is an organisation with its tenants
  (hosts). Agreements come from CRM (`src/lib/crm/agreements.ts`), and an Assist agreement is
  recognised by the contract's name (`src/lib/crm-agreements.ts`).
- The usage pages are open to the admin role as a whole (`src/lib/access.ts`). Reports that hold
  personal data need a narrower permission and a record of who read what (N13).
- `src/app/personvern/page.tsx` and the "Om dataene" text on Logging › Prosjektportalen promise that
  error messages are never sent.

## Decisions

### Given by the user

G1 to G6 above.

### Decided in the walk-through (2026-11-26 and 2026-11-27)

- **N3. What a report holds in the first version.**
  - Decided: rows 1 to 12 of the candidate table. In short: the error as thrown (name, message,
    stack, causes), SharePoint's answer and request id, the setup wizard's log, where it happened
    (site URL and page path), when, the user's last actions as contract events, the page's context,
    a coarse description of the browser, and a reference code the user can quote to support.
  - The facts read from the browser (row 8) wait for L9.
  - Rows 13 to 20 are not in the first version. Each becomes a slice and a decision of its own.
- **N4. A plain switch.**
  - Decided: level 4 is the value `4` in the hub's level row, and nothing more. Whoever can edit
    the hub's settings list can switch it on, at any customer and at any organisation that runs
    Prosjektportalen. There is no activation key, no consent row and no lookup against Assist.
  - Turned down: a signed activation key issued by the team (the first proposal), and a consent
    row that the gate would require.
  - Consequence: one list value stands between a hub and sending error text. The information
    where the value is set (N6), the mark (N7) and the legal footing (L7) carry the weight.
- **N5. What the Premium Assist agreement means.**
  - Decided: the agreement does not gate the switch. Every hub at level 4 sends, and Assist stores
    every report, also from hubs without the agreement and from organisations that are not
    customers. The agreement decides whom the team follows up.
  - Decided: nothing marks the agreement today, in Assist or in CRM. Assist derives it from the
    terms of the customer's active Assist agreement in CRM, by a rule the user gave. The rule is
    kept in Assist and in the brief for the Assist work, not in this public plan. Assist does not
    read the term the rule needs from CRM yet.
  - Proposal: Assist keeps only the answer (Premium or not) with the agreement, never the term the
    answer was derived from, and shows it as a badge.
  - Turned down: a lookup that would stop a hub without the agreement from sending, and dropping
    such reports at ingest.
- **N6. How the customer is informed: a description column.**
  - Decided: no dialog. The level is set where it is set today, in the list Globale innstillinger.
    The list gets a description column. We fill it with the information a setting needs, and it
    can hold a link.
  - For the level row the description says what each level sends, why level 4 exists, that its
    reports can hold personal data, and where the terms are. Setting the value is the opt-in.
    There is no step that accepts the terms, and the customer types no justification.
  - The cost of the new field: a site field and the list's reference to it, a place in the view,
    its display name and the description texts in both resource files, an upgrade step that fills
    the description on existing rows where it is empty (rows are added with Skip, so the template
    never updates one), and the integration test. No search or crawl depends on it.
  - To verify in the slice: that a link in the column can be clicked in the list view and in the
    form, as plain text or as rich text.
  - Proposal: this work writes the descriptions of the two rows about usage statistics. The
    column is there for the other rows, whose descriptions are outside this plan.
  - Turned down: a dialog in the footer that would show the terms, ask for a justification and
    write the row.
- **N7. The footer mark.**
  - Decided: while the hub is at level 4, the footer shows «Diagnostikk er på» to site
    administrators only, as it shows them the configuration link. Other users see nothing.
  - Consequence: the product does not tell ordinary users. The organisation's own information to
    its users is their only notice (L8).
  - The switch has no end date. It stays on until someone lowers the level, and the mark is the
    reminder.
- **N12. Retention.**
  - Decided: a report is kept for two years and then deleted by the nightly job. Deletion on
    request covers reports. Lowering the level stops new reports; the stored ones stay their two
    years unless deletion is asked for.
  - The proposal was 30 days. Legal checks two years (L12): a report is free text that can hold
    personal data, and it can come from an organisation with no agreement.
- **N13. Who can read reports in Assist.**
  - Decided: a permission of its own, granted to named people, on top of the admin role. Holders
    must have two-factor sign-in. Every list and every opened report is written to an access log
    (who, when, which host, which report). No export in the first version. Other administrators
    and the support role see only that a hub runs at level 4 and how many reports it has.
  - Reason: a report holds personal data, which the usage pages do not.
- **N15. Release.**
  - Decided: level 4 is built for 1.16.0, with the legal checks as a gate of the release. From
    the day the version is out, any hub can switch it on. If L7 to L13 and the terms are not
    signed when 1.16.0 ships, level 4 is taken out of that release and follows in the next.
  - How it is taken out: until the gate is passed, `4` stays the invalid value it is in 1.15. One
    constant in the contract turns level 4 on, and the template texts that name level 4 merge
    last.
- **L1 to L6.** Approved as proposed, the user says. The controller is SoftwareOne, not Puzzlepart.
  The texts that name Puzzlepart are to be corrected, and the entity's exact name in them is to
  be confirmed.
- **Owners of L7 to L13.** As for L1 to L6: the legal adviser with the personvernombud takes L7 to
  L10 and L12, the Assist owner L11, and the user L13.

### Still proposed (not yet put to the user)

- **N1. Name and number.**
  - Recommendation: the value `4`, named «Diagnostikk» in Norwegian and "Diagnostics" in English;
    `Diagnostic` in PowerShell output. Level 4 is level 3 plus diagnostic reports.
  - Alternatives: «Feilsøking», «Support».
- **N2. A separate flow.**
  - Recommendation: diagnostic reports go to `POST /api/telemetry/diagnostics` under their own
    contract (`diagnosticsContract.ts`, schema 1, with its own golden fixture) and are stored in
    their own tables. The usage contract changes in one place: `level` may be `4`, with the same
    content as level 3.
  - Reason: free text never passes the usage validator, the usage tables and their open-ended
    retention never hold text, and the two flows can have different access, retention, kill
    switches and legal roles.
  - Alternative: a `diagnostics[]` array in the usage batch. One transport, but text would share the
    16 KB budget with the counts and travel through code written to hold no text.
- **N8. Gate semantics.**
  - Recommendation: rules 1 to 6 of `resolveTelemetryGate` stay. `4` becomes a valid value: the
    level is 4 and `diagnostics` is true. The tester flag, Global Privacy Control and Do Not Track
    close everything, diagnostics included. A DEBUG build logs reports and never sends them.
  - Cost: on 1.15 apps a hub set to `4` sends nothing (rule 7).
- **N9. Installation and upgrade never switch it on.**
  - Recommendation: `-UsageStatisticsLevel` keeps its four values, and no script writes `4`. An
    upgrade leaves an existing `4` alone, as it leaves every existing level. The summary prints
    "Diagnostic (4)" with one line saying that error text is sent. New hubs get a level title that
    names level 4; existing hubs keep their title, and get the description.
  - Reason: G2.
- **N10. Scrubbing and limits.**
  - Recommendation: every text is scrubbed in the browser and again at ingest, by the same patterns
    (in the contract file) against the same golden cases:
    - tokens and secrets (JWTs, `Bearer` values, `access_token`, `code`, `sig`, request digests,
      cookies) are removed;
    - e-mail addresses and claims logins (`i:0#.f|membership|…`) are replaced by a marker;
    - query string values are removed, parameter names kept;
    - long opaque strings are cut.

    Names in running text cannot be recognised and stay: that is why level 4 is treated as personal
    data throughout.
  - Limits: message 1,000 characters, stack 4,000, three causes, 30 log lines, 20 breadcrumbs, one
    report per distinct error per page load (repeats are counted in `n`), 10 reports and 10 requests
    per page load, 15,000 bytes per request, a daily cap per host at ingest.
- **N11. Where errors are captured.**
  - Recommendation: inside `trackError`, so the call sites that pass the error need no change. The
    four sites that can pass only a code also pass the error, with the boundary's component stack
    or the setup's engine log. No global `error` or `unhandledrejection` listener in the first
    version: it would catch other solutions' errors on the page.
- **N14. Protection at rest.**
  - Recommendation: the text of a report is encrypted in the application (AES-256-GCM) before it is
    stored, with a key that exists only where diagnostics may be stored: production, and a test
    environment with its own database. The columns used for lists and grouping (host, day,
    component, code, fingerprint) stay readable. Without the key the route answers 204 and stores
    nothing, and the pages show nothing.
  - Reason: a report's text must be readable only where it is meant to be handled, whichever
    database an environment is connected to. Every environment that is not production has its own
    database before the release. Two years of text (N12) makes this weigh more.
- **N16. Kill switches.**
  - The hub: level 3 or lower, the browsers' privacy signals, a firewall rule for
    `assist.prosjektportalen.no/api/telemetry/diagnostics`.
  - The team: `PP_DIAGNOSTICS_INGEST_DISABLED` and `PP_DIAGNOSTICS_BLOCKED_HOSTS`. Assist answers
    403 for both, and a browser that gets 403 sends no more reports from that page: the one place
    the client reads a response status, so that text stops leaving a tenant we do not store for.
    Also a Vercel Firewall rule, and the purge.
- **N17. No user is named by a field.**
  - Recommendation: a report has no field for a user's name, login, e-mail, Entra object id or
    SharePoint user id, and no count of users. It has the user's role class (administrator, owner,
    member, visitor, guest), because many errors are about permissions. One new identifier appears:
    `pageId`, random for each page load and kept in memory only, so the reports of one page load can
    be read together. Nothing links two page loads.
- **N18. Rules for using the reports** (binding for everyone with the permission):
  - only to find and fix errors for that organisation and in the product, never to assess a
    person;
  - report text never goes into public GitHub issues, the wiki, commit messages, test fixtures or
    tools outside the list of sub-processors; it is rewritten with `contoso` first;
  - a report copied to a case in Assist follows the case's own redaction rules.
- **N19. One canonical text, per level.**
  - Recommendation: the wiki page Bruksstatistikk gets a section «Nivå 4: diagnostikk» with the
    field table, and its never-list is headed "på nivå 0 til 3". Every other text copies from it:
    the description column, the terms, the footer mark, the release notes, the guide, Assist's
    privacy page. Bokmål first.
- **N20. Stacks that can be read.**
  - Recommendation: the release build keeps its source maps as a private build output (never in an
    `.sppkg`), and Assist holds them per version so a stack resolves to file and line when a report
    is opened. It sends nothing more from customers.
  - To verify in the slice: that the production build can emit hidden source maps.

### Candidate signals (G6)

"Sensitivity" is how likely the signal is to hold personal data or project content. Rows 1 to 12
are decided for the first version (N3).

| # | Signal | What it tells us | Sensitivity | When |
|---|---|---|---|---|
| 1 | The error as thrown: name, message, stack, up to three causes | What failed and where in our code | High | v1 |
| 2 | SharePoint's answer: status, its error code and text, the request id (`sprequestguid`), the request path without query values | Why SharePoint refused, and an id Microsoft support and the organisation's own admin can look up | Medium to high | v1 |
| 3 | React's component stack when a web part fails to render | Which component broke | Low | v1 |
| 4 | The setup wizard's failure: the task that failed and the provisioning engine's warnings and errors (`captureEngineLog`) | Why a project setup stopped, today's most laborious support case | Medium (list, field and template names) | v1 |
| 5 | Breadcrumbs: the last 20 contract events before the error, with milliseconds | What the user did just before | Low (enumerations only) | v1 |
| 6 | Where: the site's URL, the page's path, site type and page kind | Which site to look at | Medium (the URL holds the project's name) | v1 |
| 7 | When: the browser's time of the error, and a `pageId` per page load | Order, and which reports belong together | Low to medium | v1 |
| 8 | The browser, coarse: family and major version, operating system family, window size class, time zone offset | Errors that only one browser, one layout or one time zone has | Low; read from the device (L9) | v1 if L9 allows |
| 9 | The page's context: the user's SharePoint language, the site's language and time zone, Teams or browser | The date and translation errors 1.15 had several of | Low | v1 |
| 10 | The user's role class and whether they are a guest, never who they are | Permission errors, for example for the group «Minimum lesetilganger på hub» | Low to medium | v1 |
| 11 | A reference code in the error message the user sees | A user can quote it, and support finds the report | Low | v1 |
| 12 | The bundle versions on the page | Version skew between solutions | Low | v1 |
| 13 | Health snapshot of the hub, once a day from an owner's browser: lists and columns the solutions need, search properties that answer, term sets, counts of views, columns and templates, an allowlist of settings | Configuration drift before it becomes a case | Medium | Later |
| 14 | Performance in detail: durations per kind of data call, rows returned, pages fetched, throttling with Retry-After | Slow tenants and why | Low | Later |
| 15 | The failing web part's properties (data source, view, columns, query) | Errors that depend on configuration | Medium to high | Later |
| 16 | Empty results in search-driven web parts: the query, the row count, properties asked for and returned empty | "The portfolio overview is empty" | Medium | Later |
| 17 | The hub's `Logg` list: its Error and Warning entries | What the hub's own log holds, without asking for access | High | Later |
| 18 | A «Send diagnostikk» button: a report the user sends on purpose, with a comment and, if they choose, their name and e-mail | A report tied to a person who wants to be contacted | Chosen by the user each time | Later |
| 19 | Install.ps1: an offer to send the log when an installation or upgrade fails | Failed upgrades, today sent by e-mail | High (the admin's login, URLs) | Later |
| 20 | Errors nobody caught, from our own bundles only | Crashes outside the error boundaries | Medium; risk of catching others' errors | Later |
| 21 | Screenshots, DOM snapshots, session replay, typed values | | Very high | Never |
| 22 | List items, documents or status report text read for telemetry | | Very high | Never |
| 23 | Who the user is, in an automatic report; counts of users | | High | Never |

## Levels and the data contract

**The usage contract (schema 1)** changes in one place: `TELEMETRY_LEVELS` gets `4`, and a batch's
`level` may be `4`. A level 4 batch may hold what a level 3 batch holds, nothing more.

**The catalog contract** does not change: a catalog event from a hub at level 4 says `level: 3` and
carries its error code as at level 3.

**The diagnostics contract (schema 1, new).**

Transport:
- `POST https://assist.prosjektportalen.no/api/telemetry/diagnostics`, sent as the usage batch is
  (P2): JSON as `text/plain;charset=UTF-8`, `keepalive`, `credentials: 'omit'`,
  `referrerPolicy: 'no-referrer'`, no custom header. There is no override of the URL.
- At most 16,384 bytes per request; the client stays at 15,000 and sends a large report alone.
- Assist answers:

  | Status | Meaning |
  |---|---|
  | 204 | stored, a replay, over the cap, or an environment without the encryption key |
  | 400 | malformed, or an unknown field |
  | 403 | a foreign Origin, a blocked host, or the ingest switched off |
  | 413 | too large |
  | 500 | database error |

- The client reads only the status. After 403 it sends no more reports from that page load. It
  never retries.

Envelope:

| Field | Type and allowed values | Source |
|---|---|---|
| `schema` | integer `1` | constant |
| `batchId` | lowercase GUID v4, new for each request | random |
| `host`, `hubUrl`, `appVersion` | as in the usage contract | the page |
| `tenantId` | lowercase GUID, required here | `legacyPageContext.aadTenantId` |
| `pageId` | lowercase GUID v4, new for each page load, never stored | random |
| `reports` | 1 to 10 entries | |

Report:

| Field | Type and allowed values |
|---|---|
| `id` | lowercase GUID v4; its first eight characters are the reference code |
| `at` | the browser's time of the error, ISO 8601 in UTC, to the second |
| `c`, `code`, `http?` | as an `errors` entry of level 3 |
| `n` | 1 to 10,000: how many times the same error occurred in this page load |
| `site` | `{ s, url }`: the site type, and the web's URL (https, same host, no query, at most 512) |
| `page` | `{ kind, path }`: `sitePage`, `listView`, `form`, `system` or `other`; the path without query and fragment, at most 512 |
| `error` | `{ name, message, stack?, componentStack?, causes? }`: name 100, message 1,000, stack 4,000, component stack 2,000, up to three causes of `{ name, message, stack? }` with stack 1,500 |
| `sp?` | `{ status, requestId?, method?, path? }`: the request id is a GUID; the path keeps query parameter names and drops their values |
| `log?` | up to 30 lines of at most 200 characters: the provisioning engine's warnings and errors, from ProjectSetup only |
| `crumbs?` | up to 20 of `{ t, c, e, v? }`: milliseconds before the error (0 to 600,000) and an event of the usage contract |
| `ctx?` | `{ role, bundles, uiLang, siteLang, siteTz?, shell }`, from SharePoint's page context: the user's role class, up to six bundle versions, the user's SharePoint language, the site's language and time zone offset, and Teams or browser |
| `env?` | `{ browser, browserMajor, os, viewport, tz }`, read from the browser, every value an enumeration or a bounded number; left out if L9 says so |

Every text is scrubbed (N10) before it is sent and again before it is stored.

**The gate at level 4** (N8):

| Level row | Level | Diagnostics |
|---|---|---|
| `0` to `3` | as today | no |
| `4` | 4 | yes |
| anything else | 0 | no |

**The never-list, restated for level 4.**

| Item of the never-list (levels 0 to 3) | At level 4 |
|---|---|
| 1. What identifies a user | Still never a field. Can occur inside error text; e-mail addresses and logins are scrubbed, names in running text are not |
| 2. Identifiers of a user, device or session | One: `pageId`, random per page load, in memory only |
| 3. Identifiers that stay the same | The site's URL; GUIDs that occur in messages and paths |
| 4. Content | Can occur inside error text, URLs and the setup log. Never read on purpose |
| 5. Other URLs | The failing page's site URL and path, and the failing request's path without query values |
| 6. Free text | Yes: this is the purpose |
| 7. Browser and device | A coarse description, if L9 allows it |
| 8. Network identifiers | SharePoint's request id. IP addresses are still never read or stored |
| 9. Timestamps | The browser's time of the error |
| 10. Settings and the `Logg` list | Not in the first version (candidates 13 and 17) |
| 11. Counts of users | Never |
| Storage in the browser | Never, unchanged |

**Still never sent, at any level:** fields that name a user; anything written to the browser's
storage; screenshots, DOM snapshots, session replay or typed values; list items, documents or report
text read for telemetry; tokens, digests and cookies (scrubbed, and tested); errors from other
solutions on the page.

## Design

### PP365 client (shared-library)

- `contract.ts`: `TELEMETRY_LEVELS` gets `4`, behind the constant that turns level 4 on (N15).
- `diagnosticsContract.ts` (new, data only, no imports): the schema, the URL, the limits, the field
  lists, the enumerations and the scrub patterns.
- `gate.ts`: accepts `4` and answers `diagnostics`.
- `store.ts`: the store gets the diagnostics buffer, the breadcrumb ring and `pageId`, and a new
  window name (`__pp365UsageV2`), since two bundle versions can share a page.
- `diagnostics.ts` (new): called by `trackError` after the count. It returns at once unless the
  decision says `diagnostics`, or is still pending. While pending it keeps up to ten caught errors
  as they are, unread, and drops them when the decision says no. Only with a yes does it read an
  error: it builds, scrubs and truncates the report, and merges repeats.
- `environment.ts` (new): reads the browser facts of `env`, only after `diagnostics` is decided.
- `diagnosticsFlush.ts` (new): sends shortly after a capture and on the existing flush events, at
  most ten requests per page load, reading only the status.
- `track.ts`: `trackError(component, errorOrCode, detail?)`, where `detail` carries the error, a
  component stack or log lines for the callers that pass a code. `useTelemetry().trackError` returns
  the reference code, or nothing when diagnostics are off. `ITelemetryInit` gains the page-context
  facts of `ctx`, which stay in memory and go only into a report.
- `PortfolioExtensions/src/services/TelemetryService.ts`: a level above 3 is sent as `3`, and the
  error code is added at level 3 and up. It holds today's only comparison of the level with
  `=== 3`.
- `privacy.test.ts` grows: at levels 0 to 3 no message, stack or browser fact is read, nothing is
  posted to the diagnostics endpoint, and storage is untouched.

### Emit sites

- The error boundaries of `BaseProjectWebPart`, `BasePortfolioWebPart` and `BaseProgramWebPart` pass
  the error and the component stack. ProgramWebParts' own `ErrorBoundary` takes them from
  `componentDidCatch`.
- `setupTelemetry.ts` passes the error and the engine log's lines.
- `UserMessage` shows «Referanse: XXXX-XXXX» under an error when it is given one.

### Settings, the description column, install and upgrade

- `Templates/Portfolio/Objects/SiteFields`: a new site field for the description (a multi-line
  text), included as the others are.
- `Globale innstillinger.xml`: the list's reference to the field, the field in the view, and the
  description of the two rows about usage statistics. No new row and no new list.
- Both `Resources.*.resx`: the field's display name, the two descriptions, and the level title
  with level 4 for new hubs:
  «Bruksstatistikk til Prosjektportalen-teamet (0 = av, 1 = grunnleggende, 2 = standard,
  3 = utvidet, 4 = diagnostikk)».
- An upgrade step, after the template has added the field: it fills the description of a row
  found by its settings id, only where the description is empty. A text a customer has written is
  never replaced.
- `SharedFunctions.ps1`: `Convert-UsageStatisticsLevel`, `Get-EffectiveUsageStatisticsLevel` and
  `Format-UsageStatisticsSummary` learn `4`. `Resolve-InitialUsageStatisticsLevel` never returns
  `4`.
- `.tasks/fixtures/usage-statistics-level.json` gets the level 4 scenarios, and
  `integration/tests/template.test.ts` reads the field and the level row's description.

### The footer mark (PortfolioExtensions)

- `Footer/DiagnosticsMark/` (new, component folder with hook): «Diagnostikk er på», shown to site
  administrators while the gate says `diagnostics`, with the short explanation and a link to the
  settings list. Strings in the loc triad; an axe scan in its test.

### Assist: the agreement

- `src/lib/crm/agreements.ts` reads the term the rule needs from CRM, `src/lib/crm-agreements.ts`
  derives the answer, and `src/lib/agreementGroup.ts` gives it a badge (N5). Only the answer is
  kept.

### Assist: ingest and storage

- `src/lib/pp-usage-contract.ts` (synced) and `src/lib/pp-usage-telemetry.ts`: level 4 is accepted
  with level 3's content.
- `src/db/schema.ts` and the next migration: `pp_diagnostics_report` and `pp_diagnostics_access`,
  the diagnostics permission on the user, and a `pp_activity_type` value for deleted reports.
- `src/lib/pp-diagnostics-contract.ts` (a verbatim copy, synced by the existing script or a twin),
  `src/lib/pp-diagnostics-telemetry.ts` (the validator and the scrub),
  `src/lib/pp-diagnostics-crypto.ts` (AES-256-GCM with `PP_DIAGNOSTICS_ENC_KEY`),
  `src/lib/pp-diagnostics-store.ts` (one statement: the host is under its cap and the report id is
  new), `src/app/api/telemetry/diagnostics/route.ts`.
- The route reuses `src/lib/telemetry-http.ts`, answers 204 where the encryption key is not set,
  and logs only the host and the SQLSTATE, never a body or a driver's error text. The same rule
  holds for every telemetry route.
- Reports are stored for every host, also one that has no tenant row. Ingest never creates tenant
  rows (D8).
- `src/lib/pp-usage-maintenance.ts`: deletes reports and access rows older than two years (N12,
  L12). The deletion on request (`src/lib/actions/pp-usage.ts`) also deletes the host's reports.
- `.env.sample`, `README.md`, `docs/logging.md`.

### Assist: the permission and the diagnostics view

- `src/lib/access.ts` and `src/lib/dal.ts`: the permission and `requireDiagnostics()`; granting and
  withdrawing it is audited (N13).
- Under Logging › Prosjektportalen: hubs at level 4, with since when, the agreement's badge and
  their report counts (all admins); the hosts without a tenant row among them, as "Ukoblede verter"
  are shown for usage; the reports of a host grouped by fingerprint, and one report opened and
  decrypted (the permission, with an access row written each time); delete one report or all of a
  host's.
- The stack is resolved against the release's source maps when they exist (N20).
- `docs/pp-kundekort.md`, `docs/avtalekoer.md`.

### Transparency and texts

Drafts, bokmål first. Legal sentences are published only after sign-off. The texts name SoftwareOne,
and the entity's exact name is to be confirmed.

**Canonical paragraph (draft).** "Nivå 4, diagnostikk, er av til dere selv slår det på: i listen
Globale innstillinger på porteføljeområdet settes UsageStatisticsLevel til 4. På nivå 4 sender
Prosjektportalen i tillegg en feilrapport til Prosjektportalen-teamet i SoftwareOne når noe feiler:
feilmeldingen slik den er, hvor i koden det skjedde, hvilket område og hvilken side det gjaldt, og
hva SharePoint svarte. En feilmelding kan inneholde navn på personer, prosjekter, lister og filer,
og adresser. Vi bruker rapportene til å finne og rette feil. De lagres i to år, og bare navngitte
personer hos oss kan lese dem."

**The level row's description (draft).** "Styrer hva Prosjektportalen sender til
Prosjektportalen-teamet. 0 = av, 1 = grunnleggende, 2 = standard, 3 = utvidet, 4 = diagnostikk.
Nivå 4 er av til dere setter det selv. Da sendes også feilmeldingene slik de er når noe feiler, med
adressen til området og siden. De kan inneholde navn på personer, prosjekter og filer. Vi bruker
dem til å finne og rette feil. Les hva som sendes, og vilkårene, før dere setter 4: [lenke]."

**The footer mark (draft).** «Diagnostikk er på». Under it: "Når noe feiler i Prosjektportalen,
sendes feilmeldingen til Prosjektportalen-teamet for feilsøking. Den kan inneholde navn og adresser.
Nivået endres i Globale innstillinger."

Texts to change, in the same release:
- prosjektportalen365: the wiki pages Bruksstatistikk and Grunnlag for DPIA og ROS,
  `releasenotes/1.16.0.md`, `CHANGELOG.md`, `readme/2-Installering.md`,
  `.development-guide/spfx/bruksstatistikk.md`, `AGENTS.md` gotcha 9, the pp365-templates and
  pp365-testing skills, the parent plan's rules.
- Assist: `src/app/personvern/page.tsx`, the "Om dataene" text, `README.md`, `docs/logging.md`.
- prosjektportalen.no/personvern (prosjektportalen-web), where the terms for level 4 are published.

### Legal checks (L7 to L13)

All are needed before 1.16.0 is published with level 4 (N15). L1 to L6 were approved as proposed.
Owners: the legal adviser with the personvernombud for L7 to L10 and L12, the Assist owner for L11,
the user for L13.

- **L7. Roles and footing.** Who is controller and who is processor for a report's text, when the
  party on our side is SoftwareOne? For an organisation with an agreement, do its data processing
  terms cover it? For one without, the published terms the description links to are all there is:
  is setting a list value, after reading a description, enough? Does fixing the product for
  everyone with what a report taught us fit within the purpose?
- **L8. The organisation's side.** Its legal basis, its information to employees and guests, and
  the rules on monitoring employees' use of electronic equipment (the regulation on the employer's
  access to e-mail and other electronically stored material, § 2, and the Working Environment Act
  chapter 9). Only administrators see the mark (N7), so the organisation's own information is the
  users' only notice. We supply a text; the organisation decides.
- **L9. Ekomloven § 3-15 at level 4.** Reading the browser, the window size and the time zone is
  access to information on the user's device. Can the organisation decide it for its users? If
  not, `env` is left out: the design keeps it apart from `ctx`, which comes from SharePoint's page
  context.
- **L10. Special categories and confidentiality.** Hubs where titles or URLs can reveal health data,
  information under a duty of secrecy, or graded information. What the description must warn
  about, and whether the organisation needs a DPIA.
- **L11. Sub-processors and location.** Vercel (Stockholm; function logs must hold no body), Neon
  (Frankfurt; the restore window, in which deleted rows still exist), transfers outside the EEA.
- **L12. Retention.** Two years for free text that can hold personal data, also from organisations
  without an agreement (N12). The access log's period.
- **L13. Our own use.** The rules of N18, who gets the permission, two-factor, and whether report
  text may be given to AI tools at all.

## Slices and order

L7 to L13 and the terms are the long pole and start first. Slices 2 and 3 (Assist) can run beside
4 to 8 (PP365) once slice 1 is done. Effort is in agent days, as in the parent plan.

1. **Contracts and fixtures.**
   - Repo: prosjektportalen365 (shared-library).
   - Depends on: N1, N2, N10 and N17 confirmed.
   - Files: `telemetry/contract.ts`, `telemetry/diagnosticsContract.ts`,
     `__fixtures__/diagnostics-batch-v1.json`, `__fixtures__/diagnostics-scrub-cases.json`, their
     tests.
   - Done when: the contract matches this plan's tables and the tests are green.
   - Effort: S (1 day).
2. **Assist: the agreement's badge.**
   - Depends on: the rule, from the brief.
   - Files: as under "Assist: the agreement".
   - Done when: the badge follows the rule in tests, and only the answer is stored.
   - Effort: S (1 day).
3. **Assist: ingest, live and empty.**
   - Depends on: 1, N14.
   - Files: as under "Assist: ingest and storage".
   - Done when: CI is green; the curl matrix passes on an environment with its own database (a
     valid report, its replay, a blocked host, an unknown field, a body with a token that is
     scrubbed, a host without a tenant row); production answers 400 to an invalid payload and
     holds no rows; a level 4 usage batch is accepted.
   - Effort: M (2 to 3 days).
4. **The gate at level 4.**
   - Repo: prosjektportalen365 (shared-library, PortfolioExtensions).
   - Depends on: 1.
   - Files: `telemetry/gate.ts`, `telemetry/store.ts`,
     `PortfolioExtensions/src/services/TelemetryService.ts`, their tests.
   - Done when: the gate's truth table has a test for `4` with the constant on and off, and a
     catalog event at level 4 equals one at level 3.
   - Effort: S (1 day).
5. **Capture and transport.**
   - Depends on: 4.
   - Files: `telemetry/diagnostics.ts`, `telemetry/environment.ts`, `telemetry/diagnosticsFlush.ts`,
     `telemetry/scrub.ts`, `telemetry/track.ts`, `telemetry/TelemetryContext.tsx`,
     `telemetry/privacy.test.ts`, the test fixtures.
   - Done when: the payload equals the fixture; the scrub cases pass; the limits and the 403 stop
     are tested; the privacy tests of "PP365 client" pass; shared-library's coverage floors hold.
   - Effort: L (3 days).
6. **Emit sites.**
   - Repo: prosjektportalen365 (ProjectWebParts, PortfolioWebParts, ProgramWebParts,
     ProjectExtensions, shared-library's `UserMessage`).
   - Depends on: 5.
   - Done when: a render failure carries its component stack, a failed setup carries its log, and a
     shown error carries its reference, each with a test.
   - Effort: S to M (1 to 2 days).
7. **Settings, the description column, install and upgrade.**
   - Repo: prosjektportalen365 (Templates, Install).
   - Depends on: N9, and the texts of slice 11 for the description.
   - Files: as under "Settings, the description column, install and upgrade", plus `CHANGELOG.md`
     and the pp365-templates skill.
   - Done when: `validate-loc` shows no gap, resx line parity holds, `npm run test:tasks` passes, a
     new hub has the column with both descriptions, an upgraded hub gets them where they were
     empty and keeps an existing `4`, and a link in the description can be clicked.
   - Effort: M (2 days).
8. **The footer mark.**
   - Repo: prosjektportalen365 (PortfolioExtensions).
   - Depends on: 4.
   - Done when: the mark shows for a site administrator at level 4 and for nobody else, and its
     axe scan passes.
   - Effort: S (1 day).
9. **Assist: the permission and the diagnostics view.**
   - Depends on: 3.
   - Done when: a report from the test hub can be found, opened and deleted, each opening leaves an
     access row, and a user without the permission gets nothing.
   - Effort: M (2 to 3 days).
10. **Source maps (N20).**
    - Repos: prosjektportalen365 (the release build), Assist.
    - Done when: a stack from a test-channel build resolves to a source file and line in Assist.
    - Effort: M (2 days); can follow the release.
11. **Texts.**
    - Depends on: L7 to L13 for the legal sentences and the terms.
    - Files: as under "Transparency and texts".
    - Effort: M (2 days), plus the terms with legal.
12. **End-to-end and integration.**
    - Repo: prosjektportalen365 (`e2e`, `integration`).
    - Files: `e2e/tests/smoke/usage-statistics.spec.ts` (its own copy of the diagnostics fields),
      `integration/tests/template.test.ts`. `guardTelemetry` in `e2e/tests/fixtures/pp365.ts`
      already holds every address under `/api/telemetry/`, the new one included.
    - Done when: no test sends a report to production by accident, and the spec checks a forced
      error's report on the test hub at level 4.
    - Effort: S to M (1 to 2 days).
13. **Verification and the release gate.**
    - A checklist on the test channel: every gate row, the description on a new and an upgraded
      hub, the mark, an upgrade that leaves `4` alone, a blocked host, the purge.
    - The gate: L7 to L13 signed, the terms published, the wiki live, Assist in production, and
      N14 verified. Then the constant is turned on and the texts that name level 4 are merged.

## Rules for the executing agent (additions to the parent plan's)

- Only `diagnostics.ts` reads an error's message or stack, and only when the decision says
  `diagnostics`. `errorCodeFrom` and everything at levels 0 to 3 still never do.
- No real customer text anywhere outside the encrypted column: not in fixtures, tests, commit
  messages, issues, logs or this plan. Examples use `contoso`.
- A new field of a report is a decision of its own, as a new event is: both contracts, both
  fixtures, the e2e field list and the wiki table change together, and Assist deploys first.
- No browser storage, as before. `pageId` lives in memory.
- No field that names a user, and no count of users.
- No script and no default ever sets the level to `4`.
- In Assist: never log a diagnostics body or a driver error with its parameters; never run the
  diagnostics pages or the ingest against `.env.local`.
- The store's window name changes with its shape.
- This repository is public and Assist's is private. What this plan and its slice log say about
  Assist is what level 4 needs from it. Findings about how Assist is run or secured, and the rule
  that derives the agreement, go in the brief for the Assist work, never here.

## Risks

| Risk | Mitigation | Owner |
|---|---|---|
| Any organisation that runs Prosjektportalen can switch level 4 on and send personal data, with no agreement | The legal checks gate the release (N15); the description and the published terms (N6); the view of new hubs at level 4, and blocking a host (N16) | User, Legal |
| The value is set by someone who did not read the description, or by mistake | The description and the title where the value is set; the mark for administrators (N7); Assist shows since when a hub has been at level 4 | User |
| Ordinary users are not told | The organisation's own information (L8); the terms say it is theirs to give | User, Legal |
| Two years of free text | Encryption (N14), the permission and the access log (N13), deletion on request, L12 | Assist owner, Legal |
| A bug sends error text at level 3 or lower | A separate flow, one module that reads messages, the privacy tests, the e2e guard and payload spec | Agent |
| Error text carries a token or a login | The scrub on both sides against the same golden cases, built from real PnP error shapes | Agent |
| Text leaks through logs or an environment that is not production | No body or driver error in logs; encryption with a key that only production and the test environment hold (N14) | Assist owner |
| Reports are read by more people than need to, or unseen | The permission, two-factor, the access log (N13) | Assist owner |
| Published promises become untrue ("feilmeldinger sendes aldri"), and published texts name the wrong party | The texts change in the same release, per level (N19); the texts that name Puzzlepart are corrected | User |
| An error storm fills the table or the bill | One report per distinct error per page load, ten per page load, a daily cap per host | Agent |
| Stacks from minified bundles cannot be read | Source maps (N20) | Agent |
| Level 4 is read as employee monitoring | No user fields, the rules of use (N18), L8 | User, Legal |
| A hub at 4 on 1.15 apps goes silent | Stated in the texts | User |
| Report text is copied into a public issue or an AI tool | N18, L13, and the reference code as the thing to quote | User |
| Level 4 grows field by field | Every field is in the contract and the wiki table, and is a decision | User |
| The legal checks are not done when 1.16.0 ships | Level 4 stays off behind its constant and follows in the next release (N15) | User |

## Definition of done

- Slices 1 to 13 are merged and green, and each has its log entry.
- At levels 0 to 3 nothing has changed: the usage payloads, the texts' never-list and the tests of
  the parent plan hold.
- A hub at `4` sends reports that match the contract. No installation or upgrade sets `4`.
- A new hub and an upgraded hub show the description where the level is set.
- In production Assist: reports are encrypted, read only with the permission and logged, and
  deleted after two years and on request.
- The wiki, the terms, the description and the footer mark describe the same fields as
  `diagnosticsContract.ts`, and name the right party. Legal has signed L7 to L13.

## Open points

- The proposals not yet put to the user: N1, N2, N8 to N11, N14 and N16 to N20.
- The exact name of the entity in the texts (SoftwareOne), and the correction of the published
  texts that name Puzzlepart.
- Where the terms for level 4 are published, and the link the description holds.
- Whether the description is plain or rich text (N6).

## Slice log

### Decisions round (2026-11-26 and 2026-11-27)

The user went through the questions one by one.

1. **The agreement (N5).** Nothing marks a Premium Assist agreement today. It is derived from the
   terms of the customer's Assist agreement in CRM, by a rule the user gave and made precise the
   day after; the rule is in the brief for the Assist work. Assist does not read that term from
   CRM yet.
2. **A switch, not an entitlement (N4, N5).** Asked whether a key could be issued as an exception
   without the agreement, the user decided that level 4 is only a switch, which anyone can turn
   on. Turning it on must come with a justification and with information about the terms. So no
   organisation needs anything from the team to switch it on, and the agreement does not gate the
   switch.
3. **Only the level row (N4).** Offered a consent row that the gate would require, or the signed
   key after all, the user chose the plain switch: the value `4` in the level row is enough. The
   signed key, its row, its table in Assist and its verdicts fall away.
4. **Everyone who switches it on is stored (N5).** Prosjektportalen is open source, so hubs without
   the agreement, and organisations that are not customers, can set the level to 4. Offered a
   lookup that would stop them from sending, or dropping their reports at ingest, the user chose
   that every hub at level 4 sends and Assist stores it. The agreement decides only whom the team
   follows up. Personal data then comes also from organisations with no agreement, so the terms
   the description links to are the only footing for them (L7).
5. **The first version's content (N3).** Rows 1 to 12 of the candidate table, as proposed. The
   facts read from the browser (row 8) still wait for L9.
6. **The later signals (N3).** Rows 13 to 20 stay out of the first version. Each becomes a slice
   and a decision of its own afterwards.
7. **No dialog (N6).** The level is set where it is set today, in the list. The user turned the
   footer dialog down: setting level 4 is a field in a list.
8. **A description column (N6, N19).** The user decided to add a description column to Globale
   innstillinger. We fill it with the information a setting needs, and it can hold a link. For the
   level row that is what each level sends, why level 4 exists, that its reports can hold personal
   data, and the link to the terms. No step accepts the terms and the customer types no
   justification: the description is the information, and setting the value is the opt-in.
9. **The footer mark (N7).** Shown to site administrators only, while the hub is at level 4.
   Other users see nothing.
10. **Retention (N12).** Two years, the user's choice over the proposed 30 days. Legal checks it
    (L12).
11. **Reading reports in Assist (N13).** As proposed: a permission of its own for named people,
    two-factor for its holders, and every opened report logged.
12. **Release (N15).** Level 4 is built for 1.16.0, with the legal checks as a gate of the release.
    If they are not signed when 1.16.0 ships, level 4 is taken out of that release and follows in
    the next.
13. **L1 to L6.** Approved as proposed, the user says. The controller is SoftwareOne, not
    Puzzlepart.
14. **Owners of L7 to L13.** As for L1 to L6.

What the walk-through left: the proposals listed under "Open points".
