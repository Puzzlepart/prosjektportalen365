---
name: pp365-toolchain
description: 'Repo-specific rules for the Prosjektportalen 365 SPFx monorepo toolchain (Rush + pnpm + Heft). Use together with the generic `spfx` skill when: "upgrade SPFx", "gulp to Heft", "m365 spfx project upgrade", "rush update", "add a dependency", "heft build", "channel build", "watch / serve / debug a web part", "shared-library not picked up", "sppkg", "Build-Release.ps1", "lint rule". Encodes what the generic skill does not know: Rush/pnpm translation of npm commands, the eleven Rush projects, the shared library, channel builds, the checks of the release build, and the traps found during the 1.17.4 to 1.23.2 migration.'
argument-hint: 'Describe the toolchain task (upgrade step, dependency change, build/serve problem)'
---

# PP365 toolchain (Rush + pnpm + Heft)

Depth (Norwegian): `.development-guide/spfx/rush.md`, `npm-skript.md`, `utviklingsmiljo.md`, `.development-guide/ci/kontinuerlig-integrasjon.md`, `.development-guide/utgivelse/bygge-utgivelse.md`. For an SPFx upgrade: `docs/plans/dependency-upgrades-phase-5.md` (SPFx 1.24 and React 18, slice 4) and the pattern it follows, `docs/plans/spfx-1.23-heft-toolchain.md` (Decisions A to E) with `docs/plans/spfx-1.23-heft-toolchain/reports/_distilled.json`. The generic `spfx` skill covers the upstream procedure; this skill overrides it where they disagree. Version-bound facts here are for SPFx 1.24.0-rc.0 (phase 5, slice 4): rig 1.24.0-rc.0, Heft 1.3.2, heft-jest-plugin 2.0.19, heft-lint-plugin 1.3.1, ESLint 9.37.0, the rig's own TypeScript 5.3.3 (the solutions compile with ~5.8.3). Moving from the RC to 1.24 GA is a version bump of every `@microsoft/*` pin; re-check these then.

## Layout

- Eleven Rush projects (`rush.json`). Six SPFx solutions under `SharePointFramework/`: `shared-library` (SPFx **Library** component, npm `pp365-shared-library`), `PortfolioExtensions`, `PortfolioWebParts`, `ProgramWebParts`, `ProjectExtensions`, `ProjectWebParts`. Five others: `Templates`, `SharePointFramework/.tasks` (shared build scripts), `SharePointFramework/.eslint-config` (`pp365-eslint-config`), `SharePointFramework/.jest-config` (`pp365-jest-config`) and `e2e` (`pp365-e2e`).
- The five consumers import `pp365-shared-library` (barrel and deep `pp365-shared-library/lib/...`), linked with `workspace:*`. `PortfolioWebParts` also imports `pp365-projectwebparts/lib/...`; `ProgramWebParts` imports `pp365-portfoliowebparts/lib/...` and takes ProjectWebParts' strings through `localizedResources` in `config/config.json`. `rush build` orders them.
- The five consumers share one script set (`watch`, `prewatch`, `postwatch`, `start`, `build`, `build:<channel>`, `lint`, `prettier`, `validate-loc`, `test`, ...); change it in all five at once. `validate-loc --dts` names the file exactly: `myStrings.d.ts` in PortfolioExtensions and ProjectExtensions, `mystrings.d.ts` elsewhere. `shared-library`'s `watch` is `heft build-watch --clean` (no dev server, no `prewatch`/`postwatch`), and its `build` and `test` also run `test:runtime`.

## Package management (never bypass Rush)

