---
name: pp365-templates
description: 'How content reaches Prosjektportalen 365 sites and existing installations: the hub PnP templates, the JSON project templates the setup wizard applies, their .resx texts, site scripts, channel ids, and the install and upgrade scripts. Use when asked to "add a field", "new project property", "show a property in Prosjektinformasjon", "site column", "content type", "add a list", "seed rows", "Prosjektkolonner", "Maloppsett", "global setting", "Portfolio.xml", "JSON template", "Standardmal", "project setup", "sp-js-provisioning", "resx", "SharedResources", "term set", "site script", "generate-channel-config", "upgrade existing hubs or projects", "Install.ps1 -Upgrade", "PreInstallUpgrade", "PostInstallUpgrade", "UpgradeAllSitesToLatest", "Ensure script", "managed property", "template catalog". Pair with pp365-release for CI tags and runs, and pp365-toolchain for builds and dependency bumps.'
argument-hint: 'Describe the content change (field, content type, list, page, setting, term, site script) and whether existing hubs and projects must get it'
---

# PP365 templates, provisioning and upgrades

Read first (Norwegian):
- `.development-guide/maler/maler.md`, `js-provisjoneringsmal.md` (`Parameters`, `TermSetIds`), `kanaler.md` and `site-design-og-site-scripts.md`. They predate the current layout (they name `_JsonTemplate.json`, Templates-root `.ps1` scripts and `Portfolio_content_BA` files that no longer exist); where they disagree with this skill, the code wins.
- `Templates/README.md` (resx to `SharedResources`) and `.development-guide/spfx/npm-skript.md`, "Skript i `Templates`" (current).
- CI tags: `.development-guide/ci/kontinuerlig-integrasjon.md` and pp365-release.
- The guide has no chapter on adding a project property or on upgrade scripts. The newest worked upgrade is `docs/plans/prosjektveiviseren-v6.md` ("Den avgjørende mekanikken", "K. Oppgraderingssti").

## Map

| What | Source | Reaches the tenant as |
|---|---|---|
| Hub site columns, content types, lists with seed rows, pages, navigation, custom actions | `Templates/Portfolio/Portfolio.xml` includes `Objects/*.xml`; columns, content types, lists and pages are one file each, listed by `xi:include` in `Objects/<Kind>/@.xml` (`href` relative to `Templates/Portfolio`) | `Portfolio.pnp` |
| Hub texts | `{resource:Key}` from `Templates/Portfolio/Resources.no-NB.resx` / `Resources.en-US.resx`, picked by the site LCID (1044, 1033) | inside the `.pnp` |
| Project, program and parent templates | `Templates/JsonTemplates/_JsonTemplate{Project,Program,Parent}.json`, sp-js-provisioning schema: `{{Key}}` = resx text, `{{ControlId_<alias>}}` = component id, `{version}` = root `package.json` | generated (gitignored) to `Templates/Content/Portfolio_content.<lng>/ProjectTemplates/*.txt` (`Standardmal`, `Programmal`, `Overordnet`; `DefaultTemplate`, ...) and uploaded to the hub's project templates library by the content template |
| Per-language content: those `.txt`, matrix configurations, `Malbibliotek`, the v6 `Fasesjekkliste` and `Planneroppgaver` rows | `Templates/Content/Portfolio_content.<lng>/Portfolio_content.<lng>.xml`, written per language, no tokens | `Portfolio_content.<lng>.pnp` |
| Term sets | `Templates/Taxonomy/Taxonomy.xml`; for existing tenants `Templates/Upgrade/<version>/<version>.xml` | `Taxonomy.pnp`, `<version>.pnp` |
| Site design `Prosjektområde` / `Project Site` | `SiteScripts/src/NNNNNN - <Title>.txt` (`Install.ps1` cuts the 9-character prefix off the title) | site scripts and design |
| Managed property mappings | `Install/SearchConfiguration.xml` | `Set-PnPSearchConfiguration -Scope Subscription` |

`Install/Build-Release.ps1` packs `Templates/Portfolio`, every folder under `Templates/Content/` (after `npm run generate-project-templates`) and `Templates/Upgrade/`, and `Templates/Taxonomy` with `Convert-PnPFolderToSiteTemplate`.

