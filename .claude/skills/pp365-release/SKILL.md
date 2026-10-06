---
name: pp365-release
description: 'From a finished change to a Prosjektportalen 365 release: branches, commit messages and their CI tags, what CI does with a push, channels and version stamping, the changelog, release notes and pull requests, reading a failed run, and cutting a release. Use when asked to "commit this", "write the commit message", "which tag", "[skip-ci]", "[apps-only]", "[build-debug]", "skip e2e", "push", "which workflow runs", "why did CI not run", "how long does CI take", "deploy to the test channel", "try a build change in CI", "version stamp", "update the changelog", "write the release notes", "open a PR", "squash merge", "release PR", "cut a release", "npm version", "CI failed", "read the failed run", "playwright report", "stale bundle", "Could not load ... in require". Encodes the subject-line tag rules, the branch and path triggers, run times, the build errors, the deployment gate, the merge and the release steps. Pair with pp365-testing to fix a failing test and pp365-toolchain for build problems.'
argument-hint: 'Where the change stands (branch, commit, run id or failing job) and what is needed: commit message, push plan, failure diagnosis, pull request or a release step'
---

# PP365: from a finished change to a release

Authoritative description (Norwegian): `.development-guide/` (`git/`, `ci/`, `utgivelse/`). What CI does is decided by `.github/workflows/*.yml` (top level only; `unused/` never runs) and `Install/Build-Release.ps1`.

A push runs the workflow files **of the pushed commit**, so read the target branch's copy: `gh api 'repos/Puzzlepart/prosjektportalen365/contents/.github/workflows/<file>?ref=<branch>' --jq .content | base64 -d`. This skill matches `feat/dependency-upgrades-phase-5` on 2026-10-06. Until phase 5 merges, `releases/1.15` has no `ci-build-debug.yml` (and no `skills.yml`), its `ci-channel-test.yml` lacks `feat/dependency-upgrades*`, and its packages-only job lacks `-RushTimeline -SkipPnPPowerShell`.

## Read first

- `git/commit-praksis.md`, `git/branching-og-arbeidsflyt.md` (one `releases/x.y` per minor; patches stay on it), `ci/kontinuerlig-integrasjon.md` (tags, «CI (build debug)»), `spfx/testing.md` «Finne og lese E2E-rapporten fra CI» and «Når en test feiler», `maler/kanaler.md`, `utgivelse/` (`versjonering.md`, `opprette-ny-versjon.md`, `smoketest.md`).
- Where the guide lags, trust the files: the workflow tables in the CI chapter and `commit-praksis.md` (`ci-releases.yml` runs on `releases/1.15`, not `main`; `ci-channel-i18n.yml`, `pr-package-spfx-dev.yml` and `automatic_chores.yml` sit in `unused/`), «Bygg og installer (dev)» (25-35 min, `CI_DEV_TARGET_URL`), `[skip-test-ci]` and `[skip-ci]` on `main` (below), the branch list, «14 dager» and the `e2e` label in `testing.md`, `releases/1.12` in the branching page, `git push --tags` in `opprette-ny-versjon.md`, and `utgivelse/npm.md`.

## 1. Before committing

