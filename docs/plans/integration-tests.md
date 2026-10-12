# Integration tests: the data layer against SharePoint, without a browser

Planned 2026-10-12, while PR #1784 (phase 5) waits for review. The user asked what the test regime
lacks: the boundary between our code and SharePoint is mocked everywhere but in the browser suite,
so what SharePoint returns and stores is checked only by Playwright, through the UI, or by hand.
Phase 5 found four defects there that no Jest test could see (`getTermStore` throwing under SPFx,
search returning numbers as text, the matrices' ignored `Listenavn` and CAML query, and
`CanvasContent1` being HTML in the list field but JSON in the SitePages API). This plan adds the
missing middle layer: our data services run in Node against the test tenant, in seconds, asserting
on real responses, pointing at one function when they fail. It complements the browser suite, it
does not replace it (I9). Runs on `feat/dependency-upgrades-phase-5` unless the user says
otherwise (the branch is the pre-merge vehicle for 1.15, and the library change is small).

## Goal and non-goals

Goal: the shared library's data layer (`PortalDataService`, `ProjectDataService`,
`SPDataAdapterBase` with the entity service, `searchAggregatedItems`, the term store, the field
value parsing) exercised from Node against the test tenant, after every test-channel upgrade in CI
and on a developer's machine, with assertions on what SharePoint returns and stores; the
assumptions phase 5 verified by hand pinned as tests; the browser suite relieved of the data
assertions it makes after a write. Non-goals: replacing the Playwright suite (what only a browser
shows stays there: bundles, channels, layout, navigation, user journeys); testing SharePoint
itself; provisioning sites from CI (a later slice names the scratch-site option); the web parts'
UI; the consumers' adapters before the library is covered (slice 5).

## Inventory (2026-10-12)

What runs in Node as it is, what needs a seam, and what cannot run outside a page.

