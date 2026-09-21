# Plan: SPFx 1.17.4 (gulp) to 1.23.2 (Heft) toolchain migration

Date: 2026-09-16. Status: Phase 0 (analysis and preparation) done, all decisions settled, Phase 1 not started. Branch: `feat/toolchain-upgrade`.

## Context

All six SPFx solutions under `SharePointFramework/` build with SPFx 1.17.4 and the gulp toolchain (`@microsoft/sp-build-web`), which requires Node 16 and TypeScript 4.5. Microsoft replaced gulp with Heft in SPFx 1.22 (Dec 2025); from SPFx 1.24 the gulp toolchain is officially unsupported. The current stack also blocks PnPjs 4, current Fluent UI releases, Node 22 in CI, and produces a stale `.sppkg` when built on the wrong Node (see `AGENTS.md`).

This plan covers **Phase 1: the toolchain**. It moves the repo to SPFx 1.23.2 on Heft, Node 22, TypeScript 5.8, ESLint 9, Rush 5.179 and pnpm 10, with the minimum dependency bumps the new toolchain forces. It deliberately leaves out PnPjs 4, the Fluent v8 to v9 UI work and React 18 (SPFx 1.24 is still preview).

The gulp 1.17 toolchain needs Node 16 and Heft 1.23 needs Node 22, and Rush installs the whole repo under one Node version. The switch therefore ships as **one change for all six solutions**; the work is sequenced per solution inside the branch (see Execution order).

Inputs: the six CLI for Microsoft 365 reports in `docs/plans/spfx-1.23-heft-toolchain/reports/` (read-only output of `m365 spfx project upgrade --toVersion 1.23.2 --packageManager pnpm --shell bash --output md`), the machine-distilled `reports/_distilled.json`, and a source read of `@microsoft/spfx-web-build-rig@1.23.2`, `@microsoft/spfx-heft-plugins@1.23.2` and `@rushstack/heft-lint-plugin@1.2.7`.

## Version targets

| Area | Now | Phase 1 target | Note |
|---|---|---|---|
| SPFx | 1.17.4, gulp | 1.23.2, Heft | 1.23.2 GA 2026-06-30 (1.23.1 delisted). 1.24 is preview (React 18). |
| Node | 16.18.0 | 22.x (`>=22.14.0 <23`) | Rig `engines`. Locally 22.22.2 via nvm. CI variable `NODE_VERSION` is still `16.18.0`. |
| Rush | 5.98.0 | 5.179.0 | Requires Node >= 20.9. |
| pnpm | 5.18.9 | 10.34.5 | Newest 10.x. Rush 5.179.0 has explicit pnpm 10.x and 11.x handling (CHANGELOG 5.176.0, 5.178.0, 5.179.0). pnpm 10 introduced build-script approval; pnpm 11 additionally stops reading the `pnpm` field of `package.json` and non-auth `.npmrc` settings, replaces `onlyBuiltDependencies` with `allowBuilds`, and defaults `minimumReleaseAge` to 1 day. Stay on 10 for Phase 1. The lockfile must be regenerated: pnpm >= 9 no longer reads lockfile v5. |
| TypeScript | 4.5.5 (rush-stack-compiler-4.5) | ~5.8.3 | Rig base tsconfig is `strict: true`; we override. Verified: TS 5.8.3 compiles cleanly against the rig base. |
| ESLint | 8.25.0, shared `.eslintrc.yaml` | 9.37.0, flat `eslint.config.js` | `@rushstack/heft-lint-plugin` 1.2.7 accepts `eslint.config.js/.cjs/.mjs` with ESLint 9 and rejects ESLint 10. Lint runs inside `heft build`, not in `heft start`. |
| React | 17.0.1 | 17.0.1 | Unchanged until SPFx 1.24 GA. `@types/react` 17.0.45 pinned via Rush override. |
| Fluent v8 | 8.98.1 | 8.106.4 exact | Matches `@pnp/spfx-controls-react` 3.25 / `spfx-property-controls` 3.24 so pnpm resolves one copy. |
| Fluent v9 | ~9.72.10 | unchanged | 9.74.7 available; bump belongs to Phase 3. |
| PnP controls | 3.15.0/3.17.0, ~3.19.0 | 3.25.0, 3.24.0 | Built against SPFx 1.23.0. |
| PnPjs | 3.17.0 | unchanged | Phase 2. |

## Decisions

All five decisions were confirmed by the maintainers on 2026-09-16; each follows the recommended option. The execution steps assume them.

### A. Shared library: keep bundled into consumers (Decided)

Facts. The five consumers import `pp365-shared-library` as an npm package (barrel plus deep `lib/...` paths). Release builds bundle the library code into every consumer bundle; consumer manifests have no component dependency on the library id `0f65a874-dc9d-491d-b979-6ce1d943dd00`. Heft's manifest discovery (`CumulativeManifestProcessor`) attaches a package name, and therefore externalizes the package as a runtime library component, only when the dependency's `dist` folder contains exactly one manifest. `shared-library/dist` currently contains four (main `0f65a874`, `test` `dbbc7e1a`, `kurs` `6cff2075` and `de08518e`, a stale id that matches no channel file), which is why it is bundled today. Heft cleans `dist` on every build, so after migration a clean build would flip the library into a runtime dependency without anyone deciding it.

Mechanics (from `@microsoft/spfx-heft-plugins` source). The consumer manifest declares a component dependency only for modules webpack actually treats as externals (`ManifestPlugin` matches each webpack `ExternalModule` against `linkedExternals`); `AsyncComponentPlugin` likewise only acts on external modules. Removing the package name from `webpackConfig.externals` therefore bundles the code and drops the runtime dependency in one move. The rig's `customize-configure-webpack` task calls `config/spfx-customize-webpack.js` last in the configuration chain (stage `MAX_SAFE_INTEGER`, after the third-party externals task), so a filter there is authoritative.

Options.
1. **Keep bundled (recommended for Phase 1).** Add the externals filter below to every consumer. Behaviour identical to today; no deployment coupling; `pp-shared-library.sppkg` keeps being deployed as before.
2. **Runtime library component.** Let Heft externalize. Consumer manifests then pin the library id and version; every release must deploy the library sppkg first, channel builds must swap the library id consistently (they do), and bundles shrink by roughly the library's size times the 29 components in `src` (20 web parts plus 9 extension components). Deferred to its own phase with its own smoke tests, not a side effect of the toolchain switch (see "Deferred to later phases").

**Decision: option 1.** Phase 1 keeps the current bundling behaviour; the move to a runtime library component becomes a separate, planned change once the toolchain migration has shipped.

`pp365-projectwebparts` and `pp365-portfoliowebparts` are also linked packages. Their `src` holds 8 WebPart manifests each (ProgramWebParts has 4), so they are never "single package" and are always bundled. Today's `dist` counts (32 and 31) are stale channel-build leftovers, not real component counts. Include both in the filter anyway for determinism.

```js
// SharePointFramework/<Solution>/config/spfx-customize-webpack.js
const BUNDLE_LINKED = ['pp365-shared-library', 'pp365-projectwebparts', 'pp365-portfoliowebparts']
module.exports = function (webpackConfig) {
  if (Array.isArray(webpackConfig.externals)) {
    webpackConfig.externals = webpackConfig.externals.filter((name) => !BUNDLE_LINKED.includes(name))
  }
}
```

Verification after every build: the AMD header of a consumer bundle must not list the library.

```sh
grep -o 'define(\[[^]]*\]' SharePointFramework/PortfolioWebParts/dist/*.js | grep pp365 || echo "OK: no pp365-* external"
```

### B. TypeScript strictness: keep today's options via overrides (Decided)