- [ ] The branch starts from the release branch: `git log --oneline origin/releases/1.15..HEAD` lists only your commits. Long-lived `feat/*` branches exist (`feat/dependency-upgrades-phase-5`), and a fix cut from one drags their commits into the PR. Names in use: `feat/<topic>`, `fix/<topic>`, `chore/<topic>` (the guide says `issues/<n>`).
- [ ] Node 22 (`nvm use`); `Build-Release.ps1` exits on any other major.
- [ ] `npm test` in each touched solution (after a `shared-library` change, `rush rebuild -o pp365-shared-library` first), `npm run lint`, and after loc edits `npm run validate-loc`. It writes `localization-report.md` in the solution, which is not in the repo and not ignored: leave it out of the commit.
- [ ] Coverage: each solution's `config/jest.config.json` sets a `coverageThreshold`. Jest prints `coverage threshold for ... not met` but Heft passes, so only `Build-Release.ps1` (CI, or a local `npm run build-release`) fails on it. Read the test output.
- [ ] A skill change: `npm run check-skills` (`.tasks/check-skills.js`). Skills live only in `.claude/skills`; any file in `.github/skills` or `.agents/skills` fails it, `name` must equal the folder and `description` may have at most 1024 characters.
- [ ] `CHANGELOG.md`, edited against the release branch's copy (parallel PRs conflict at a section's tail): under `## 1.15.0 - TBA`, in Norwegian, sections in the order `### Ny funksjonalitet`, `### Forbedringer`, `### Fjernet`, `### Feilrettinger`, `### Merk`.
  - Name features as the UI does, in backticks (`Porteføljeoversikt`); a fix reads "Rettet en feil i `<webdel>` hvor ..."; end with `[#<n>](https://github.com/Puzzlepart/prosjektportalen365/issues/<n>)` (or `/pull/<n>`) when there is one; no final full stop.
  - A highlight gets a bold lead sentence, "Se releasenotes for <versjon> for detaljer", and a section in `releasenotes/<versjon>.md`.
- [ ] No channel-build leftovers. `*.bak`, `config/.generated-solution-config.json` and the root `.current-channel-config.json` are gitignored, so `git status` shows only modified `config/package-solution.json` and `src/**/manifest.json` (channel ids, `hiddenFromToolbox`). A failed local channel build leaves them too: `Build-Release.ps1` exits on an `[ERROR]` before it reverts.
  - Fix: in each solution run `node ../.tasks/modifySolutionFiles.js --revert --force` and `node ../.tasks/setBundleConfig.js --revert`, then delete `.current-channel-config.json`.

## 2. The commit message and its tags

- English, `<type>(<scope>): <subject>`, present tense. Types (guide): `feat`, `fix`, `docs`, `style`, `refactor`, `chore`, `ci`, `install`; history also uses `test`. History's scopes are solution or area names (`fix(PortfolioWebParts,shared-library): ...`, `test(e2e): ...`); the guide's examples are lowercase.
- `ci-releases.yml`, `ci-channel-test.yml` and `ci-build-debug.yml` read tags from the **subject (first line) of the pushed head commit only** (job "Determine commit subject"). A tag in the body does nothing, and when one push carries several commits only the last subject counts.
- `build-release.yml` (`main`) differs: it matches `[skip-main-ci]` and `[build-kurs]` anywhere in the message, body included, and never reads `[skip-ci]`.

Choosing a tag. Decision A bundles `pp365-shared-library`, `pp365-projectwebparts` and `pp365-portfoliowebparts` into every solution that imports them; nothing imports the two extensions or `ProgramWebParts`. Check with `grep -rlE "from 'pp365-<name>" SharePointFramework/*/src`.

- Code in `PortfolioExtensions`, `ProjectExtensions` or `ProgramWebParts` only: `[apps-only:<that solution>]`.
- `PortfolioWebParts` code: `[apps-only:PortfolioWebParts,ProgramWebParts]`. `ProjectWebParts` code: name `ProjectWebParts`, `PortfolioWebParts` and `ProgramWebParts`, or use `[apps-only]`.
- `shared-library` code: `[apps-only]`. `[apps-only:shared-library]` deploys a package that nothing loads.
- PnP templates under `Templates/` changed (the guide says its `.xml` files): no `apps-only`; take the full path.
- Only docs, `CHANGELOG.md` or `releasenotes/`: no tag needed (path filters). `[skip-ci]` for anything else that should not deploy.
- A change to the build itself (`Build-Release.ps1`, Rush, Heft), tried first: `[skip-ci] [build-debug]` on `releases/1.15` or a `feat/**` branch.

