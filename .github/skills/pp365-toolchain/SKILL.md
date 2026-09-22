---
name: pp365-toolchain
description: 'Repo-specific rules for the Prosjektportalen 365 SPFx monorepo toolchain (Rush + pnpm + Heft). Use together with the generic `spfx` skill when: "upgrade SPFx", "gulp to Heft", "m365 spfx project upgrade", "rush update", "add a dependency", "heft build", "channel build", "watch / serve / debug a web part", "shared-library not picked up", "sppkg". Encodes what the generic skill does not know: Rush/pnpm translation of npm commands, the six-solution layout, the shared library, channel builds, and the traps found during the 1.17.4 to 1.23.2 migration.'
argument-hint: 'Describe the toolchain task (upgrade step, dependency change, build/serve problem)'
---

# PP365 toolchain (Rush + pnpm + Heft)

Read first when the task is the SPFx/Heft migration: `docs/plans/spfx-1.23-heft-toolchain.md` (the plan; Decisions A to E, per-solution checklists, execution order), `docs/plans/spfx-1.23-heft-toolchain/reports/_distilled.json` (machine-distilled final state per solution: packages, files, SCSS lists, ignored report steps, repo facts) and, only when a detail is disputed, the raw report `reports/<solution>.md`. The generic `spfx` skill (`.claude/skills/spfx`) covers the upstream procedure; this skill overrides it wherever the two disagree.

## Layout

- Six SPFx solutions under `SharePointFramework/`: `shared-library` (SPFx **Library** component, npm name `pp365-shared-library`), `PortfolioExtensions`, `PortfolioWebParts`, `ProgramWebParts`, `ProjectExtensions`, `ProjectWebParts`. Plus two non-SPFx Rush projects: `SharePointFramework/.tasks` (shared build scripts) and `Templates`.
- The other five solutions import `pp365-shared-library` (barrel and deep `pp365-shared-library/lib/...` paths). `PortfolioWebParts` and `ProgramWebParts` also import `pp365-projectwebparts/lib/...`; `ProgramWebParts` imports `pp365-portfoliowebparts`. Rush symlinks these; `rush build` orders them.
- All solutions share one script set (`build`, `build:<channel>`, `watch`, `lint`, `prettier`, `validate-loc`). Change them in all six at once.

## Package management (never bypass Rush)

- **Never run `npm install`, `npm i`, `pnpm i`, `pnpm add` or `pnpm un` inside a solution.** They corrupt the Rush-managed `node_modules` and ignore the shared lockfile.
- To change a dependency: edit the solution's `package.json` with an **exact** version (no `^`/`~` for SPFx, React, Fluent, PnP controls), then run `npm run rush:update` from the repo root (equivalent: `node common/scripts/install-run-rush.js update`). Alternative: `rush add -p <pkg>@<version> --exact [--dev] [--all -m]` from a solution folder.
- Version overrides go in `common/config/rush/pnpm-config.json` under `globalOverrides`. A report line such as `pnpm pkg set overrides.@rushstack/heft=1.2.17` or a `"resolutions"` block means: add it to `globalOverrides`, not to the solution.
- The lockfile is `common/config/rush/pnpm-lock.yaml`. Regenerate it only when the plan says so (`rush update --full`), and say so in the commit.
- Keep versions consistent across solutions (`@fluentui/react` exactly `8.106.4` so PnP controls share one copy; React `17.0.1`; `@types/react` `17.0.45`).

## Translating a CLI for Microsoft 365 upgrade report

Generate a report per solution, read-only, from inside the solution folder:

```
npx -y -p @pnp/cli-microsoft365@latest m365 spfx project upgrade --toVersion <version> --packageManager pnpm --shell bash --output md
```

Then:

