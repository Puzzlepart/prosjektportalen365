# AGENTS.md

Operational guide for AI coding agents working in **Prosjektportalen 365** — an open-source (Puzzlepart) SharePoint Framework (SPFx) monorepo managed with **Rush + pnpm**.

The build toolchain is **Heft** (SPFx 1.23.2, Rush Stack). The gulp toolchain was retired in the 1.17.4 to 1.23.2 migration; see `docs/plans/spfx-1.23-heft-toolchain.md` and the `pp365-toolchain` skill.

This is a thin operational index. The authoritative, detailed conventions live in **`.development-guide/`** (Norwegian) — read it for depth on anything below. Human contributors: see also `CONTRIBUTING.md`.

## Repository map

- `SharePointFramework/` — the SPFx solutions, all sharing the same script set and conventions:
  - `PortfolioExtensions`, `PortfolioWebParts`, `ProgramWebParts`, `ProjectExtensions`, `ProjectWebParts`
  - `shared-library` — shared code, published independently as `pp365-shared-library`; the other solutions depend on it
  - `.tasks` — shared build tasks (pre/post-watch, `validateLoc`, channel build logic)
- `Templates/` — generates JSON provisioning templates + `.resx`-based localization for the templates
- `SiteScripts/`, `Install/` (release build), `common/` (Rush), `.development-guide/` (the guide)

## Before you edit — gotchas that break things

1. **The localization triad must stay balanced.** Each solution has `src/loc/{myStrings.d.ts, nb-no.js, en-us.js}`. A key added to one must be added to all three (identical key sets) or `validate-loc` and the build fail. `nb-no.js` is the default (Norwegian). Never leave a double comma (`,,`) in the `.js` files — it crashes the module at runtime.
2. **Do not hand-edit generated files** — they are gitignored and regenerated on build:
   - Sass typings — generated into `temp/sass-ts/` by the Heft build (they used to sit next to the source as `**/*.module.scss.ts`). Edit the `.scss`; keep the set of class names stable. Never edit or commit anything under `temp/`.
   - `**/src/loc/shared/*` — regenerated from `Templates/Portfolio/Resources.*.resx` (via the `Templates` `generate-resx-ts` task).
3. **Node 22** (`.nvmrc` = `22.22.2`, `rush.json` enforces `>=22.14.0 <23.0.0`). The SPFx 1.23 Heft toolchain requires it; another major fails the build, and `build-release` refuses to run.
4. **Production builds need more than Node's default heap on small machines.** The PortfolioWebParts build fails at a 2 GB heap and passes at 3 GB. CI (`ubuntu-latest`) and `Install/Build-Release.ps1` set `NODE_OPTIONS=--max-old-space-size=8192`; if a local `heft build --production` or `rush rebuild` dies with "Reached heap limit", export the same variable first.
5. **CI runs on Linux, so every path is case sensitive.** macOS hid mismatches such as `SiteScripts/Src` vs the real `SiteScripts/src` and `build-release.ps1` vs `Build-Release.ps1`; on `ubuntu-latest` they fail the release build. Spell paths in scripts, workflows and imports exactly as the filesystem does, and check with `ls` when in doubt.
6. **PnPjs is v4 (4.21.0)**, and three v3 habits no longer compile or silently misbehave: `items.getAll()` and `import '@pnp/sp/items/get-all'` are gone (use `getAllItems(query)` from `pp365-shared-library`, which always sends `$top`; for a single row use `.top(1)()`); `sp.termStore` and `@pnp/sp/taxonomy` are gone (use `getTermStore(sp.web)` from `pp365-shared-library`, and `getTermLabel` for labels, which applies the fixed chain web language, then `nb-NO`, then `en-US`); `add`/`update`/`ensureUser`/`addUsingPath` resolve to the payload itself (`IFileInfo`, `IFolderInfo`, `ISiteUserInfo`, the created item), never to `{ data, file, folder, group, node }` wrappers. `sp-entityportal-service` is vendored as `SpEntityPortalService` in the shared library. Unit tests (`src/**/*.test.ts`, run by every Heft build) must not import `@pnp/*` (ESM-only under the CommonJS Jest runner); test against structural stand-ins as `shared-library/src/taxonomy/*.test.ts` does.

## Conventions (summary — full details in `.development-guide/spfx/kodemonster.md`)