| Tag (subject) | Effect |
|---|---|
| `[skip-ci]` | The deploy workflows run only "Determine commit subject" (seconds). An `[apps-only…]` or `[build-debug]` in the same subject still runs. |
| `[apps-only]` | Packages only: `Build-Release.ps1 -SkipBuildPnPTemplates`, then `Install.ps1 -Upgrade -SkipTemplate` (only the PnP templates are skipped; the pre- and post-install steps run). E2E follows in `ci-channel-test.yml` only, whose build adds `-RushTimeline -SkipPnPPowerShell`. |
| `[apps-only:<names>]` | As `[apps-only]` for the named solutions: comma separated, case and hyphens ignored, from the six folder names under `SharePointFramework/`. `rush rebuild` still builds and tests all six; only packaging and deployment narrow. |
| `[build-debug]` | `ci-build-debug.yml` builds the test-channel package as the packages-only job does, deploys nothing, needs no secrets; artifacts `release-package-debug` and `rush-logs-debug`. |
| `[skip-e2e]` | Skips "End-to-end smoke (test channel)". |
| `[skip-upgrade]` | Skips the upgrade (in `ci-channel-test.yml` both paths), and with it Install and e2e. `ci-releases.yml`'s packages-only upgrade ignores it. |
| `[skip-install]` | `ci-releases.yml`: skips Install, the fresh site per commit (~46 min). |
| `[upgrade-all-sites-to-latest]` | Runs `Install/Scripts/UpgradeAllSitesToLatest.ps1` after a full upgrade. |
| `[skip-main-ci]` | `main`, whole message: skips "Build release (CI)" and kurs. "Build test channel release (CI)" still runs: its `if:` starts with `always()`. |
| `[build-kurs]` | `main`, whole message: also builds the kurs package. |
| `[skip-test-ci]` | No effect, for the same `always()`. |

GitHub's own `[skip ci]` (with a space) suppresses every push workflow, `main`'s included; the house tag is `[skip-ci]`.

## 3. The push: what CI runs, and how long

A deploy workflow starts when the branch is in `on.push.branches` and the push changes something under `paths` (`SharePointFramework/**`, `Install/**`, `Templates/**`, the workflow file; `ci-channel-test.yml` adds `e2e/**`). `SiteScripts/` and `channels/` are in no filter, although site scripts ship in the package. Times are from runs in October 2026.

| Push to | Workflow: jobs | Time |
|---|---|---|
| `releases/1.15` | `ci-releases.yml`: build (~13 min), upgrade the dev hub `https://puzzlepart.sharepoint.com/sites/pp365` (~28), install a new site `<that URL>_<sha>` (~46) | full ~87 min, `[apps-only]` ~14 |
| `releases/1.15`, `feat/fluent-v9*`, `feat/dependency-upgrades*` | `ci-channel-test.yml`: build the test channel (~14, packages only ~9), upgrade `vars.SP_URL_TEST` (~25, packages only ~3.5), e2e (~5-6) | full ~40-45 min, `[apps-only]` ~18-20 |
| `releases/1.15`, `feat/**`, every push (no path filter) | `ci-build-debug.yml`: the subject job; the build only with `[build-debug]` | seconds; with the tag ~10-13 min |
| `main` | `build-release.yml`: release package, then test-channel package (kurs on `[build-kurs]`); deploys nothing | ~25 min |
| any branch or PR touching `.claude/skills/**`, `.github/skills/**`, `.agents/skills/**` or `.tasks/check-skills.js` | `skills.yml`: `npm run check-skills`, regardless of `[skip-ci]` | seconds |
| tag `v*` | `generate-sbom.yml`: regenerates `SBOM.md` and uploads it as the artifact `sbom`, no commit. Run by hand from a branch, it also commits a dependency change there (the `Generated` timestamp alone does not count). Red on every tag from v1.12.1 to v1.14.0, when it pushed to the tag ref | seconds |

- A merge into `releases/1.15` starts both deploy workflows in parallel: done in ~20 min with `[apps-only]` (up to 10 more if the deployment gate waits), ~90 min without.
- Trying a build change: push it with `[skip-ci] [build-debug]`, read the log and `rush-logs-debug`, then move the switch into the live workflows. How to compare two runs or two `.sppkg`: the CI chapter, «CI (build debug)».
- Other branches deploy nothing until merged (`feat/**` gets the seconds-long debug run). To put a topic branch on the test tenant, add it to `ci-channel-test.yml`'s `on.push.branches` in its first commit, as phase 5 did. `workflow_dispatch` is declared but has never run: `main`'s copy lacks the trigger until 1.15.0 merges, and `ci-build-debug.yml` is not on `main` at all. A dispatched run has no commit subject, so it takes the full path.
- The branch names are literal in `ci-releases.yml`, `ci-channel-test.yml` and `ci-build-debug.yml`.
- Every branch in `ci-channel-test.yml` upgrades the same test hub, and neither deploy workflow has a `concurrency` group: two pushes close together upgrade it at once, and one run's e2e can test the other's packages. Let a run finish before the next push.
- Pull requests start only `skills.yml`; otherwise a PR shows the push runs of its head branch.