1. **Apply the final state only.** The report concatenates every intermediate SPFx version. Known superseded steps: `@microsoft/rush-stack-compiler-5.3` and the tsconfig `extends` pointing at it (FN002029, FN012017) are replaced by the Heft tsconfig that extends `@microsoft/spfx-web-build-rig/profiles/default/tsconfig-base.json` (FN015011).
2. **Shared library exceptions.** Ignore "remove `main`" (FN021001) and "remove `src/index.ts`" (FN015005) for `shared-library`: `main: lib/index.js` and `src/index.ts` are its public entry. For the other solutions, check whether `src/index.ts` exists and is referenced before deleting it.
3. Package commands become `package.json` edits (see above). `dependencies` vs `devDependencies` as the report states.
4. `.gitignore` is split: the Heft output folders (`lib-commonjs`, `lib-dts`, `lib-esm`, `jest-output`, `.heft`) are in the **root** file under `SharePointFramework/**/`, while `dist`, `lib`, `solution`, `temp` and `release` are only in each solution's **own** `.gitignore` (the root has `release/*` and `common/temp`, anchored to the repo root, plus `.dist`/`.temp` — not `dist`/`temp`). A new solution must carry its own `.gitignore`; never prune those entries as redundant.
5. SCSS: replace `@import '~@fluentui/react/dist/sass/References.scss'` with the `pkg:` form the report gives. Do not add the import to files that never had it.
6. Run `rush update` once after editing all `package.json` files, then build in dependency order (`shared-library` first).
7. The reports do not cover the ESLint plugin stack: `@typescript-eslint/*` 5.x, `eslint-plugin-prettier` 4, `eslint-config-prettier` 8, `eslint-plugin-unused-imports` 2, `eslint-plugin-react` 7.31 and `prettier` 2 all need the ESLint 9 / Prettier 3 versions listed in the plan. Prettier 3 renamed `--loglevel` to `--log-level`.

## Heft toolchain map

| gulp (until 1.21) | Heft (1.22+) |
|---|---|
| `gulp bundle --ship && gulp package-solution --ship` | `heft build --clean --production && heft package-solution --production` |
| `gulp serve-deprecated --nobrowser` | `heft start --nobrowser [--serve-config <name>]` |
| `gulp clean` | `heft clean` |
| `gulpfile.js` `configureWebpack.mergeConfig` | `config/spfx-customize-webpack.js` exporting `function (webpackConfig, taskSession, heftConfiguration, webpack)` (runs last), or `config/webpack-patch.json` `patchFiles` |
| custom gulp tasks | `config/heft.json` extending `@microsoft/spfx-web-build-rig/profiles/default/config/heft.json`, or a Node script called from `.tasks/build.js` |
| `build.addSuppression(...)` | not needed; Sass deprecations are silenced by the rig's `config/sass.json` |
| `src/**/*.module.scss.ts` generated in `src` | typings emitted to `temp/sass-ts`; never commit or hand-edit them |
| lint disabled in build | ESLint runs inside `heft build` (not in `heft start`); `@rushstack/heft-lint-plugin` 1.2.7 accepts flat `eslint.config.js|.cjs|.mjs` with ESLint 9 and legacy `.eslintrc.js` with ESLint 8; ESLint 10 is rejected |

Still used unchanged: `config/config.json` (bundles, externals, localizedResources), `config/package-solution.json`, `config/serve.json`, `config/write-manifests.json`. The rig's `copy-javascript` task copies every `src/**/*.js` (our loc bundles, including `src/loc/shared`) into `lib`, so no extra `includeGlobs` are needed for them. `heft start --serve-config <name>` picks `serveConfigurations.<name>.pageUrl` from `config/serve.json` (a `default` entry is mandatory when `serveConfigurations` is used); a `{tenantDomain}` placeholder is filled from the `SPFX_SERVE_TENANT_DOMAIN` environment variable. The rig tsconfig base is `strict: true`; each solution re-applies the repo's looser options in its own `tsconfig.json`.

## Shared library: bundled or runtime component?

Heft externalizes a linked dependency as a runtime library component only when that dependency's `dist` folder holds exactly one manifest (see `CumulativeManifestProcessor` in `@microsoft/spfx-heft-plugins`). Channel builds (`.tasks/build.js --channel test|kurs|i18n`) leave extra manifests in `shared-library/dist`, so behaviour flips with stale output. Today's release bundles the library into every consumer.

