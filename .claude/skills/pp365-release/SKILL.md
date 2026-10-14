---
name: pp365-release
description: 'From a finished change to a Prosjektportalen 365 release: branches, commit messages and their CI tags, what CI does with a push, channels and version stamping, the changelog, release notes and pull requests, reading a failed run, and cutting a release. Use when asked to "commit this", "write the commit message", "which tag", "[skip-ci]", "[apps-only]", "[build-debug]", "skip e2e", "skip integration", "push", "which workflow runs", "why did CI not run", "how long does CI take", "deploy to the test channel", "try a build change in CI", "version stamp", "update the changelog", "write the release notes", "open a PR", "squash merge", "release PR", "cut a release", "npm version", "CI failed", "read the failed run", "playwright report", "stale bundle", "Could not load ... in require". Encodes the subject-line tag rules, the branch and path triggers, run times, the build errors, the deployment gate, the merge and the release steps. Pair with pp365-testing to fix a failing test and pp365-toolchain for build problems.'
argument-hint: 'Where the change stands (branch, commit, run id or failing job) and what is needed: commit message, push plan, failure diagnosis, pull request or a release step'
---

# PP365: from a finished change to a release

Authoritative description (Norwegian): `.development-guide/` (`git/`, `ci/`, `utgivelse/`). What CI does is decided by `.github/workflows/*.yml` (top level only; `unused/` never runs) and `Install/Build-Release.ps1`.

A push runs the workflow files **of the pushed commit**, so read the target branch's copy: `gh api 'repos/Puzzlepart/prosjektportalen365/contents/.github/workflows/<file>?ref=<branch>' --jq .content | base64 -d`. This skill matches `releases/1.15` after the workflow overhaul of 2026-10-14: subject-only tags in every workflow, `main` included; a timeout on every job; the opt-in fresh install (`[fresh-install]`); the main channel's version stamp in `ci-releases.yml`; the debug build on pull requests; actions on Node 24 (`checkout@v7`, `setup-node@v7`, `upload-artifact@v7`, `download-artifact@v8`); the unused workflows deleted.

## Read first

- `git/commit-praksis.md`, `git/branching-og-arbeidsflyt.md` (one `releases/x.y` per minor; patches stay on it), `ci/kontinuerlig-integrasjon.md` (tags, «CI (build debug)»), `spfx/testing.md` «Finne og lese E2E-rapporten fra CI» and «Når en test feiler», `maler/kanaler.md`, `utgivelse/` (`versjonering.md`, `opprette-ny-versjon.md`, `smoketest.md`).
- Where the guide and the files disagree, trust the files (`.github/workflows/*.yml`, `Install/Build-Release.ps1`) and fix the guide. The CI, branching, versioning, release-build, SBOM and npm-scripts chapters were checked against them on 2026-10-08.

## 1. Before committing