## How content reaches sites

The hub, through `Install/Install.ps1`:
- Fresh install: `Taxonomy.pnp`, then `Portfolio.pnp` and the content template with all handlers, the search configuration, `Scripts/PostInstall.ps1`.
- `-Upgrade`: `Scripts/PreInstallUpgrade.ps1` (before the apps), `Portfolio.pnp` with `-ExcludeHandlers Navigation, SupportedUILanguages, Files` (the `-UpgradeExcludeHandlers` default), the content template with `-Handlers Files` only (its rows are not applied), the search configuration, `PostInstall.ps1`, `Scripts/PostInstallUpgrade.ps1`. `Taxonomy.pnp` is never applied on upgrade. `-SkipTemplate` (an `[apps-only]` run) skips the templates, but the pre- and post-install scripts still run.
- Seed rows: `<pnp:DataRows KeyColumn="..." UpdateBehavior="...">`. `Skip` (most lists: `Prosjektkolonner` on `GtInternalName`, `Globale innstillinger` on `GtSettingsId`, `Statusseksjoner`, `Listeinnhold`, `Portefoljevisninger`, `Prosjektkolonnekonfigurasjon` on `Title`) adds the rows whose key is missing and never changes an existing row. `Overwrite` (`Maloppsett`, `Hjelpeinnhold`, `Prosjektadministrasjonstilganger`, `Idekonfigurasjon`, `Tillatelseskonfigurasjon`) rewrites its rows on every upgrade.
- On a fresh install a seed row's item id is its position in `DataRows`, and seed lookups use those ids: `Portefoljevisninger` (`GtPortfolioColumns`, `GtPortfolioRefiners`) and `Prosjektkolonnekonfigurasjon` (`GtPortfolioColumn`) point at `Prosjektkolonner` rows, `Maloppsett` (`GtProjectTemplate`) at the template files. Existing hubs have other ids, so `PostInstall.ps1` resolves such lookups at run time (by `GtInternalName` for the v6 status colours, by file name for `Maloppsett`).
- Hub pages carry `Overwrite="false"` except `Idemodul.xml` and `Konfigurasjon.xml`, so other existing pages stay as they are. Navigation is excluded on upgrade; new nodes are added in `PostInstallUpgrade.ps1` (`Add-PnPNavigationNode`).

