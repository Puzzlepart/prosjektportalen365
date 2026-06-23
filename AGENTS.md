# AGENTS.md

Operational guide for AI coding agents working in **Prosjektportalen 365** — an open-source (Puzzlepart) SharePoint Framework (SPFx) monorepo managed with **Rush + pnpm**.

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
   - `**/*.module.scss.ts` — regenerated from the sibling `.module.scss`. Edit the `.scss`; keep the set of class names stable.
   - `**/src/loc/shared/*` — regenerated from `Templates/Portfolio/Resources.*.resx` (via the `Templates` `generate-resx-ts` task).
3. **Node 16** (`.nvmrc` = `16.18.0`). The SPFx/gulp toolchain targets it; a newer Node can fail **silently** and produce a stale `.sppkg` — especially `build-release`.

## Conventions (summary — full details in `.development-guide/spfx/kodemonster.md`)

- **Component folder + barrel:** `KomponentNavn/` containing `index.ts` (the barrel — **re-export only**, a `.ts` never `.tsx`, no logic/JSX), `KomponentNavn.tsx`, `KomponentNavn.module.scss`, `useKomponentNavn.ts`, `types.ts`, and optional `context.ts` / `reducer.ts`.
- **Logic in hooks:** all state, effects, handlers and computed values live in a `useXxx` hook; the `.tsx` is JSX/presentation only.
- **State sharing:** React **Context** for shared state across sub-components (avoid prop-drilling); **Redux Toolkit + `useReducer`** (in `reducer.ts`) for complex state.
- **Identifiers in English; user-facing text in Norwegian** via the loc bundle. Use the solution's strings module (`PortfolioExtensionsStrings`, `ProjectExtensionsStrings`, …) and `format(strings.Key, …)` for interpolated values — never hard-code user-facing strings, including thrown `Error()` messages that surface in the UI.
- **Fluent UI v9** (`@fluentui/react-components`); icons via `getFluentIcon` / `getFluentIconWithFallback` from `pp365-shared-library`. Wrap dialogs/drawers in `IdPrefixProvider` + `FluentProvider` with `customLightTheme`.
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
| Build a release package (needs Node 16) | `npm run build-release` |

Inside a solution (`SharePointFramework/<Solution>/`):

| Task | Command |
|---|---|
| Dev server + live-reload | `npm run watch` |
| Build a shippable `.sppkg` | `npm run build` |
| Lint + Prettier | `npm run lint` |
| Validate localization balance | `npm run validate-loc` |
| Type-check only | `npx tsc --noEmit` |

After changing the loc files, run `validate-loc`. After changing `shared-library`, rebuild it (`rush rebuild -o pp365-shared-library`) so dependent solutions pick up the change.

## Notes

- The five SPFx solutions share an identical script set and conventions, so this single root file covers them. Add a nested `AGENTS.md` inside a solution only if it accrues genuinely distinct rules.
- Per-developer workflow preferences (who runs git, who runs builds, editor setup) are intentionally **not** encoded here — they belong in personal agent memory, not in a shared repo file.