- **Never run `npm install`, `npm i`, `pnpm i`, `pnpm add` or `pnpm un` inside a solution.** They corrupt the Rush-managed `node_modules` and ignore the shared lockfile.
- To change a dependency: edit the solution's `package.json`, then `npm run rush:update` from the repo root (or `rush add -p <pkg>@<version> --exact [--dev] [--all -m]` in a solution). Pin exactly: SPFx, React 17.0.1, `@types/react` 17.0.45, the PnP controls (3.25.0 / 3.24.0), `@fluentui/react` 8.106.4. Fluent v9 packages are tilde ranges (`@fluentui/react-components ~9.74.8`), the same wherever declared.
- Overrides go in `common/config/rush/pnpm-config.json` `globalOverrides` (a report's `pnpm pkg set overrides...` or `"resolutions"` too); among them Heft, `@types/react(-dom)` and Fluent v9's focus stack (`@fluentui/react-tabster`, `keyborg`, `tabster`, one tabster per page). Re-check those three on every Fluent v9 bump: `npm view @fluentui/react-tabster@<version> dependencies`.
- The lockfile is `common/config/rush/pnpm-lock.yaml`. Regenerate it only when the plan says so (`rush update --full`), and say so in the commit.
- `@fluentui/react` (v8) is declared only by `shared-library` (the `Icon` fallback in `src/icons/index.tsx`); the PnP controls resolve the same 8.106.4. Consumers must not add it back. The PnP controls' own PnPjs 2.5.0 is isolated; never force it onto v4.
- `xlsx` (shared-library) is the tarball `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`, not an npm version: bump it by editing the URL and running `rush update` (the lockfile keeps URL and integrity). An empty store needs `cdn.sheetjs.com` to install; GitHub's dependency graph and Dependabot cannot track it, so check SheetJS's advisories at release (`docs/plans/dependency-upgrades-phase-5.md`, slice 1).

## Translating a CLI for Microsoft 365 upgrade report

Generate a report per solution, read-only, from inside the solution folder:

```
npx -y -p @pnp/cli-microsoft365@latest m365 spfx project upgrade --toVersion <version> --packageManager pnpm --shell bash --output md
```

Then:

1. **Apply the final state only.** The report concatenates every intermediate SPFx version.
2. **Shared library exceptions.** Ignore "remove `main`" (FN021001) and "remove `src/index.ts`" (FN015005) for `shared-library`: they are its public entry. Elsewhere, check that `src/index.ts` is unreferenced before deleting it.
3. Package commands become `package.json` edits (see above), `dependencies` vs `devDependencies` as the report states.
4. `.gitignore` is split: Heft output (`lib-commonjs`, `lib-dts`, `lib-esm`, `jest-output`, `.heft`) is in the **root** file under `SharePointFramework/**/`; `dist`, `lib`, `solution`, `temp` and `release` only in each solution's **own** `.gitignore`. Never prune those as redundant.
5. Fluent v8 Sass is gone (no `References.scss` import left): such a step has nothing to apply. Do not reintroduce it.
6. The lint stack lives in `SharePointFramework/.eslint-config/package.json` (ESLint 9.37.0, the SPFx and Rush Stack configs, `@typescript-eslint` 8, Prettier 3.9.7, plugins). Solutions declare only `eslint`, `prettier` and `pp365-eslint-config`; `eslint.config.js` is `module.exports = require('pp365-eslint-config')(__dirname)`. Bump lint packages there plus the `eslint`/`prettier` pins in the six solutions.
7. Run `rush update` once after editing all `package.json` files, then build in dependency order (`shared-library` first).

## Heft

- `npm run build` is `heft test --clean --production && heft package-solution --production`: the test phase depends on the build phase, so it builds, lints and runs Jest. Channel builds and `postversion` call `heft build`, which runs no Jest; neither does `heft start`.
- `npm run watch` is `heft start --nobrowser [--serve-config <name>]`. gulp is gone: no `gulpfile.js`, `gulp bundle/serve` or `build.addSuppression` (the rig's `config/sass.json` silences Sass deprecations).
- A watch bundles `shared-library` and ProjectWebParts from their `lib/` as it finds them: build them first (`rush build -T <package>`, or `npx heft build --clean` in each), or it fails with `Can't resolve ...` or serves stale code. `SERVE_CHANNEL` must match the page's channel (`test` on the test tenant). See `utviklingsmiljo.md`.
- To change `shared-library` under a solution's watch, start `npm run watch` in `shared-library` first (its `--clean` empties `lib/`, which breaks a running consumer until the first build is done). webpack follows the pnpm link to `SharePointFramework/shared-library/lib`, outside `node_modules`, so a saved `.ts(x)` or `.scss` rebuilds the solution and reloads the page (verified 2026-10-07: `lib/` after 1 s, the page after about 20 s). Strings are not watched: spfx-heft-plugins' `LegacyExternals` reads each `localizedResources` file once per watch and caches it, so a `loc/*.js` change (the solution's own or the library's) needs the solution's watch restarted; not even a rebuild picks it up. A sibling solution used as a dependency (ProjectWebParts under PortfolioWebParts) takes `npx heft build-watch`, not `npm run watch`, which would start a second dev server on port 4321.
- `config/spfx-customize-webpack.js`, identical in all six, exports `function (webpackConfig, taskSession, heftConfiguration, webpack)` and runs last (stage `MAX_SAFE_INTEGER`, after the serve plugin sets `devServer`). It turns the dev server's hot module replacement off (`reloadPageOnRebuild`): every bundle on a SharePoint page has its own webpack runtime, HMR fails with "[HMR] Update failed" and never reloads, while live reload reloads the page after each rebuild. Custom steps go in `config/heft.json` extending the rig's, or a Node script called from `.tasks/build.js`.
- Sass typings go to `temp/sass-ts`; never commit or hand-edit them.
- ESLint runs in the build phase, not in `heft start`. heft-lint-plugin 1.3.1 needs a flat `eslint.config.*` with ESLint 9 (`.eslintrc.*` only with 8). Stay on ESLint 9: 10 is outside the peer ranges of `@microsoft/eslint-config-spfx` 1.24.0-rc.0 and `@rushstack/eslint-config` 4.8.0.
- Still read: `config/config.json`, `package-solution.json`, `write-manifests.json`. `config/serve.json` is gitignored, generated by `prewatch` (`.tasks/createServeConfig.js`) from `config/serve.sample.json` and the per-developer `environments.json` (`SERVE_ENVIRONMENT` picks `default`): edit those, never `serve.json`. `{tenantDomain}` comes from `SPFX_SERVE_TENANT_DOMAIN`. The rig copies `src/**/*.js` (loc bundles) into `lib` and `lib-commonjs`; the `includeGlobs` in `config/typescript.json` is redundant. The rig tsconfig is `strict: true`; each solution loosens it.

## Shared library: bundled or runtime component?

Heft externalizes a linked dependency as a runtime library component only when its `dist` holds exactly one manifest (`CumulativeManifestProcessor`, `@microsoft/spfx-heft-plugins`); channel builds leave extra manifests in `shared-library/dist`, so behaviour flips with stale output. Decision A: bundle it into every consumer. A consumer manifest declares a component dependency only for webpack externals, so `keepLinkedPackagesBundled` removes the three `pp365-*` packages from `webpackConfig.externals`, which bundles the code and drops the dependency. Verify after a `--clean` build:

```
grep -o 'define(\[[^]]*\]' SharePointFramework/PortfolioWebParts/dist/*.js | grep pp365 || echo "OK: no pp365-* external"
```

A `pp365-*` name in that AMD list means externalized. The manifest is authoritative (`loaderConfig.scriptResources` entry with `"type": "component"`); `SharedLibraryStrings` as a `localizedPath` is the strings bundle, not the library. `Build-Release.ps1` fails on such a header (packaging proof, part 2).

## Channel builds

`npm run build:<name>` (`node ../.tasks/build.js --channel <name>`) writes the ids from `channels/<name>.json` into `config/package-solution.json` and every `manifest.json`, applies `SERVE_BUNDLE_REGEX`, runs `heft build --clean --production` and `heft package-solution --production` (no Jest), then reverts. `PP365_BUILD_NUMBER` (the CI run number) is stamped as the fourth version segment so SharePoint refetches manifests. CI skips `build.js`: `Build-Release.ps1 -Channel test` runs `modifySolutionFiles.js`, then the full `rush rebuild` with tests. If a build aborts, revert with `node ../.tasks/modifySolutionFiles.js --revert --force` and `node ../.tasks/setBundleConfig.js --revert`. Never commit `*.bak`, `config/.generated-solution-config.json`, or channel ids in manifests.

## Verification checklist after any toolchain change

1. `npm run rush:update` succeeds without peer warnings you did not expect.
2. `rush rebuild` is green; every solution emits `sharepoint/solution/*.sppkg`.
3. The AMD header check above finds no `pp365-*` external.
4. `npm run rush:lint` and `rush validate-loc` pass (see `AGENTS.md`).
5. A watch (dependencies built) serves a real page via `?debug=true&noredir=true&debugManifestsFile=https://localhost:4321/temp/build/manifests.js`, and picks up a `shared-library/src` change after the library is rebuilt.
6. `npm run build:test` succeeds and leaves the tree clean (it runs no tests).
7. `Install/Build-Release.ps1 -CI -SkipBundle` (or CI) produces the release on Node 22. Only this enforces the coverage floors in `config/jest.config.json` (Heft passes on a miss; the script greps `rush-logs`) and the packaging proofs: a fresh `.sppkg` each, no `pp365-*` external, no hashed third-party class names. Try changes to the build in `.github/workflows/ci-build-debug.yml` first: a push with `[build-debug]` in the subject (plus `[skip-ci]` to keep the live workflow idle) builds the test channel's package, deploys nothing, uploads package and Rush logs.

## PnPjs 4 (beyond `AGENTS.md`; see `docs/plans/pnpjs-4-migration.md`)

- Every declared `@pnp/*` is 4.21.0 (`sp`, `core`, `queryable`, `logging`; `graph` only in ProjectExtensions).
- Term store: `getTermStore(sp.web).sets.getById(id).terms.select('*', 'localProperties').all()`. Never `@pnp/graph/taxonomy`: no `localProperties`, and it needs tenant-admin consent.
- From a returned payload, re-resolve handles (`web.getFileByServerRelativePath(info.ServerRelativeUrl)`, `web.siteGroups.getById(info.Id)`). `IItemAddResult`, `IItemUpdateResult`, `IFileAddResult`, `IFolderAddResult` are gone; `IListEnsureResult` is in `@pnp/sp/lists/types`.
- `sp-js-provisioning` is pinned to 1.4.0 (PnPjs 4 peers) in PortfolioExtensions and ProjectExtensions; bump by editing both and `npm run rush:update`. A v3 release fails every `new WebProvisioner(web)` with "IWeb is not assignable".

## CI, release build and memory

- Workflows run on `ubuntu-latest` (16 GB) with `NODE_OPTIONS=--max-old-space-size=8192` and `RUSH_PARALLELISM=2`; `Build-Release.ps1` defaults that heap when unset. PortfolioWebParts fails at 2 GB and passes at 3 GB; keep these on any other runner.
- `Build-Release.ps1` stops when `rush install` (CI) or `rush update` fails, with the tail of `SharePointFramework/rush-<install|update>.build.log`. `-RushTimeline` prints each project's rebuild time (also in the job summary); `-SkipPnPPowerShell` skips PnP.PowerShell and requires `-SkipBuildPnPTemplates`. The live `[apps-only]` job uses both.
- A phased Rush rebuild (build and test as separate phases) was tried and was slower on the CPU-bound 4-core runner; it is not used (`dependency-upgrades-phase-5.md`, slice 1c).
- Deploy jobs use `shell: pwsh`; `shell: powershell` is Windows-only.
- Linux is case sensitive (`SiteScripts/src`, `Install/Build-Release.ps1`, `myStrings.d.ts`). Audit path literals in `.tasks/*.js`, `Templates/.tasks/*.js` and `Install/*.ps1` after renaming anything; macOS will not catch it.
- Tests: see the `pp365-testing` skill.

## CSS from node_modules

The rig compiles every `.css` that is not `*.global.css` as a CSS module and hashes its class names. Third-party stylesheets are global (today only `react-calendar-timeline/lib/Timeline.css`, in `shared-library/src/components/ProjectTimeline/Timeline/index.tsx`), so `treatNodeModulesCssAsGlobal` routes node_modules `.css` to the rig's global-CSS loaders. It must EXCLUDE `node_modules/pp365-*` and any `*.module.*` file: making those global leaves `styles` undefined at runtime (every shared component broken on the tenant, caught only by e2e). Without the rule the timeline collapses into an unclickable overlay. Verify after a production build, in `SharePointFramework/ProjectWebParts`: `grep -c 'react-calendar-timeline_' dist/project-timeline-web-part_*.js` is 0 (packaging proof part 3 automates this) AND `grep -c 'fieldContainer_[0-9a-f]' dist/project-information-web-part_*.js` is at least 1 (a shared-library CSS module).

## Node globals under webpack 5

webpack 5 does not polyfill Node globals. `xml-js` (sp-js-provisioning) evaluates `json instanceof Buffer`, which threw "Buffer is not defined" when the template catalog provisioned a list. PortfolioExtensions and ProjectExtensions declare `buffer` as a devDependency, and `provideNodeGlobals` binds `Buffer` through `webpack.ProvidePlugin` (the hook's fourth argument). For another global, extend `provideNodeGlobals` rather than adding a global `resolve.fallback` (`process` is defined by the rig).

## Do not

- Do not pin Node below 22 or run the Heft toolchain on Node 16/18.
- Do not add `"overrides"` or `"resolutions"` to a solution's `package.json`.
- Do not delete `config/config.json`; Heft still reads it.
- Do not break the lint house rules (errors, `SharePointFramework/.eslint-config/index.js`): no `import * as` from `@fluentui/react-icons` (named imports via `shared-library/src/icons/iconCatalog.ts`); no root import of `@pnp/spfx-controls-react` or `@pnp/spfx-property-controls` (use `<package>/lib/<Control>`: neither declares `sideEffects`, so the root bundles every control and its Fluent v8); no deep import of `pp365-shared-library/lib/icons/iconCatalog`; `no-floating-promises`, `no-void` (statements allowed), `eqeqeq` (null ignored), `react/jsx-key`, `prettier/prettier`. Warnings do not fail the build (`allowWarningsInSuccessfulBuild`).
- Do not put skills anywhere but `.claude/skills` (Copilot reads it too): `npm run check-skills` (CI: `skills.yml`) fails on a copy in `.github/skills` or `.agents/skills`, a `name` unlike its folder, or a `description` over 1024 characters.