A project site, once, at creation:
- The hub's default site design runs the site scripts; `002000 - Setup extension.txt` attaches the `ProjectSetup` customizer with default `termSetIds`.
- The wizard runs the tasks in `ProjectExtensions/src/extensions/projectSetup/tasks/index.ts`, in this order:
  - `PreTask` loads the template file linked from the chosen `Maloppsett` row; `ProjectTemplate.getSchema()` fills `Parameters` from that row (content types, column groups, phase term set), falling back to the file's values. Unless the `forceTemplate` property is set, the wizard fails when a `0x…` parameter is not a hub content type or the `GtProjectPhase` term set is missing. A catalog (cloud) template takes its schema from `CloudTemplatePackage.fromUrl`, falls back to the standard schema when the package has no `Parameters`, and is not validated.
  - `SitePermissions`.
  - `SetupProjectInformation`: `PortalDataService.syncList` builds the local properties list (`Lists_ProjectProperties_Title`: `Prosjektegenskaper`, en-US `ProjectProperties`) from the hub content type `Parameters.ProjectContentTypeId`, and the project is added to the hub list `Prosjekter`.
  - `ProvisionSiteFields` copies the hub site columns of group `Parameters.ProvisionSiteFields` ("Kolonner for Prosjektportalen (Prosjekt)"), except Calculated ones and those already there.
  - `ApplyTemplate`: `new WebProvisioner(web).setup(...).applyTemplate(schema)`, then each chosen extension without its `Hooks`.
  - `SetTaxonomyFields` binds `Parameters.TermSetIds`; `CopyListData` copies the chosen `Listeinnhold` configurations (list rows, Planner tasks; a cloud template's bundled rows); `CustomActions`; `Hooks`.
- Nothing re-applies a template to an existing project except an admin running the wizard again (Prosjektinformasjon, "Kjør oppsettveiviser"). Otherwise existing projects change only through `syncList` or `Install/Scripts/UpgradeAllSitesToLatest/*.ps1`. The `ProjectUpgrade` customizer the templates add is an empty placeholder.

## Typical task: a new project property in Prosjektinformasjon, editable in its panel

1. Column: `Templates/Portfolio/Objects/SiteFields/ProjectInformation/GtXxx.xml`, one `<Field>` modelled on its Text sibling `ProjectInformation/GtArchiveReference.xml`: new `ID` GUID, `Name` = `StaticName` = `GtXxx`, `DisplayName="{resource:SiteFields_GtXxx_DisplayName}"`, `Description="{resource:SiteFields_GtXxx_Description}"`, `Group="{resource:SiteFields_Portfolio_Group}"`. Register it in `Objects/SiteFields/@.xml`. With `SiteFields_Project_Group` instead it is also copied as a site column to every new project (`GtProjectPhase`, `GtStartDate`). Choices are `{resource:Choice_GtXxx_<Value>}` (`SiteFields/GtProjectLifecycleStatus.xml`).
2. Content type: `<pnp:FieldRef ID="<GUID without braces>" Name="GtXxx" UpdateChildren="true" />` in `Objects/ContentTypes/Prosjekt.xml` (`0x0100805E9E4FEAAB4F0EABAB2600D30DB70C`).
   - `UpdateChildren` pushes it into the lists that bind the type: hub `Prosjekter` and the idea module's `Lists/Idea/Prosjektdata.xml` (add it to their `AllItems` views only if wanted).
   - A taxonomy property also needs a `GtXxxText` companion there (Text or Note, `ShowInEditForm="FALSE"`): the hub sync writes only the term text, into that field (`GtProjectServiceArea`, `GtProjectServiceAreaText`).
3. Display: a `<pnp:DataRow>` in `Objects/Lists/Prosjektkolonner.xml`.
   - Append it as the last row; never insert or reorder (the lookup ids above are positions).
   - Copy a sibling's values: `GtSortOrder`, `Title` = `{resource:SiteFields_GtXxx_DisplayName}`, `GtInternalName`, `GtManagedProperty`, `GtFieldDataType` (`Text`, `Note`, `Date`, `User`, `Tags`, `Currency`, `Boolean`), `GtColMinWidth`, `GtColMaxWidth`, `GtShowFieldFrontpage`, `GtShowFieldProjectStatus`, `GtShowFieldPortfolio`, `GtIsRefinable`, `GtIsGroupable`; optionally `GtFieldOverrides` (per `Maloppsett` `FieldConfigurationName` and locale; `GtProjectNumber` has a `Program` one).
   - `GtSortOrder` orders both the read view and the panel (`createProperties`): 35 puts a field between `GtProjectNumber` (30) and `GtArchiveReference` (40).
   - Without a row the field is not shown (`EditableSPField.isVisible` asks `ProjectColumn.isVisible(page)`, `page` being `Frontpage` on the front page); the row's `Title` replaces the field's display name.
4. Search: `GtManagedProperty` follows the existing rows: the crawled default `GtXxxOWSTEXT` (`OWSDATE`, `OWSMTXT`, `OWSCHCS`, `OWSCURR`, `OWSBOOL`), or `GtXxxTextOWSTEXT` for taxonomy (`OWSMTXT` when the companion is a Note), both without a search configuration change. People fields use a `RefinableStringNN` mapped in `Install/SearchConfiguration.xml` (`GtProjectManager`: `RefinableString51`, ManagedPid `1000000051`). Nothing checks that a new RefinableString is free in the tenant (`PreInstallUpgrade.ps1` only warns about 90-98, and only on upgrades from before 1.13.0): add a check or a manual step in the release notes.
5. Texts in both `.resx` files (Localization), then `cd Templates && npm run build && npm run validate-loc` and read the reports.
6. Code: none for a supported type. The panel (`shared-library` `CustomEditPanel`, `useFieldElements`) renders `Text`, `Note`, `Number`, `Currency`, `DateTime`, `Boolean`, `URL`, `Choice`, `MultiChoice`, `User`, `UserMulti`, `TaxonomyFieldType`, `TaxonomyFieldTypeMulti` and `Lookup`, and leaves out `ShowInEditForm="FALSE"`, hidden and `ReadOnly="TRUE"` fields and `GtProjectPhase`.
7. Optional, a product choice: when the web part's `fallbackVisibleFields` is non-empty, users without hub access see only those fields (it overrides `showFieldExternal`). The project and program templates list five (`GtProjectPhase`, `GtProjectOwner`, `GtProjectManager`, `GtProjectType`, `GtProjectServiceArea`); add the name in `_JsonTemplateProject.json` and `_JsonTemplateProgram.json` only if outsiders should see it.
8. Existing installations:
   - `Install.ps1 -Upgrade` gives hubs the column, the FieldRef and the row.
   - A project's properties list gets the field only when someone saves the edit panel (`useEditPropertiesPanelSubmit` runs `usePropertiesSync` with `syncList: true`; never with the web part's `skipSyncToHub`) or reruns the wizard. Until then neither the panel nor the read view shows it.
   - To give every project the field at once, add `Install/Scripts/UpgradeAllSitesToLatest/Ensure<Name>.ps1` that does what `syncList` does: list title from `Get-Resource -Name "Lists_ProjectProperties_Title"`; return when the field exists (by id or name); `$List.Fields.AddFieldAsXml(<XML with the hub ID, Name, StaticName, Type, and DisplayName = the internal name>, $false, [Microsoft.SharePoint.Client.AddFieldOptions]::AddToDefaultContentType)`, `Invoke-PnPQuery`, then `Set-PnPField -List $List -Identity <id> -Values @{ Title = (Get-Resource -Name "SiteFields_GtXxx_DisplayName") }`.
   - Model a new step on `EnsureStakeholderGroupsTaxField.ps1`: its gate, its exists check and its names from `Get-Resource` (since 1.15.0). `EnsureProjectAdminRolesField.ps1` still hard-codes Norwegian names and adds its field unlike `syncList` (to the content type `Element`). Rules: Writing upgrade steps.
