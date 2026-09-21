# Handoff: SPFx 1.17.4 (gulp) to 1.23.2 (Heft) migration

Written for: the next AI coding agent (GitHub Copilot or Claude Code) and the developer continuing this work. Date: 2026-09-16. Branch: `feat/toolchain-upgrade` (off `releases/1.15`, working tree otherwise clean at handoff).

## Where things are

| Artifact | Path | State |
|---|---|---|
| The plan (read this first) | `docs/plans/spfx-1.23-heft-toolchain.md` | Complete, 646 lines, corrections from three review passes applied. All five decisions settled; Phase 5 (runtime library component) written up as future work. |
| Raw upgrade reports (one per solution) | `docs/plans/spfx-1.23-heft-toolchain/reports/<solution>.md` | Generated read-only with CLI for Microsoft 365 (`m365 spfx project upgrade --toVersion 1.23.2 --packageManager pnpm --shell bash --output md`). |
| Machine-distilled final state | `docs/plans/spfx-1.23-heft-toolchain/reports/_distilled.json` | Per solution: `finalPackages`, `filesRemove/Add/Modify`, `scss.requiredFix`, `ignoreSteps`, `repo` facts (alias imports, cross-package imports, gulpfile customisations, non-TS assets). `aggregate` has the cross-solution package tables. |
| Generic SPFx skill (Microsoft) | `.claude/skills/spfx/` and `.github/skills/spfx/` | Copy of `plugins/spfx/skills/spfx` from github.com/SharePoint/spfx-dev-skills, commit 31010d2 (2026-09-02). Identical copies; keep in sync. |
| Repo-specific companion skill | `.claude/skills/pp365-toolchain/SKILL.md` and `.github/skills/pp365-toolchain/SKILL.md` | Rush translation rules, report quirks, shared-library exceptions, verification checklist. Identical copies. |
| `.gitignore` | root | `!.claude/skills/` appended so the skills are committed. `.github/skills` was never ignored. |

**Status: Phase 1 is implemented and green** (see "Phase 1 progress" below); **Phase 2 (PnPjs 4) is implemented** (see the Phase 2 section near the end and `docs/plans/pnpjs-4-migration.md`). Commit Phase 1 and Phase 2 as separate commits.

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

## Decisions (all settled 2026-09-16)

| # | Decision | Outcome |
|---|---|---|
| A | Shared library bundling | **Keep bundled** in Phase 1 via the externals filter in `config/spfx-customize-webpack.js`. Moving to a runtime library component is deferred to Phase 5, which is now written up at the end of the plan. |
| B | TypeScript strictness | Keep today's looser options as overrides on the rig base; tighten later. |
| C | ESLint | SPFx flat React profile plus the repo's rules in one shared config, with `@typescript-eslint/no-floating-promises` downgraded to a warning for the migration. |
| D | Serve and debug | Generate `serveConfigurations` from `environments.json`; the hosted workbench retires 2026-12-01. |
| E | Rush and pnpm | Rush 5.179.0 with pnpm 10.34.5. |

Nothing is blocked on the maintainers. Phase 1 can start.

## Not yet written (Phase 1 work)

`SharePointFramework/eslint.shared.config.js`, the new `.tasks/createServeConfig.js` logic, `.tasks/build.js` Heft commands, per-solution `config/rig.json`, `config/sass.json`, `config/typescript.json`, `config/spfx-customize-webpack.js`, `eslint.config.js`, new `tsconfig.json` files, all `package.json` edits, Rush and pnpm config, the `NODE_VERSION` variable, `Install/Build-Release.ps1`, and the documentation updates. The plan gives the content for each.

## Phase 1 progress (started 2026-09-16)

Done, in the working tree, not yet built or committed:

