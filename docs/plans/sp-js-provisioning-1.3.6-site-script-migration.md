# sp-js-provisioning and PP365 Site Script Migration Plan

Date: 2026-05-11

Review update: 2026-05-12

## Context

The patched `sp-js-provisioning` branch now supports deterministic SharePoint content type IDs by using `SP.ContentTypeCreationInformation.set_id(...)`. This has been tested through a PP365 `Prosjekttillegg` where document-library content types were created with the expected fixed IDs.

PP365 is targeting `sp-js-provisioning@1.3.8` for the JSON-based content type provisioning path.

Planning branch:

- `codex/sp-js-provisioning-137-docs`
- Based on `origin/releases/1.14` at `63655320`.
- This clone does not have a separate `upstream` remote configured; `origin` points at `git@github.com:Puzzlepart/prosjektportalen365.git`.

## 1. Replace sp-js-provisioning in PP365

Current state:

- `sp-js-provisioning@1.3.8` includes the deterministic content type ID support from `1.3.7` and the follow-up field link fix from `sp-js-provisioning` PR [#7](https://github.com/Puzzlepart/sp-js-provisioning/pull/7).
- PP365 now references `sp-js-provisioning: 1.3.8` in:
  - `SharePointFramework/ProjectExtensions/package.json`
  - `SharePointFramework/shared-library/package.json`
- The fixed branch is `codex/research-content-type-creation-with-configuration-ids`.

Previous temporary dependency:

```json
"sp-js-provisioning": "file:/tmp/sp-js-provisioning-pack/sp-js-provisioning-1.3.5.tgz"
```

Target dependency update sequence:

1. Publish `sp-js-provisioning` as `1.3.8` with generated `lib/` output included.
2. Confirm the package contains both:
   - `lib/handlers/contenttypes.js`
   - `ContentTypeCreationInformation.set_id(...)`
3. In PP365, replace the local tarball dependency with the fixed published version:

```json
"sp-js-provisioning": "1.3.8"
```

4. Run `rush update` in PP365.
5. Rebuild the relevant SPFx packages.
6. Verify the generated bundle still contains the patched JSOM path:

```js
new SP.ContentTypeCreationInformation(...).set_id(...)
```

Do not use a Git branch dependency as the long-term solution. The package `main` points to `./lib/index.js`, while `lib/` is gitignored, so Git installs are unsafe unless the package is changed to build on install or publish generated output.

Do not consume `sp-js-provisioning@1.3.6` from npm in PP365. `npm pack sp-js-provisioning@1.3.6` shows only `README.md`, `package.json`, `schema.json`, and `sample-schemas/all-simple.ts`.

Observed failure mode for the broken npm package:

```text
MODULE_NOT_FOUND: Cannot find module '.../node_modules/sp-js-provisioning/lib/index.js'.
Please verify that the package.json has a valid "main" entry
```

PP365 build test results:

- Upstream `origin/main` uses `sp-js-provisioning: ~1.3.5`.
- The local tarball dependency was only an uncommitted working-tree change.
- With the local tarball dependency, `rush rebuild --to pp365-projectextensions --verbose` succeeds under Node `v16.18.0`, and the generated ProjectExtensions bundle contains both `ContentTypeCreationInformation` and `set_id`.
- After changing PP365 to npm latest at the time, `sp-js-provisioning: ~1.3.6`, `rush update` succeeds and installs `sp-js-provisioning 1.3.6`.
- With npm `1.3.6`, `rush rebuild --to pp365-projectextensions --verbose` fails in `pp365-shared-library` TypeScript compilation:

```text
src/models/ProjectExtension.ts(3,24): error TS2307: Cannot find module 'sp-js-provisioning' or its corresponding type declarations.
src/models/ProjectTemplate.ts(2,24): error TS2307: Cannot find module 'sp-js-provisioning' or its corresponding type declarations.
```

- The build fails before dependency testing under Node `v24.15.0`, because SPFx `1.17.4` requires Node `>=12.13.0 <13.0.0 || >=14.15.0 <15.0.0 || >=16.13.0 <17.0.0`.
- `npm pack sp-js-provisioning@1.3.7` includes 70 files, including `lib/index.js`, `lib/index.d.ts`, `lib/handlers/contenttypes.js`, and `lib/handlers/contenttypes.d.ts`.
- After changing PP365 to `sp-js-provisioning: ~1.3.7`, `rush update` succeeds and installs `sp-js-provisioning 1.3.7`.
- With npm `1.3.7`, `rush rebuild --to pp365-projectextensions --verbose` succeeds under Node `v16.18.0` for both `pp365-shared-library` and `pp365-projectextensions`.
- With a local `sp-js-provisioning@1.3.8` tarball, `rush update` and `rush rebuild --to pp365-projectextensions --verbose` succeed under Node `v16.18.0` for both `pp365-shared-library` and `pp365-projectextensions`.
- The generated ProjectExtensions setup bundle contains both `ContentTypeCreationInformation` and `set_id`.

## 2. Migrate selected PP365 site scripts into base JSON templates

Current PP365 site designs include many site scripts. Only the content type creation scripts are migrated away from site scripts.

Content type site scripts removed from the release package:

- `SiteScripts/src/000020 - Innholdstype - Prosjektloggelement.txt`
- `SiteScripts/src/000040 - Innholdstype - Gevinstoppfølging.txt`
- `SiteScripts/src/000050 - Innholdstype - Kommunikasjonselement.txt`
- `SiteScripts/src/000060 - Innholdstype - Sjekkpunkt.txt`
- `SiteScripts/src/000070 - Innholdstype - Prosjektleveranse.txt`
- `SiteScripts/src/000080 - Innholdstype - Interessent.txt`
- `SiteScripts/src/000090 - Innholdstype - Gevinst.txt`
- `SiteScripts/src/000100 - Innholdstype - Endring.txt`
- `SiteScripts/src/000101 - Innholdstype - Usikkerhet.txt`
- `SiteScripts/src/000110 - Innholdstype - Mulighet.txt`
- `SiteScripts/src/000120 - Innholdstype - Risiko.txt`
- `SiteScripts/src/000130 - Innholdstype - Ressursallokering.txt`
- `SiteScripts/src/000160 - Innholdstype - Prosjekthendelse.txt`
- `SiteScripts/src/000170 - Innholdstype - Prosjektoppgave.txt`
- `SiteScripts/src/000180 - Innholdstype - Måleindikator.txt`

All of these content type IDs already exist in both:

- `Templates/JsonTemplates/_JsonTemplateProject.json`
- `Templates/JsonTemplates/_JsonTemplateProgram.json`

The JSON definitions are better migration targets because they include the full content type metadata and field refs, while the site scripts only create bare content types with fixed IDs and names.

Repo review notes:

- The site script source inventory now contains only the 5 bootstrap scripts listed below.
- `Install/Install.ps1` creates or updates site scripts by enumerating every `Install/SiteScripts/*.txt`, so deleting these source files removes them from future release packages and future site design updates.
- The built-in project and program JSON templates include the listed content types and list content type bindings.
- `PreTask` validates only content type IDs found in template parameters before `ApplyTemplate` runs. The built-in project/program templates currently validate `ProjectContentTypeId` and `ProjectStatusContentTypeId`, not the content type IDs being moved from site scripts.
- The migration still needs validation against any tenant-custom project templates that might omit the `ContentTypes` handler while relying on the site scripts to pre-create these IDs.
- Existing tenant site script objects do not need to be removed for correctness. If a site design still references the old content type site scripts, they create bare content types with the same fixed IDs before project setup. The patched `sp-js-provisioning` content type handler initializes existing web content types by ID, reuses an existing content type when the ID is already present, then updates name, description, group, and field refs from the JSON template.
- The patched handler should not be expected to fix a content type that exists with the same name but a different/random ID. In that case, creating the fixed ID could still conflict with SharePoint's duplicate-name rules. The known site-script workaround creates the expected fixed IDs, so this is mainly a risk for earlier test sites or custom templates created through the broken path.

### Follow-up validation: deterministic content type field refs

After the content type site scripts were removed from the pzlokms `Prosjektområde` site design, a fresh project site exposed a `sp-js-provisioning@1.3.7` edge case: newly created deterministic content types inherited `Title`, but the field ref handler did not reload the actual field links before processing the template refs. Since PP365 templates include `Title` first, the handler attempted to add `Title` again, SharePoint rejected the JSOM batch, and the handler swallowed the error. The result was bare content types and list views that referenced fields missing from the list.

The source fix is tracked in `sp-js-provisioning` PR [#7](https://github.com/Puzzlepart/sp-js-provisioning/pull/7) and versioned as `1.3.8`. A local `sp-js-provisioning-1.3.8.tgz` build was deployed to pzlokms for validation. New project site `https://pzlokms.sharepoint.com/sites/prosjektportalen-rom04/` was created with Norwegian locale `1044` and validated with the standard template:

- 15/15 expected site content types had the expected field refs.
- 12/12 template lists had the expected fields from their bound content types.
- `Fasesjekkliste` contained `GtProjectPhase`, `GtChecklistStatus`, `GtComment`, and `GtSortOrder`.

Before this PR is merged as the only content type provisioning path, `sp-js-provisioning@1.3.8` must be published to npm so PP365 can resolve the package without the temporary local tarball used for pzlokms validation.

Site scripts that should remain for now:

- `SiteScripts/src/001000 - Regionale innstillinger.txt`
- `SiteScripts/src/002000 - Setup extension.txt`
- `SiteScripts/src/002100 - Upgrade extension.txt`
- `SiteScripts/src/002200 - TemplateSelectorCommandSet.txt`
- `SiteScripts/src/002300 - Footer.txt`

These still bootstrap regional settings and SPFx extensions before interactive project setup runs.

## Execution Plan

1. Done: update PP365 to consume the published fixed `sp-js-provisioning` package.
2. Done: run `rush update` and keep the lockfile change in the dependency commit.
3. Done: build the affected SPFx projects and inspect the generated package for `ContentTypeCreationInformation.set_id(...)`.
4. Done: delete only the content type site script files listed above.
5. Done: keep regional settings and extension association site scripts.
6. Do not require upgrade cleanup for deprecated tenant site script objects. They can remain in old tenants as inert tenant objects, and even if still referenced by an old site design they should be harmless with the patched content type handler.
7. Build PP365 release.
8. Deploy to `pzlokms` test tenant.
9. Create a fresh project site through the UI.
10. Create a fresh program site through the UI.
11. Verify content type IDs on provisioned lists match the IDs from the JSON templates.
12. Test a legacy-path fresh site where the old content type site scripts run before project setup, then verify the JSON template enriches the existing bare content types.

Optional tenant cleanup implementation details:

- Tenant cleanup can be added later as housekeeping, but should not be a release requirement for this migration.
- If cleanup is added, place it around the next product version gate in `Install/Scripts/PreInstallUpgrade.ps1` after confirming the target version.
- `PreInstallUpgrade.ps1` runs connected to the portfolio site. Tenant site script cleanup must connect to `$AdminSiteUrl`, remove the deprecated scripts, then reconnect to `$Uri.AbsoluteUri` before site-scoped upgrade work continues.
- Remove both default titles and channel-suffixed titles for the active channel. Installed site script titles are derived from the filename after the numeric prefix, for example `Innholdstype - Prosjektloggelement`, and non-main channels append ` - $Channel`.
- Keep cleanup tolerant with `-ErrorAction SilentlyContinue`, matching the existing deprecated site script cleanup pattern.

## Commit Structure

Recommended PP365 commits:

1. `chore: consume fixed sp-js-provisioning`
   - Replace local tarball dependency with the fixed published package version.
   - Update Rush lockfile.
   - Build/verify package.

2. `refactor: provision project content types from json templates`
   - Remove content type site scripts.
   - Keep bootstrap site scripts.
   - Leave tenant site script cleanup out unless we explicitly choose housekeeping.
   - Validate project/program site creation.

## Validation Checklist

- PP365 package bundle contains `ContentTypeCreationInformation.set_id(...)`.
- Release package contains only the remaining bootstrap site scripts.
- New project site provisions all list content types with expected IDs.
- New program site provisions all list content types with expected IDs.
- Site design still associates setup/upgrade/template selector/footer extensions.
- Regional settings still apply.
- Existing tenant site design no longer references deleted content type scripts after reinstall/upgrade.
- Old tenant site script objects may remain without blocking new project/program setup.
- If old content type site scripts run before JSON setup, the JSON setup enriches the pre-existing content types instead of failing.
- Custom project templates that omit `ContentTypes` are identified before rollout, or explicitly treated as unsupported for this migration.
- The fixed published `sp-js-provisioning` package includes generated `lib/` output.