Mechanics (verified in `@microsoft/spfx-heft-plugins` 1.23.2 source): the consumer manifest declares a component dependency only for modules webpack actually treats as externals (`ManifestPlugin` looks up `linkedExternals` for each webpack `ExternalModule`). So removing a package name from `webpackConfig.externals` both bundles the code and drops the runtime dependency. Do it in `config/spfx-customize-webpack.js` (runs last, mutate in place):

```js
const BUNDLE_LINKED = ['pp365-shared-library', 'pp365-projectwebparts', 'pp365-portfoliowebparts']
module.exports = function (webpackConfig) {
  if (Array.isArray(webpackConfig.externals)) {
    webpackConfig.externals = webpackConfig.externals.filter((e) => !BUNDLE_LINKED.includes(e))
  }
}
```

Follow Decision A in the plan; whatever it says, verify after a build:

```
grep -o 'define(\[[^]]*\]' SharePointFramework/PortfolioWebParts/dist/*.js | grep pp365 || echo "OK: no pp365-* external"
```

`pp365-shared-library` present in that AMD dependency list means externalized (runtime component); absent means bundled. The manifest in `dist/*.manifest.json` is the authoritative source: a runtime dependency shows up in `loaderConfig.scriptResources` with `"type": "component"`. Note `SharedLibraryStrings` legitimately appears as a `localizedPath`; that is the localization bundle, not the library. Build with `--clean` so `dist` never carries stale manifests.

## Channel builds

`node ../.tasks/build.js --channel <name>` (or `npm run build:<name>`) rewrites `config/package-solution.json` and every `manifest.json` with the channel ids from `channels/<name>.json`, runs the production build, then reverts. If a build aborts, revert manually with `node ../.tasks/modifySolutionFiles.js --revert --force` and `node ../.tasks/setBundleConfig.js --revert`. Never commit `*.bak`, `config/.generated-solution-config.json`, or channel ids in manifests.

## Verification checklist after any toolchain change

1. `npm run rush:update` succeeds without peer warnings you did not expect.
2. `rush rebuild` is green; every solution emits `sharepoint/solution/*.sppkg`.
3. AMD define header check above matches Decision A.
4. `npm run rush:lint` and `rush validate-loc` pass (localization triad stays balanced, see `AGENTS.md`).
5. `heft start --nobrowser` in one web part solution serves a real page via the debug query string (`?debug=true&noredir=true&debugManifestsFile=https://localhost:4321/temp/build/manifests.js`), and a change in `shared-library/src` is picked up after rebuilding the library.
6. One channel build (`npm run build:test`) succeeds and leaves the working tree clean.
7. `Install/Build-Release.ps1 -CI -SkipBundle` (or the CI workflow) produces the release folder on Node 22.

## PnPjs 4 conventions (Phase 2, see `docs/plans/pnpjs-4-migration.md`)

- All six solutions are on `@pnp/{sp,core,queryable,logging,graph}` 4.21.0; the only other PnPjs in the bundles is the 2.5.0 nested inside `@pnp/spfx-controls-react`, which is isolated and must not be forced onto v4 via `globalOverrides`.
- `getAll()` is gone: `getAllItems(items.select(...).filter(...))` from `pp365-shared-library` (always sets `$top`, default 2000). One row: `.top(1)()`.
- Taxonomy is the ported SharePoint term store client in `shared-library/src/taxonomy`: `getTermStore(sp.web).sets.getById(id).terms.select('*', 'localProperties').all()`. Term labels go through `getTermLabel(term, languageTag)` (fixed fallback nb-NO, then en-US, then first label). Never reach for `@pnp/graph/taxonomy`: it has no `localProperties` and needs tenant-admin consent.
- Results of `add`, `update`, `ensureUser`, `files.addUsingPath`, `folders.addUsingPath`, `siteGroups.add`, `navigation.*.add` are the payloads (`IFileInfo`, `IFolderInfo`, `ISiteUserInfo`, `ISiteGroupInfo`, `INavNodeInfo`, created item JSON). Re-resolve handles via `web.getFileByServerRelativePath(info.ServerRelativeUrl)`, `web.siteGroups.getById(info.Id)`, etc. Types `IItemAddResult`, `IItemUpdateResult`, `IFileAddResult`, `IFolderAddResult` no longer exist; `IListEnsureResult` moved to `@pnp/sp/lists/types`.
- `sp-js-provisioning` must be on a PnPjs 4 release (1.4.0 or later, `@pnp/*` as peer dependencies). Bump it with `node docs/plans/pnpjs-4-migration-bump.js --provisioning-version=<v>` and `rush update`; a v3 release makes every `new WebProvisioner(web)` site fail with "IWeb is not assignable".
- Heft runs Jest on `src/**/*.test.ts` in every build (`heft test` gates `npm run build`). `@pnp/*` 4 is ESM-only and the Jest runner is CommonJS, so tests use structural stand-ins (`shared-library/src/services/EntityPortalService/pnpShapes.ts`) instead of importing `@pnp/*`.