- **Node**: all seven `.nvmrc` files say `22.22.2`; every solution `package.json` has `engines.node` `>=22.14.0 <23.0.0`.
- **Rush and pnpm**: `rush.json` at Rush 5.179.0 / pnpm 10.34.5 with `nodeSupportedVersionRange`; `common/config/rush/pnpm-config.json` rewritten with `useWorkspaces`, `resolutionMode`, `autoInstallPeers`, `strictPeerDependencies`, the `@rushstack/heft` and React type overrides, and an empty `globalOnlyBuiltDependencies` to fill from the first `rush update` error.
- **package.json x6** via `migrate-package-json.js` (263 changes): gulp toolchain and dead packages removed, every `@microsoft/sp-*` at 1.23.2, Heft rig and plugins added, ESLint 9 / Prettier 3 stack, TypeScript ~5.8.3, Fluent v8 pinned 8.106.4, PnP controls 3.25.0/3.24.0, scripts rewritten for Heft, `main` dropped from PortfolioExtensions only.
- **Heft config x6** via `migrate-config.js` (36 changes): `config/rig.json`, `config/sass.json`, `config/typescript.json`, a new `tsconfig.json` extending the rig base while restoring each solution's looseness, `lib` union and path aliases, per-solution `.gitignore` additions, `.yo-rc.json` at 1.23.2 with `useGulp: false` (and PortfolioExtensions' existing `sdksVersions` teams-js bumped in place).
- **SCSS**: all 28 `~@fluentui/...` imports rewritten to `pkg:@fluentui/...` (9 PortfolioWebParts, 15 ProjectWebParts, 2 ProgramWebParts, 1 ProjectExtensions, 1 shared-library).
- **Deleted**: six `gulpfile.js`; the five placeholder `src/index.ts` (the library's barrel is untouched).
- **Channel builds**: `.tasks/build.js` runs `heft build --clean --production` and `heft package-solution --production`.
- **Serve and debug (Decision D)**: `.tasks/createServeConfig.js` rewritten to generate `serveConfigurations` from `environments.json`, mapping `componentType`/`componentId`/`componentProperties` onto Heft `customActions`/`fieldCustomizers`, honouring `SERVE_ENVIRONMENT` for the required `default` entry; verified by generating a config for both an application customizer and a command set. The three web part `serve.sample.json` files moved off the retiring hosted workbench, ProjectExtensions' obsolete `core-build` schema fixed, and `.env.template` documents `SERVE_ENVIRONMENT` and `SPFX_SERVE_TENANT_DOMAIN`.
- **Release**: `Install/Build-Release.ps1` calls Rush through `common/scripts/install-run-rush.js` (CI uses `install`, local uses `update`) and fails fast unless Node is 22.
- **Docs**: `AGENTS.md` (Heft, Node 22, Sass typings now in `temp/sass-ts`, new commands), `.development-guide/spfx/npm-skript.md` and `utviklingsmiljo.md` rewritten for Heft. `.development-guide/README.md` is generated; regenerate with `npm run generate-readme`.

Two helper scripts live beside this file, `migrate-package-json.js` and `migrate-config.js`. Both are idempotent, take `--dry`, and should be deleted once Phase 1 ships.

Verified by reading the compiled toolchain sources, then landed:

- **Decision A is mandatory, not cosmetic.** `pp365-shared-library` declares exactly one component, so after a clean Heft build its `dist` holds one manifest and Heft *would* externalize it into a runtime library component, changing today's behaviour. `ManifestPlugin` emits a `type: "component"` dependency only for requests webpack turned into an `ExternalModule`, so dropping the name from `webpackConfig.externals` both bundles the code and removes the runtime dependency. `config/spfx-customize-webpack.js` (identical in all six solutions) does that and rebuilds `resolve.alias` from the tsconfig `extends` chain. It installs the filter as a property setter, so a later reassignment by the third-party externals plugin is re-filtered regardless of task ordering. Verified locally against the real tsconfig: aliases resolve to `<solution>/lib/*`, React and SPFx externals are preserved, `pp365-*` are removed, and a simulated late reassignment is re-filtered.
- **ESLint structure changed from the plan.** The shared file at `SharePointFramework/eslint.shared.config.js` resolves correctly via `createRequire`, but it sits outside every Rush project, so it is not an input to any build-cache key and nothing version-checks the plugin set. It is now a real Rush project, `SharePointFramework/.eslint-config` (`pp365-eslint-config`, registered in `rush.json`), which owns the whole lint stack. Each solution has a one-line `eslint.config.js` and keeps only `eslint`, `prettier` and `typescript`.
- **Other verified corrections applied**: `eslint-plugin-prettier/recommended` is an object, not an array, so it must not be spread; `react` and `react-hooks` must not be re-registered or ESLint 9 throws `Cannot redefine plugin`; `@typescript-eslint/eslint-plugin` must be declared explicitly or `unused-imports` silently degrades; `jsxBracketSameLine` was deleted rather than renamed, because the tree is already formatted as if it were off and renaming would rewrite roughly 580 JSX brackets; `prettier/prettier` is set to `warn` because the old config never enforced it and `--production` disables autofix.
- **Lint severity, decided during implementation.** Heft fails the build on ESLint errors and never on warnings, and lint does not run in watch mode. Beyond Decision C's `no-floating-promises`, two more rules are relaxed to `warn` for the migration: `@typescript-eslint/no-use-before-define` and `require-atomic-updates`. Both are `error` in the rushstack profile, neither was enforced before, and neither can be measured without running ESLint. Tighten all three once the tree is clean.
- **One behaviour change.** `CopyListData` used `new Promise(async (resolve) => ...)`, which `no-async-promise-executor` blocks. It is now an async `map` callback. This also fixes a latent bug: a failing `getBlob()` previously left the promise unsettled so `Promise.all` would hang, and now it rejects. It was the only such case in the repo.

Phase 1 is BUILT AND GREEN as of 2026-09-16 evening:

- `rush update` succeeds on Node 22 with Rush 5.179.0 / pnpm 10.34.5.
- **All six solutions build** and emit their `.sppkg`: shared-library 2.0 MB, project-web-parts 7.2 MB, portfolio-web-parts 10.5 MB, program-web-parts 4.8 MB, project-extensions 1.3 MB, portfolio-extensions 1.5 MB.
- `rush lint` passes 9/9 projects; `rush validate-loc` passes 9/9.
- **Decision A verified in real output**: zero `pp365-*` entries in any consumer's AMD dependency list and zero manifest component dependencies on the workspace packages. `SharedLibraryStrings` correctly remains a `localizedPath`. Note the shared library's `dist` dropped from four stale manifests to exactly one on a clean build, which is the condition that would have made Heft externalize it, so the filter is load-bearing.

Build failures encountered and fixed, all of them the newer toolchain enforcing something the old one ignored:

1. **TS1503, named capture groups** in `shared-library/src/models/ProjectColumn.ts`. TypeScript 5.5+ validates regex against the compile target and the rig targets ES5. Rewritten to numbered groups, parity verified against six inputs. Raising `target` was rejected: it would stop ES5 downleveling for every bundle.
2. **TS2550, `Object.entries` / `getOwnPropertyDescriptors`**. The six solutions had drifted to different, too-narrow `lib` lists while the code already used ES2017-2019 APIs; shared-library was the only one with `es2020`, which is why it alone compiled. All six are now `es2020`. `lib` is types-only and does not change emitted output.
3. **`office-ui-fabric-react` unresolved**. `pzl-spfx-components` declares no runtime dependencies and imports the old Fabric name implicitly, which npm's flat layout used to satisfy. Aliased to the `@fluentui/react` copy already bundled (Fabric v7 was renamed to Fluent v8). Only `ProjectInformation.tsx` uses it; dropping the package belongs to Phase 3.
4. **`@fluentui/react/dist/css/fabric.min.css` not exported**. Five web parts import it; Fluent 8.106.4's `exports` map exposes only `./dist/sass/*`, and webpack 5.105 enforces `exports` where the old build did not. Aliased the folder to its absolute path, so the same file still loads.
5. **`sax` requiring Node's `stream`** (warning only, in the two extensions). It is inside a `try/catch` with a fallback. Declared `resolve.fallback = { stream: false }` so the log stays free of noise that would mask real warnings.

Also fixed along the way: three ESLint errors (two `eslint-disable` comments naming `@typescript-eslint/ban-types`, deleted in typescript-eslint 8; one self-assigning `document.location.href` reload, now `location.reload()`, which was also a latent bug); six legacy `.eslintignore` files that ESLint 9 ignores, with their one still-needed pattern (`src/loc/**/*.js`) moved into the shared config; and a pre-existing `validate-loc` script in `pp365-spfx-tasks` that pointed at a non-existent `./src/loc`.

**`rush rebuild` exited 1 on lint warnings, which broke the whole release pipeline (fixed).** Rush returns a nonzero exit code when any project "succeeds with warnings". Under gulp this never fired because lint was disabled during the build (`build.lintCmd.enabled = false`); Heft runs ESLint in `heft build` and the repo carries ~700 warnings. `Install/Build-Release.ps1` treats a nonzero `rush rebuild` as fatal, so it aborted before packaging: empty `Apps/`, no zip, and CI would have failed on the first release push. Fixed with `"allowWarningsInSuccessfulBuild": true` on the `build` command in `common/config/rush/command-line.json`. Errors still fail the build. Do NOT also declare a bulk command named `rebuild`: that makes Rush look for a `rebuild` script, which no project has. The single `build` override governs `rush rebuild` too (verified: both exit 0).

**`Build-Release.ps1` shipped stale packages (pre-existing bug, fixed).** The copy loop globbed every `.sppkg` in each solution's gitignored `sharepoint/solution` folder, so a local release picked up 14 packages: the 6 real ones plus `-arkiv` packages from June and `-test` channel packages. `Install.ps1` deploys every `.sppkg` in `Apps`, so that would have pushed obsolete and wrong-channel apps to a tenant. Invisible in CI, where a fresh clone holds only the current build. It now copies only the package each solution declares in its own `config/package-solution.json`. Verified: 6 packages, 54 MB zip (was 112 MB with the duplicates).

**The `dot-notation` trap (found the hard way, now fixed).** The rushstack ESLint profile enables `dot-notation`, which is AUTOFIXABLE. The first `rush lint` rewrote 49 bracket accesses such as `result['GtSiteIdOWSTEXT']` into `result.GtSiteIdOWSTEXT`. Those properties are not declared on PnP's types (`ISearchResult`, `ISiteGroupInfo`, `IColumn`, `IWebInfo`, `IFileInfo`) because SharePoint payloads are deliberately accessed loosely here, so the "fix" broke compilation in five of six solutions. The old `.eslintrc.yaml` never enabled the rule. It is now `'off'` in `SharePointFramework/.eslint-config/index.js` with the reasoning inline, and all 49 sites were restored by driving the edit from `tsc`'s own error positions. **Do not re-enable it.** The lint loop is now idempotent: a second `rush lint` leaves every solution type-checking clean.

Note this nearly escaped: all six solutions were built BEFORE the first `rush lint`, so every build was green at the time. The next compile after linting was a channel build, which is the only reason it surfaced. When changing lint configuration, always re-compile afterwards, not just re-lint.

**Review note: the first `rush lint` reformatted 148 source files.** `npm run lint` is now `npm run prettier && eslint ./src --fix`, and this was the first run under Prettier 3 with the `prettier/prettier` rule enabled. The changes are formatting only, but they are mixed into the migration diff. Consider committing them separately.

Not done yet (needs tenant or repository access):

- ~~The GitHub repository variable `NODE_VERSION`~~ is no longer used by the active workflows. All four now use `node-version-file: '.nvmrc'`, so each branch selects its own Node version and no repository-wide variable has to be flipped at merge time (flipping it would have broken CI on `main` and `releases/1.15`, which still build with gulp on Node 16). The variable can be deleted once the workflows under `.github/workflows/unused/` are retired; they still reference it.
- ~~A channel build~~ has been run (`npm run build:test` on ProgramWebParts): it produced `pp-program-web-parts-test.sppkg` and reverted the tree cleanly. The revert path was also proven by a failing run.
- ~~`Install/Build-Release.ps1`~~ has been run locally end to end (exit 0, 6 packages, zip produced). The `-CI` path additionally runs `npm ci` and installs PnP.PowerShell, which has not been exercised.
- A smoke test in the test tenant. This is the only way to prove the bundles load; an accidental externalization shows up as a missing-module error in the browser, not at build time.
- Commit the refreshed `common/scripts`, `repo-state.json` and the regenerated lockfile, which Rush explicitly asked for.
- ~~`.development-guide/README.md`~~ has been regenerated (`npm run generate-readme`); it now has zero gulp references.

Sequence for the first build:

1. `node common/scripts/install-run-rush.js update --full --purge` on Node 22, after deleting `common/config/rush/pnpm-lock.yaml`. Expect it to fail once on pnpm 10 build-script approval; put the packages it names into `globalOnlyBuiltDependencies` in `common/config/rush/pnpm-config.json`.
2. Build `shared-library` first, then ProjectWebParts, PortfolioWebParts, ProgramWebParts, then the two extensions.
3. Run a non-production `heft build --fix` per solution before `npm run build`, so ESLint can autofix what it can. `--production` force-disables `--fix`, and `unused-imports/no-unused-imports` is still an error.
4. Triage lint output from `release/analysis-logs/lint.sarif`, which the rig writes on every run.
5. Escape hatch if a solution drowns in lint errors: rename its `eslint.config.js` to `eslint.config.js.disabled`. The lint task then logs "No ESLint config file found" and does nothing. Do not hand-write a `config/heft.json`; it replaces the rig's configuration wholesale unless it carries the right `extends`.
6. Verify Decision A after the first clean build of a consumer: the AMD header must not list `pp365-shared-library`.

```sh
grep -o 'define(\[[^]]*\]' SharePointFramework/PortfolioWebParts/dist/*.js | grep pp365 || echo "OK: no pp365-* external"
```

## Re-creating the toolchain sources for the two unfinished checks

The claims in the plan were read out of the compiled toolchain packages, not from documentation. Those extracts lived in a temporary folder that is now gone. To re-create them anywhere (they are read-only npm tarballs, nothing is installed into the repo):

```sh
mkdir -p /tmp/spfx-src && cd /tmp/spfx-src
for p in @microsoft/spfx-web-build-rig@1.23.2 @microsoft/spfx-heft-plugins@1.23.2 \
         @rushstack/heft@1.2.17 @rushstack/heft-lint-plugin@1.2.7 \
         @microsoft/eslint-config-spfx@1.23.2; do
  d=$(echo "$p" | tr '/@' '__'); mkdir -p "$d" && (cd "$d" && npm pack "$p" --silent >/dev/null && tar -xzf *.tgz)
done
```

The files that matter:

- externals and manifests: `spfx-heft-plugins/package/lib-commonjs/plugins/webpackConfigurationPlugin/WebpackConfigurationGenerator.js`, `.../spfxManifests/webpack/ManifestPlugin.js`, `.../spfxManifests/cumulativeManifestProcessor/CumulativeManifestProcessor.js`, `.../plugins/thirdPartyExternalsPlugin/{ThirdPartyExternalsPlugin,LegacyExternals}.js`, `.../plugins/CustomizeWebpackConfigurationPlugin.js`
- serve and debug: `.../plugins/webpackConfigurationPlugin/{WebpackServeConfigurationPlugin,ConfigureServe,updateServeConfigAsync,SPFxDebugPageUrl,SPFxDebugPageUrlUtilities}.js`, `.../spfxConfig/schemas/spfx-serve.schema.json`, and `spfx-heft-plugins/package/heft-plugin.json` for the CLI parameters
- build phases and defaults: `spfx-web-build-rig/package/profiles/default/config/heft.json`, `tsconfig-base.json`, `config/{sass,typescript}.json`
- lint: `heft-lint-plugin/package/lib-commonjs/{Eslint,LintPlugin,LinterBase}.js`, `eslint-config-spfx/package/lib-commonjs/flat-profiles/{default,react}.js`

## How to continue with an agent

Open the repo on `feat/toolchain-upgrade` and start with a prompt like:

> Read `docs/plans/spfx-1.23-heft-toolchain/HANDOFF.md`, then `docs/plans/spfx-1.23-heft-toolchain.md`. Use the `pp365-toolchain` skill together with the `spfx` skill. Start Phase 1 step 1 (repo-wide changes) and step 2 (shared-library) exactly as the plan's "Execution order and verification" section describes, in dependency order. Never run `npm install` or `pnpm` inside a solution; edit `package.json` and run `rush update` from the root. Keep `main` and `src/index.ts` in `shared-library`. Report each step's verification result before moving on.

Working rules that were in effect and should stay:

- The developer runs git and builds themselves; the agent edits files and proposes commands.
- Localization triad rule and other conventions: `AGENTS.md`.
- Regenerate a report if needed from a solution folder: `npx -y -p @pnp/cli-microsoft365@latest m365 spfx project upgrade --toVersion 1.23.2 --packageManager pnpm --shell bash --output md`.
- Verify bundling after any build: `grep -o 'define(\[[^]]*\]' SharePointFramework/PortfolioWebParts/dist/*.js | grep pp365 || echo "OK: no pp365-* external"

## Phase 2: PnPjs 3.17 to 4.21 (implemented 2026-09-21)

Plan, decisions A to E, per-solution status, verification and the finishing steps are in `docs/plans/pnpjs-4-migration.md`; read that before touching any data adapter. In short: `@pnp/*` is 4.21.0 in all six solutions; `getAll()` became `getAllItems()` from `pp365-shared-library`; the v3 taxonomy module was ported into `shared-library/src/taxonomy` (`getTermStore(sp.web)`, `getTermLabel` with the fixed nb-NO then en-US fallback chain); `sp-entityportal-service` was vendored into `shared-library/src/services/EntityPortalService`; add/update/ensureUser/addUsingPath results are the payloads themselves (no `.data`/`.file`/`.folder`).

Closed 2026-09-21: `sp-js-provisioning` 1.4.0 (PnPjs 4, peer dependencies) is published and both importers are bumped; `rush rebuild` is green in all nine projects with no boundary errors.

## CI runner (changed 2026-09-21)

The first Phase 1 CI run failed on `macos-latest` with `FATAL ERROR: Reached heap limit` in PortfolioWebParts. Reproduced locally: the production build of that solution dies at a 2 GB Node heap (the small runner's default) and passes at 3 GB. All build and deploy jobs now run on `ubuntu-latest` with `NODE_OPTIONS=--max-old-space-size=8192` and `RUSH_PARALLELISM=2` at workflow level, deploy steps use `shell: pwsh`, and `Install/Build-Release.ps1` defaults the same heap when unset. Every path the workflows and scripts reference was checked for exact-case existence, since Ubuntu's filesystem is case sensitive (the root `build-release` npm script had the wrong case).

Working rule for tests: Heft runs Jest on `src/**/*.test.ts` during every build. `@pnp/*` 4 is ESM-only and the Jest runner is CommonJS, so tests for code that talks to PnPjs are written against structural stand-ins (see `shared-library/src/services/EntityPortalService/pnpShapes.ts` and `src/taxonomy/*.test.ts`), never by importing `@pnp/*` in a test.

## Later phases (not started)

Phase 3 Fluent v8 to v9 completion (v8 in ~214 files) and dependency hygiene. Phase 4 React 18 with SPFx 1.24 GA. Phase 5 runtime library component for `pp365-shared-library`. Details at the end of the Phase 1 plan.