## 4. After the run

- Follow: `gh run list --branch <branch> --limit 6`, `gh run watch <run-id>`, `gh run view <run-id> --log-failed`. Job ids for a rerun: `gh run view <run-id> --json jobs --jq '.jobs[] | {name, databaseId}'`. Logs and artifacts expire after **7 days**, the repository maximum, which caps the workflow's `retention-days: 14`: download what you need.
- A channel build logs `[<Solution>] solution version x.y.z.<run>`, the version the tenant should now report. On a release branch it carries the last release's number until `npm version` runs (`1.14.0.<run>` on 1.15 work).
- Build job, the `[ERROR]` lines of `Build-Release.ps1`:
  - `rush install failed with exit code N. Last 50 lines of .../rush-install.build.log`: usually `common/config/rush/pnpm-lock.yaml` no longer matches after a dependency change; run `npm run rush:update` and commit the lockfile.
  - `rush rebuild failed with exit code N`, the last 200 lines of `SharePointFramework/rush-rebuild.build.log` with Rush's `--[ FAILURE: <project> ]--`, then `Jest failures in <Solution>/rush-logs/<package>.build.log` with `[test:jest] FAIL <file>` and the `●` blocks: reproduce with `npm test` in that solution (pp365-testing). Only `ci-build-debug.yml` uploads the complete per-project logs (`rush-logs-debug`).
  - `A coverage floor was missed`: add tests. The message offers lowering the floor; every `jest.config.json` says never lower it.
  - `did not emit`, `predates this build`, `No .sppkg were packaged`, `reference a pp365-* package as an external`, `hashed class names from third-party stylesheets`: the packaging proof; see pp365-toolchain.
  - `[WARNING] Unknown solution '<x>' - skipping` or `No valid solutions selected`: a misspelled `[apps-only:<names>]`.
  - `Correct PnP.PowerShell module not found` (the PowerShell Gallery install) or `-SkipPnPPowerShell needs -SkipBuildPnPTemplates` (a workflow's arguments). Like a failed `rush install`, these used to exit 0 and leave a green job without packages.
  - `[Rush rebuild timeline]` is no error: time per project, longest first, in the log and the job summary of the packages-only test-channel job and the debug build (`-RushTimeline`). Compare times only within one run; the same build has taken 506 and 711 s.
- Upgrade job: `Install.ps1` output (`Failed to run pre-install upgrade steps`, `Failed to install app packages`, `Failed to apply PnP Portfolio template after 3 attempts`). After tenant trouble, `gh run rerun <run-id> --failed`.
- E2E job: each failure is logged as `[chromium] › tests/<spec>:<line>:<col> › <title>` with its assertion, then `N failed` and `N passed (<time>)`, also as annotations on the run page; each test attaches `browser-errors.txt`. The report artifact and how to open it: `testing.md` «Finne og lese E2E-rapporten fra CI». Classify per «Når en test feiler»:

| In the log | Means | Do |
|---|---|---|
| `[deployment] › tests/deployment.setup.ts:… › the upgraded apps are served` with "bundles the tenant points at but cannot serve" and the URLs; no `[chromium]` test ran | A bundle still missing ten minutes after the upgrade. The gate checks only the hub and the project home. | Check the package (below), then rerun the upgrade job, which reruns e2e with it: `gh run rerun <run-id> --job <databaseId>` |
| `Could not load <component> in require. Error: Script error for "<componentId>_<version>"`, plus `Access to script at '.../ClientSideAssets/<feature id>/<bundle>_<hash>.js' ... blocked by CORS policy` | The page asked for a bundle file that is not served | Look for that file name in the package. Missing: a stale manifest on a page the gate does not check; wait, then `gh run rerun <run-id> --failed` (reruns e2e only). Present: deployment or packaging |
| `Could not load ... in require. TypeError: ...` | The bundle threw while loading | Regression: fix the code |
| `Cannot find module`, `Failed to load component`, `ChunkLoadError` | An externalized `pp365-*` package, or a chunk that is missing or 404s | Packaging; see pp365-toolchain |
| A locator or assertion, or «Noe gikk galt» | Regression, or an intended UI change | Fix the code, or heal the spec in its own commit |
| Sign-in, MFA, a skip that lists the site's pages | Environment | Fix the secret or variable, rerun |

- A regression issue: `testing.md` asks for labels `bug` and `e2e`, but `e2e` does not exist; use `bug` (set by `.github/ISSUE_TEMPLATE/feil.yml`) and link the run.
- Stale or new bundle? The loader names a module `<componentId>_<component version>`, and component versions are never stamped (they keep the synced version), so the name cannot tell builds apart; the bundle file name `<bundle>_<hash>.js` can. Example: run 37107937758, the template selector on the project home three minutes after the upgrade, which is why the gate exists.
  - Fetch the run's package: `gh run download <run-id> -n release-package-test -D pkg`, then `unzip -l pkg/Apps/<package>.sppkg | grep ClientSideAssets` (test names in `channels/test.json`, such as `pp-project-extensions-test.sppkg`). A requested name missing there is a stale manifest; one present is the new build.
  - Read the package, not the CDN: `public-cdn.sharepointonline.com` answers a request from outside a SharePoint page with a redirect to `AccessOutsideSharePointIsNotAllowed`.

## 5. The pull request and the merge

- Base: the release branch, with the milestone of its version (`releases/1.15`, `1.15.0`). Fill `.github/PULL_REQUEST_TEMPLATE.md` (Norwegian; its «Hvordan teste» steps feed the next smoke test). Its CHANGELOG link and "mot dev" point at a `dev` branch that does not exist; edit the release branch's file.
- Labels in use: `enhancement`, `bug`, `documentation`, `dependencies`, `frontend`, `backend`, `ci`, `build and packaging`, `complexity: small|medium|large`, `priority: high|medium|low`, `hotfix`, `release-pr`.
- Merge with **Squash and merge**. Merge commits and rebase are enabled too, but a merge commit's subject (`Merge pull request #N from ...`) carries no tag, so the full ~90-min path runs, and a rebase pushes several commits of which only the last subject counts.
- The squash subject is what CI reads. GitHub proposes the commit's own subject for a one-commit PR and the PR title otherwise (`COMMIT_OR_PR_TITLE`); the body lists the branch's commit messages (`COMMIT_MESSAGES`), where tags count only on `main`. Keep the PR title untagged and add the tag at the end of the subject in the merge dialog: `feat: allow clipboard-write på assistent-iframen i footeren (#1773) [apps-only]`.

## 6. Cutting a release

1. Gate: the last e2e run on the test channel is green, and the smoke-test issues (templates in the private `Puzzlepart/prosjektportalen365-testing` repo, `utgivelse/smoketest.md`) link to it.
2. `CHANGELOG.md`: `## <versjon> - TBA` becomes `## <versjon> - DD.MM.YYYY`. For a minor, the intro line links `./releasenotes/<versjon>.md`; only minors have a notes file (model: `releasenotes/1.14.0.md`).
3. `releasenotes/<versjon>.md`: the title's `(TBA)` becomes month and year (`# Prosjektportalen 365 - 1.14.0 (September 2026)`); add the images for every `<!-- TODO skjermbilde -->` under `releasenotes/assets/<x.y>/` (`assets/1.15/` does not exist yet).
4. Version, on `releases/x.y` with a clean tree, in the root after `npm install` there (`sync-version` needs `glob`; `generate-readme` fetches `@appnest/readme` with `npx`): `npm version minor` (or `patch`). `postversion` runs `generate-readme`, `sync-version` (`.tasks/automatic-versioning.js`: the `package.json` of every project in `rush.json`, the dot folders, `Templates` and `e2e` included; `package-solution.json` as `x.y.z.0`; every `src/**/manifest.json`) and `generate-sbom`. `npm run sync-version -- --dry-run` lists what it would change.
5. npm commits and tags before `postversion` runs, so its commit misses those files. 1.14.0 ended as one commit `v1.14.0` on `releases/1.14` holding them all, with the `v1.14.0` tag later on `main`: use `npm version minor --no-git-tag-version` and one commit, or amend npm's commit and delete its local tag. Do not `git push --tags` as `opprette-ny-versjon.md` says: the tag would land on the release branch. Never version a solution on its own (`versjonering.md`).
6. Release PR from `releases/x.y` into `main`, titled `v<versjon>`, label `release-pr`, milestone `<versjon>` (#1769, squash-merged). `build-release.yml` reads the whole squash message, so check its body (every commit of the release) for `[skip-main-ci]` and `[build-kurs]`.
7. `build-release.yml` uploads `release-package` and `release-package-test` (the `release/` folder, gone after 7 days). Its test package carries `x.y.z.0`, lower than the `x.y.z.<run>` the test hub got from `ci-channel-test.yml`. A local `npm run build-release` on `main` writes `release/pp365-<version>.<hash>.zip` (`-test` appended with `-Channel test`). Both include the bundled PnP.PowerShell, which the deploy workflows leave out (`-SkipBundle`).
8. GitHub release `v<versjon>` on `main` with the assets `pp365-<versjon>.zip` and `pp365-<versjon>-test.zip` (as v1.14.0; no build names them so: rename the local zips or zip the artifacts' content), and a body that links the release notes and repeats the changelog section under the headings of `.github/RELEASE_TEMPLATE.md`. The tag starts `generate-sbom.yml`, which only uploads the `sbom` artifact; `SBOM.md` already came with `postversion`.
9. Next cycle: open `releases/<next>`; write it into `ci-releases.yml`, `ci-channel-test.yml`, `ci-build-debug.yml` and the branch lists in `testing.md` and the CI chapter; create the milestone if missing (`1.16.0` exists); add `## <next> - TBA` to the changelog.

## Channels and version stamping

- `channels/<name>.json` (`main`, `test`, `kurs`, `i18n`) gives each solution its own id, name and `zippedPackage` and each component its own id, so channels install side by side in one tenant (`maler/kanaler.md`). `Build-Release.ps1 -Channel test|kurs|i18n` swaps them into `config/package-solution.json` and every `manifest.json` (web parts get `hiddenFromToolbox`), runs the full `rush rebuild`, copies each selected solution's declared `.sppkg` and reverts. `npm run build:<channel>` in one solution (`.tasks/build.js`) runs `heft build`, so no tests run.
- Stamp: `ci-channel-test.yml` and `ci-build-debug.yml` set `PP365_BUILD_NUMBER` to the run number, and `modifySolutionFiles.js` makes the solution and feature versions `x.y.z.<run>`, so clients refetch the manifests (`SharePointFramework/.tasks/README.md`). Packages from `main`, `ci-releases.yml` and local builds carry `x.y.z.0` from `sync-version`.
- `Install.ps1` gets `<version>.<git hash>` and the channel name at build time; every install and upgrade logs both in the hub list `Installasjonslogg` (`Installation Log` on English installs), which tells which commit a tenant runs.

## Do not

- Do not run `npm version` or `npm publish` inside a solution: its `postversion` is `heft build --production && npm publish`, and publishing has stopped (npm's latest is 1.8.4, `pp365-shared-library` is not on npm), whatever `utgivelse/npm.md` says.
- Do not lower a `coverageThreshold`, delete an assertion or add `[skip-e2e]` to get CI green.
- Do not commit channel ids in manifests, `*.bak`, `.generated-solution-config.json` or `.current-channel-config.json`.
- Do not push to a deploying branch while its previous run is still upgrading the tenant.
- Do not edit `.development-guide/README.md` or the root `README.md`; `npm run generate-readme` builds them from the chapter files and `readme/`.
- Do not copy a step from `.github/workflows/unused/`, and do not put skills in `.github/skills` or `.agents/skills`.