9. Release: one Norwegian line under `### Ny funksjonalitet` in the open `## x.y.z - TBA` section of `CHANGELOG.md`; `[upgrade-all-sites-to-latest]` in the commit subject when step 8 adds a script, and never `[apps-only]`.
10. Check on the test hub in the edit panel first: read mode hides empty values (`useProjectProperties` filters `!p.isEmpty`).

## Other tasks

- Column on a project list: a hub column in `SiteFields_Project_Group` and a FieldRef in the content type in `_JsonTemplateProject.json` and `_JsonTemplateProgram.json`. Calculated columns are never copied from the hub; they live in the JSON template's `SiteFields` (`GtRiskFactor`). Existing projects: an `UpgradeAllSitesToLatest` script (`EnsureGtTagSiteColumn.ps1`).
- Porteføljeoversikt column: a view shows a `Prosjektkolonner` row only when the row's id is in the view's `GtPortfolioColumns` and `GtShowFieldPortfolio` is true (`PortfolioOverviewView.configure`). New hubs: add the fresh-install id to the `Portefoljevisninger` rows. Existing hubs: a `PostInstallUpgrade.ps1` step that finds the column by `GtInternalName`.
- Hub list: `Objects/Lists/<Name>.xml` with `Title="{resource:Lists_<X>_Title}"` and `Url="{resource:Lists_<X>_Url}"`, listed in `Objects/Lists/@.xml`. Code opens hub lists by title from `SharedResources` (`PortalDataServiceDefaultConfiguration.listNames`, `getByTitle`), and `ContentConfig` finds `Listeinnhold` sources and targets by title: a changed list title is a breaking change.
- Page: on the hub `Objects/ClientSidePages/<Page>.xml` (existing hubs keep their copy unless `Overwrite="true"`); on projects the JSON templates' `ClientSidePages` (new projects; existing ones: `EnsureProjectTimelinePage.ps1`).
- Global setting: a row in `Objects/Lists/Globale innstillinger.xml` with a new `GtSettingsId` GUID, a resx `Title`, `GtSettingsKey`, `GtSettingsValue`, `GtSettingsEnabled` and `GtSettingsCategory`. `PortalDataService.getGlobalSettings()` maps key to value for enabled rows only: a disabled setting is absent, not false. A new default for an existing row needs a `PostInstallUpgrade.ps1` step (`AvailableProgramHubs`).
- Terms: `Taxonomy.xml` for new tenants; for existing ones a new `Templates/Upgrade/<version>/<version>.xml` (`TermGroups` only, like 1.5.0 to 1.14.0), applied by `ApplyUpgradeTemplate "<version>"` behind a version gate in `PreInstallUpgrade.ps1`.
- v6 phase checklist and Planner task rows: edited by hand in both content XMLs (sources `docs/prosjektveiviseren-v6/innhold-*.csv`), with the same rows and `GtSortOrder` in both languages and `GtProjectPhase` as `Name|GUID` from `Taxonomy.xml`. Existing hubs never get new rows: the upgrade applies the content template with `Files` only, and `PostInstallUpgrade.ps1` fills a v6 list only while it is empty.
- New template type: `Templates/.tasks/generate-project-templates.js` maps only `Project`, `Program` and `Parent` in `templateNames` (another `_JsonTemplate<X>.json` is written as `undefined.txt`). It also needs `pnp:File` entries in both content XMLs, a `Maloppsett` row, `Lists_TemplateOptions_*` keys and an entry in `$TemplateFilesMap` in `PostInstall.ps1`.
- Template catalog (`.pppkg`): design in `docs/plans/template-catalog.md`; the hub import is `PortfolioExtensions/src/services/PackageInstaller.ts` (`provisionCloudTemplateHubDependencies` for Mode B); the wizard side is the cloud branches of `PreTask` and `CopyListData`.
- Site script: reaches only sites created afterwards; `SiteScripts/src/README.md` shows `Invoke-PnPSiteDesign` for one existing site.

