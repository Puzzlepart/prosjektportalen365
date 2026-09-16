# Handoff: SPFx 1.17.4 (gulp) to 1.23.2 (Heft) migration

Written for: the next AI coding agent (GitHub Copilot or Claude Code) and the developer continuing this work. Date: 2026-09-16. Branch: `feat/toolchain-upgrade` (off `releases/1.15`, working tree otherwise clean at handoff).

## Where things are

| Artifact | Path | State |
|---|---|---|
| The plan (read this first) | `docs/plans/spfx-1.23-heft-toolchain.md` | Complete, 646 lines, corrections from three review passes applied. Decisions A, C, D marked Pending with recommended defaults. |
| Raw upgrade reports (one per solution) | `docs/plans/spfx-1.23-heft-toolchain/reports/<solution>.md` | Generated read-only with CLI for Microsoft 365 (`m365 spfx project upgrade --toVersion 1.23.2 --packageManager pnpm --shell bash --output md`). |
| Machine-distilled final state | `docs/plans/spfx-1.23-heft-toolchain/reports/_distilled.json` | Per solution: `finalPackages`, `filesRemove/Add/Modify`, `scss.requiredFix`, `ignoreSteps`, `repo` facts (alias imports, cross-package imports, gulpfile customisations, non-TS assets). `aggregate` has the cross-solution package tables. |
| Generic SPFx skill (Microsoft) | `.claude/skills/spfx/` and `.github/skills/spfx/` | Copy of `plugins/spfx/skills/spfx` from github.com/SharePoint/spfx-dev-skills, commit 31010d2 (2026-09-02). Identical copies; keep in sync. |
| Repo-specific companion skill | `.claude/skills/pp365-toolchain/SKILL.md` and `.github/skills/pp365-toolchain/SKILL.md` | Rush translation rules, report quirks, shared-library exceptions, verification checklist. Identical copies. |
| `.gitignore` | root | `!.claude/skills/` appended so the skills are committed. `.github/skills` was never ignored. |

Nothing in `SharePointFramework/`, `rush.json`, `common/`, `Install/` or `.github/workflows/` has been changed yet. Phase 1 has not started.

## What was verified (do not re-derive)

- Toolchain target: SPFx 1.23.2 (Heft rig), Node 22 (`>=22.14 <23`), TypeScript ~5.8.3, ESLint 9.37 flat config, Rush 5.179.0, pnpm 10.34.5, React stays 17.0.1, `@fluentui/react` exactly 8.106.4, PnP controls 3.25.0 / 3.24.0. `m365 spfx doctor --spfxVersion 1.23.2` accepts the local Node 22.22.2.
- `config/config.json` (bundles, externals, localizedResources) is still used by Heft. Webpack customisation goes in `config/spfx-customize-webpack.js` (function `(webpackConfig, taskSession, heftConfiguration, webpack)`, return value ignored, runs last).
- The shared library is bundled into every consumer today (confirmed in the release output: no consumer manifest depends on the library id). Heft externalizes a linked package only when its `dist` holds exactly one manifest, and `shared-library/dist` holds four, which is why bundling happens today by accident. The proposed fix, filtering the package names out of `webpackConfig.externals` in `config/spfx-customize-webpack.js`, reads correctly from the `ManifestPlugin` source but was **not** independently re-verified (see Verification status). This is Decision A in the plan.
- `@rushstack/heft-lint-plugin` 1.2.7 (pinned by the rig) accepts `eslint.config.js/.cjs/.mjs` with ESLint 9, rejects ESLint 10, and skips linting in watch mode. Lint runs inside `heft build`.
- The rig's `copy-javascript` task copies `src/**/*.js` (our loc bundles) into `lib`; TypeScript 5.8.3 compiles cleanly against the rig `tsconfig-base.json`; Heft's locale parameter is `--locales` (plural).
- The five web part/extension `src/index.ts` files are scaffold placeholders (safe to delete); the shared library's `src/index.ts` and `main` must stay. The gulpfile `XLSX` external is dead (only lowercase `xlsx` is imported). `colors`, `find`, `yargs`, `concurrently`, `livereload`, `webpack`, `ajv`, `@pnp/odata`, `@pnp/sp-taxonomy`, `jsom-ctx` are not imported in any `src`.
- The reports concatenate intermediate SPFx versions; apply only the final state (see "Report quirks and traps" in the plan). They also miss the ESLint plugin stack upgrade (typescript-eslint 5, prettier plugins, unused-imports, Prettier 2).

## Verification status of the plan

The plan was reviewed by five adversarial passes. Three completed and **all their corrections have been applied to the plan**; two ran out of model credits and were never run.