- [ ] The branch starts from the release branch: `git log --oneline origin/releases/1.15..HEAD` lists only your commits. Long-lived `feat/*` branches exist (`feat/dependency-upgrades-phase-5`), and a fix cut from one drags their commits into the PR. Names in use: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`, `docs/<topic>`, and `issues/<n>` for a single issue.
- [ ] Node 26 (`nvm use`); `Build-Release.ps1` exits on any other major.
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
- Every workflow reads tags from the **subject (first line) of the pushed head commit only** (job "Determine commit subject"). A tag in the body does nothing, and when one push carries several commits only the last subject counts.
- `build-release.yml` (`main`) reads only `[skip-main-ci]`, `[skip-test-ci]` and `[build-kurs]`, never `[skip-ci]`. Until 2026-10-14 it matched them anywhere in the message, so a release's squash body could trip them.

Choosing a tag. Decision A bundles `pp365-shared-library`, `pp365-projectwebparts` and `pp365-portfoliowebparts` into every solution that imports them; nothing imports the two extensions or `ProgramWebParts`. Check with `grep -rlE "from 'pp365-<name>" SharePointFramework/*/src`.

- Code in `PortfolioExtensions`, `ProjectExtensions` or `ProgramWebParts` only: `[apps-only:<that solution>]`.
- `PortfolioWebParts` code: `[apps-only:PortfolioWebParts,ProgramWebParts]`. `ProjectWebParts` code: name `ProjectWebParts`, `PortfolioWebParts` and `ProgramWebParts`, or use `[apps-only]`.
- `shared-library` code: `[apps-only]`. `[apps-only:shared-library]` deploys a package that nothing loads.
- PnP templates under `Templates/` changed (the guide says its `.xml` files): no `apps-only`; take the full path.
- Only docs, `CHANGELOG.md` or `releasenotes/`: no tag needed (path filters). `[skip-ci]` for anything else that should not deploy, except code: a change under `SharePointFramework/**` never goes with a bare `[skip-ci]`, since nothing builds it and a compile error reaches the branch unbuilt (#1779's `IItemAddResult` on 2026-10-13 broke the next full run). Use `[apps-only]`, or `[skip-ci] [build-debug]` when it must not deploy.
- A change to the build itself (`Build-Release.ps1`, Rush, Heft), tried first: `[skip-ci] [build-debug]` on `releases/1.15` or a `feat/**` branch.

| Tag (subject) | Effect |
|---|---|
| `[skip-ci]` | The deploy workflows run only "Determine commit subject" (seconds). An `[apps-only…]` or `[build-debug]` in the same subject still runs. |
| `[apps-only]` | Packages only: `Build-Release.ps1 -SkipBuildPnPTemplates`, then `Install.ps1 -Upgrade -SkipTemplate` (only the PnP templates are skipped; the pre- and post-install steps run). E2E follows in `ci-channel-test.yml` only, whose build adds `-RushTimeline -SkipPnPPowerShell`. |
| `[apps-only:<names>]` | As `[apps-only]` for the named solutions: comma separated, case and hyphens ignored, from the six folder names under `SharePointFramework/`. `rush rebuild` still builds and tests all six; only packaging and deployment narrow. |
| `[build-debug]` | `ci-build-debug.yml` builds the test-channel package as the packages-only job does, deploys nothing, needs no secrets; artifacts `release-package-debug` and `rush-logs-debug`. |
| `[skip-e2e]` | Skips "End-to-end smoke (test channel)". |
| `[skip-integration]` | Skips "Integration tests (test channel)" (`integration/`, beside e2e). |
| `[skip-upgrade]` | Skips the upgrade (both paths in both deploy workflows; `ci-releases.yml`'s packages-only upgrade since 2026-10-14), and with it Install, e2e and the integration tests. |
| `[fresh-install]` | `ci-releases.yml`: also runs Install, a fresh hub `<SP_URL>_<sha>` (~46 min), which nothing deletes. Opt-in since 2026-10-14 (it replaced `[skip-install]`): run on every push, it had left 354 hubs on the tenant. |
| `[upgrade-all-sites-to-latest]` | Runs `Install/Scripts/UpgradeAllSitesToLatest.ps1` after a full upgrade (never after `[apps-only]`: the job needs the full build and upgrade). It signs in with the certificate, so it grants itself no owner access, and a failure fails the job (until 2026-10-09 it stopped at the first site and still ended green). |
| `[skip-main-ci]` | `main`, subject: skips "Build release (CI)" and kurs. "Build test channel release (CI)" still runs: its `if:` is `!cancelled() && …`, so a skipped or failed main build does not stop it. |
| `[build-kurs]` | `main`, subject: also builds the kurs package. |
| `[skip-test-ci]` | `main`, subject: skips "Build test channel release (CI)" (it had no effect until 2026-10-09, when the `if:` began with `always() ||`). |

GitHub's own `[skip ci]` (with a space) suppresses every push workflow, `main`'s included; the house tag is `[skip-ci]`.

## 3. The push: what CI runs, and how long

A deploy workflow starts when the branch is in `on.push.branches` and the push changes something under `paths` (`SharePointFramework/**`, `Install/**`, `Templates/**`, the workflow file; `ci-channel-test.yml` adds `e2e/**` and `integration/**`). `SiteScripts/` and `channels/` are in no filter, although site scripts ship in the package. Times are from runs in October 2026.

| Push to | Workflow: jobs | Time |
|---|---|---|
| `releases/1.15` | `ci-releases.yml`: build as the main channel with the run number (~13 min), upgrade the dev hub `vars.SP_URL` = `https://puzzlepart.sharepoint.com/sites/pp365` (~28), with `[fresh-install]` a new hub `<that URL>_<sha>` (~46) | full ~40 min (~87 with `[fresh-install]`), `[apps-only]` ~14 |
| `releases/1.15`, `feat/technical-backlog*` | `ci-channel-test.yml`: build the test channel (~14, packages only ~9), upgrade `vars.SP_URL_TEST` (~25, packages only ~3.5), e2e (~5-6) and beside it the integration tests (added 2026-10-12, not yet timed) | full ~40-45 min, `[apps-only]` ~18-20 |
| `releases/1.15`, `feat/**`, every push (no path filter); every pull request to `releases/**` | `ci-build-debug.yml`: the subject job; the build with `[build-debug]`, and always on a pull request (the check the branch protection requires) | seconds; a build ~10-15 min |
| `main` | `build-release.yml`: release package, then test-channel package (kurs on `[build-kurs]`); deploys nothing | ~25 min |
| any branch or PR touching `.claude/skills/**`, `.github/skills/**`, `.agents/skills/**` or `.tasks/check-skills.js` | `skills.yml`: `npm run check-skills`, regardless of `[skip-ci]` | seconds |
| tag `v*` | `generate-sbom.yml`: regenerates `SBOM.md` and uploads it as the artifact `sbom`, no commit. Run by hand from a branch, it also commits a dependency change there (the `Generated` timestamp alone does not count). Red on every tag from v1.12.1 to v1.14.0, when it pushed to the tag ref | seconds |

- A merge into `releases/1.15` starts both deploy workflows in parallel: done in ~20 min with `[apps-only]` (up to 10 more if the deployment gate waits), ~90 min without.
- Trying a build change: push it with `[skip-ci] [build-debug]`, read the log and `rush-logs-debug`, then move the switch into the live workflows. How to compare two runs or two `.sppkg`: the CI chapter, «CI (build debug)».
- Other branches deploy nothing until merged (`feat/**` gets the seconds-long debug run). To put a topic branch on the test tenant, add it to `ci-channel-test.yml`'s `on.push.branches` in its first commit, as phase 5 did, and take it out again in the pull request's last commit, pushed on its own after the branch's last test-channel run: the workflow files of the pushed commit decide, so that push deploys nothing, and the merge leaves the trigger list and the branch lists in this skill, `testing.md` and the CI chapter as they were (#1319 did both). `workflow_dispatch` is declared but has never run: `main`'s copy lacks the trigger until 1.15.0 merges, and `ci-build-debug.yml` is not on `main` at all. A dispatched run has no commit subject, so it takes the full path.
- The branch names are literal in `ci-releases.yml`, `ci-channel-test.yml` and `ci-build-debug.yml`.
- Every branch in `ci-channel-test.yml` upgrades the same test hub and app catalog, so its runs share one `concurrency` group (`ci-channel-test`, `cancel-in-progress: false`) whatever the branch: a run waits while another runs, so a second push takes up to a full run longer. GitHub keeps only the newest waiting run in a group and cancels an older waiting one. On one branch the newer commit holds the older one's changes, but a cancelled full run's templates are not applied: push the commit that needs the full run last. `ci-releases.yml` has its own group (`ci-releases`) since 2026-10-14, for the same reason: every run upgrades the dev hub.
- Pull requests start `ci-build-debug.yml`'s build («Build release package (pull request)»: the rebuild with Jest, the coverage floors and the packaging proofs, no deployment, no secrets) and `skills.yml` when skills change; the deploy workflows run only on push. The branch protection on `releases/1.15` should require «Build release package (pull request)» and «task-list-completed», in a rule for that exact name: it outranks the `releases/1.1*` wildcard, whose branches up to 1.14 run no workflow on a pull request. The pull request's job has its own name because a push to the same commit without `[build-debug]` reports a skipped job, and GitHub counts a skipped job as passed for a required check. A skipped job is named by its unevaluated `name:` expression (`github.event_name == 'pull_request' && …`), and the protection's search lists that text too: picked on 2026-10-14, it required a check no pull request reports. The list offers «Build release package (pull request)» once a pull request has run it in the last week; GraphQL's `updateBranchProtectionRule` takes the name before that. The old required check «Rush Install and Rebuild» came from a workflow that never ran, so every merge needed an admin.
- Every job has `timeout-minutes` (build 45, full upgrade 60, packages-only upgrade 20, e2e 30, integration 20, `UpgradeAllSitesToLatest.ps1` 120): GitHub's default is six hours, and with one run at a time a hung job holds every later run as long. A failed build uploads the whole Rush logs as `rush-logs-<workflow>` (the job log has the last 200 lines).
- Every job that touches a tenant signs in as the Entra app «Prosjektportalen CI», app-only with a certificate (`CI_CLIENT_ID`, `CI_TENANT`, `CI_CERT_BASE64`, a PFX without a password): the upgrades and installs in both deploy workflows and the integration tests; e2e signs in as the e2e user. Its permissions are SharePoint application permissions, which work only after admin consent (`TermStore.Read.All` since 2026-10-12, for the integration tests). Never give the multi-tenant «Prosjektportalen» app (`da6c31a6-…`, `Install.ps1`'s default for interactive sign-in) permissions for CI: every customer who consents to it is asked for them. The CI chapter, «CI-appen».

## 4. After the run

- Follow: `gh run list --branch <branch> --limit 6`, `gh run watch <run-id>`, `gh run view <run-id> --log-failed`. Job ids for a rerun: `gh run view <run-id> --json jobs --jq '.jobs[] | {name, databaseId}'`. Logs and artifacts expire after **7 days**, the repository maximum, which caps the workflow's `retention-days: 14`: download what you need.
- A channel build logs `[<Solution>] solution version x.y.z.<run>`, the version the tenant should now report. On a release branch it carries the last release's number until `npm version` runs (`1.14.0.<run>` on 1.15 work).
- Build job, the `[ERROR]` lines of `Build-Release.ps1`:
  - `rush install failed with exit code N. Last 50 lines of .../rush-install.build.log`: usually `common/config/rush/pnpm-lock.yaml` no longer matches after a dependency change; run `npm run rush:update` and commit the lockfile.
  - `rush rebuild failed with exit code N`, the last 200 lines of `SharePointFramework/rush-rebuild.build.log` with Rush's `--[ FAILURE: <project> ]--`, then `Jest failures in <Solution>/rush-logs/<package>.build.log` with `[test:jest] FAIL <file>` and the `●` blocks: reproduce with `npm test` in that solution (pp365-testing). Only `ci-build-debug.yml` uploads the complete per-project logs (`rush-logs-debug`).
  - `A coverage floor was missed`: add tests. The message offers lowering the floor; every `jest.config.json` says never lower it.
  - `did not emit`, `predates this build`, `No .sppkg were packaged`, `reference a pp365-* package as an external`, `hashed class names from third-party stylesheets`: the packaging proof; see pp365-toolchain.
  - `[WARNING] Unknown solution '<x>' - skipping` or `No valid solutions selected`: a misspelled `[apps-only:<names>]`.
  - `config/package-solution.json has the solution id … after the channel swap`, or `… without the run number N`: `modifySolutionFiles.js` (output silenced) did not write the channel's ids or the stamp. Run `node ../.tasks/modifySolutionFiles.js --force` in that solution to see why, then revert as in the checklist above.
  - `Correct PnP.PowerShell module not found` (the PowerShell Gallery install) or `-SkipPnPPowerShell needs -SkipBuildPnPTemplates` (a workflow's arguments). Like a failed `rush install`, these used to exit 0 and leave a green job without packages.
  - `[Rush rebuild timeline]` is no error: time per project, longest first, in the log and the job summary of the packages-only test-channel job and the debug build (`-RushTimeline`). Compare times only within one run; the same build has taken 506 and 711 s.
- Upgrade job: `Install.ps1` output (`Failed to run pre-install upgrade steps`, `Failed to install app packages`, `Failed to apply PnP Portfolio template after 3 attempts`). After tenant trouble, `gh run rerun <run-id> --failed`.
- Integration job: `node --test`'s spec report lists each test, and each failure with its assertion; JUnit is in the artifact `integration-report-test-channel`. A missing variable or secret fails it (`INTEGRATION_STRICT`) rather than skipping. "names the upgrade that just ran" failing means the hub's installation log has no entry for this commit: the upgrade did not log, or another run's is newest. The template tests run only after the full upgrade (`INTEGRATION_TEMPLATES_APPLIED`), and skip after `[apps-only]`. Classify per `testing.md` «Når en test feiler».
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
- The squash subject is what CI reads. GitHub proposes the commit's own subject for a one-commit PR and the PR title otherwise (`COMMIT_OR_PR_TITLE`); the body lists the branch's commit messages (`COMMIT_MESSAGES`), where tags never count. Keep the PR title untagged and add the tag at the end of the subject in the merge dialog: `feat: allow clipboard-write på assistent-iframen i footeren (#1773) [apps-only]`.

## 6. Cutting a release

1. Gate: the last e2e and integration runs on the test channel are green, and the smoke-test issues (templates in the private `Puzzlepart/prosjektportalen365-testing` repo, `utgivelse/smoketest.md`) link to it.
2. `CHANGELOG.md`: `## <versjon> - TBA` becomes `## <versjon> - DD.MM.YYYY`. For a minor, the intro line links `./releasenotes/<versjon>.md`; only minors have a notes file (model: `releasenotes/1.14.0.md`).
3. `releasenotes/<versjon>.md`: the title's `(TBA)` becomes month and year (`# Prosjektportalen 365 - 1.14.0 (September 2026)`); add the images for every `<!-- TODO skjermbilde -->` under `releasenotes/assets/<x.y>/` (`assets/1.15/` does not exist yet).
4. Version, on `releases/x.y` with a clean tree, in the root after `npm install` there (`sync-version` needs `glob`; `generate-readme` fetches `@appnest/readme` with `npx`): `npm version minor` (or `patch`). `postversion` runs `generate-readme`, `sync-version` (`.tasks/automatic-versioning.js`: the `package.json` of every project in `rush.json`, the dot folders, `Templates`, `e2e` and `integration` included; `package-solution.json` as `x.y.z.0`; every `src/**/manifest.json`) and `generate-sbom`. `npm run sync-version -- --dry-run` lists what it would change.
5. npm commits and tags before `postversion` runs, so its commit misses those files. 1.14.0 ended as one commit `v1.14.0` on `releases/1.14` holding them all, with the `v1.14.0` tag later on `main`: use `npm version minor --no-git-tag-version` and one commit, or amend npm's commit and delete its local tag. Do not `git push --tags` as `opprette-ny-versjon.md` says: the tag would land on the release branch. Never version a solution on its own (`versjonering.md`).
6. Release PR from `releases/x.y` into `main`, titled `v<versjon>`, label `release-pr`, milestone `<versjon>` (#1769, squash-merged). `build-release.yml` reads the squash subject only: add `[build-kurs]` there when the kurs package is wanted.
7. `build-release.yml` uploads `release-package` and `release-package-test` (the `release/` folder, gone after 7 days). Its test package carries `x.y.z.0`, lower than the `x.y.z.<run>` the test hub got from `ci-channel-test.yml`. A local `npm run build-release` on `main` writes `release/pp365-<version>.<hash>.zip` (`-test` appended with `-Channel test`). Both include the bundled PnP.PowerShell, which the deploy workflows leave out (`-SkipBundle`).
8. GitHub release `v<versjon>` on `main` with the assets `pp365-<versjon>.zip` and `pp365-<versjon>-test.zip` (as v1.14.0; no build names them so: rename the local zips or zip the artifacts' content), and a body that links the release notes and repeats the changelog section under the headings of `.github/RELEASE_TEMPLATE.md`. The tag starts `generate-sbom.yml`, which only uploads the `sbom` artifact; `SBOM.md` already came with `postversion`.
9. Next cycle: open `releases/<next>`; write it into `ci-releases.yml`, `ci-channel-test.yml`, `ci-build-debug.yml` and the branch lists in `testing.md` and the CI chapter; create the milestone if missing (`1.16.0` exists); add `## <next> - TBA` to the changelog.

