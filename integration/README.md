# pp365-integration

Integration tests for the shared library's data layer: its services run in Node against the test
tenant, and the tests assert on what SharePoint returns and stores. They sit between the Jest
suites, where SharePoint is mocked, and the browser suite in `e2e/`, which sees SharePoint only
through the UI; they do not replace the browser suite. They run after every test-channel upgrade
(`.github/workflows/ci-channel-test.yml`, job "Integration tests (test channel)"), beside the smoke
tests, and on a developer's machine in seconds. Plan and decisions:
`docs/plans/integration-tests.md`; the testing regime: `.development-guide/spfx/testing.md`.

## How it works

- `node --test` runs `tests/**/*.test.ts` directly through Node 22's type stripping. There is no
  build: only TypeScript that erases to JavaScript (no `enum`, namespaces or parameter
  properties; `import type` for types), and imports name the `.ts` file. `npm run build` only
  type-checks.
- The tests load the library's CommonJS build (`SharePointFramework/shared-library/lib-commonjs`),
  the one its Jest suites run, so the library must be built first.
- `src/loader.ts` resolves what only SPFx provides on a page: the string modules
  (`SharedLibraryStrings`, `SharedResources`) to the bundles in `INTEGRATION_LOCALE`, through the
  Jest harness's AMD transform; `@microsoft/sp-*` to the Jest harness's stand-ins; stylesheets to
  their class names. `src/globals.ts` adds jsdom's `DOMParser` and `XMLSerializer`, nothing else.
- `src/sites.ts` connects to a site and builds the SPFx context a web part on it would have
  (`src/context.ts`) from what the site says about itself. The library's clients connect through
  `setSpfiFactory` (`shared-library/src/data/createSpfiInstance.ts`) with the tests' sign-in;
  without a factory they connect through SPFx, as on a page.
- `src/library.ts` loads the library's modules, typed by their declarations in `lib`.

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
npm test
```

A test skips, with the reason, when a site or the sign-in it needs is not configured;
`INTEGRATION_STRICT=true` (CI) fails it instead, since a suite skipped whole would pass having
tested nothing. `INTEGRATION_LOCALE` (`nb-no` by default, or `en-us`) must be the sites' language:
the library finds the hub's lists by their titles in the strings' language, and the harness stops
with that reason when the two differ.

## Writing a test

- Write only to `INTEGRATION_PROJECT_URL`, a project on the test hub reserved for these tests, and
  to hub rows the test created. Restore in `finally`, from what the test read first. Never point a
  variable at the project in `E2E_PROJECT_URL`, which the browser suite and hand tests use.
- Assert what SharePoint returned or stored, read back, not what the code sent; keep assertions
  independent of the time zone and of other projects' data.
- No secret reaches a log, a report or a file: no token, cookie or certificate is printed.
- What a test creates in the hub carries a prefix of its own (columns: `Integrasjonstest …`), and the test first removes what an interrupted run left with that prefix.
- Format with Prettier and the solutions' rules: `prettier --config ../SharePointFramework/.prettierrc.yaml`.

## In CI

The job installs `--to pp365-integration --to pp365-templates`, generates the library's shared
strings from the templates' `.resx` files (`npm run generate-resx-ts` in `Templates`; they are not
in git), builds the library (`heft build --production`, without Jest) and runs `npm run test:ci`:
the spec report in the log, JUnit in `test-results/junit.xml`, uploaded as
`integration-report-test-channel` for 7 days. `[skip-integration]` in the commit subject skips it.

| GitHub | Kind | Here |
|---|---|---|
| `SP_URL_TEST` | variable | `INTEGRATION_HUB_URL` |
| `E2E_PROGRAM_URL` | variable | `INTEGRATION_PROGRAM_URL` |
| `INTEGRATION_PROJECT_URL` | variable | `INTEGRATION_PROJECT_URL`, the project reserved for these tests |
| `E2E_USERNAME` | secret | `INTEGRATION_USER` |
| `CI_CERT_BASE64`, `CI_CLIENT_ID`, `CI_TENANT` | secrets | The certificate sign-in, from the workflow's `env` |

A failed run's report: `gh run download <run-id> -n integration-report-test-channel`.