## Writing upgrade steps

- `PreInstallUpgrade.ps1` and `PostInstallUpgrade.ps1` read `$PreviousVersion` from the newest `Installasjonslogg` entry and gate on `$PreviousVersion -lt [version]"x.y.z"`. An `[apps-only]` upgrade logs the new version too, so a step that needs the templates checks `$SkipTemplate` and the state as well (`$V6SplitPending`, an empty v6 list), not only the version.
- x.y.z is the open `## x.y.z - TBA` heading in `CHANGELOG.md`, not the root `package.json`: that keeps the last release (1.14.0) until the release, and a gate on it skips every site upgraded from that release. Every build stamps the `package.json` version into the log, so until the bump each upgrade (every CI test-channel run too) logs 1.14.0 and a `-lt 1.15.0` step reruns: idempotence is required.
- `Scripts/UpgradeAllSitesToLatest.ps1 -Url <hub>` runs after the hub upgrade and dot-sources every `UpgradeAllSitesToLatest/*.ps1` into one scope per site (set every variable before reading it), on each group site of the hub that has the project properties list, found by `Get-Resource -Name "Lists_ProjectProperties_Title"` (`Prosjektegenskaper`, en-US `ProjectProperties`; the URL follows the title, so it differs too). CI runs it only with `[upgrade-all-sites-to-latest]` in the commit subject. Signed in with a certificate (CI) it grants no owner access, since SharePoint refuses to make the app an owner and the app reaches every site anyway; a signed-in user is still offered owner access. In CI a failure exits 1.
- Until 1.15.0 that title was hard-coded in Norwegian, so English installations ran no per-site step. The steps written before then still hard-code Norwegian names (`Prosjektegenskaper`, `Prosjektleveranser`, `Ressursallokering`, `Interessentregister`, `Prosjekttidslinje`, `Hjelpeinnhold`). On an English site their list lookups find nothing, so `EnsureStakeholderGroupsTaxField.ps1` (gate 1.14.0) never migrated an English stakeholder list until 1.15.0, when it took its names from the resources; the timeline page and footer steps would add Norwegian content, but their gates (1.8.2, 1.9.0) stay shut on English hubs (English came in 1.12.0). A hub whose log holds one install entry gets 0.0.0 as the previous version from `Get-PPInstallationInfo`; since 1.15.0 `UpgradeAllSitesToLatest.ps1` then takes the installed version as the previous one and runs no step, the sites being as new as the installation.
- Per-site scripts gate on `$global:__PreviousVersion` (the second-newest install entry): `if ($global:__PreviousVersion -ge [version]"x.y.z") { return }`.
- Make each step idempotent. Rename only from known default titles (`RetitleRows`, `EnsureV6BenefitTerminology.ps1`); never touch customers' own rows or names. Take localized names from `Get-Resource -Name <Key>` (the release's `Resources.<lng>.resx`): an unknown key calls `Write-Error`, which ends the script under `$ErrorActionPreference = "Stop"`.

