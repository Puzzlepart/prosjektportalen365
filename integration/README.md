# pp365-integration

Integration tests for the shared library's data layer: its services run in Node against the test
tenant, and the tests assert on what SharePoint returns and stores. They sit between the Jest
suites, where SharePoint is mocked, and the browser suite in `e2e/`, which sees SharePoint only
through the UI; they do not replace the browser suite. They run after every test-channel upgrade
(`.github/workflows/ci-channel-test.yml`, job "Integration tests (test channel)"), beside the smoke
tests, and on a developer's machine in seconds. Plan and decisions:
`docs/plans/integration-tests.md`; the testing regime: `.development-guide/spfx/testing.md`.

## How it works

- `node --test` runs `tests/**/*.test.ts` directly through Node's type stripping (stable since 22.18; the repo runs 26). There is no
  build: only TypeScript that erases to JavaScript (no `enum`, namespaces or parameter
  properties; `import type` for types), and imports name the `.ts` file. `npm run build` only
  type-checks.
- The tests load the CommonJS builds (`lib-commonjs`) of the library and of ProjectWebParts, whose
  data adapter they run, the builds their Jest suites run: build both first.
- `src/loader.ts` resolves what only SPFx and webpack provide, as the Jest harness does: the
  workspace packages and their `lib/...` paths to `lib-commonjs` (one instance of the library, so
  the tests' sign-in reaches the solution's clients); a solution's bare imports of its own folders
  (`types`, `data`) in its `lib-commonjs`; the string modules each package names in
  `config/config.json` to the bundles in `INTEGRATION_LOCALE`, through the Jest harness's AMD
  transform; `@microsoft/sp-*` and PnP's UI controls (ESM written for webpack, never rendered here)
  to the Jest harness's stand-ins; stylesheets to their class names. `src/globals.ts` adds jsdom's
  `DOMParser` and `XMLSerializer` and the page context SharePoint sets on a page
  (`_spPageContextInfo`, with the locale's cultures), nothing else.
- `src/sites.ts` connects to a site and builds the SPFx context a web part on it would have
  (`src/context.ts`) from what the site says about itself. The library's clients connect through
  `setSpfiFactory` (`shared-library/src/data/createSpfiInstance.ts`) with the tests' sign-in;
  without a factory they connect through SPFx, as on a page.
- `src/library.ts` loads the library's modules and ProjectWebParts' adapter, typed by their
  declarations in `lib`.

## Sign-in

| Mode | When | As |
|---|---|---|
| `certificate` | `CI_TENANT`, `CI_CLIENT_ID` and `CI_CERT_BASE64` are set (CI) | The CI app «Prosjektportalen CI» (Entra ID), app-only, with the certificate the upgrade jobs use, read in memory |
| `cookies` | Otherwise, when `e2e/.auth/user.json` exists (locally) | The e2e user, with the session the browser suite's sign-in left |

`INTEGRATION_AUTH=certificate|cookies` forces one. The session lasts about two days: renew it with
`npx playwright test --project=setup` in `e2e/` (with `e2e/.env` filled in). App-only, nothing is
permission-trimmed and the library's user is `INTEGRATION_USER`; a test that needs a real user
(personal views, `Author`) runs with cookies only, and says so when it skips. The term store's v2.1
API refuses cookies from anything but a browser, so cookie calls send a browser `User-Agent`.
App-only, the term store refuses the CI app (403) until it has the application permission
`TermStore.Read.All` on SharePoint: a test that needs a permission the app may lack probes with
`appOnlyDenied` (`src/sites.ts`) and skips, naming the permission, when SharePoint refuses it.

## Local run

```bash
cp .env.example .env                                    # the test hub, a program, the reserved project
(cd ../e2e && npx playwright test --project=setup)      # the e2e user's session, every other day
(cd ../SharePointFramework/shared-library && npx heft build --clean)   # after a library change
(cd ../SharePointFramework/ProjectWebParts && npx heft build --clean)  # after a change there
npm test
```

The tests of the templates' state (`tests/template.test.ts`) run only with
`INTEGRATION_TEMPLATES_APPLIED=true`, which CI sets after its full upgrade (the packages-only one
applies no templates); in CI the installation log's newest entry must also name the commit under
test (`GITHUB_SHA`). A test skips, with the reason, when a site or the sign-in it needs is not
configured;
`INTEGRATION_STRICT=true` (CI) fails it instead, since a suite skipped whole would pass having
tested nothing. `INTEGRATION_LOCALE` (`nb-no` by default, or `en-us`) must be the sites' language:
the library finds the hub's lists by their titles in the strings' language, and the harness stops
with that reason when the two differ.

## Writing a test

- Write only to `INTEGRATION_PROJECT_URL`, a project on the test hub reserved for these tests, and
  to hub rows the test created. Restore in `finally`, from what the test read first. Never point a
  variable at the project in `E2E_PROJECT_URL`, which the browser suite and hand tests use.
- Assert what SharePoint returned or stored, read back, not what the code sent; keep assertions
  independent of the time zone and of other projects' data. A test of a date's text runs the
  machine through the zones with `process.env.TZ`, which Node applies at once (Jest's copy of the
  environment does not); the harness hands the services the site's time zone as a page does
  (`siteTimeZoneData` in `src/context.ts`, which knows the European zones' daylight rules).
- No secret reaches a log, a report or a file: no token, cookie or certificate is printed. A
  `t.diagnostic` line, `console` output and a failed assertion's values land in the HTML report and
  on the test report site as well as in the log.
- What a test creates in the hub carries a prefix of its own (columns: `Integrasjonstest …`;
  status reports: the reserved project's report series `ITEST`, apart from its own reports), and
  the test first removes what an interrupted run left there.
- Format with Prettier and the solutions' rules: `prettier --config ../SharePointFramework/.prettierrc.yaml`.
- The browser suite's matrix smoke needs a project page with both matrix web parts, which no
  template holds: `npm run add-matrix-page -- <project url> [Usikkerhet.aspx] [channel]` adds and
  publishes it with the toolbox defaults, signed in as the harness is (`scripts/add-matrix-page.ts`).

## In CI

The job installs `--to pp365-integration --to pp365-templates`, generates the library's shared
strings from the templates' `.resx` files (`npm run generate-resx-ts` in `Templates`; they are not
in git), builds the library (`heft build --production`, without Jest), compiles ProjectWebParts'
`lib-commonjs` with TypeScript alone (`--noCheck`, the strings copied beside it; its bundle and
type check are the release build's) and runs `npm run test:ci`:
the spec report in the log, JUnit in `test-results/junit.xml` and an HTML report in
`test-results/index.html` (`src/reporters/html.ts`, a `node:test` reporter: each file's suites and
tests with their status, skip reasons, `t.diagnostic` lines, errors with their cause chain and
stack, and the file's stdout and stderr). With three reporters Node prints a
`MaxListenersExceededWarning`, which is harmless. The job uploads `test-results` as
`integration-report-test-channel` for 7 days and publishes the HTML report to the test report site,
a private GitHub Pages site (`.tasks/publish-test-report.js`; setup in
`.development-guide/ci/kontinuerlig-integrasjon.md` «Testrapportsiden»). `[skip-integration]` in the
commit subject skips it. `tests/html-reporter.test.ts` tests the reporter offline, in `npm test` too.

| GitHub | Kind | Here |
|---|---|---|
| `SP_URL_TEST` | variable | `INTEGRATION_HUB_URL` |
| `E2E_PROGRAM_URL` | variable | `INTEGRATION_PROGRAM_URL` |
| `INTEGRATION_PROJECT_URL` | variable | `INTEGRATION_PROJECT_URL`, the project reserved for these tests |
| `INTEGRATION_SECOND_HUB_URL` | variable | `INTEGRATION_SECOND_HUB_URL`, a second hub `AvailableProgramHubs` names, read only (`tests/multi-hub.test.ts`) |
| `E2E_USERNAME` | secret | `INTEGRATION_USER` |
| `CI_CERT_BASE64`, `CI_CLIENT_ID`, `CI_TENANT` | secrets | The certificate sign-in, from the workflow's `env` |

A failed run's report: the link under «Integration report» in the job summary on the run's page
opens it on the test report site, which keeps 7 days of runs. Without the site (not set up yet, or
the publishing step warned): `gh run download <run-id> -n integration-report-test-channel`, then
open `index.html`.