- **Component folder + barrel:** `KomponentNavn/` containing `index.ts` (the barrel — **re-export only**, a `.ts` never `.tsx`, no logic/JSX), `KomponentNavn.tsx`, `KomponentNavn.module.scss`, `useKomponentNavn.ts`, `types.ts`, and optional `context.ts` / `reducer.ts`.
- **Logic in hooks:** all state, effects, handlers and computed values live in a `useXxx` hook; the `.tsx` is JSX/presentation only.
- **Function style:** named top-level declarations (hooks + pure helpers) use the `function` keyword; components are arrow functions typed `const X: FC<Props> = …`; inline callbacks are arrows.
- **State sharing:** React **Context** for shared state across sub-components (avoid prop-drilling); **Redux Toolkit + `useReducer`** (in `reducer.ts`) for complex state.
- **Identifiers in English; user-facing text in Norwegian** via the loc bundle. Use the solution's strings module (`PortfolioExtensionsStrings`, `ProjectExtensionsStrings`, …) and `format(strings.Key, …)` for interpolated values — never hard-code user-facing strings, including thrown `Error()` messages that surface in the UI.
- **Fluent UI v9** (`@fluentui/react-components`); icons via `getFluentIcon` / `getFluentIconWithFallback` (options object; legacy UI Fabric names resolve through `fabricIconAliases`, `resolveFluentIcon` is the single lookup) from `pp365-shared-library`. Wrap dialogs/drawers in `IdPrefixProvider` + `FluentProvider` with `customLightTheme`.
- **Styling:** `.module.scss` CSS modules, imported as `styles`, applied via `className={styles.x}`; nest selectors to mirror the component's DOM hierarchy.
- **Comments:** document symbols (exported functions, hooks, components, interfaces) with **JSDoc** (`/** */`) — a short purpose line, plus `@param`/`@returns` only when non-obvious. Reserve inline `//` comments for non-obvious **why** (rationale, gotchas, framework quirks), not for restating **what** the next line does; keep them tight.

## Commands

From the **repo root** unless noted:

| Task | Command |
|---|---|
| First-time setup (install + build all) | `npm run rush:init` |
| Install / refresh dependencies | `npm run rush:update` |
| Build all solutions (dependency order) | `npm run rush:build` |
| Rebuild only `shared-library` | `rush rebuild -o pp365-shared-library` |
| Lint + format all solutions | `npm run rush:lint` |
| Build a release package (needs Node 22) | `npm run build-release` |

Inside a solution (`SharePointFramework/<Solution>/`):

| Task | Command |
|---|---|
| Dev server + live-reload (`heft start --nobrowser`) | `npm run watch` |
| Dev server against a named environment | `npm run watch -- --serve-config <name>` |
| Build a shippable `.sppkg` (`heft build` + `heft package-solution`) | `npm run build` |
| Lint + Prettier | `npm run lint` |
| Validate localization balance | `npm run validate-loc` |
| Type-check only | `npx tsc --noEmit` |
| Run the solution's unit and component tests (`heft test`, builds first) | `npm test` |
| Run one test file | `npx heft test --test-path-pattern <name>` |

After changing the loc files, run `validate-loc`. After changing `shared-library`, rebuild it (`rush rebuild -o pp365-shared-library`) so dependent solutions pick up the change.

End-to-end smoke tests live in `e2e/` (Rush project `pp365-e2e`, Playwright) and run in CI after the test-channel upgrade; locally `cd e2e && npm test` with an `e2e/.env` from `.env.example`.

## Testing

Every Heft build runs the solution's `src/**/*.test.ts(x)` with Jest; a failing test fails the build. The shared harness is `pp365-jest-config` (`SharePointFramework/.jest-config`): jsdom, jest-dom, SPFx string modules resolved like at runtime, `@pnp/*` and `@microsoft/sp-*` stubbed. Components are tested with React Testing Library and `jest.mock` of their hook or data adapter; never import `@pnp/*` in a test. Full regime, failure handling and the Playwright suite: `.development-guide/spfx/testing.md` and the `pp365-testing` skill.

## Notes

- The five SPFx solutions share an identical script set and conventions, so this single root file covers them. Add a nested `AGENTS.md` inside a solution only if it accrues genuinely distinct rules.
- Per-developer workflow preferences (who runs git, who runs builds, editor setup) are intentionally **not** encoded here — they belong in personal agent memory, not in a shared repo file.