The rig base sets `strict: true`, `noImplicitAny: true` and a minimal `lib`. Every solution re-applies its current looseness (`strict: false`, `noImplicitAny: false`, `strictNullChecks: false`, `useUnknownInCatchVariables: false`, `noUnusedLocals: false`) plus `downlevelIteration`, `allowSyntheticDefaultImports`, the wider `lib`, and its `baseUrl`/`paths`. Tightening is a separate effort.

### C. ESLint: SPFx flat React profile plus repo rules, shared file (Decided)

**Decision: adopt the recommendation below.** Adopt the flat `eslint.config.js` the report generates, but compose it from one shared file `SharePointFramework/eslint.shared.config.js` that adds `eslint-plugin-prettier`, `eslint-plugin-unused-imports` and every rule from today's `.eslintrc.yaml`. The SPFx profile makes `@typescript-eslint/no-floating-promises` an error and several other rules errors (`guard-for-in`, `no-throw-literal`, `@typescript-eslint/no-use-before-define`, `@typescript-eslint/no-var-requires`); because lint runs inside `heft build`, each of these fails the build. Start with `no-floating-promises` downgraded to `warn` and downgrade others only if the first build shows mass violations; track the warnings as debt. Prettier 3 is required by `eslint-plugin-prettier` 5; the repo's `.prettierrc.yaml` already sets `trailingComma: none` and `semi: false`, so the format delta should be small, but run Prettier once as its own commit.

### D. Serve and debug: serve.json `serveConfigurations` from `environments.json` (Decided)

