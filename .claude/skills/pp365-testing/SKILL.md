---
name: pp365-testing
description: How tests work in the Prosjektportalen 365 monorepo and how to write, run and fix them. Use when asked to "add a test", "write a component test", "unit test", "run the tests", "heft test", "jest", "why does the test fail", "mock the data adapter", "playwright", "e2e", "smoke test", "flaky test", "test the web part". Encodes the shared Jest harness (pp365-jest-config), the PnPjs stub, string module resolution, and the Playwright smoke suite against the test tenant. Pair with the playwright-cli skill for browser work.
---

# Testing in PP365

Authoritative description (Norwegian): `.development-guide/spfx/testing.md`. This skill is the operational summary for agents.

## Layers and where they run

| Layer | Location | Runs |
|---|---|---|
| Unit + component tests | `SharePointFramework/<Solution>/src/**/*.test.ts(x)` | `heft test` inside every build (`npm run build`, `rush build`, CI). A failing test fails the build. Output: `jest-output/JUnit.xml`, `jest-output/coverage/`. |
| Runtime contract tests | `SharePointFramework/shared-library/test/runtime/*.test.mjs` (`node --test`, real ESM PnPjs 4 with a fake transport, emulating SPFx's relative URLs via `pre.prepend`) | `npm run test:runtime`, part of shared-library's `build` after `heft test`. Add one whenever code composes PnPjs queryables: Jest stand-ins missed `getTermStore` throwing under SPFx. |
| Packaging proof | `Install/Build-Release.ps1` | Every release build: each selected solution must emit a fresh `.sppkg`; no AMD `define([...])` header in `dist` may list a `pp365-*` external. |
| E2E smoke | `e2e/` (Rush project `pp365-e2e`, Playwright) | Job "End-to-end smoke (test channel)" in `ci-channel-test.yml`, after the test-channel upgrade, full or packages-only (`[apps-only]`). `[skip-e2e]` skips it. |

## Running

- One solution: `cd SharePointFramework/<Solution> && npm test` (= `heft test`, builds first). One file: `npx heft test --test-path-pattern <name>`.
- Consumers need the shared library built first: `rush rebuild -o pp365-shared-library` from the root.
- E2E locally: `cd e2e && cp .env.example .env` (fill in) `&& npx playwright install chromium && npm test`. `npm run test:ui` for the inspector.

## The harness: `pp365-jest-config` (SharePointFramework/.jest-config)

Every solution's `config/jest.config.json` extends `pp365-jest-config/jest-shared.config.json`, which extends the SPFx rig's config (jsdom, `lib-commonjs` roots, coverage, JUnit). It adds:

- `lib/setup.js`: jest-dom matchers; polyfills `matchMedia`, `ResizeObserver`, `IntersectionObserver`, `scrollTo`.
- `lib/resolver.js`: resolves SPFx string modules (`SharedLibraryStrings`, `SharedResources`, `<Solution>Strings`) via `config/config.json` `localizedResources` to the `nb-no` bundle (`PP365_TEST_LOCALE=en-us` switches). `lib/amdTransform.js` turns those AMD bundles into CommonJS. A syntax error in a loc `.js` therefore fails the test run.
- `lib/spfxStub.js` mapped over `@microsoft/sp-*` (their lib-commonjs needs Microsoft-internal modules): chainable proxy plus real values for `DisplayMode`, `Guid`, `Log`, `Text`, `Version`, `UrlQueryParameterCollection`, `EnvironmentType`, `PropertyPaneFieldType`, `PlaceholderName`; extend `KNOWN` when a test needs more. `@microsoft/sp-lodash-subset` maps to real lodash. `react-markdown` renders its source as text; `rehype-*`/`remark-*` are no-op plugins. `window.__themeState__` carries SharePoint's default palette.
- `lib/pnpStub.js` mapped over `@pnp/*`: PnPjs 4 is ESM-only and cannot be required under Jest. Imports and chaining succeed; awaiting a PnP call rejects with "PnPjs is not available in unit tests". Mock the adapter/service instead.
- `moduleNameMapper`: `pp365-shared-library`, `pp365-projectwebparts`, `pp365-portfoliowebparts` resolve to their `lib-commonjs/` output.
- jest-dom types come from `src/jest-dom.d.ts` in each solution (the rig pins `typeRoots`, so `compilerOptions.types` cannot list the package).

## Writing tests

- **`jest.mock(...)` must precede the import statements.** Heft runs Jest on TypeScript's CommonJS output with no Babel, so mocks are not hoisted; TypeScript preserves statement order, which is what makes a mock above the imports take effect.
- Unit: next to the code, `foo.test.ts`. Never import `@pnp/*` in a test; test against structural stand-ins (`shared-library/src/services/EntityPortalService/pnpShapes.ts`) or mock the adapter with `jest.mock`.
- Component: `@testing-library/react` 12 (React 17), `@testing-library/user-event` for interaction. Data comes from a hook or adapter, so `jest.mock('./useX', ...)`. `.module.scss` classes resolve to their names. Strings are the Norwegian texts. Pattern: `ProjectWebParts/src/components/ProjectStatus/Header/Header.test.tsx`; shared-library `LoadingSkeleton.test.tsx`.
- Fluent v9's first load costs 15-45 s per test file: group a feature's tests in one file rather than one file per tiny component.
- SPFx context: pass a minimal object with exactly the fields the component reads. Do not build a general SPFx mock.
- E2E: read-only smoke specs in `e2e/tests/smoke`. Fixtures in `e2e/tests/fixtures/pp365.ts`: `openPage` (normalized URL, 404 reported with the URL), `resolvePage(site, candidates)` (looks the page up in the site's SitePages via REST and skips with the existing page names when none matches), `webPart(page, text)` and `WEB_PART` = `[data-sp-web-part-id]` (the only marker shared by canvas pages and single web part app pages), and a console guard that fails on missing-module errors while ignoring SharePoint's own CSP noise. Verified 2026-09-21 against the test hub: 6 passed, status page and project tests skipped (page missing / `E2E_PROJECT_URL` placeholder). Sign-in in `tests/auth.setup.ts` with `E2E_USERNAME`/`E2E_PASSWORD`; `E2E_BASE_URL` is the hub, `E2E_PROJECT_URL` a provisioned project. Use the `playwright-cli` skill (`references/test-generation.md`) to plan, generate and heal specs.

## When a test fails

- In a build: the build stops. Reproduce with `npm test` in the solution, decide code vs test, fix the code for regressions; update the test in the same commit only for intentional behaviour changes. Never delete an assertion to go green.
- E2E: the job log lists each test and prints the assertion and locator per failure (`github` reporter). The full report is the `playwright-report-test-channel` artifact (14 days): `playwright-report/` (HTML) and `test-results/` (`error-context.md` page snapshot, screenshot, video, `trace.zip` on retry, `junit.xml`). Fetch and open from `e2e/` with `gh run download <run-id> -n playwright-report-test-channel -D ci-report && npx playwright show-report ci-report/playwright-report`. The workflow triggers on push to its listed branches when `SharePointFramework/**`, `Install/**`, `Templates/**` or `e2e/**` change, and manually via `workflow_dispatch`; a push also upgrades the test tenant. Environment (sign-in, MFA, missing page) → fix secret/policy/variable and rerun. Regression → issue labelled `bug` + `e2e` with the run link; release blocked. Intentional UI change → heal the spec in its own commit. One CI retry exists; three consecutive flaky runs → `test.fixme` plus an issue, not more retries.

## Do not

- Do not add `@pnp/*` transforms or try to load PnPjs in Jest without updating `pp365-jest-config` and this skill.
- Do not change `pp365-jest-config` without running `heft test` in `shared-library` and one consumer.
- Do not put tests under `lib/`, `temp/` or outside `src/`; Heft only compiles `src/**`.
