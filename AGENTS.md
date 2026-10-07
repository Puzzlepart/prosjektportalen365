# AGENTS.md

Operational guide for AI coding agents working in **Prosjektportalen 365** — an open-source (Puzzlepart) SharePoint Framework (SPFx) monorepo managed with **Rush + pnpm**.

The build toolchain is **Heft** (SPFx 1.24, on its release candidate 1.24.0-rc.0 until GA; React 17; Rush Stack). The gulp toolchain was retired in the 1.17.4 to 1.23.2 migration; see `docs/plans/spfx-1.23-heft-toolchain.md` and the `pp365-toolchain` skill.

This is a thin operational index. The authoritative, detailed conventions live in **`.development-guide/`** (Norwegian) — read it for depth on anything below, and load the skill that covers your task (see [Skills](#skills)). Human contributors: see also `CONTRIBUTING.md`, and new developers `.development-guide/kom-i-gang.md` (a first-week path through the guide).

## Repository map

Every Rush project is listed in `rush.json`.

- `SharePointFramework/` — the SPFx solutions and their shared tooling:
  - `PortfolioExtensions`, `PortfolioWebParts`, `ProgramWebParts`, `ProjectExtensions`, `ProjectWebParts` — the five consumer solutions, with one script set and the conventions below. `PortfolioWebParts` also depends on `ProjectWebParts`, and `ProgramWebParts` on both
  - `shared-library` — shared code, published independently as `pp365-shared-library`; every consumer depends on it
  - `.tasks` (`pp365-spfx-tasks`) — shared build tasks (pre/post-watch, `validateLoc`, channel builds)
  - `.eslint-config` (`pp365-eslint-config`) — the shared ESLint 9 flat config with the house rules
  - `.jest-config` (`pp365-jest-config`) — the shared Jest harness
- `Templates/` (`pp365-templates`) — the hub's PnP template, the JSON project templates and their `.resx` texts
- `e2e/` (`pp365-e2e`) — Playwright end-to-end tests against the test tenant
- `channels/` — the solution and component ids of each release channel (`main`, `test`, `i18n`, `kurs`)
- `.claude/skills/` — the agent skills; `docs/plans/` — migration and feature plans
- `.tasks/` (repo scripts such as channel config, PnP templates, site scripts, SBOM and `check-skills`), `SiteScripts/`, `Install/` (install and upgrade scripts, `Build-Release.ps1`), `common/` (Rush), `.development-guide/` (the guide)

## Before you edit — gotchas that break things

1. **The localization triad must stay balanced.** Each solution has `src/loc/{mystrings.d.ts, nb-no.js, en-us.js}`; the typings file is `myStrings.d.ts` in `PortfolioExtensions` and `ProjectExtensions` (see gotcha 5). A key added to one goes into all three. `nb-no.js` is the default (Norwegian). Never leave a double comma (`,,`) in the `.js` files — it crashes the module at runtime.
2. **Nothing gates the triad fully, so check it yourself.** A key used in code but missing from the `.d.ts` fails TypeScript, and a syntax error in `nb-no.js` fails the tests that import the strings (Jest loads only `nb-no` unless `PP365_TEST_LOCALE` is set). A key missing from `en-us.js` passes the build and renders as `undefined` in English. `npm run validate-loc` writes the `.d.ts` keys missing from each bundle to `localization-report.md` (the console shows the counts), but exits 0 even then, cannot see a key that exists only in a `.js` file, and no build or CI job runs it: read its output.
3. **Do not hand-edit generated files** — they are gitignored and regenerated on build:
   - Sass typings — generated into `temp/sass-ts/` by the Heft build (they used to sit next to the source as `**/*.module.scss.ts`). Edit the `.scss`; keep the set of class names stable. Never edit or commit anything under `temp/`.
   - `**/src/loc/shared/*` — regenerated from `Templates/Portfolio/Resources.*.resx` (via the `Templates` `generate-resx-ts` task).
4. **Node 22** (`.nvmrc` = `22.22.2`, `rush.json` enforces `>=22.14.0 <23.0.0`). The SPFx 1.23 Heft toolchain requires it; another major fails the build, and `build-release` refuses to run.
5. **CI runs on Linux, so every path is case sensitive.** macOS hid mismatches such as `SiteScripts/Src` vs the real `SiteScripts/src` and `build-release.ps1` vs `Build-Release.ps1`; on `ubuntu-latest` they fail the release build. Spell paths in scripts, workflows and imports exactly as the filesystem does, and check with `ls` when in doubt.
6. **Production builds need more than Node's default heap on small machines.** The PortfolioWebParts build fails at a 2 GB heap and passes at 3 GB. CI (`ubuntu-latest`) and `Install/Build-Release.ps1` set `NODE_OPTIONS=--max-old-space-size=8192`; if a local `heft build --production` or `rush rebuild` dies with "Reached heap limit", export the same variable first.
7. **Lint errors fail the build** (Heft lints in its build phase; warnings do not fail). The house rules are in `SharePointFramework/.eslint-config/index.js`: no `import * as` from `@fluentui/react-icons`; no root import of `@pnp/spfx-controls-react` or `@pnp/spfx-property-controls` (import each control from its `/lib/<Control>` entry point); no deep import of `pp365-shared-library/lib/icons/iconCatalog`. `@typescript-eslint/no-floating-promises`, `no-void` (allowed only as a statement, `void promise;` for a deliberate fire-and-forget), `eqeqeq` (`== null` allowed), `react/jsx-key`, `unused-imports/no-unused-imports` and `prettier/prettier` are errors.
8. **PnPjs is v4 (4.21.0)**, and three v3 habits no longer compile or silently misbehave: `items.getAll()` and `import '@pnp/sp/items/get-all'` are gone (use `getAllItems(query)` from `pp365-shared-library`, which always sends `$top`; for a single row use `.top(1)()`); `sp.termStore` and `@pnp/sp/taxonomy` are gone (use `getTermStore(sp.web)` from `pp365-shared-library`, and `getTermLabel` for labels, which applies the fixed chain web language, then `nb-NO`, then `en-US`); `add`/`update`/`ensureUser`/`addUsingPath` resolve to the payload itself (`IFileInfo`, `IFolderInfo`, `ISiteUserInfo`, the created item), never to `{ data, file, folder, group, node }` wrappers. `sp-entityportal-service` is vendored as `SpEntityPortalService` in the shared library. Unit tests (`src/**/*.test.ts`, run by `heft test`) must not import `@pnp/*` (ESM-only under the CommonJS Jest runner); test against structural stand-ins as `shared-library/src/taxonomy/*.test.ts` does.

## Conventions (summary — full details in `.development-guide/spfx/kodemonster.md` and the `pp365-ui` skill)

- **Component folder + barrel** (for new and refactored components): `KomponentNavn/` containing `index.ts` (the barrel — **re-export only**, a `.ts` never `.tsx`, no logic/JSX), `KomponentNavn.tsx`, `KomponentNavn.module.scss`, `useKomponentNavn.ts`, `types.ts`, and optional `context.ts` / `reducer.ts`. Many older folders still have an `index.tsx` holding the component (e.g. `shared-library/src/components/WebPartTitle`): do not copy that shape, and restructure one only when that is the task.
- **Logic in hooks:** all state, effects, handlers and computed values live in a `useXxx` hook; the `.tsx` is JSX/presentation only.
- **Function style:** named top-level declarations (hooks + pure helpers) use the `function` keyword; components are arrow functions typed `const X: FC<Props> = …`; inline callbacks are arrows.
- **State sharing:** React **Context** for shared state across sub-components (avoid prop-drilling); **Redux Toolkit + `useReducer`** (in `reducer.ts`) for complex state.
- **Identifiers in English; user-facing text in Norwegian** via the loc bundle. Use the solution's strings module (`PortfolioExtensionsStrings`, `ProjectExtensionsStrings`, …) and `format(strings.Key, …)` from `pp365-shared-library` for interpolated values — never hard-code user-facing strings, including thrown `Error()` messages that surface in the UI.
- **Fluent UI v9** (`@fluentui/react-components`); icons via `getFluentIcon` (Fluent names only) or `getFluentIconWithFallback` (options object; legacy UI Fabric names resolve through `resolveFluentIcon` and `fabricIconAliases`, and unknown names fall back to the Fabric font), or `getIconComponentWithFallback` for a component-typed `icon` prop, all from `pp365-shared-library`. A dialog or drawer in its own React root gets `IdPrefixProvider` + `FluentProvider` with `customLightTheme` (the shared-library `Fluent` component does both); the shared wrappers (`BasePanel`, `Toolbar`, `UserMessage`, `ConfirmDialog`, `WebPartTitle`) carry their own, so add none around or inside them, and never one per cell or row (see `pp365-ui`). In our code, Fluent v8 (`@fluentui/react`) is left only in shared-library's UI Fabric icon fallback (`src/icons/index.tsx`); it still ships inside the PnP controls. Do not add it to a solution.
- **Styling:** `.module.scss` CSS modules, imported as `styles`, applied via `className={styles.x}`; nest selectors to mirror the component's DOM hierarchy.
- **Comments:** document symbols (exported functions, hooks, components, interfaces) with **JSDoc** (`/** */`) — a short purpose line, plus `@param`/`@returns` only when non-obvious. Reserve inline `//` comments for non-obvious **why** (rationale, gotchas, framework quirks), not for restating **what** the next line does; keep them tight.

## Commands

From the **repo root** unless noted:

| Task | Command |
|---|---|
| First-time setup (install + build all) | `npm run rush:init` |
| Install / refresh dependencies | `npm run rush:update` |
| Rebuild everything in dependency order (`rush rebuild`: full, not incremental; runs the Jest tests) | `npm run rush:build` |
| Rebuild only `shared-library` | `rush rebuild -o pp365-shared-library` |
| Lint + format all solutions (rewrites files: `prettier --write`, `eslint --fix`) | `npm run rush:lint` |
| Build a release package (`Install/Build-Release.ps1`; needs Node 22 and PowerShell 7, `pwsh`) | `npm run build-release` |
| Check the agent skills (one copy, valid `SKILL.md` frontmatter) | `npm run check-skills` |

Inside a solution (`SharePointFramework/<Solution>/`):

| Task | Command |
|---|---|
| Dev server + live-reload (`heft start --nobrowser`; consumers only) | `npm run watch` |
| Rebuild `shared-library` on every save while a solution's watch runs (`heft build-watch --clean`; no dev server, no tests) | `npm run watch` in `shared-library` |
| Dev server against a named environment | `npm run watch -- --serve-config <name>` |
| Build, test and package a shippable `.sppkg` (`heft test --clean --production` + `heft package-solution --production`) | `npm run build` |
| Lint + Prettier | `npm run lint` |
| Report loc keys missing from a bundle (exits 0 even then) | `npm run validate-loc` |
| Type-check only (needs the Sass typings in `temp/sass-ts` from an earlier Heft build) | `npx tsc --noEmit` |
| Run the solution's unit and component tests (`heft test`, builds first) | `npm test` |
| Run one test file | `npx heft test --test-path-pattern <name>` (a regex over the compiled test file's path, e.g. `ProjectStatus/reducer`; heft-jest-plugin 2.0.19, with SPFx 1.24, passes it on as Jest 30's `testPathPatterns`) |

After changing the loc files, run `validate-loc` and read its report. A dev server bundles `shared-library` and sibling solutions from their `lib/` as it finds them. To change `shared-library` under a solution's watch, start `npm run watch` in `shared-library` first: a saved `.ts(x)` or `.scss` reaches `lib/`, the solution rebuilds and the page reloads. Strings are the exception: a watch reads every `loc/*.js` (its own and the library's) once when it starts, so restart the solution's watch after editing them. Without the library's watch, rebuild it after a change (`rush rebuild -o pp365-shared-library`, or without tests `npx heft build --clean` inside it). To try local bundles on a test-tenant page, the solution's `.env` needs `SERVE_CHANNEL=test`: the page asks only for its own channel's component ids. Watching and debugging from VS Code: `.development-guide/spfx/utviklingsmiljo.md`.

## Testing

`heft test` runs the solution's `src/**/*.test.ts(x)` with Jest after the build phase, so `npm test`, `npm run build`, `rush build`/`rebuild` and CI run them, and a failing test fails them. `heft build` (used by the channel builds `npm run build:<channel>` and by `postversion`) and `heft start` (`npm run watch`) do not. `shared-library` also runs `test:runtime` (`node --test`) in `npm test` and `npm run build`. The shared harness is `pp365-jest-config` (`SharePointFramework/.jest-config`): jsdom, jest-dom, SPFx string modules resolved like at runtime, `@pnp/*` and `@microsoft/sp-*` stubbed. Components are tested with React Testing Library and `jest.mock` of their hook or data adapter; never import `@pnp/*` in a test.

**Coverage floors:** each solution's `config/jest.config.json` sets a `coverageThreshold`. Raise a floor when coverage grows; never lower one. Jest only reports a missed floor and Heft still passes, so only `Install/Build-Release.ps1` fails on it (CI, or a local `npm run build-release`), never `npm test` or `npm run build`: read the coverage summary before you push.

**End-to-end:** `e2e/` (Rush project `pp365-e2e`, Playwright) holds `tests/smoke` (pages and web parts render and fit), `tests/flows` (user journeys) and `tests/local` (a solution's local bundle through a dev server; only with `E2E_LOCAL_BUNDLE=1`, never in CI). Tests that write to the tenant clean up after themselves. CI runs smoke and flows after the test-channel upgrade. Locally: `npx playwright install chromium` once, then `cd e2e && npm test` with an `e2e/.env` from `.env.example` (the project and program tests skip without `E2E_PROJECT_URL` / `E2E_PROGRAM_URL`).

Full regime and failure handling: `.development-guide/spfx/testing.md` and the `pp365-testing` skill.

## Skills

`.claude/skills/` is the one copy of the agent skills: Claude Code reads project skills only from that folder, and GitHub Copilot reads it too. Never add `.github/skills` or `.agents/skills`; `npm run check-skills` (and the `Check skills` workflow) fails when either holds a file, and checks each `SKILL.md` against the Agent Skills rules Copilot applies (`name` equal to the folder name, a `description` of 1 to 1024 characters). Load the skill that covers the task:

- `pp365-toolchain` — Rush, pnpm and Heft: adding or bumping a dependency, builds and channel builds, watch/serve/debug, SPFx upgrades, a `shared-library` change not picked up.
- `pp365-testing` — writing, running and fixing tests: Jest unit and component tests on `pp365-jest-config`, and the Playwright suite.
- `pp365-ui` — building or changing UI: components and the shared-library wrappers, Fluent v9, icons, styling, strings, accessibility.
- `pp365-templates` — content that reaches sites: the hub PnP template, JSON project templates and their `.resx` texts, site scripts, channel ids, install and upgrade scripts.
- `pp365-release` — from a finished change to a release: commits and their CI tags, what CI runs, channels and version stamps, changelog, release notes, PRs, reading a failed run.
- `spfx` (upstream, generic) — creating and upgrading SPFx projects, React design, PnPjs; use with `pp365-toolchain`, whose Rush rules replace its npm commands.
- `playwright-cli` (upstream) — driving a real browser from the command line; use with `pp365-testing`.

## Notes

- The five consumer solutions share one script set (only the `validate-loc` interface and typings file names differ) and the conventions, so this single root file covers them. `shared-library`'s `watch` is `heft build-watch --clean` (it keeps `lib/` current and serves nothing); it has no `start`, `prewatch`, `postwatch` or `eject-webpack`, and runs `test:runtime` in `build` and `test`. Add a nested `AGENTS.md` inside a solution only if it accrues genuinely distinct rules.
- Per-developer workflow preferences (who runs git, who runs builds, editor setup) are intentionally **not** encoded here — they belong in personal agent memory, not in a shared repo file.