## Channels and version stamping

- `channels/<name>.json` (`main`, `test`, `kurs`, `i18n`) gives each solution its own id, name and `zippedPackage` and each component its own id, so channels install side by side in one tenant (`maler/kanaler.md`). `Build-Release.ps1 -Channel main|test|kurs|i18n` swaps them (`main` since 2026-10-14, for `ci-releases.yml`'s version stamp; its ids are the source's own) into `config/package-solution.json` and every `manifest.json` (web parts get `hiddenFromToolbox` when the channel's ids differ from the source's), runs the full `rush rebuild`, copies each selected solution's declared `.sppkg` and reverts. `npm run build:<channel>` in one solution (`.tasks/build.js`) runs `heft build`, so no tests run.
- Stamp: `ci-releases.yml` (built with `-Channel main` for it), `ci-channel-test.yml` and `ci-build-debug.yml` set `PP365_BUILD_NUMBER` to the run number, and `modifySolutionFiles.js` makes the solution and feature versions `x.y.z.<run>`, so clients refetch the manifests (`SharePointFramework/.tasks/README.md`). Packages from `main` and local builds carry `x.y.z.0` from `sync-version`. A channel build hides the web parts from the toolbox only when the channel's ids differ from the manifests' own, so the main channel's stay in the toolbox (`.tasks/modify-solution-files.test.js`).
- `Install.ps1` gets `<version>.<git hash>` and the channel name at build time; every install and upgrade logs both in the hub list `Installasjonslogg` (`Installation Log` on English installs), which tells which commit a tenant runs.