## CI and memory

- Workflows run on `ubuntu-latest` (16 GB) with `NODE_OPTIONS=--max-old-space-size=8192` and `RUSH_PARALLELISM=2` set at workflow level; `Install/Build-Release.ps1` defaults the same heap when the variable is unset. The 7 GB macOS runner ran out of heap in PortfolioWebParts (fails at 2 GB, passes at 3 GB), so do not move the build jobs back to macOS without keeping these.
- Deploy jobs use `shell: pwsh`; `shell: powershell` is Windows-only and is not valid on Ubuntu.
- Linux is case sensitive: `SiteScripts/src`, `Install/Build-Release.ps1`. Audit path literals in `.tasks/*.js`, `Templates/.tasks/*.js` and `Install/*.ps1` after renaming anything; macOS will not catch it.
- Tests: see the `pp365-testing` skill. `heft test` is part of every build; `e2e/` is the Playwright project run after the test-channel deploy.

## CSS from node_modules

The rig runs every `.css` that is not `*.global.css` through the CSS-modules loader and hashes the class names. Third-party stylesheets (`react-calendar-timeline/lib/Timeline.css`, `@fluentui/react/dist/css/fabric.min.css`) are global by nature, so `config/spfx-customize-webpack.js` (`treatNodeModulesCssAsGlobal`) routes third-party `.css` from node_modules to the rig's global-CSS loaders. The predicate must EXCLUDE workspace packages (`node_modules/pp365-*`, bundled from there) and any `*.module.*` file: making those global leaves `styles` undefined at runtime ("Cannot read properties of undefined (reading 'accordionChevron')", every shared component broken on the tenant, caught by e2e only after deploy). Symptom when the rule is missing entirely: the timeline collapses into an unclickable overlay. Verify after a production build: `grep -c 'react-calendar-timeline_' dist/project-timeline-web-part_*.js` is 0 AND `grep -c 'accordionChevron_[0-9a-f]' dist/project-information-web-part_*.js` is at least 1.

## Node globals under webpack 5

webpack 4 (gulp) polyfilled Node globals silently; webpack 5 (Heft) does not. `xml-js` (used by sp-js-provisioning for field/view XML) evaluates `json instanceof Buffer`, which threw "Buffer is not defined" the first time the template package catalog provisioned a list. Solutions that bundle such code (PortfolioExtensions, ProjectExtensions) declare `buffer` as a devDependency and `config/spfx-customize-webpack.js` (`provideNodeGlobals`) binds `Buffer` through `webpack.ProvidePlugin` when the package resolves. The hook receives `webpack` as its fourth argument. If another Node global surfaces (`process` is already defined by the rig, `stream` for sax is handled), extend `provideNodeGlobals` rather than adding a global `resolve.fallback`.

## Do not

- Do not pin Node below 22 or run the Heft toolchain on Node 16/18.
- Do not add `"overrides"` or `"resolutions"` to a solution's `package.json`.
- Do not delete `config/config.json`; Heft still reads it.
- Do not `import * as Icons from '@fluentui/react-icons'` (see `.eslintrc`/flat config rule and `AGENTS.md`).