## Localization

- Both `.resx` files carry the same keys in the same order on the same lines, mostly alphabetical: insert a new key by hand next to its alphabetical neighbour in both. `assets/scripts/Add-ResxEntry.ps1` prompts with `Read-Host`, appends at the end and re-serializes the whole file, so an agent cannot use it.
- Names: `SiteFields_<Name>_DisplayName` / `_Description`, `ContentTypes_<X>_Name`, `Lists_<X>_Title` / `_Url`, `Choice_<Field>_<Value>`, `View_<X>_DisplayName`, `ClientSidePages_<X>_PageName` / `_Title`, `Navigation_<X>_Title` / `_Url`, `WebParts_<X>_Title`.
- One key serves four readers: `{resource:Key}` in `Templates/Portfolio`, `{{Key}}` in the JSON templates (through `Templates/Resources.json`), `Get-Resource` in `Install/Scripts`, and `import resource from 'SharedResources'` in code (`src/loc/shared/{nb-no,en-us}.js` and `shared.d.ts` in all six solutions). Names that code and templates must agree on share one key. Choice values are stored as the localized text, so code compares with `resource.Choice_<Field>_<Value>` (`fetchProjectStatusReportData.ts`).
- `npm run build` in `Templates/` runs `generate-resx-json`, `generate-resx-ts` and `generate-project-templates`. No Rush dependency orders `pp365-templates` before the solutions, so run it after every resx change. Keep values non-empty and on one line: `generate-resx-ts.js` drops empty values from that language's bundle and escapes nothing but `"`.
- `npm run validate-loc` in `Templates/` exits 0 even with gaps; read the reports: `resx-ts-report.json` (keys missing from a bundle), `pnp-missing-resource-tokens-report.json` (`{resource:}` tokens a language lacks), and `<template>-validation.md` beside each generated `.txt` (unresolved `{{...}}`, such as a `ControlId_` missing from the channel file).
- The `-validation.md` files are tracked, and every run rewrites their timestamp line: revert them unless the template content changed.

## Channels and component ids

- PnP XML and site scripts hold the `main` component GUIDs; the JSON templates use `{{ControlId_<alias>}}`. A channel build swaps both from `channels/<name>.json` (`generate-pnp-templates`, `generate-site-scripts` and `generate-project-templates` read `.current-channel-config.json`).
- A component id hard-coded in TypeScript is not swapped: both `ProjectSetupCustomAction.ts` files in `ProjectWebParts/src/components/ProjectInformation/` (`RunProjectSetupDialog`, `CreateParentDialog`).
- After adding an SPFx component: `npm run generate-channel-config` (refreshes `main.json` from the manifests), then `npm run generate-channel-config <name> /update` for `test`, `kurs` and `i18n`; without `/update` every id is regenerated.
- A component missing from a channel file under its own solution gets no id in that channel's build (`modifySolutionFiles.js` sets `id` to `undefined`), and `generate-pnp-templates.js` swaps nothing for it. `channels/$schema.json` requires each component under its solution; check a channel file against it after a hand edit (`kurs.json` had `DynamicListWebPart` under `PortfolioWebParts` from 1.13.0 to 1.15.0).
- `Install.ps1 -Upgrade` refuses a site installed with another channel or language. Channel builds and CI: pp365-release.