**Decision: adopt the recommendation below.** `heft start` (alias of `heft build-watch --serve`) opens `serveConfigurations.<name>.pageUrl` when `--serve-config <name>` is given, otherwise `serveConfigurations.default`, otherwise `initialPage`, and appends `?debug=true&noredir=true&debugManifestsFile=https://localhost:4321/temp/build/manifests.js` (plus `loadSPFX`/`customActions` for extensions). A `default` entry is mandatory once `serveConfigurations` exists. `{tenantDomain}` in a URL is replaced from the `SPFX_SERVE_TENANT_DOMAIN` environment variable. The hosted workbench (`_layouts/workbench.aspx`, used by the web part solutions' `serve.sample.json`) is retired on 2026-12-01. Recommendation: `.tasks/createServeConfig.js` generates `config/serve.json` with one `serveConfigurations` entry per `environments.json` environment (name to `siteUrl/page`), keeps the extension solutions' existing `customActions` entries, and developers run `npm run watch -- --serve-config <name>` (or set `SERVE_ENVIRONMENT`, which the script maps to the `default` entry). `livereload`/`concurrently` go away: webpack-dev-server reloads the page.

### E. Rush 5.179.0 with pnpm 10.34.5 (Decided)

`useWorkspaces: true`, `strictPeerDependencies: false`, lockfile regenerated from scratch. See Repo-wide changes.

## Repo-wide changes

### Node

- Replace the seven `.nvmrc` files (root and each solution) with `22.22.2` (or any 22.x >= 22.14).
- Add `"engines": { "node": ">=22.14.0 <23.0.0" }` to every solution `package.json` (report FN021003).
- Update the Node 16 statements. Only `AGENTS.md` has them (gotcha 3 and the command table); the development guide and `CONTRIBUTING.md` never name a Node version.

### Rush and pnpm

`rush.json`:

```jsonc
"rushVersion": "5.179.0",
"pnpmVersion": "10.34.5",
"nodeSupportedVersionRange": ">=22.14.0 <23.0.0",
// optional: set "ensureConsistentVersions": true in common/config/rush/common-versions.json
// (create it from the rush init template) once versions are aligned; rush.json accepts it only as a fallback.
```

`common/config/rush/pnpm-config.json`:

```jsonc
{
  "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/pnpm-config.schema.json",
  "useWorkspaces": true,
  "resolutionMode": "highest",
  "autoInstallPeers": false,
  "strictPeerDependencies": false,
  "globalOverrides": {
    "caniuse-lite": "^1.0.30001700",
    "@fluentui/react-tabster": "9.26.13",
    "keyborg": "2.6.0",
    "tabster": "8.7.0",
    "@rushstack/heft": "1.2.17",
    "@types/react": "17.0.45",
    "@types/react-dom": "17.0.17"
  },
  "globalOnlyBuiltDependencies": []
}
```

The report's `pnpm pkg set overrides.@rushstack/heft=1.2.17` (FN027001) and `"resolutions": { "@types/react": "17.0.45" }` (FN020001) map to `globalOverrides`; never add `overrides`/`resolutions` to a solution `package.json`. Keep the existing tabster/keyborg pins until the Fluent v9 phase re-evaluates them.

pnpm 10 disables dependency lifecycle scripts unless they are approved, and pnpm >= 10.3 defaults `strictDepBuilds` to true, so `rush update` **exits non-zero** listing the packages that requested build scripts rather than merely warning. Approve only what the error names, in `pnpm-config.json`:

```jsonc
"globalOnlyBuiltDependencies": ["<package-name>"]
```

Rush writes that array to `onlyBuiltDependencies` in the generated `common/temp/pnpm-workspace.yaml`. `node common/scripts/install-run-rush-pnpm.js approve-builds` does the same interactively and persists into the same field (Rush >= 5.167.0). Do **not** use `globalAllowBuilds`: it is pnpm 11 only, and Rush errors if both fields are present. None of the SPFx runtime packages need postinstall scripts; expect at most transitive tooling such as `esbuild` or `core-js`.

Command sequence for the maintainer (from the repo root, on Node 22):

```sh
rm common/config/rush/pnpm-lock.yaml        # lockfile v5; pnpm >= 9 no longer reads v5 (v5 -> v6 needed pnpm 8)
node common/scripts/install-run-rush.js update --full --purge
```

`rush update` recopies all four scripts in `common/scripts` (`install-run.js`, `install-run-rush.js`, `install-run-rushx.js`, `install-run-rush-pnpm.js`) to match the new `rushVersion`; commit them together with `rush.json` and the new lockfile. `rush install` only validates them and fails with "The standard files in the common/scripts folders need to be updated for this Rush version" if they are stale, which is how CI would break. Missing config templates (`.npmrc`, `common-versions.json`, `rush-plugins.json`, `experiments.json`) are optional; `rush init` never overwrites existing files, so it can be run in a scratch folder to copy templates if wanted.

`common/config/rush/command-line.json`: the bulk `lint` and `validate-loc` commands stay. `rush build`/`rush rebuild` keep calling each project's `build` script; the rig ships a `rush-project.json` for phased builds and build cache, which is optional and not needed now.

### CI and release

- GitHub repository variable `NODE_VERSION`: `16.18.0` to `22.22.2` (used by `actions/setup-node` in `build-release.yml`, `ci-releases.yml`, `ci-channel-test.yml` and `generate-sbom.yml`).
- `Install/Build-Release.ps1` line 143 hard-codes `npm i @microsoft/rush@5.98.0 -g`; replace all three `rush` invocations (`rush update` on lines 144 and 150, `rush rebuild` on line 293) with `node common/scripts/install-run-rush.js <command>` so the version follows `rush.json`, and fail fast if `node -v` is not 22.x. In CI mode prefer `install-run-rush.js install` (exact lockfile) over `update`; it requires the regenerated lockfile and the four refreshed `common/scripts` files to be committed.
- `package.json` root script `build-release` and the docs: state Node 22.

### Root files and docs

- Root `.gitignore`: add `SharePointFramework/**/lib-commonjs`, `lib-dts`, `lib-esm`, `jest-output`, `.heft` (report FN023003 to FN023006). The `.claude/skills/` negation was added in Phase 0 so the SPFx skills are shared.
- `AGENTS.md`: Node 22; the generated Sass typings now live in `temp/sass-ts`, not `src/**/*.module.scss.ts`; command table (`npm run watch` now wraps `heft start`); `npx tsc --noEmit` still works for type checks.
- `.development-guide/spfx/npm-skript.md` (describes `gulp serve-deprecated` and `gulp bundle && package-solution`), `.development-guide/spfx/utviklingsmiljo.md` (watch script snippets), `.development-guide/spfx/rush.md`, `SharePointFramework/.tasks/README.md`: rewrite the gulp references as Heft.

## Per-solution changes

### Common template (all six solutions)

**Remove from `package.json`**

| Package | Current | Solutions |
|---|---|---|
| `@microsoft/sp-build-web` | 1.17.4 | all six |
| `@rushstack/eslint-config` | 2.5.1 | PortfolioExtensions, PortfolioWebParts, ProgramWebParts, ProjectExtensions, ProjectWebParts |
| `@typescript-eslint/parser` | 5.40.0 | all six |
| `ajv` | ^6.12.5, 6.12.5 | all six |
| `gulp` | 4.0.2 | all six |

Also remove, although the reports do not mention them (incompatible with ESLint 9 or gulp-only): `@typescript-eslint/eslint-plugin` 5.40.0, `webpack` 5.74.0 devDependency (rig brings 5.105), `concurrently`, `livereload`, `find`, `colors`, `@microsoft/rush-stack-compiler-4.5`, and `yargs` 14.2.0 in ProgramWebParts. `colors`, `find`, `yargs`, `concurrently` and `livereload` are referenced only by gulpfiles/scripts, not by `src` (verified by grep).

**Add or bump devDependencies (exact versions)**

| Package | Version | Solutions | Current |
|---|---|---|---|
| `@microsoft/eslint-config-spfx` | 1.23.2 | all six | 1.17.4 |
| `@microsoft/eslint-plugin-spfx` | 1.23.2 | all six | 1.17.4 |
| `@microsoft/sp-module-interfaces` | 1.23.2 | all six | 1.17.4 |
| `@microsoft/spfx-heft-plugins` | 1.23.2 | all six | new |
| `@microsoft/spfx-web-build-rig` | 1.23.2 | all six | new |
| `@rushstack/eslint-config` | 4.5.2 | shared-library | new |
| `@rushstack/heft` | 1.2.17 | all six | new |
| `@types/heft-jest` | 1.0.2 | all six | new |
| `@types/jest` | 30.0.0 | all six | new |
| `css-loader` | 7.1.2 | all six | new |
| `eslint` | 9.37.0 | all six | 8.25.0 |
| `eslint-plugin-react-hooks` | 5.2.0 | all six | 4.3.0 |
| `typescript` | ~5.8.0 | all six | 4.5.5 |

Normalizations on top of the reports: `@rushstack/eslint-config` 4.6.4 in all six (the report adds 4.5.2 only to shared-library and removes 2.5.1 elsewhere; Microsoft's 1.23.2 template lists 4.6.4). Add for the shared ESLint config: `eslint-plugin-prettier` 5.5.6, `eslint-config-prettier` 10.1.8, `eslint-plugin-unused-imports` 4.4.1, `eslint-plugin-react` 7.37.5, `prettier` 3.9.7. Use `typescript` `~5.8.3` (report says `~5.8.0`). `@microsoft/sp-module-interfaces` is already a devDependency in the four solutions that have it (shared-library, ProjectWebParts, ProgramWebParts, PortfolioExtensions); it is simply bumped, and added to PortfolioWebParts and ProjectExtensions. `@microsoft/eslint-config-spfx` and `@microsoft/eslint-plugin-spfx` are new in shared-library (not a bump); `eslint-plugin-react-hooks` is new in shared-library and PortfolioExtensions. `webpack` 5.74.0 exists in the five consumers only. ProgramWebParts already has an `engines.node` field (update it).

**Bump dependencies (exact versions)**

| Package | Version | Solutions | Current |
|---|---|---|---|
| `@fluentui/react` | 8.106.4 | all six | 8.98.1 |
| `@microsoft/decorators` | 1.23.2 | PortfolioExtensions, PortfolioWebParts, ProjectExtensions, ProjectWebParts | 1.17.4 |
| `@microsoft/sp-adaptive-card-extension-base` | 1.23.2 | ProgramWebParts, ProjectWebParts | 1.17.4 |
| `@microsoft/sp-application-base` | 1.23.2 | shared-library, PortfolioExtensions, ProjectExtensions | 1.17.4 |
| `@microsoft/sp-core-library` | 1.23.2 | all six | 1.17.4 |
| `@microsoft/sp-dialog` | 1.23.2 | PortfolioExtensions, ProjectExtensions, ProjectWebParts | 1.17.4 |
| `@microsoft/sp-http` | 1.23.2 | PortfolioWebParts, ProgramWebParts, ProjectWebParts | 1.17.4 |
| `@microsoft/sp-listview-extensibility` | 1.23.2 | shared-library, PortfolioExtensions, ProjectExtensions, ProjectWebParts | 1.17.4 |
| `@microsoft/sp-lodash-subset` | 1.23.2 | shared-library, PortfolioWebParts, ProgramWebParts, ProjectWebParts | 1.17.4 |
| `@microsoft/sp-office-ui-fabric-core` | 1.23.2 | PortfolioWebParts, ProgramWebParts, ProjectExtensions, ProjectWebParts | 1.17.4 |
| `@microsoft/sp-page-context` | 1.23.2 | all six | 1.17.4 |
| `@microsoft/sp-property-pane` | 1.23.2 | shared-library, PortfolioWebParts, ProgramWebParts, ProjectWebParts | 1.17.4 |
| `@microsoft/sp-webpart-base` | 1.23.2 | shared-library, PortfolioWebParts, ProgramWebParts, ProjectWebParts | 1.17.4 |

Plus in every solution that has them: `@pnp/spfx-controls-react` 3.25.0, `@pnp/spfx-property-controls` 3.24.0, `tslib` 2.8.1, `@types/webpack-env` ~1.15.2 (align with the rig), `moment` ~2.29.4 (three solutions still pin 2.11.1), `@reduxjs/toolkit` ~1.9.5 (four solutions pin 1.5.0), `pzl-react-reusable-components` ~0.3.1 (ProgramWebParts pins ^0.0.14).

**Delete**: `gulpfile.js` (all six). `src/index.ts` in the five web part/extension solutions (scaffold placeholder comment only). PortfolioExtensions also drops `"main": "lib/index.js"` (nothing imports `pp365-portfolioextensions`).

**Add**

`config/rig.json`

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rig-package/rig.schema.json",
  "rigPackageName": "@microsoft/spfx-web-build-rig"
}
```

`config/sass.json`

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/heft/v0/heft-sass-plugin.schema.json",
  "extends": "@microsoft/spfx-web-build-rig/profiles/default/config/sass.json"
}
```

`config/typescript.json` (the rig's `copy-javascript` task already copies `src/**/*.js`, including `src/loc/**` bundles, into `lib`, so the glob is belt and braces. The reports write the template default `webparts/*/loc/*.js`; our loc files live in `src/loc/` and `src/loc/shared/`, so `loc/**/*.js` is the matching glob.)

```json
{
  "extends": "@microsoft/spfx-web-build-rig/profiles/default/config/typescript.json",
  "staticAssetsToCopy": {
    "fileExtensions": [".resx", ".jpg", ".png", ".woff", ".eot", ".ttf", ".svg", ".gif"],
    "includeGlobs": ["loc/**/*.js"]
  }
}
```

`tsconfig.json` (replace the whole file; `paths` per solution, see below)

```json
{
  "extends": "./node_modules/@microsoft/spfx-web-build-rig/profiles/default/tsconfig-base.json",
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "useUnknownInCatchVariables": false,
    "noUnusedLocals": false,
    "downlevelIteration": true,
    "allowSyntheticDefaultImports": true,
    "lib": ["dom", "es5", "es2015", "es2016", "es2017.object", "es2020"],
    "baseUrl": "src",
    "paths": { "components": ["components"], "models": ["models"] }
  }
}
```

`eslint.config.js`

```js
module.exports = require('../eslint.shared.config.js')(__dirname)
```

`config/spfx-customize-webpack.js`: the externals filter from Decision A plus the alias block from Shared build tooling.

`.gitignore` (per solution): append `lib-commonjs`, `lib-dts`, `lib-esm`, `jest-output`, and `.heft` where missing (shared-library and PortfolioWebParts already ignore `.heft`).

**Modify**

`package.json` scripts (identical in the **five consumer solutions**; `prewatch`/`postwatch` keep working because `watch` stays an npm script). The shared library has no `watch`/`serve`/`prewatch`/`postwatch` scripts today, no `config/serve.sample.json` and no `.vscode/launch.sample.json`; give it only `build`, `build:<channel>`, `clean`, `lint`, `prettier`, `validate-loc` and `postversion`:

```json
"build": "heft build --clean --production && heft package-solution --production",
"build:test": "node ../.tasks/build.js --channel test",
"build:i18n": "node ../.tasks/build.js --channel i18n",
"build:kurs": "node ../.tasks/build.js --channel kurs",
"clean": "heft clean",
"start": "heft start",
"watch": "heft start --nobrowser",
"prewatch": "node ../.tasks/pre-watch.js",
"postwatch": "node ../.tasks/post-watch.js",
"eject-webpack": "heft eject-webpack",
"lint": "eslint ./src --fix && npm run prettier",
"prettier": "prettier '**/*.ts*' --write --log-level silent --config ../.prettierrc.yaml",
"validate-loc": "<unchanged>"
```

Reports FN021004 and FN021007 prescribe `heft test --clean --production` and `heft start --clean`; we use `heft build` because the repo has no Jest tests, and drop `--clean` from `start` because `prewatch` already prepares the working tree. Prettier 3 renamed `--loglevel` to `--log-level`. ESLint 9 with flat config drops `--ext` and the `--config ../.eslintrc.yaml` argument. `postversion` (`tsc && npm publish`, shared-library) becomes `heft build --production && npm publish`.

`.yo-rc.json`: `version` 1.23.2 and `useGulp: false` in all six (FN010001, FN010011). The teams-js bump (FN010010) applies only to PortfolioExtensions, whose file is the only one with an SDK block, currently `"version": "1.16.1"` and the key spelled **`sdksVersions`** with teams-js 2.4.1. Update that existing key to 2.24.0 rather than adding a second `sdkVersions` key; the other five have no SDK block and need none.

SCSS: replace `@import '~@fluentui/react/dist/sass/References.scss'` with `@import 'pkg:@fluentui/react/dist/sass/References.scss'` (FN022001) in the files listed per solution below. Do not add the import to files that never had it (FN022002 is marked optional by the report and adds nothing we use).

`.vscode/settings.json`: `"files.exclude": { "**/jest-output": true }` (FN014010, cosmetic).

### shared-library

Report: `reports/shared-library.md` (79 findings). Alias imports depending on tsconfig `paths`: 0. Cross-package imports: none.

Dependencies to bump to 1.23.2 / 8.106.4: `@microsoft/sp-core-library`, `@microsoft/sp-lodash-subset`, `@microsoft/sp-webpart-base`, `@microsoft/sp-application-base`, `@microsoft/sp-listview-extensibility`, `@microsoft/sp-property-pane`, `@microsoft/sp-page-context`, `@fluentui/react`.

tsconfig extras beyond the common template: `lib` today is `es2015`, `dom`, `es2015.collection`, `es2020`; keep at least those entries.

SCSS files to switch from `~@fluentui/...` to `pkg:@fluentui/...` (1):

- `src/components/ProjectTimeline/Timeline/Timeline.module.scss`

Notes:

- **Keep** `"main": "lib/index.js"` and `src/index.ts` (the barrel re-exporting components, config, data, interfaces, logging, models, services, types, util, icons). Ignore report findings FN021001 and FN015005.
- The gulpfile only aliased `serve` to `serve-deprecated` and suppressed one Sass warning; nothing to port. A library has no meaningful `heft start`; develop it through a consumer.
- `postversion`: `tsc && npm publish` becomes `heft build --production && npm publish`. Add `lib-commonjs`, `lib-dts`, `lib-esm`, `jest-output` and `.heft` to `.npmignore` so the published package stays small (`lib` and `dist` remain published).
- Remove the unused `@pnp/odata` 2.15.0 dependency (no imports).
- Dynamic import without chunk name: `src/services/CloudTemplate/CloudTemplatePackage.ts` (`jszip`).
- Consumers reference `node_modules/pp365-shared-library/lib/loc/{locale}.js` and `SharedResources` from their own `config/config.json`; unchanged.

### ProjectWebParts

Report: `reports/ProjectWebParts.md` (115 findings). Alias imports depending on tsconfig `paths`: 24 (keys: `data`, `components`, `models`, `types`). Cross-package imports: `pp365-shared-library` 142.

Dependencies to bump to 1.23.2 / 8.106.4: `@microsoft/sp-core-library`, `@microsoft/sp-lodash-subset`, `@microsoft/sp-office-ui-fabric-core`, `@microsoft/sp-webpart-base`, `@microsoft/sp-dialog`, `@microsoft/sp-listview-extensibility`, `@microsoft/sp-property-pane`, `@microsoft/sp-http`, `@microsoft/sp-page-context`, `@microsoft/decorators`, `@microsoft/sp-adaptive-card-extension-base`, `@fluentui/react`.

tsconfig extras beyond the common template: `lib` today is `es5`, `dom`, `es2016`, `es2015.collection`; keep at least those entries. `paths`: `data`, `components`, `models`, `types` with `baseUrl: "src"`.

SCSS files to switch from `~@fluentui/...` to `pkg:@fluentui/...` (15):

- `src/components/ProjectInformation/ArchiveStatus/ArchiveStatus.module.scss`
- `src/components/ProjectInformation/ArchiveStatus/ArchiveStatusPopover/ArchiveStatusPopover.module.scss`
- `src/components/ProjectPhases/ChangePhaseDialog/Views/ArchiveView/ArchiveView.module.scss`
- `src/components/ProjectPhases/ChangePhaseDialog/Views/InitialView/InitialView.module.scss`
- `src/components/ProjectPhases/ChangePhaseDialog/Views/SummaryView/CheckListItem/CheckListItem.module.scss`
- `src/components/ProjectPhases/ProjectPhase/ProjectPhasePopover/ProjectPhasePopover.module.scss`
- `src/components/ProjectStatus/ProjectStatus.module.scss`
- `src/components/ProjectStatus/Sections/BaseSection/BaseSection.module.scss`
- `src/components/ProjectStatus/Sections/Sections.module.scss`
- `src/components/ProjectStatus/Sections/SummarySection/SummarySection.module.scss`
- `src/components/ProjectStatus/StatusElement/StatusElement.module.scss`
- `src/components/ProjectStatus/UserMessages/UserMessages.module.scss`
- `src/components/ProjectTimeline/ProjectTimeline.module.scss`
- `src/components/ProjectTimeline/TimelineList/TimelineList.module.scss`
- `src/webparts/baseProjectWebPart/ErrorBoundary/ErrorBoundaryFallback.module.scss`

Notes:

- The `setHiddenToolbox` gulp task is dead code (never wired into the build); it goes with the gulpfile, optionally as an opt-in `.tasks/setHiddenToolbox.js`. See Shared build tooling. Its gulp devDependencies `find`, `colors` and the undeclared `yargs` go too.
- Consumed by PortfolioWebParts (`pp365-projectwebparts/lib/components/ProjectInformation`, `.../ProjectInformationPanel`) and by ProgramWebParts; keep `lib` output paths stable. Its 8 WebPart manifests in `src` mean it is never auto-externalized.
- `serve.sample.json` still points at the hosted workbench; replace with `serveConfigurations` (Decision D).

### PortfolioWebParts

Report: `reports/PortfolioWebParts.md` (89 findings). Alias imports depending on tsconfig `paths`: 24 (keys: `icons`, `components`, `models`, `interfaces`, `types`, `data`, `utils`). Cross-package imports: `pp365-projectwebparts` 4, `pp365-shared-library` 138.

Dependencies to bump to 1.23.2 / 8.106.4: `@microsoft/sp-core-library`, `@microsoft/sp-lodash-subset`, `@microsoft/sp-office-ui-fabric-core`, `@microsoft/sp-webpart-base`, `@microsoft/sp-property-pane`, `@microsoft/sp-http`, `@microsoft/sp-page-context`, `@microsoft/decorators`, `@fluentui/react`.

tsconfig extras beyond the common template: `lib` today is `es5`, `dom`, `es2016`, `es2015.collection`, `es2017.object`; keep at least those entries. `paths`: `icons`, `components`, `models`, `interfaces`, `types`, `data`, `utils` with `baseUrl: "src"`.

SCSS files to switch from `~@fluentui/...` to `pkg:@fluentui/...` (9):

- `src/components/EditViewColumnsPanel/EditViewColumnsPanel.module.scss`
- `src/components/List/List.module.scss`
- `src/components/ProjectList/Commands/Commands.module.scss`
- `src/components/ProjectList/List/List.module.scss`
- `src/components/ProjectList/ProjectCard/ProjectCard.module.scss`
- `src/components/ProjectList/ProjectCard/ProjectCardFooter/ProjectCardFooter.module.scss`
- `src/components/ProjectList/ProjectList.module.scss`
- `src/components/ResourceAllocation/ResourceAllocation.module.scss`
- `src/webparts/basePortfolioWebPart/ErrorBoundary/ErrorBoundaryFallback.module.scss`

Notes:

- `config/config.json` `localizedResources` point into `node_modules/pp365-projectwebparts/lib/loc/{locale}.js` and `node_modules/pp365-shared-library/lib/loc/{locale}.js`; valid under pnpm symlinks, unchanged.
- Remove unused `@pnp/sp-taxonomy` 1.3.8 (PnPjs v1 era) and `jsom-ctx` (no imports).
- `serve.sample.json` points at the hosted workbench; replace with `serveConfigurations` (Decision D).

### ProgramWebParts

Report: `reports/ProgramWebParts.md` (55 findings). Alias imports depending on tsconfig `paths`: 9 (keys: `components`, `models`, `interfaces`, `data`). Cross-package imports: `pp365-portfoliowebparts` 8, `pp365-shared-library` 15.

Dependencies to bump to 1.23.2 / 8.106.4: `@microsoft/sp-core-library`, `@microsoft/sp-lodash-subset`, `@microsoft/sp-office-ui-fabric-core`, `@microsoft/sp-webpart-base`, `@microsoft/sp-property-pane`, `@microsoft/sp-http`, `@microsoft/sp-page-context`, `@microsoft/sp-adaptive-card-extension-base`, `@fluentui/react`.

tsconfig extras beyond the common template: `lib` today is `es5`, `dom`, `es2015`, `es2015.collection`; keep at least those entries. `paths`: `components`, `models`, `interfaces`, `data` with `baseUrl: "src"`.

SCSS files to switch from `~@fluentui/...` to `pkg:@fluentui/...` (2):

- `src/components/ProgramAdministration/AddProjectDialog/AddProjectDialog.module.scss`
- `src/components/ProgramAdministration/ProgramAdministration.module.scss`

Notes:

- Remove unused `yargs` 14.2.0 (yargs is used only by `.tasks`, at 17.7.2, and by the ProjectWebParts gulpfile that is being deleted), `@pnp/sp-taxonomy` and `jsom-ctx`.
- The old `serve` script passed `--locale=nb-no`; with Heft use the built-in `--locales nb-no` parameter (plural, string list; defined in `@rushstack/heft` `Constants.localesParameterLongName`) on `heft start` if a single-locale dev build is still wanted.
- Imports `pp365-portfoliowebparts` (8) and `pp365-shared-library` (15) via deep paths; both stay bundled (Decision A).

### PortfolioExtensions

Report: `reports/PortfolioExtensions.md` (65 findings). Alias imports depending on tsconfig `paths`: 39 (keys: `components`, `models`, `services`, `interfaces`, `types`, `data`). Cross-package imports: `pp365-shared-library` 31.

Dependencies to bump to 1.23.2 / 8.106.4: `@microsoft/sp-core-library`, `@microsoft/sp-dialog`, `@microsoft/sp-application-base`, `@microsoft/sp-listview-extensibility`, `@microsoft/sp-page-context`, `@microsoft/decorators`, `@fluentui/react`.

tsconfig extras beyond the common template: `lib` today is `es6`, `dom`, `es2017`; keep at least those entries. `paths`: `components`, `models`, `services`, `interfaces`, `types`, `data` with `baseUrl: "src"`.

SCSS files to switch from `~@fluentui/...` to `pkg:@fluentui/...` (0):

- none

Notes:

- Drop `"main": "lib/index.js"` together with the placeholder `src/index.ts` (nothing imports `pp365-portfolioextensions`).
- Dynamic imports without chunk names in `src/services/PackageInstaller.ts` (lines 432, 562, 685: `jszip`, `sp-js-provisioning` twice); add `/* webpackChunkName */` comments.
- `serve.sample.json` already uses `serveConfigurations` with `customActions` for the command sets and has a `default` entry; keep it, only regenerate `pageUrl`s from `environments.json` if Decision D is adopted.
- No SCSS `~` imports in this solution.

### ProjectExtensions

Report: `reports/ProjectExtensions.md` (71 findings). Alias imports depending on tsconfig `paths`: 19 (keys: `components`, `models`, `interfaces`, `types`, `data`). Cross-package imports: `pp365-shared-library` 50.

Dependencies to bump to 1.23.2 / 8.106.4: `@microsoft/sp-core-library`, `@microsoft/sp-office-ui-fabric-core`, `@microsoft/sp-dialog`, `@microsoft/sp-application-base`, `@microsoft/sp-listview-extensibility`, `@microsoft/sp-page-context`, `@microsoft/decorators`, `@fluentui/react`.

tsconfig extras beyond the common template: `lib` today is `dom`, `es2016`; keep at least those entries. `paths`: `components`, `models`, `interfaces`, `types`, `data` with `baseUrl: "src"`.

SCSS files to switch from `~@fluentui/...` to `pkg:@fluentui/...` (1):

- `src/components/ProgressDialog/ProgressDialog.module.scss`

Notes:

- `serve.sample.json` uses the obsolete `core-build/serve.schema.json` `$schema`; switch to `https://developer.microsoft.com/json-schemas/spfx-build/spfx-serve.schema.json`. Its `customActions` block (application customizers + command set) stays.
- Remove `colors` 1.4.0 (a devDependency; gulpfile only). The gulpfile also suppressed the `RiskActionPlanner` field customizer packaging warning; Heft has no suppression API and the warning does not fail the build.
- `@uifabric/utilities` and `@uifabric/file-type-icons` stay for Phase 1 (Phase 3 replaces them).

## Shared build tooling

### `.tasks/build.js` (channel builds)

Replace the two gulp invocations:

```js
run('heft', ['build', '--clean', '--production'])
run('heft', ['package-solution', '--production'])
```

No `config/heft.json` is needed in any solution. Keep `modifySolutionFiles.js`, `setBundleConfig.js` and the revert logic unchanged; `SERVE_BUNDLE_REGEX` still works because Heft reads `config/config.json` bundles.

### `.tasks/pre-watch.js`, `post-watch.js`, `createServeConfig.js`, `createLaunchFile.js`

- `createServeConfig.js`: build `config/serve.json` from `config/serve.sample.json` plus `environments.json` (Decision D). Web part solutions' `serve.sample.json` lose `initialPage` and gain `serveConfigurations.default` pointing at a real page. ProjectExtensions' sample still references the old `core-build/serve.schema.json`; switch to `spfx-build/spfx-serve.schema.json`.
- `createLaunchFile.js`: base configuration `type: "msedge"` (or keep `chrome`), same `sourceMapPathOverrides`, URL = the page with the debug query string. Add `-incognito` only if wanted.
- `pre-watch.js`/`post-watch.js`: unchanged.
- Delete nothing else; `.env.template` gains `SERVE_ENVIRONMENT` if Decision D maps it to `default`.

### `SharePointFramework/eslint.shared.config.js`

Plugins must resolve from the solution's own `node_modules` (pnpm has no hoisting), so the shared file resolves them relative to the calling solution:

```js
const path = require('path')
const { createRequire } = require('module')

module.exports = function createConfig(solutionDir) {
  const req = createRequire(path.join(solutionDir, 'package.json'))
  const spfxReact = req('@microsoft/eslint-config-spfx/lib/flat-profiles/react')
  const prettierRecommended = req('eslint-plugin-prettier/recommended')
  const unusedImports = req('eslint-plugin-unused-imports')
  return [
    { ignores: ['lib/**', 'lib-commonjs/**', 'lib-dts/**', 'dist/**', 'temp/**', 'release/**', 'node_modules/**', '**/*.scss.ts', 'config/**'] },
    ...spfxReact,
    prettierRecommended,
    {
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: { parserOptions: { tsconfigRootDir: solutionDir, project: './tsconfig.json' } },
      plugins: { 'unused-imports': unusedImports },
      rules: {
        // translated from SharePointFramework/.eslintrc.yaml
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        'react/prop-types': 'off',
        'react/display-name': 'off',
        'no-compare-neg-zero': 'warn',
        'no-console': 'warn',
        'default-case': 'off',
        eqeqeq: 'warn',
        'max-classes-per-file': 'off',
        'jsx-quotes': ['error', 'prefer-single'],
        quotes: ['error', 'single'],
        yoda: 'error',
        'require-await': 'warn',
        semi: ['error', 'never'],
        'unused-imports/no-unused-imports': 'error',
        'no-restricted-syntax': ['error', { selector: "ImportDeclaration[source.value='@fluentui/react-icons'] > ImportNamespaceSpecifier", message: 'Never `import * as ... from @fluentui/react-icons` (bloats every bundle). Use named imports via the shared-library icon catalog.' }],
        'no-restricted-imports': ['error', { paths: [{ name: 'pp365-shared-library/lib/icons/iconCatalog', message: 'Do not deep-import the icon catalog. Use getFluentIcons/resolveFluentIcon from pp365-shared-library.' }] }],
        // SPFx profile softening for the migration (Decision C); tighten later
        '@typescript-eslint/no-floating-promises': 'warn',
        '@rushstack/no-new-null': 'off'
      }
    }
  ]
}
```

Delete `SharePointFramework/.eslintrc.yaml` once all six build. Keep `.prettierrc.yaml` (Prettier finds it by walking up from each file).

### `config/spfx-customize-webpack.js` (alias + externals)

The gulpfiles turn `tsconfig.compilerOptions.paths` into `resolve.alias` and declare an `XLSX` external. Grep shows no `import ... from 'XLSX'` anywhere (all imports are lowercase `xlsx`), so the external is dead and is dropped. The alias logic moves as is:

```js
const path = require('path')
const BUNDLE_LINKED = ['pp365-shared-library', 'pp365-projectwebparts', 'pp365-portfoliowebparts']

module.exports = function (webpackConfig) {
  // 1. tsconfig paths -> webpack alias (same behaviour as the old gulpfile)
  const tsconfig = require('../tsconfig.json')
  const { baseUrl = 'src', paths = {} } = tsconfig.compilerOptions || {}
  webpackConfig.resolve = webpackConfig.resolve || {}
  webpackConfig.resolve.alias = Object.keys(paths).reduce((alias, key) => {
    alias[key] = path.join(__dirname, '..', 'lib', paths[key][0]) // lib mirrors src after tsc
    return alias
  }, { ...(webpackConfig.resolve.alias || {}) })
  // 2. Decision A: keep linked monorepo packages bundled
  if (Array.isArray(webpackConfig.externals)) {
    webpackConfig.externals = webpackConfig.externals.filter((name) => !BUNDLE_LINKED.includes(name))
  }
}
```

The old gulpfiles pointed aliases at `outDir` (`lib`) too, so behaviour is identical. Alternative for the long run: replace the ~115 bare alias imports with relative imports and delete `paths`; not part of Phase 1.

`build.addSuppression(...)` lines have no Heft equivalent and are not needed: the rig's `sass.json` already silences the Dart Sass deprecations, and the camelCase class warnings no longer exist.

### `setHiddenToolbox` (ProjectWebParts only)

**It is not part of any build today.** The gulp task is registered with `gulp.task('setHiddenToolbox', ...)` but never hooked into the rig and never called by a script, `Build-Release.ps1` or a workflow; it only ran if someone typed `gulp setHiddenToolbox --ship`. The committed manifests already carry the intended values (hidden: `ProjectPhasesWebPart`, `ProjectStatusWebPart`, `ProjectTimelineWebPart`; visible: `RiskMatrixWebPart`, `ProjectNewsWebPart`, `OpportunityMatrixWebPart`, `ProjectInformationWebPart`, `DynamicListWebPart`).

Therefore: do **not** wire a port into `.tasks/build.js`. Doing so would hide `ProjectInformation`, `OpportunityMatrix` and `DynamicList` in release builds, a behaviour change. Either drop the task with the gulpfile, or port it as an opt-in helper `node ../.tasks/setHiddenToolbox.js --hide|--show` that nothing calls automatically. Note also that channel builds do not need it: `modifySolutionFiles.js` already forces `hiddenFromToolbox: true` for every WebPart, with no skip list.

## Developer workflow after migration

| Task | Command |
|---|---|
| Install / refresh dependencies | `npm run rush:update` (root) |
| Build everything (dependency order) | `npm run rush:build` |
| Rebuild only the library | `rush rebuild -o pp365-shared-library` (runs `heft build --clean --production`) |
| Dev server without browser | `npm run watch` (= `heft start --nobrowser` with the pre/post hooks) |
| Dev server, open a configured page | `npm run start -- --serve-config <name>` |
| Type check only | `npx tsc --noEmit` |
| Lint + format | `npm run lint` |
| Localization check | `npm run validate-loc` |
| Package a channel | `npm run build:test` |

Debug URL for any page: `<page>?debug=true&noredir=true&debugManifestsFile=https://localhost:4321/temp/build/manifests.js` (extensions add `&loadSPFX=true&customActions=...`, which Heft generates from `serveConfigurations`).

Library changes while serving a consumer: rebuild the library (`rush rebuild -o pp365-shared-library`, or run `heft build-watch` in `shared-library` in a second terminal) and let the consumer's dev server pick up the new `lib` output. Verify during the Phase 1 smoke test whether webpack's watcher notices changes under the symlinked `node_modules/pp365-shared-library/lib`; if not, restart `heft start`.

## Report quirks and traps

Aggregated `ignoreSteps` from `_distilled.json` plus what the reports miss:

- **Intermediate steps**: FN012017 (tsconfig `extends` rush-stack-compiler-5.3) is contradicted by the report's own execute script, which writes a `tsconfig.json` extending the rig (FN015011). FN002029 (`@microsoft/rush-stack-compiler-5.3@0.1.0`) is still in all six execute scripts; skip it deliberately, because the rig brings TypeScript and Microsoft's 1.23.2 template does not list it.
- **FN015014 (`config/rig.json`) is missing from every report's Summary execute script** although it is a Required finding in all six, and it is therefore absent from `_distilled.json` `filesAdd`. Anyone executing from the summaries alone would skip it and the rig would never activate. The common template adds it.
- **PortfolioExtensions-only findings**: FN007002 fires on the gitignored, generated `config/serve.json` and points at the retiring hosted workbench; ignore it, `createServeConfig.js` regenerates the file (Decision D). FN026001 and FN026002 fire because that solution has a tracked legacy `config/sass.json` with the old `core-build/sass.schema.json`; the common template's `config/sass.json` replaces it rather than adding a new file.
- **shared-library**: FN021001 (remove `main`) and FN015005 (remove `src/index.ts`) are template rules; the barrel is imported 241 times as `pp365-shared-library` (236 files) and 135 times through 35 distinct deep `lib/...` paths (107 files). Keep both.
- **Rush, not pnpm**: FN027001 (`pnpm pkg set overrides...`) and FN020001 (`resolutions`) go to `pnpm-config.json` `globalOverrides`; every `pnpm i`/`pnpm un` line is a `package.json` edit followed by one `rush update`.
- **FN014003** (`.vscode/launch.json`): the file is gitignored and generated by `.tasks/createLaunchFile.js`; change the generator.
- **ESLint stack not covered by the reports**: they remove `@typescript-eslint/parser` but leave `@typescript-eslint/eslint-plugin` 5.40, `eslint-plugin-prettier` 4, `eslint-config-prettier` 8, `eslint-plugin-unused-imports` 2, `eslint-plugin-react` 7.31 and `prettier` 2.7, none of which work with ESLint 9 flat config. See the common template.
- **`@rushstack/eslint-config` inconsistency**: the report installs 4.5.2 only in shared-library. Use 4.6.4 everywhere.
- **Stale `dist` manifests decide bundling** (Decision A). Always build with `--clean`; the `build` script does.
- **Strict rig tsconfig** (Decision B): without the overrides the first `heft build` reports thousands of errors.
- **Lint inside build**: `@typescript-eslint/no-floating-promises` is an error in the SPFx profile (Decision C).
- **Hosted workbench retirement 2026-12-01** (Decision D).
- **pnpm 10 build-script approval**: `rush update` may refuse to run postinstall scripts of dependencies until approved.
- **Node 22 for `build-release`**: the earlier "stale sppkg on the wrong Node" trap inverts; CI variable and `.nvmrc` must move together.
- **`@fluentui/react` exactly 8.106.4**: a newer v8 would give pnpm two copies (PnP controls pin 8.106.4), doubling Fabric in every bundle and breaking theming.
- **Dynamic imports without chunk names**: `PackageInstaller.ts` (3) and `CloudTemplatePackage.ts` (1) trigger the `@rushstack/import-requires-chunk-name` warning; add `/* webpackChunkName: 'jszip' */` etc.
- **`tslib`**: the rig compiles with `importHelpers`; bump to 2.8.1.
- **Prettier 3**: `--loglevel` became `--log-level`; expect a one-off reformat commit.
- **`--locales nb-no`**: ProgramWebParts' old serve script passed `--locale=nb-no` to gulp; Heft's built-in parameter is `--locales <name>` (plural; verified in `@rushstack/heft` 1.2.17 `lib-commonjs/utilities/Constants.js`) and applies to `heft start`/`heft build`.

## Execution order and verification

Do the work on `feat/toolchain-upgrade` in this order; nothing builds until step 4 is complete for `shared-library`, so commit per step for reviewability but expect a red build in between.

1. **Repo-wide**: `.nvmrc` files, `rush.json`, `pnpm-config.json`, root `.gitignore`, `.tasks/build.js` (Heft commands), `.tasks/createServeConfig.js`, `eslint.shared.config.js`; delete `.eslintrc.yaml` once all six solutions build. Verification: `node common/scripts/install-run-rush.js update --full` completes on Node 22 (after all six `package.json` files are edited in step 2 to 4; run it once at the end of step 4).
2. **shared-library**: common template + its deltas. Verification: `heft build --clean --production && heft package-solution --production` in the folder emits `sharepoint/solution/pp-shared-library.sppkg`; `dist` has exactly one manifest; `lib/index.js` exists.
3. **ProjectWebParts, then PortfolioWebParts, then ProgramWebParts** (import order). Verification per solution: build green; sppkg emitted; AMD header check shows no `pp365-*` externals; `npm run lint` and `npm run validate-loc` pass.
4. **PortfolioExtensions, ProjectExtensions**. Same verification; additionally `heft start --serve-config default` loads the command set / application customizer on the configured page.
5. **Whole repo**: `npm run rush:build` green; `npm run rush:lint`; `rush validate-loc`; one channel build (`npm run build:test` in one solution) leaves a clean tree; `Install/Build-Release.ps1 -CI -SkipBundle -Channel test` on Node 22 produces a release folder with six sppkg files.
6. **Smoke test in the test tenant** via the existing CI (`ci-channel-test.yml`) after setting `NODE_VERSION`: deploy, open portfolio, project and program pages, run one project setup, check the browser console for missing module errors (the symptom of an accidental library externalization).
7. **Docs and skills**: `AGENTS.md`, `.development-guide`, `.tasks/README.md`, `.claude/skills/pp365-toolchain/SKILL.md` (mark Decision A as decided, record any renamed flags).

Escape hatch: the branch is isolated; `releases/1.15` keeps building with Node 16 until this merges. Do not merge partially.

## Dependency compatibility matrix (Phase 1 actions)

| Package | Now | Phase 1 | Action |
|---|---|---|---|
| `@microsoft/sp-*`, `@microsoft/decorators` | 1.17.4 | 1.23.2 | bump (exact) |
| `@microsoft/sp-module-interfaces` | 1.17.4 (devDependency in 4 of 6) | 1.23.2 (devDependency in all 6) | bump; add to PortfolioWebParts and ProjectExtensions |
| `@microsoft/sp-build-web`, `gulp`, `ajv`, `@microsoft/rush-stack-compiler-4.5`, `webpack` | various | removed | gulp toolchain |
| `@microsoft/rush-stack-compiler-5.3` | absent | never added | the reports install it (FN002029); the rig supplies TypeScript |
| `@microsoft/spfx-web-build-rig`, `@microsoft/spfx-heft-plugins`, `@rushstack/heft` | absent | 1.23.2, 1.23.2, 1.2.17 | add (devDependencies) |
| `@types/jest`, `@types/heft-jest`, `css-loader` | absent | 30.0.0, 1.0.2, 7.1.2 | add (rig expects them) |
| `typescript` | 4.5.5 | ~5.8.3 | bump |
| `tslib` | 2.3.1 | 2.8.1 | bump |
| `eslint` | 8.25.0 | 9.37.0 | bump; flat config |
| `@microsoft/eslint-config-spfx`, `@microsoft/eslint-plugin-spfx` | 1.17.4 | 1.23.2 | bump |
| `@rushstack/eslint-config` | 2.5.1 / absent | 4.6.4 | bump/add everywhere |
| `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` | 5.40.0 | removed | provided transitively (8.56) by `@rushstack/eslint-config` |
| `eslint-plugin-react`, `eslint-plugin-react-hooks` | 7.31.10, 4.3.0 | 7.37.5, 5.2.0 | bump |
| `eslint-plugin-prettier`, `eslint-config-prettier`, `eslint-plugin-unused-imports`, `prettier` | 4.2.1, 8.5.0, 2.0.0, 2.7.1 | 5.5.6, 10.1.8, 4.4.1, 3.9.7 | bump (ESLint 9 / Prettier 3) |
| `@fluentui/react` | 8.98.1 | 8.106.4 | bump (exact, matches PnP controls) |
| `@fluentui/react-components`, `@fluentui/react-icons`, `@fluentui/react-datepicker-compat`, `@fluentui/react-file-type-icons`, `@fluentui/react-hooks` | ~9.72.10, ~2.0.317, ~0.6.22, ~8.16.0, 8.6.27 | unchanged | Phase 3 |
| `@pnp/spfx-controls-react`, `@pnp/spfx-property-controls` | 3.15.0/3.17.0, ~3.19.0 | 3.25.0, 3.24.0 | bump |
| `@pnp/sp`, `@pnp/core`, `@pnp/logging`, `@pnp/queryable`, `@pnp/graph` | 3.17.0 | unchanged | Phase 2 |
| `@pnp/odata` (2.15.0), `@pnp/sp-taxonomy` (1.3.8), `jsom-ctx` | present | removed | unused (no imports) |
| `react`, `react-dom`, `@types/react`, `@types/react-dom` | 17.0.1, 17.0.45, 17.0.17 | unchanged | pinned via `globalOverrides` |
| `concurrently`, `livereload`, `find`, `colors`, `yargs` (14.2.0) | present | removed | gulp/serve tooling only |
| `@types/webpack-env` | 1.18.0 / ~1.15.2 | ~1.15.2 | align with rig |
| `moment` | 2.11.1 / ~2.29.4 | ~2.29.4 | align |
| `@reduxjs/toolkit` | 1.5.0 / ~1.9.5 | ~1.9.5 | align (2.x in Phase 3) |
| `pzl-react-reusable-components` | ^0.0.14 / ~0.3.1 | ~0.3.1 | align |
| `react-markdown`, `rehype-raw` | ^8.0.3, ^6.1.1 | unchanged | 9+/7 are ESM-only; evaluate in Phase 3 |
| `xlsx` | ^0.16.9 | unchanged | 0.18.5 is the last npm release; Phase 3 |
| `react-calendar-timeline` | 0.28.0 | unchanged | newer requires React 18 |
| `@uifabric/utilities`, `@uifabric/file-type-icons` | 6.45.1, 7.6.27 | unchanged | replace in Phase 3 |
| `sp-js-provisioning`, `sp-entityportal-service`, `spfx-jsom`, `msgraph-helper`, `pzl-spfx-components` | current | unchanged | Puzzlepart packages; PnPjs 4 work in Phase 2 |

## Defects found after deployment (2026-09-21)

- **Third-party CSS hashed as CSS modules.** The rig's webpack config treats every `.css` not named `*.global.css` as a CSS module, so `react-calendar-timeline/lib/Timeline.css` and `fabric.min.css` got hashed class names and the project timeline rendered as an unclickable overlay (its DOM uses the plain names). Fixed in `config/spfx-customize-webpack.js` (`treatNodeModulesCssAsGlobal`): node_modules stylesheets bypass the module rule and use the rig's global-CSS loaders. Found by manual smoke testing; the Playwright suite only checks that the timeline web part mounts, not its layout.

## Deferred to later phases

- **Phase 2, PnPjs 4.21**: implemented 2026-09-21, see `docs/plans/pnpjs-4-migration.md` (scoping corrected several of the numbers first written here: 27 result-shape sites, not 3; `presets/all` still exists; taxonomy was ported into shared-library rather than moved to Graph; `sp-entityportal-service` was vendored; `sp-js-provisioning` gets a PnPjs 4 minor release, 1.4.0).
- **Phase 3, Fluent v9 completion and dependency hygiene**: v8 still in ~214 files (DetailsList, Panel, Callout, Shimmer, people pickers); `format` from `@fluentui/react` (58) and `@uifabric/*` (10 files) are quick wins; Redux Toolkit 2, react-markdown 10, xlsx 0.18.
- **Phase 4, React 18** with SPFx 1.24 GA.
- **Phase 5, shared library as a runtime library component** (Decision A, option 2). Stop filtering `pp365-shared-library` out of `webpackConfig.externals` and let Heft externalize it, so consumer manifests declare a component dependency on the library id and version instead of inlining its code. Scope: confirm a clean `shared-library/dist` holds exactly one manifest per build (stale channel ids must be gone); verify every channel's `channels/*.json` library id flows into both the library manifest and the consumer manifests; make `Install.ps1` deploy `pp-shared-library.sppkg` before the consumer packages and verify the upgrade path for sites running an older library; measure the bundle-size win across the 29 components; smoke-test every web part and extension for missing-module errors, which is the failure mode when a consumer loads before the library. Prerequisite: Phase 1 shipped and stable.

## Appendix

- Reports: `docs/plans/spfx-1.23-heft-toolchain/reports/<solution>.md`, regenerate from a solution folder with `npx -y -p @pnp/cli-microsoft365@latest m365 spfx project upgrade --toVersion 1.23.2 --packageManager pnpm --shell bash --output md`. Machine-distilled final state: `reports/_distilled.json` (script kept out of the repo; regenerate by re-running the distillation if reports change).
- Finding ids seen across the six reports: `FN001001`, `FN001002`, `FN001003`, `FN001004`, `FN001011`, `FN001012`, `FN001013`, `FN001014`, `FN001021`, `FN001027`, `FN001032`, `FN001034`, `FN001035`, `FN002001`, `FN002002`, `FN002004`, `FN002007`, `FN002021`, `FN002022`, `FN002023`, `FN002024`, `FN002025`, `FN002026`, `FN002029`, `FN002030`, `FN002031`, `FN002032`, `FN002033`, `FN002034`, `FN002035`, `FN002036`, `FN007002`, `FN010001`, `FN010010`, `FN010011`, `FN012017`, `FN014003`, `FN014010`, `FN015005`, `FN015010`, `FN015011`, `FN015014`, `FN015015`, `FN015016`, `FN020001`, `FN021001`, `FN021003`, `FN021004`, `FN021006`, `FN021007`, `FN021008`, `FN022001`, `FN022002`, `FN023003`, `FN023004`, `FN023005`, `FN023006`, `FN026001`, `FN026002`, `FN027001`.
- Skills: `.claude/skills/spfx` (copy of `plugins/spfx/skills/spfx` from github.com/SharePoint/spfx-dev-skills, commit 31010d2, 2026-09-02) and the repo-specific `.claude/skills/pp365-toolchain`. `.gitignore` now un-ignores `.claude/skills/`.
- Environment check: `npx -y -p @pnp/cli-microsoft365@latest m365 spfx doctor --spfxVersion 1.23.2` accepts Node 22.22.2; `yo`/generator are not needed (no new projects).