| Pass | Result |
|---|---|
| Report coverage (plan vs the six reports and `_distilled.json`) | Done. 10 checks confirmed, 5 minor corrections applied (script deviation from FN021004/FN021007 now stated, FN002029 reclassified as a deliberate skip rather than superseded, `includeGlobs` note corrected, PortfolioExtensions-only FN007002/FN026001/FN026002 documented, FN015014 `config/rig.json` missing-from-summary trap recorded). |
| Repository fidelity (paths, counts, unused-package claims) | Done. 28 checks confirmed, 11 corrections applied, including three substantive ones listed below. |
| Rush and pnpm correctness | Done. 10 checks confirmed, 5 corrections applied (pnpm 10 build approval is `globalOnlyBuiltDependencies` and `rush update` fails hard, pnpm 11 rationale corrected, `ensureConsistentVersions` belongs in `common-versions.json`, `update --full --purge`, commit all four `common/scripts` files). |
| **Heft toolchain mechanics** (plan claims vs `@microsoft/spfx-heft-plugins` source) | **Not run.** Re-run before executing Decision A and the serve changes. |
| **ESLint flat config details** | **Not run.** Re-run before writing `eslint.shared.config.js`. |

Three plan errors the repository pass caught, now fixed, worth knowing because they change what you should do:

1. **`setHiddenToolbox` is dead code today.** The gulp task was never wired into any build; the committed manifests already hold the intended values. Do not auto-run a port of it, or three more web parts get hidden in release builds.
2. **Manifest counts were read from stale `dist`.** `src` has 8 WebPart manifests in ProjectWebParts, 8 in PortfolioWebParts, 4 in ProgramWebParts. The 32/31/8 in `dist` are channel-build leftovers.
3. **Shared-library import counts were wrong.** The barrel is imported 241 times (236 files) and 135 times through 35 distinct deep `lib/...` paths (107 files), not 95 and 27.

Still unverified, so treat as assumptions until checked (this is what the two missing passes would have covered):

- That filtering names out of `webpackConfig.externals` in `config/spfx-customize-webpack.js` is sufficient to keep linked packages bundled, and that the customize hook reliably runs after the third-party externals hook (both register at webpack stage `MAX_SAFE_INTEGER`).
- Whether lint warnings (not just errors) fail a `--production` Heft build.
- Whether `eslint-plugin-prettier/recommended` is the correct flat-config export in 5.5.6, whether the `createRequire` plugin-resolution trick in the shared config works under pnpm, and whether `.prettierrc.yaml`'s `jsxBracketSameLine` must be renamed to `bracketSameLine` for Prettier 3.

## Open decisions

The plan's "Decisions" section marks A, C and D as Pending with a recommended default; B and E are decided.

- **A. Shared library**: keep it bundled in Phase 1 via the externals filter (recommended), or adopt runtime library components as a separate change.
- **C. ESLint**: SPFx flat React profile plus the repo's rules, with `@typescript-eslint/no-floating-promises` downgraded to a warning for the migration.
- **D. Serve and debug**: generate `serveConfigurations` from `environments.json`; the hosted workbench retires 2026-12-01.

## Not yet written (Phase 1 work)

`SharePointFramework/eslint.shared.config.js`, the new `.tasks/createServeConfig.js` logic, `.tasks/build.js` Heft commands, per-solution `config/rig.json`, `config/sass.json`, `config/typescript.json`, `config/spfx-customize-webpack.js`, `eslint.config.js`, new `tsconfig.json` files, all `package.json` edits, Rush and pnpm config, the `NODE_VERSION` variable, `Install/build-release.ps1`, and the documentation updates. The plan gives the content for each.

## How to continue with an agent

Open the repo on `feat/toolchain-upgrade` and start with a prompt like:

> Read `docs/plans/spfx-1.23-heft-toolchain/HANDOFF.md`, then `docs/plans/spfx-1.23-heft-toolchain.md`. Use the `pp365-toolchain` skill together with the `spfx` skill. Start Phase 1 step 1 (repo-wide changes) and step 2 (shared-library) exactly as the plan's "Execution order and verification" section describes, in dependency order. Never run `npm install` or `pnpm` inside a solution; edit `package.json` and run `rush update` from the root. Keep `main` and `src/index.ts` in `shared-library`. Report each step's verification result before moving on.

Working rules that were in effect and should stay:

- The developer runs git and builds themselves; the agent edits files and proposes commands.
- Localization triad rule and other conventions: `AGENTS.md`.
- Regenerate a report if needed from a solution folder: `npx -y -p @pnp/cli-microsoft365@latest m365 spfx project upgrade --toVersion 1.23.2 --packageManager pnpm --shell bash --output md`.
- Verify bundling after any build: `head -c 600 SharePointFramework/PortfolioWebParts/dist/portfolio-overview-web-part.js | grep -o 'define("[^"]*",\[[^]]*\]'` must not list `pp365-shared-library`.

## Later phases (not started)

Phase 2 PnPjs 3.17 to 4.21 (blockers: `sp-js-provisioning` pins 3.17.0, `sp-entityportal-service` pins 3.9.0, `@pnp/sp/taxonomy` removed, `getAll()` removed, `.data` gone from add/update). Phase 3 Fluent v8 to v9 completion (v8 in ~214 files) and dependency hygiene. Phase 4 React 18 with SPFx 1.24 GA. Details at the end of the plan.