## Do not

- Do not run `npm version` or `npm publish` inside a solution: its `postversion` is `heft build --production && npm publish`, and publishing has stopped (npm's latest is 1.8.4, `pp365-shared-library` is not on npm), whatever `utgivelse/npm.md` says.
- Do not lower a `coverageThreshold`, delete an assertion or add `[skip-e2e]` or `[skip-integration]` to get CI green.
- Do not commit channel ids in manifests, `*.bak`, `.generated-solution-config.json` or `.current-channel-config.json`. A running `npm run watch` with `SERVE_CHANNEL=test` holds them in the working tree; `npm run check-channel-ids` tells before you commit, and `Build-Release.ps1` stops on them.
- Do not push to a deploying branch while its previous run is still upgrading the tenant.
- Do not edit `.development-guide/README.md` or the root `README.md`; `npm run generate-readme` builds them from the chapter files and `readme/`.
- Do not put skills in `.github/skills` or `.agents/skills`.
- Do not write a secret into a `run:` line (`${{ secrets.X }}` or `${{ env.X }}` holding one): pass it through `env` and read it as `$env:X` in `pwsh`, so it never lands in the step's script. A new job gets a `timeout-minutes`; a PnP.PowerShell install in CI goes through `Install-ModuleWithRetry` (`Install/Scripts/SharedFunctions.ps1`).