| Entry point | Node-readiness |
|---|---|
| `data/searchAggregatedItems.ts` | Takes an `SPFI`: ready. Fans out one search request per chunk of site ids |
| `taxonomy/` (`getTermStore(web)`, `getTermLabel`) | Take a web: ready; `test/runtime` already loads them in Node |
| `data/getAllItems.ts`, `models/ItemFieldValues.ts`, `util/createFieldValueMap.ts`, `models/EditableSPField.ts` | Pure, or take a queryable: ready, and worth running on real `FieldValuesAsText` |
| `services/ProjectDataService` | `createSpfiInstance(spfxContext)` then `spfi(webUrl).using(AssignFrom(sp.web))`; params `webUrl`, `siteId`, `entityService`, `spfxContext`. `clearCache` touches `sessionStorage` unguarded |
| `services/PortalDataService` | `createSpfiInstance`; reads `pageContext.legacyPageContext.hubSiteId`, `web.absoluteUrl`, `site.id`, `site.absoluteUrl`, `user.email` (`getPortfolioOverviewViews` filters personal views by it); `PnPClientStorage().local` for the hub id. `syncList` runs JSOM (`spfx-jsom` 0.6.6 loads `sp.js` into the page): not runnable outside a page (I10) |
| `data/SPDataAdapterBase` | `createSpfiInstance`, a `PortalDataService`, then `new SpEntityPortalService(spfxContext, …)`, which builds `spfi(portalUrl).using(SPFx(spfxContext))` of its own and reads `window.location` for `origin`; `getCurrentUser` is `ensureUser(user.loginName ?? user.email)` |
| `util/transformFieldXml.ts` | `DOMParser` and `XMLSerializer` globals; Node has neither, jsdom 26.1.0 (the Jest harness's) has both |
| `data/projectsCache.ts` | Guards `typeof sessionStorage`: ready |
| The compiled library | `lib-commonjs` (CommonJS) `require`s `@pnp/*` (ESM only): works on Node 22.22 (`require(esm)`), proven by `test:runtime`. 66 files `require("SharedLibraryStrings")` and 15 `require("SharedResources")`: AMD bundles copied to `lib-commonjs/loc/{nb-no,en-us}.js` and `lib-commonjs/loc/shared/`, which Node cannot load without a `define`. `config/config.json` names both under `localizedResources`, which `pp365-jest-config/lib/resolver.js` reads and `lib/amdTransform.js` converts for Jest. Node 22.22 has `module.registerHooks` (synchronous resolve and load hooks) |
| Consumers' adapters (`ProjectWebParts/src/data`, ProjectExtensions' setup tasks) | Import `<Solution>Strings` and `@microsoft/sp-*`, which load in Jest only through the harness's stubs: slice 5 |
| PnPjs in Node | `@pnp/nodejs` 4.21.0 on npm (depends on `@azure/msal-node` 3.8.10), not in the repo. `SPDefault({ baseUrl, msal: { config, scopes } })` composes `DefaultHeaders`, `DefaultInit`, `NodeFetchWithRetry`, `DefaultParse`, `MSAL` and resolves relative URLs against `baseUrl`; no `RequestDigest` (a bearer token needs none). The library's `SPFx(context)` composes `BrowserFetchWithRetry`, `RequestDigest` from `legacyPageContext.formDigestValue` and the web's URL, and no sign-in: it rides on the browser's cookies, so it is useless in Node |
| Sign-in material | CI: `CI_CERT_BASE64` (a base64 PFX, no password: `Connect-PnPOnline -CertificateBase64Encoded -Tenant -ClientId` in `Install/Scripts/SharedFunctions.ps1`), `CI_CLIENT_ID`, `CI_TENANT`, the identity the upgrade jobs run as (`app@sharepoint`). The e2e user (`E2E_USERNAME`/`E2E_PASSWORD`) signs in through the browser only: `e2e/tests/auth.setup.ts` leaves FedAuth and rtFa cookies in `e2e/.auth/user.json`. `node-forge` 1.4.0 is in the pnpm store (transitive) and reads PKCS#12 |
| Sites | `SP_URL_TEST` (the test hub), `E2E_PROJECT_URL` (a project the browser suite and the user's hand tests both write to), `E2E_PROGRAM_URL`. No site is reserved for automated writes (I7) |
| Node | 22.22.2 (`.nvmrc`) runs `node --test a.test.ts` directly (type stripping, unflagged since 22.18): erasable syntax only, no `enum`, parameter properties or value namespaces, `import type` for types |
| CI | shared-library's `heft build --production` took 62 s on the runner, its tests 81 s more (phase 5, slice 1c). The e2e job installs `--to pp365-e2e` and builds nothing |
| Precedent | `shared-library/test/runtime/*.test.mjs`: `node --test`, real PnPjs, a fake transport, `createRequire` for `lib-commonjs` |

## Decisions

- **I1. A Rush project of its own: `integration/`, package `pp365-integration`**, modelled on
  `e2e/` (`rush.json` entry with `shouldPublish: false`). `npm test` is `node --test` over
  `tests/**/*.test.ts` through Node's type stripping (no transpiler); `build` is `tsc --noEmit`;
  dependencies `pp365-shared-library` (`workspace:*`), `@pnp/nodejs`, `node-forge`, `jsdom`,
  `dotenv`, `@types/node`, added through `package.json` and `npm run rush:update`. The tests never
  run inside `rush build`: they need a tenant and secrets. Not a browser-less Playwright project in
  `e2e/`: that keeps the browser suite's install (`--to pp365-e2e`) free of the library and its
  dependencies, and `node --test` with real PnPjs is already the repo's pattern (`test:runtime`).
  Not inside `shared-library`: `test:runtime` runs offline in every build and must stay so.
- **I2. Two sign-in modes, chosen by what is configured.** `certificate` (CI, app-only):
  `CI_TENANT`, `CI_CLIENT_ID`, `CI_CERT_BASE64` → `node-forge` reads the PFX in memory (private key
  as PEM, SHA-1 thumbprint of the certificate) → MSAL `clientCertificate` → `SPDefault({ baseUrl,
  msal: { config, scopes: ['https://<tenant>.sharepoint.com/.default'] } })`. `cookies` (local, a
  user): the e2e user's `e2e/.auth/user.json`, produced by `npx playwright test --project=setup`
  in `e2e/`, read into a `CookieAuth` behaviour (FedAuth and rtFa in the `Cookie` header) composed
  with `@pnp/sp`'s `RequestDigest()`, which cookie-authenticated writes need. A test that needs a
  user (personal views, `Author`, permission trimming) runs in cookie mode only and skips with the
  reason otherwise. A local user through device code or ROPC would need public-client flows on the
  app registration: not now, and recorded here so nobody rediscovers it.
- **I3. One seam in the library: `createSpfiInstance` honours a registered factory.**
  `data/createSpfiInstance.ts` gets `setSpfiFactory(factory?: (context: SPFxContext) =>
  TimelinePipe)`; `createSpfiInstance` uses the factory when one is set and `SPFx(context)`
  otherwise, so nothing changes for the solutions. `SpEntityPortalService` builds its client
  through the same path (`spfi(portalUrl).using(AssignFrom(createSpfiInstance(context).web))`)
  instead of `SPFx(context)` directly, and takes `origin` from `pageContext.web.absoluteUrl`
  instead of `window.location`. Nothing else in the services changes; the Jest suites prove it.
- **I4. A stand-in SPFx context from the site, not from configuration.** The harness reads
  `/_api/site` and `/_api/web` and builds `{ pageContext: { web: { absoluteUrl, serverRelativeUrl,
  title }, site: { id, absoluteUrl }, user: { email, loginName }, legacyPageContext: { hubSiteId },
  cultureInfo: { currentUICultureName } } }`, cast to `SPFxContext`. Under app-only, `user` is the
  e2e user (so `ensureUser` and `getCurrentUser` have someone real to resolve).
- **I5. Browser globals supplied, not designed around.** The harness installs `DOMParser` and
  `XMLSerializer` from jsdom as globals, nothing else of jsdom. `localStorage` and
  `sessionStorage` stay absent: `@pnp/core` falls back to `MemoryStorage` (verified in
  `storage.js`), `projectsCache` guards, and `ProjectDataService.clearCache` gets the same guard.
- **I6. The strings modules through a Node loader.** `module.registerHooks` resolves
  `SharedLibraryStrings` and `SharedResources` (later `<Solution>Strings`) to the
  `lib-commonjs/loc/<locale>.js` bundles as `config/config.json`'s `localizedResources` names
  them, and loads an AMD bundle as CommonJS the way `pp365-jest-config/lib/amdTransform.js` does
  (a `define` that accepts exactly `define([], function () {...})` and fails loudly on anything
  else). `INTEGRATION_LOCALE` (default `nb-no`) picks the bundle, so the English-installation reads
  phase 5 fixed by hand (`UpgradeAllSitesToLatest`, the stakeholder field) have a test path.
- **I7. A site reserved for the tests' writes.** `INTEGRATION_PROJECT_URL`: a project on the test
  hub, created once by hand through the setup wizard with the standard template and named for its
  purpose, that neither the browser suite nor a hand test touches. Write tests change it and
  restore it in `finally`, as the browser suite's write flows do; a test that cannot restore fails
  loudly. The hub's lists are written only through the APIs under test, with cleanup (a column
  added is removed). Reads may use `INTEGRATION_HUB_URL` (CI: `SP_URL_TEST`) and
  `INTEGRATION_PROGRAM_URL` (CI: `E2E_PROGRAM_URL`). Until the site exists, write tests skip with
  the reason. The user creates the site and the repository variable.