## Testing a provisioning change

- CI: `ci-channel-test.yml` upgrades the test channel's hub; `ci-releases.yml` (`releases/1.15`) upgrades the dev hub and installs a fresh hub (no apps, site design, taxonomy or search configuration) unless `[skip-install]`. Both filter on `SharePointFramework/`, `Install/` and `Templates/` (the test channel on `e2e/` too): a push touching only `SiteScripts/`, `channels/` or the root `.tasks/` deploys nothing (`ci-build-debug.yml` starts on every push but builds only with `[build-debug]`).
- Engine: `sp-js-provisioning` is its own repository (github.com/Puzzlepart/sp-js-provisioning), pinned at `1.4.0` in `ProjectExtensions` (the setup tasks) and `PortfolioExtensions` (`PackageInstaller.ts`). Bump: the exact version in both `package.json`, then `npm run rush:update`.
- Local runner, in a checkout of that repository: `npm run provision -- --site <url> --package <folder|.pppkg|template.json> [--lang en-US] [--mode hub|cloud] [--handlers <csv>] [--skip-taxonomy] [--dry-run]` applies a template to a real site from Node (`debug/provision.ts`, `debug/README.md`). App-only credentials go in the gitignored `debug/provision.settings.ts`; Node 18.12 or later (ignore the README's Node 16 remark).
- It skips Taxonomy and ContentTypes (JSOM, browser-only), Files and PropertyBagEntries unless `--handlers` forces them; SiteFields and Lists run over REST, so list content-type bindings need the content types on the site already. It mirrors `PackageInstaller` (`--mode cloud` = `provisionCloudTemplateHubDependencies`), not the wizard; debug content types and taxonomy in the browser.

## Pitfalls

- The `Gt` prefix is functional: `ProjectDataService` reads only fields matching `substringof('Gt', InternalName)`, and `SPDataAdapterBase._getFieldsToSync` sends only `Gt` fields (and the custom column group) to the hub. `ShowInEditForm="FALSE"` marks a system field: not shown, not edited, not synced.
- The `<!-- ID: N -->` comments in `Prosjektkolonner.xml` give each row's position (its id on a fresh install); keep them right when appending. From 1.8.0 to 1.14.0 the three `GtStatusOpportunities` rows in `Prosjektkolonnekonfigurasjon.xml` looked up 54 instead of 36, so existing hubs have them on the column with id 54 (`GtProjectExtensions` on a hub installed with 1.8.0 to 1.13.x and upgraded through 1.13.0) or on none; `PostInstall.ps1` adds correct rows by `GtInternalName`, and `PostInstallUpgrade.ps1` (gate 1.15.0) recycles the old ones once the right row for the same value is there, leaving rows whose title or value was changed.
- Write `xi:include` hrefs with the file's exact case. `FasesjekklisteV6.xml` and `PlanneroppgaverV6.xml` (the files end in `v6.xml`) work only because the packed `.pnp` resolves includes without regard to case.
- `pwsh assets/scripts/Check-HardcodedAttributes.ps1 -Path <file or folder>` lists `DisplayName` and `Description` values that do not use `{resource:`.
- New wording in a `Skip` row keyed on `Title` lands as a second row on existing hubs.
- A leftover `.current-channel-config.json` at the root (an aborted channel build) makes local generation use that channel's ids: delete it.

## Do not

- Do not edit generated files: `Templates/Content/**/ProjectTemplates/*.txt`, `Templates/Resources.json`, `SharePointFramework/**/src/loc/shared/*`, `.dist/`, `.channel-replace-map.json`.
- Do not change a shipped internal name, field id, content type id or list URL; change display texts through the resx and a guarded upgrade step.
- Do not insert or reorder seed rows that other rows look up; append.
- Do not put a GUID where a JSON template expects `{{ControlId_<alias>}}`, or a `ControlId_` token in PnP XML.
- Do not add a key to one `.resx` only, or reuse a key for a different text.
- Do not rerun `generate-channel-config` for an existing channel without `/update`.
- Do not use `[apps-only]` for any change under `Templates/`: `.resx`, JSON template and content changes ship only in a full run.