- **I8. In CI after the upgrade, on both paths.** A job `integration_test_channel` in
  `ci-channel-test.yml` beside the e2e job: the same `needs` and `if`, `install --to
  pp365-integration`, `npx heft build --production` in `shared-library` (about a minute; no
  tests), `npm test` in `integration/` with `--test-reporter=spec` to the console and
  `--test-reporter=junit` to `integration/test-results/junit.xml`, uploaded as
  `integration-report-test-channel` for 7 days; `[skip-integration]` skips it (documented in the
  release skill's tag table). Slice 4's template-state tests run only after the full upgrade,
  since the packages-only path applies no templates.
- **I9. What moves out of the browser suite, and what stays.** Stays: everything only a browser
  shows and every user journey. Moves, once its counterpart is green in CI: the data assertions
  the write flows make after the UI step (the status report draft's stored fields, the added
  column's row in `Porteføljevisninger`), leaving each flow to assert the visible outcome. Nothing
  is removed from `e2e/` before the integration test that replaces it has passed in CI.
- **I10. JSOM stays out.** `syncList` loads `sp.js` into the page through `spfx-jsom`: it cannot
  run outside a page and stays with the browser suite and hand testing (the project setup's
  "Opprett nytt prosjekt" round). Taxonomy fields through REST (`createFieldAsXml` with the term
  set in the schema) would drop `spfx-jsom` and bring `syncList` in; noted for a later plan.

## Slices and order

| # | Slice | Scope | Exit |
|---|---|---|---|
| 0 | Harness | The project (I1), its Rush entry and dependencies; sign-in in both modes (I2); the stand-in context (I4); the seam (I3) with Jest tests for its default and factory paths; the strings loader (I6) with a test on a malformed bundle; the jsdom globals (I5); `.env.example` with `INTEGRATION_HUB_URL`, `INTEGRATION_PROJECT_URL`, `INTEGRATION_PROGRAM_URL`, `INTEGRATION_LOCALE`, the certificate variables and the cookie file's path; a first test: `PortalDataService.configure` against the hub and `getProjectColumns()` returns the template's columns with their internal names; the CI job (I8); docs: `integration/README.md`, `.development-guide/spfx/testing.md`, the `pp365-testing` skill, the tag table in `pp365-release` | The first test green locally in cookie mode and in CI in certificate mode; search and term store proven reachable app-only or the permission gap reported |
| 1 | Search and terms | `searchAggregatedItems` on the test program: every selected property present, types as SharePoint returns them (numbers as text, booleans as `'1'`/`'0'` or `'true'`/`'false'`, `SiteId` with or without braces: what the matrix filter compares), `includeSelf` with `selfSiteId`, paging past the chunk size; `getTermStore(web).sets.getById(phaseSet).terms…all()` with `localProperties`; `getTermLabel` for `nb-NO` and `en-US` and the chain's fallbacks; `ProjectDataService.getPhases` on the reserved project | The assumptions phase 5 verified by hand are tests |
| 2 | Project properties round trip | On the reserved project: `getProjectInformationData` → `ItemFieldValues` and `createFieldValueMap` against real `FieldValuesAsText` for date, number, choice, text, user and taxonomy fields; `updateProjectProperties` for each type, read back raw and as text, restored in `finally`; dates asserted in the site's regional settings (`FieldValuesAsText`) and as local year-month-day, so 3 April is 3 April in Oslo and in CI's UTC | The 4-March class of defect is caught without a browser |
| 3 | The hub side | For the reserved project: the entity service's `fetchEntity` and `updateEntityItem` through `SPDataAdapterBase.configure`, `syncPropertyItemToHub`'s path that needs no JSOM (I10); `getProjectColumnConfig`, `getPortfolioOverviewViews` (shared views in both modes, personal in cookie mode), `addColumnToPortfolioView` with the column removed again; `getChildProjects`/`getParentProjects` on the test program; `getGlobalSettings` | The browser column flow keeps its UI assertion and drops its data assertion (I9) |
| 4 | The template's state after an upgrade | Read-only, after the full upgrade: `Prosjektkolonnekonfigurasjon` holds the `GtStatusOpportunities` rows on the right project column and no old ones; the stakeholder taxonomy field exists on the reserved project with the resources' names; the matrices' default data sources resolve by id; the default portfolio view; the install log's last entry carries the package version | The upgrade job has assertions, not only an exit code |
| 5 | The consumers' adapters (later) | A loader for `<Solution>Strings` and stand-ins for `@microsoft/sp-*` as the Jest harness has; `ProjectWebParts`' `SPDataAdapter` (`getStatusReports`, `fetchItemsFromDataSource`), ProjectExtensions' `SetupProjectInformation` against a scratch site created by the test; decided when 0–4 are in and the cost of the stubs is known | — |

## Rules for the executing agent

- Read `AGENTS.md`, the `pp365-testing` and `pp365-toolchain` skills, this plan,
  `e2e/tests/fixtures/pp365.ts` and `shared-library/test/runtime/termStore.runtime.test.mjs` before
  the first edit. Dependencies go in `package.json` plus `npm run rush:update` from the root.
- Never run git; the developer commits from your messages. End every batch with a semantic commit
  message.
- Secrets never reach a log, a report or a file: no token, cookie or certificate is printed, the
  PFX is decoded in memory, `.env` is gitignored (`*.env`). Skip a test, with the reason, when a
  site or a mode is not configured; configuration is never a failure.
- Write only to `INTEGRATION_PROJECT_URL` and to hub rows the test created; restore in `finally`;
  never touch `E2E_PROJECT_URL`, which the user tests by hand.
- Assert what SharePoint returned or stored, read back, not what the code sent; keep assertions
  independent of time zone and of other projects' data.
- The harness stays small, one file per concern under `integration/src`: `auth`, `context`,
  `loader`, `globals`, `sites`, `env`. Erasable TypeScript only. Prettier with the
  `SharePointFramework/.prettierrc.yaml` rules, as the e2e specs are formatted.
- Tests first where a defect is known; otherwise write the test against what SharePoint does today
  and say in its comment what it pins and why.
- After each slice: green locally in cookie mode and in CI; the docs updated; a log entry below.

## Risks

- App-only identity: nothing is permission-trimmed, `Author` is the app, personal views are
  invisible; user behaviour is covered in cookie mode locally only. Each such test says so.
- The CI app's permissions for search and the term store app-only are unverified; slice 0 proves
  them or reports what consent is missing (it reaches every site, since the upgrade jobs run as it).
- Throttling: the job runs beside the browser suite against the same tenant; PnPjs retries on 429,
  request counts stay low, no polling loops.
- Cookie mode's cookies expire; the harness names the command that renews them.
- `require(esm)` and type stripping need Node 22.12 and 22.18; `rush.json` allows `>=22.14.0`
  and `.nvmrc` is 22.22.2: raise the floor to 22.18 if a developer hits it.
- The library build adds a minute or two to the job; it runs in parallel with the browser suite.
- Someone edits the reserved project by hand: tests compare against what they set, not against
  fixed values, and restore from what they read first.
- The seam (I3) is production code touched for tests: it defaults to today's behaviour, the Jest
  suites and the browser suite prove nothing else moved.
- `node:test` has no retries; a flaky tenant call fails the job. Watch the first weeks before
  adding a retry wrapper around the sign-in and the first request only.

## Definition of done

Slices 0 to 4 green in CI after a test-channel upgrade and locally in cookie mode; the hand-verified
assumptions of phase 5 pinned as tests; the browser suite's duplicated data assertions moved (I9)
with the suite still green; `testing.md`, the `pp365-testing` and `pp365-release` skills and the
project's README describe the layer; slice 5 decided and recorded, done or not.

## Slice log

### Slice 0: the harness (2026-10-12)

Done: the project `integration/` (`pp365-integration` in `rush.json`; `@azure/msal-node` 7.0.1,
`@pnp/*` 4.21.0, `jsdom` 26.1.0, `node-forge` 1.4.0, `dotenv`, the library and
`pp365-jest-config` as `workspace:*`); the harness in `integration/src` (`env`, `auth`, `loader`,
`globals`, `context`, `sites`, `library`); the seam (`setSpfiFactory`, with
`SpEntityPortalService` through it and `origin` from the context, each with a Jest test; the
origin test was seen failing against the old `window.location`); `ProjectDataService.clearCache`
guarded; the CI job `integration_test_channel` and the `integration/**` trigger; `.env.example`;
docs (`integration/README.md`, `testing.md`, `npm-skript.md`, `kom-i-gang.md`,
`kontinuerlig-integrasjon.md`, the `pp365-testing`, `pp365-release` and `pp365-toolchain` skills,
`AGENTS.md`). The reserved project exists: `INTEGRATION_PROJECT_URL`
(`/sites/Fv3600FjreveienKryssen-Egragang-ogsykkelveg`), a project on the test hub (language 1044,
`Prosjektegenskaper` with its one item), set as a repository variable by the user.

Tests: offline, the string modules in both languages, a malformed bundle, the services loading
without a page, the stand-in context, and the PFX read three ways (empty password, none at all,
AES-encrypted key) against Node's own reading of the certificate; against the tenant, the hub's
web, search over the hub's sites (`SiteId` comes as text), the phase term set through
`getTermStore`, `PortalDataService.configure` with `getProjectColumns()` returning the template's
columns with their internal names, and the hub found from the reserved project's context. Green
locally in cookie mode, strict and not. The library's floors rose to 75/81/57/75 (a full run:
76.01/82.65/58.25/76.01, 441 tests).

Deviations, each for a reason found on the way:

- **MSAL directly, not `@pnp/nodejs`.** `@pnp/nodejs` 4.21.0 pins `@azure/msal-node` 3.8.10 and
  builds a client per PnPjs instance; the harness keeps one `ConfidentialClientApplication` per
  run, with the SHA-256 thumbprint (`thumbprintSha256`; MSAL deprecates SHA-1), and Node 22's
  `fetch` through `BrowserFetchWithRetry`. node-forge opens a PFX only with the password it is
  told, and one exported with no password derives its keys differently from one with an empty
  password (.NET and OpenSSL try both): the harness tries both.
- **The loader does more than strings (I6).** The services' barrels pull in UI modules, so
  `@microsoft/sp-*` resolve to the Jest harness's `spfxStub.js`, `sp-lodash-subset` to its
  `lodashSubset.js`, and stylesheets to their class names. Slice 5 starts from there.
- **One more guard in the library (I5).** `util/theme.tsx` read `window.__themeState__` when it
  loaded, so no service loaded in Node ("window is not defined"); it reads it only where there is a
  `window`, the browser's behaviour unchanged.
- **Cookies need a browser's `User-Agent`.** The term store's v2.1 API refuses cookie calls from
  anything else ("OAuth only flow is enabled and the call has not been issued from an app"); REST
  and search do not care.
- **TypeScript resolves as a bundler.** PnPjs 4's typings add `web`, `site` and `search` to `SPFI`
  through `declare module "../fi"`, which `nodenext` cannot resolve without an extension, so
  `sp.web` did not exist on the type. Node resolves at runtime; deep PnPjs imports take `.js`.
- **The context has a file of its own** (`context.ts`), as the plan's file list has it, and checks
  `INTEGRATION_LOCALE` against the web's language: with `en-us` on the Norwegian hub the services
  looked for "Project Columns" and failed with "the template's column Title is missing".
- **CI fails on missing configuration (`INTEGRATION_STRICT=true`).** Locally a test still skips
  with the reason; in CI a suite skipped whole would pass having tested nothing.
- **The CI job generates the shared strings.** `src/loc/shared` comes from the templates' `.resx`
  (`generate-resx-ts`), not git, so the job also installs `pp365-templates`.

Open: the exit's CI half. The first run after this push proves app-only sign-in, search and the
term store for the CI app, or reports the permission it lacks; the job's time is unmeasured.
