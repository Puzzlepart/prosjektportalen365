# Usage statistics: what customers use PP365 for, sent to Assist

Status: proposed 2026-11-05, decided 2026-11-12. The user has taken decisions D1 to D9, and on
2026-11-12 went through P1 to P25 one by one. All stand as written except P4, P10 and P25, which
are rewritten below; P8, P9, P12 and P19 had already been rewritten to follow D6, D7 and D9.
On 2026-11-13 the user made Extended (3) the default level instead of Standard (2); D1, D7 and
P10 follow it.
Branches: 1.15.0 is merged to `main` in prosjektportalen365, so the work runs on a branch cut from
`main`, in the worktree `.claude/worktrees/logging` (branch `worktree-logging`, which the user may
rename). The old `feat/logging` branch there holds only this plan, on the pre-squash history. In
prosjektportalen-assist the branch is `feat/logging` off `main`. The user does all git. Target:
1.15.0 (the changelog dates it 19.11.2026), verified on the test channel before the release (D5).

Puzzlepart cannot see what customers use Prosjektportalen for. Assist knows when a hub was
installed or upgraded (the pingback), which template packages were installed (the catalog) and how
PP Assistenten is used. It knows nothing about the web parts, extensions and features people use
every day. On the customer list, "Sist aktiv" means "last upgraded"
(prosjektportalen-assist/docs/pp-oppfolging.md:34-36).

Three flows exist today:
- The template catalog posts one event per catalog action to Assist
  (`PortfolioExtensions/src/services/TelemetryService.ts`). It fails open: a disabled or missing
  `CatalogTelemetryEnabled` row, or a failed read, counts as on.
- Install.ps1 posts an installation message to the pingback function unless `-SkipPingback` is
  given. That switch is new in 1.15.
- PP Assistenten sends its own telemetry to Application Insights. Assist syncs it nightly into
  daily aggregates.

Logging › Prosjektportalen, its card on Logging › Oversikt and the Prosjektportalen line on the
customer card are placeholders ("Under arbeid", "Kommer").

This plan adds four things:
- one hub setting with four levels (D2) that governs all PP365 telemetry (D4);
- a module in the shared library that counts usage in memory and sends daily counts to a new
  Assist endpoint;
- the storage in Assist;
- the dashboard that reads it.

Everything is keyed on the customer's SharePoint host, so it follows Assist's tenant thread.
Nothing that identifies a user leaves the tenant (D3).

## Goal and non-goals

Goal: from 1.15.0, every hub that has not lowered or turned off the setting sends, at its level,
counts per day of which components and features are used, and how many different sites are in
use. The counts come with the installation's version, channel, language and size. Assist stores them as daily aggregates on the
tenant thread and shows them under Logging › Prosjektportalen, on the overview card and on the
customer card. The catalog's events obey the same setting, existing opt-outs survive the upgrade,
and every customer-facing text states exactly what is sent and what is never sent.

Non-goals:
- counting users, sessions or devices in any form (D3);
- per-event logs or free text;
- PP Assistenten's own telemetry (P23);
- customer self-service in Assist;
- sovereign clouds;
- retention, and deletion on request, for `pp_install` and the pingback table.

## Inventory (2026-11-05)

Facts the design rests on. Paths without a prefix are in prosjektportalen365; Assist paths are
prefixed `prosjektportalen-assist/`.

PP365 code:

- **Components.** `channels/main.json` lists 29 component aliases plus `SharedLibrary`:
  - 20 web parts;
  - three application customizers: `Footer`, `ProjectSetup`, and `ProjectUpgrade`, whose onInit is
    a no-op (`ProjectExtensions/src/extensions/projectUpgrade/index.ts:6-11`);
  - five list view command sets;
  - one field customizer, `RiskActionPlanner`.

  Channel builds swap component ids by alias (`SharePointFramework/.tasks/modifySolutionFiles.js:135-157`),
  so the alias is the stable key. One alias is spelled `ProgramAdministrationWebpart`.
- **Base classes.** All 20 web parts reach one of three onInit methods:
  - `PortfolioWebParts/src/webparts/basePortfolioWebPart/index.tsx:102`
  - `ProjectWebParts/src/webparts/baseProjectWebPart/index.tsx:73`
  - `ProgramWebParts/src/webparts/baseProgramWebPart/index.ts:72`

  The portfolio and project bases wrap `renderComponent` in react-error-boundary's `ErrorBoundary`
  (`index.tsx:60`, `index.tsx:49`); the program base has none (`index.ts:57-70`). Four web parts
  render their error with `renderReact` directly, and the matrices use `renderError` (pp365
  instrumentation research: `portfolioAggregation/index.tsx:36-45`,
  `portfolioOverview/index.ts:35-44`, `programProjectOverview/index.tsx:24`,
  `programAggregation/index.tsx:29`, `baseUncertaintyMatrixWebPart/index.ts:109-115`). `render()`
  runs many times per instance.
- **Portfolio portals.** BasePortfolioWebPart's onInit takes an optional portfolio and passes it
  to the DataAdapter (`basePortfolioWebPart/index.tsx:102-109`), which configures PortalDataService
  with `url: portfolio?.url` (`PortfolioWebParts/src/data/DataAdapter.ts:103`). PortfolioOverview
  passes its selected or first configured portfolio (`portfolioOverview/index.ts:88-95`;
  `setPortfolio` reconfigures at `:61-86`), and each portfolio's `url` is free text an editor types
  in the `portfolios` collection (`:209-230`).
  - With a URL, PortalDataService takes that site as `url` and the site's search `SiteId` as
    `hubSiteId` (`shared-library/src/services/PortalDataService/PortalDataService.ts:131-159`).
  - Without one, `hubSiteId` is the page's `legacyPageContext.hubSiteId` (`:161-163`).
  - `SPDataAdapterBase.configure` passes no URL (`shared-library/src/data/SPDataAdapterBase/index.ts:104-110`),
    and the Footer's, the catalog's, ProjectSetup's and the project and program bases' adapters all
    call it, so their portals resolve the page's own hub.
- **One library, 26 copies.** `shared-library` is no external: every solution has
  `"externals": {}`, and the Nov 4 release output carries PortalDataService once in each of 26
  bundles. Module state therefore exists once per bundle, not once per page. The package declares
  `"sideEffects": false` (`SharePointFramework/shared-library/package.json:4`).
- **Footer.** It is the only customizer on every site type. Its onInit:
  - reads `getGlobalSettings` (`PortfolioExtensions/src/extensions/footer/index.ts:49`);
  - returns when the hub is unavailable (`:51-59`) and when `ShowFooter` is not `'1'` (`:65`);
  - subscribes to `navigatedEvent` only after both returns (`:79`).

  It reads the newest Installasjonslogg item (`:160-177`). It is not on a project during the
  project's first setup, and a site could carry two channels' footers
  (`Install/Scripts/UpgradeAllSitesToLatest/EnsureFooterExtension.ps1:15-29`).
- **Settings read.** `getGlobalSettings` returns only rows with `GtSettingsEnabled eq 1` and
  caches them for 60 minutes in localStorage. When the hub is unavailable or the read fails, it
  returns an empty map (`shared-library/src/services/PortalDataService/PortalDataService.ts:1328-1345`;
  `shared-library/src/data/cache.ts:13-27`).
  - A disabled row and a missing row look the same.
  - Duplicate keys resolve to whichever row comes back last.
  - `isAvailable` turns false on 401/403 and when no hub URL resolves (`:76-89`, `:161-230`).
  - Most list reads in PortalDataService use `.using(DefaultCaching)` (for example `:457`, `:571`,
    `:819`, `:1336`), and the service keeps the hub's id and URL in localStorage through
    `PnPClientStorage` (`:136`, `:165`, `:201`). The Jest stub answers every PnP call with another
    stub (`SharePointFramework/.jest-config/lib/pnpStub.js:7-9`), so no unit test sees what PnP
    writes to storage.
- **Site kind.** `isHubSite` is synchronous (`shared-library/src/util/isHubSite.ts:8`).
  `getProjectDetails` reads the hub's Prosjekter item uncached and merges `GtIsParentProject` and
  `GtIsProgram` into one flag (`PortalDataService.ts:1352-1367`). The Footer calls it only when
  help content loads (`footer/index.ts:191`).
- **Catalog telemetry.** `TelemetryService`:
  - posts `application/json` with keepalive, a 10 s timeout and no retry;
  - sends `errorMessage` (cut to 500 characters), `siteUrl` (the hub: the command set runs on hub
    lists), `tenantId`, `host`, `detail` and `clientTs` (`TelemetryService.ts:83-110`);
  - is disabled only by `CatalogTelemetryEnabled` = `'0'` (`:129-136`), and its JSDoc wrongly
    calls the cache "session-cached" (`:122-128`).

  Callers send `detail` as `{ taxonomySkipped }` or `{ removedType }`
  (`components/TemplatePackageCatalog/useTemplatePackageCatalog.ts:400`, `:464`). The other
  switches are `telemetryUrl: ''` and the `PP_DISABLE_TELEMETRY` session flag
  (`services/featureFlags.ts:3`, `:44-52`). No `TelemetryService.test.ts` exists.
  - The catalog URL can be overridden by the command set's `catalogUrl` property; the default is
    `DEFAULT_CATALOG_URL` (`services/CatalogService.ts:16-21`, `:60-61`). A customer's own catalog
    names its packages itself.
  - The command set shows only on the Maloppsett list, to users with `ManageWeb`
    (`templatePackageCatalog/README.md:28`).
  - Its custom action is named `{bacfe2c8-77b4-4629-b84a-6d90f013f627}`, with
    `ClientSideComponentProperties="{}"` (`Templates/Portfolio/Objects/CustomActions.xml:8`). Channel
    template builds replace component ids, not this Name (`.tasks/generate-pnp-templates.js:42-80`).
    The README documents `telemetryUrl: ""` as the switch "to disable telemetry for the
    installation" (`templatePackageCatalog/README.md:48-51`).
- **ProjectSetup.** It configures its adapter without global settings
  (`ProjectExtensions/src/extensions/projectSetup/index.ts:177-180`). The setup dialog's onDismiss
  rejects with a `ProjectSetupError` (`:495-503`), which is awaited at `:200` inside the try that
  starts at `:176`, so an abort ends in the same catch as a failure (`:251-275`;
  `projectSetup.test.ts:423-431`).
- **Excel export.** `ExcelExportService` is a class exported as one instance
  (`shared-library/src/services/ExcelExportService/index.ts:174`, `:259`, `:320`), so it cannot
  read a React context. Its three callers are hooks:
  `PortfolioWebParts/src/components/PortfolioOverview/ToolbarItems/useExcelExport.tsx`,
  `PortfolioWebParts/src/components/PortfolioAggregation/ToolbarItems/useExcelExport.tsx` and
  `ProjectWebParts/src/components/DynamicList/hooks/useExcelExport.tsx`.
- **Storage wipes and reloads.** PP365 clears localStorage after a property edit
  (`ProjectWebParts/src/components/ProjectInformation/EditPropertiesPanel/useEditPropertiesPanelSubmit.ts:91`)
  and sessionStorage on a phase change (`ProjectWebParts/src/components/ProjectPhases/useChangePhase.ts:37`).
  The idea actions, the phase change, setup completion and template copy reload or navigate right
  after the action.
- **Identity at runtime.**
  - The host is `new URL(pageContext.web.absoluteUrl).host`, and the Entra tenant id is
    `pageContext.legacyPageContext.aadTenantId` (untyped), as the catalog sends them
    (`TelemetryService.ts:93-94`).
  - The component version is `this.manifest.version`, stamped by `.tasks/automatic-versioning.js`.
    No channel constant exists at runtime; only `InstallChannel` in the install log names it.
  - `pageContext.web.permissions.hasPermission(SPPermission.manageWeb)` is in the SPFx typings
    (`shared-library/node_modules/@microsoft/sp-page-context/dist/index-internal-public.d.ts:447`, `:496`).
  - The bases read the `DEBUG` build constant (`basePortfolioWebPart/index.tsx:78`); nothing in
    `shared-library/src` does. The shared Jest setup defines no `DEBUG`
    (`SharePointFramework/.jest-config/lib/setup.js`). Tests that reach code reading it set
    `globalThis.DEBUG` themselves (`templatePackageCatalog.test.tsx:30-31`, `ideaModule.test.ts:5`,
    `projectSetup.test.ts:6`). `footer.test.ts` runs the real Footer onInit without it (`:117`,
    `:210`), which works only because the Footer never reads it.
- **Tests and floors.** Jest stubs `@pnp/*` and `@microsoft/sp-*`, and tests must not import
  `@pnp` (AGENTS.md). Floors against the Nov 4 local summaries (statements / branches / functions /
  lines):

  | Solution | Floor | Nov 4 local summary |
  |---|---|---|
  | shared-library | 78 / 82 / 61 / 78 | 79.13 / 83.23 / 62.73 / 79.13 |
  | ProjectExtensions | branches 82 | branches 82.49 (853 of 1,034) |
  | PortfolioExtensions | 61 / 80 / 79 / 61 | 53.6 / 81.22 / 77.36 / 53.6 |

  PortfolioExtensions sits below its floor, perhaps from a partial run. ProjectExtensions has about
  six uncovered branches to spare locally. Only `Install/Build-Release.ps1` fails on a floor.
- **Browser and integration tests.**
  - No e2e fixture sets `PP_DISABLE_TELEMETRY`.
  - The console guard fails a test only on fatal patterns (`e2e/tests/fixtures/pp365.ts:210-237`).
  - `e2e/tests/smoke/risk-action.spec.ts:87-97` reads a hub setting with `$filter` on
    `GtSettingsKey`.
  - The integration template tests run only after a full upgrade
    (`integration/tests/template.test.ts:24`; `.github/workflows/ci-channel-test.yml:312`).

Settings, install and CI:

- **Globale innstillinger** (`Templates/Portfolio/Objects/Lists/Globale innstillinger.xml`).
  - DataRows are keyed on `GtSettingsId` with `UpdateBehavior="Skip"` (`:31`). The guide and the
    pp365-templates skill say Skip adds a missing row and never changes an existing one; nobody has
    checked that against PnP Framework.
  - `CatalogTelemetryEnabled` is seeded `1` in General (`:144-151`, id
    `{e332305a-ec83-4eb6-a1ae-7139a3428e3a}`). The last row is `AssistantAccessMode`
    (`:205-212`), and `</pnp:DataRows>` is `:213`.
  - The default view groups by category and shows Title, key and value, not Aktivert (`:4-17`).
  - `GtSettingsKey` is a Note field (`Templates/Portfolio/Objects/SiteFields/GtSettingsKey.xml:1`).
  - Rows already use categories that are not choices of `GtSettingsCategory` (OpportunityMatrix).
  - Owners have Full Control; members and visitors can read (`:214`).
  - The template finds the list by its URL, `{resource:Lists_Global_Settings_Url}` (`:1`;
    `Templates/Portfolio/Resources.no-NB.resx:1363`).
- **Resx.** `Templates/Portfolio/Resources.no-NB.resx` and `Resources.en-US.resx` have 4,497 lines
  each, with the same keys on the same lines. The `CatalogTelemetryEnabled` title is at `:1300`,
  `ShowFooter`'s at `:1303`, and `Lists_Global_Settings_Category_OpportunityMatrix` at `:1306`.
- **Install.ps1.**
  - The Param block is at `:2-50`. `-SkipPingback` comes last (`:48-49`), and `-Language` is a
    ValidateSet precedent (`:38-40`).
  - `$InstallStartTime` is a local-time string from `Get-Date -Format o` (`:102`).
  - The banner is at `:104-115`, and interactive runs show `Show-Countdown -Seconds 10` at `:150`.
  - PreInstallUpgrade runs before the apps and exits 1 on error (`:403-415`).
  - Apps are deployed tenant-wide (`:445`), before the Portfolio template. The template branch for
    runs without `-Upgrade` starts at `:533`. A Portfolio-template error, or a content-template
    error that is not about missing terms, exits 1 (`:573`; `Install/Scripts/SharedFunctions.ps1:316-317`).
  - PostInstall and PostInstallUpgrade follow (`:617-637`); the latter only warns.
  - The install log entry (`:656-701`) carries `InstallVersion` = `<semver>.<hash>` and
    `InstallChannel` (`:670-677`). It is written only at the end of a run.
  - `Disconnect-PnPOnline` is at `:703`.
  - The pingback sends parameter names only, unless `-SkipPingback` (`:705-728`).
  - The output says nothing about the pingback.
- **Upgrade scripts.** `Install/Scripts/PreInstallUpgrade.ps1` reads `$PreviousVersion` from the
  newest Installasjonslogg item (`:17-20`). Its body sits inside `if ($null -ne $LastInstall)`
  (`:19-423`). It already finds a list by its URL (`:131`). Builds log the package.json version
  (1.14.0) until the release bump (pp365-templates skill, "Writing upgrade steps").
  `PostInstallUpgrade.ps1:226-244` is the add-by-GtSettingsId precedent. The repo has no Pester;
  the scripts' tests are `.tasks/*.test.js`, run by `npm run test:tasks` (`package.json:15`). CI
  runs them after the debug build, on a runner that has `pwsh`
  (`.github/workflows/ci-build-debug.yml:89-94`). `Install/Scripts/SharedFunctions.ps1` holds only
  function definitions and their help comments, so a test can dot-source it.
- **CI.**
  - The test channel upgrades `SP_URL_TEST` with `-Upgrade -CI` (`ci-channel-test.yml:123`), and
    adds `-SkipTemplate` for `[apps-only]` (`:217`). It also runs on `workflow_dispatch` (`:16`),
    one run at a time (`:28-30`).
  - `releases/1.15` upgrades the dev hub as the main channel (`ci-releases.yml:87`, `:127`), and
    `[fresh-install]` creates a new hub (`:147`).
  - No run passes `-SkipPingback`.

Assist:

- **Tenant thread.**
  - `tenant.host` is unique and lowercase; `tenant.aad_tenant_id` is unique and lowercase; the
    organization link is an FK (`prosjektportalen-assist/src/db/schema.ts:942-975`).
  - `instance` is unique on `(tenant_id, site_key)` (`schema.ts:978-1001`), and `siteKey()` is the
    lowercased URL without a trailing slash (`prosjektportalen-assist/src/lib/pp-install.ts:241-243`).
  - Tenant rows come only from the pingback sync and the admin link action
    (`prosjektportalen-assist/src/lib/pp-sync.ts:98-109`;
    `prosjektportalen-assist/src/lib/actions/pp-install.ts:46`).
  - Telemetry tables have no FK and are joined at read time.
- **Catalog ingest.** The route
  (`prosjektportalen-assist/src/app/api/telemetry/catalog/route.ts:20-99`):
  - handles CORS itself, with an Origin suffix of `.sharepoint.com`, https and no port;
  - accepts any content type;
  - checks the 16 KB cap twice;
  - answers 400 with a reason;
  - makes one idempotent insert and answers 204.

  The validator requires the host to equal the Origin host and `siteUrl` to be https on that host.
  It keeps `errorMessage` up to 2,000 characters and stores the GUID as received
  (`prosjektportalen-assist/src/lib/catalog-telemetry.ts:52-65`, `:150-183`). It accepts any
  `packageId` string up to 128 characters (`:53`, `:145-146`) and stores the client's `clientTs`
  (`:193`). `received_at` is a millisecond timestamp from `defaultNow()`
  (`prosjektportalen-assist/src/db/schema.ts:791-802`). It had 53 events from 3 tenants by
  2026-10-27 (`prosjektportalen-assist/docs/pp-kundekort.md:44`).
- **Platform.**
  - The database driver is neon-http: no interactive transactions, but an atomic `db.batch`.
    Functions run in arn1 (Stockholm), Neon in Frankfurt (`prosjektportalen-assist/vercel.json:3`).
  - drizzle's `sql` template turns a JS array into a parenthesised list of parameters
    (`prosjektportalen-assist/node_modules/drizzle-orm/sql/sql.js:93-103`); `sql.param()` passes one
    value as one parameter. No raw `db.execute` statement exists in `src` yet
    (`prosjektportalen-assist/src/db/index.ts:1-32`).
  - Migrations run in every Vercel build (`vercel.json:5`). The latest is
    `0040_assistant_telemetry`, so the next is 0041, and CI checks for drift
    (`prosjektportalen-assist/.github/workflows/ci.yml`).
  - `.env.local` points at prod (`prosjektportalen-assist/docs/logging.md:121-122`).
  - There is no test script and no test file. `tsx` 4.22 is a devDependency, and engines is Node
    24.x (`prosjektportalen-assist/package.json`).
  - No `/api` route has rate limiting, and no retention job exists (`vercel.json:6-13`).
- **GUID auto-link.** `autoLinkAssistantKeys` links a GUID from assistant data when
  `pp_catalog_event` has seen it on exactly one host. It never overwrites
  (`prosjektportalen-assist/src/lib/assistant-telemetry-sync.ts:266-319`).
- **Classification.** The installs dashboard hides internal, dev, test and inactive tenants by
  default and shows them with `?internal=vis`, `?dev=vis`, `?test=vis` and `?inactive=vis`
  (`prosjektportalen-assist/src/app/admin/prosjektportalen/page.tsx:61-66`). The catalog overview
  filters nothing.
- **Pages.**
  - Logging › Prosjektportalen is a static placeholder
    (`prosjektportalen-assist/src/app/admin/logging/prosjektportalen/page.tsx:1-55`), and its
    overview card says "Under arbeid" (`prosjektportalen-assist/src/app/admin/logging/page.tsx:93-105`).
  - The customer card's Logging section has a Prosjektportalen row marked "Kommer"
    (`prosjektportalen-assist/src/components/admin/prosjektportalen/customer/CustomerLogging.tsx:101-105`).
  - "sist i bruk" is the latest of install and catalog activity, and "mulig død" applies after
    36 months (`prosjektportalen-assist/src/lib/dal.ts:4224`, `:4507`;
    `prosjektportalen-assist/src/lib/followup.ts:47`).
  - The assistant view aggregates in SQL (`buildAssistantUsage`, `dal.ts:5144`) and sums an
    organization's tenants (`getAssistantUsageForOrg`, `dal.ts:5497`). The catalog overview loads
    every row of the period (`dal.ts:2013`).
- **Accounts.** Assist had 9 users on 2026-10-28, 3 of them customers
  (`prosjektportalen-assist/docs/admin-undermenyer.md:40`), so a control that exists only in Assist
  would reach almost nobody.

Texts and promises:

- **Wiki pages.**
  - "Grunnlag for DPIA og ROS" names Puzzlepart behandlingsansvarlig "for innsikt i hvilke
    versjoner og maler som er i bruk". Its table "Hva som sendes ut av tenanten" (Fra | Hva | Til |
    Kan slås av, no retention column) lists the install message and the catalog. The catalog row
    mentions "en avkortet feilmelding" and promises "Ingenting om sluttbrukere eller
    prosjektinnhold", stored in EU (Frankfurt).
  - "Fotavtrykk i Microsoft 365" lists four outbound flows.
  - "Installasjon" documents `-SkipPingback` "fra 1.15".
  - No retention period and no Article 6 basis is stated for any PP365 flow.
- **Manual.** It calls the catalog events "anonymisert", although they carry tenant, host and hub
  URL (`prosjektportalen-manual/Brukermanual/3 Portefolje/3.11-Malpakkekatalog.md:183-187`).
- **PP365 texts.**
  - `readme/2-Installering.md:6`, which generates `README.md:49`, says install information is used
    "kun for å forbedre løsningen og til intern statistikk".
  - The catalog README says a missing row counts as on
    (`PortfolioExtensions/src/extensions/templatePackageCatalog/README.md:97-98`).
  - `CHANGELOG.md` and `releasenotes/1.15.0.md` mention neither the catalog telemetry nor the
    pingback.
  - `privacyUrl` is `https://puzzlepart.com/` in four `package-solution.json` files and empty in
    ProgramWebParts and shared-library.
- **prosjektportalen.no and Assist.**
  - `prosjektportalen.no/personvern` returns 404. Its drafts sit on the unmerged
    `feat/personvern-pp-assistenten` branch of prosjektportalen-web, and the DPA draft says
    Puzzlepart "behandler ikke data" in PP365 (`pp-assistenten-databehandleravtale.md#L60-L61`).
  - Assist's personvern page calls its own Vercel Analytics "Bruksstatistikk", says data is used
    "utelukkende for å levere support", and states "ingen automatisk sletting"
    (`prosjektportalen-assist/src/app/personvern/page.tsx:94-96`, `:121`, `:158-159`). Its opening
    sentence limits it to people who use the support portal (`:33-37`).
- **PP Assistenten's telemetry contract** (`telemetri/README.md` on its main branch):
  - a monthly salted user pseudonym, an unsalted hub hash and the site GUID;
  - browser events such as `app.opened` with the SDK's random `user_Id` (`#L39-L47`);
  - 90 days in Application Insights in Norway East;
  - a never-list of names, site URLs, usernames, e-mail and oid.

## Decisions

### Taken

- **D1. Consent model.** On by default at level Extended (Standard until 2026-11-13). The customer can lower the level or turn
  it off in the hub's Globale innstillinger. Install.ps1 gets a parameter to choose the level up
  front. This is the same model as `CatalogTelemetryEnabled` ("på som standard, kan slås av").
- **D2. Levels.** One setting with four levels:
  - 0 Av (off).
  - 1 Grunnleggende: version, channel, language, and numbers such as how many projects and
    programs, about once a day.
  - 2 Standard, the default: level 1 plus which web parts, extensions and features are used, as
    counts per day.
  - 3 Utvidet: level 2 plus error codes and load times, for troubleshooting.
- **D3. No unique users.** No user identifier, pseudonym or hash of a user leaves the tenant. We
  count usage, not people.
- **D4. One setting governs all PP365 telemetry,** including the catalog's existing events.
  `CatalogTelemetryEnabled = 0` is still respected, and no customer who opted out gets telemetry
  back.
- **D5. Ship in 1.15.0** although the templates were frozen for that release. Everything is
  verified on the test channel before the release. The facts on 2026-11-12: 1.15.0 is merged to
  `main` (the changelog dates it 19.11.2026), and the work runs on a branch cut from `main`, in a
  worktree (`.claude/worktrees/logging`, branch `worktree-logging`, which the user may rename).
  The old `feat/logging` branch holds only this plan, on the pre-squash history.
- **D6. Active sites are counted with a hashed site id.** At level 2 and up, each site sends a
  one-way hash of its id, never its name or URL, so Assist can count how many different sites are
  in use per day and per month. Assist keeps only the counts; the hashes are deleted after 90 days.
  P12 says how the hash is built.
- **D7. `-SkipPingback` and the level are independent.** `-SkipPingback` governs only the
  installation message. Without `-UsageStatisticsLevel`, a new installation gets Extended whether
  or not `-SkipPingback` is given.
- **D8. Unknown hosts are shown, never created.** Data from a host that has no tenant row in Assist
  appears under "Ukoblede verter" on Logging › Prosjektportalen, and an admin links it to a
  customer. Ingest never creates tenant rows (P17).
- **D9. No time limit on retention.** The counts are kept without a time limit. The exceptions are
  the site hashes (90 days, D6) and the batch ids that stop a batch from being counted twice
  (7 days). Every customer-facing text says so (P19).

### Confirmed by the user on 2026-11-12 (P1 to P25; P4, P10 and P25 as rewritten)

The user went through P1 to P25 one by one on 2026-11-12. All stand as written except P4, P10 and
P25, which were rewritten that day. The entries keep their "Recommendation" wording. Where one
asks the user to confirm a reading (P9, P11, P23), the user confirmed it.

- **P1. Transport: push from the browser to Assist; no Application Insights.**
  - Recommendation: browsers sum counts in memory and post small batches to a new route,
    `POST https://assist.prosjektportalen.no/api/telemetry/usage`.
  - Reason: D3 removes the one thing App Insights would add, distinct users counted over
    pseudonyms. Its other effects are all costs:
    - its JS SDK sets `ai_user` and `ai_session` cookies (a random id) unless they are turned off;
    - it keeps raw events for 90 days;
    - an illustrative 55 tenants × 30 users × 20 page views a day would put about 4 million events
      a month into it;
    - data arrives the next morning;
    - it cannot check Origin.

    Pre-summed counts keep Assist's rows bounded by tenants × keys (about 1,400 to 2,200 a day at
    full fleet), keep no raw usage anywhere, and reuse the catalog's ingest pattern.
  - Alternatives: App Insights plus a KQL sync cloned from `assistant-telemetry-sync.ts`, which
    reuses the cron, but brings raw retention, cookies and a second transport. Or one row per
    event, as the catalog stores them: about a million rows per 30 days, which breaks the in-memory
    read paths.
- **P2. Browser side: memory only, sent from memory, never sendBeacon.**
  - Recommendation:
    - One versioned queue on `window` (`window.__pp365UsageV1`), shared by every bundle, holding
      plain counters.
    - Telemetry writes nothing to cookies, localStorage, sessionStorage, IndexedDB or the Cache
      API, and stores no identifier. The one it computes, the monthly site hash (P12), lives in
      memory. The only thing it reads from storage is the tester flag (`sessionStorage`
      `PP_DISABLE_TELEMETRY`). The settings it decides on come through the app's own
      `getGlobalSettings()`, whose 60-minute localStorage cache the app keeps with or without
      telemetry (P4).
    - A flush builds its batch from memory and never waits on the network. The gate decision and
      the site types are read in the background before a flush needs them (P4); what a flush
      cannot send yet stays in memory.
    - A flush calls `fetch` with `keepalive: true`, `credentials: 'omit'`,
      `referrerPolicy: 'no-referrer'`, `cache: 'no-store'` and `mode: 'cors'`. The body is sent as
      `text/plain;charset=UTF-8`, with no other header.
    - Flushes run on `visibilitychange` to hidden, on `pagehide`, and right before PP365's own
      reloads and navigations. The last two are urgent and always send. A `visibilitychange` flush
      sends only when the last send is at least 60 seconds old; otherwise the counters keep summing
      in memory.
    - At most 500 sends per window, as a guard against a runaway loop, and no retry.
  - Reason:
    - The ekom law's storage rule requires each user's consent for storage that is not strictly
      necessary, which a default-on admin setting cannot give.
    - PP365 itself clears both storages.
    - A page that is closing, reloading or navigating unloads before an ordinary SharePoint
      request returns. A flush that first waited for a settings or site read would never send, and
      the views and loads of every page left that way would be lost.
    - A minimum interval keeps requests few without silencing a tab left open all day, which a
      fixed number of sends per window would do.
    - A `text/plain` body makes a CORS simple request, with no preflight (keepalive copes badly
      with one).
    - `credentials: 'omit'` keeps an Assist session cookie out of the request, and `no-referrer`
      keeps a project URL out of the Referer.
    - `sendBeacon` always sends credentials and cannot set a referrer policy.
  - Alternatives: a localStorage buffer or a daily guard (wiped by PP365, and it raises the consent
    question); `sendBeacon` as a fallback; a five-minute timer (about four times the requests); a
    fixed cap of 20 sends per window (undercounts the heaviest users).
- **P3. Gate semantics: one pure function, fail-closed.**
  - Recommendation: `resolveTelemetryGate` in shared-library decides for every sender, the catalog
    included. The first matching rule gives the level:
    1. the `PP_DISABLE_TELEMETRY` session flag → 0;
    2. the browser's privacy signal (P21) → 0;
    3. no anchor portal (P4): no portal of the page's own hub has attached, or the page is outside
       a hub → 0;
    4. the anchor is not available: the hub cannot be read, or it has no URL → 0;
    5. `CatalogTelemetryEnabled` in the settings map with the trimmed value `0` → 0 (P5);
    6. no `UsageStatisticsLevel` key in the settings map → 0;
    7. a value other than exactly `0`, `1`, `2` or `3` after trimming → 0;
    8. otherwise that value.

    The settings map is the one the anchor's `getGlobalSettings()` returns (P4). It holds enabled
    rows only, so a disabled row and a missing row are both absent from it, and a hub that cannot
    be read gives an empty map. All three end in rule 6. The catalog flag is true only when the
    level is 2 or 3 and `CatalogTelemetryEnabled` is exactly `1` after trimming (P5).

    The default Extended comes only from the row, which the template seeds as `3` (P10) or
    PreInstallUpgrade adds (P7). The browser code never assumes a default. A DEBUG build never
    sends (P14).
  - Reason: D4. The catalog's current rule turns an unticked Aktivert, a deleted row and a failed
    read into "on".
  - Cost: tenant-wide 1.15 apps running against a hub that is not yet upgraded send nothing,
    catalog events included, until that hub is upgraded.
  - Alternative: treat a missing row as the default 2. That starts telemetry on hubs whose admins
    never saw the setting, and again after an admin deletes the row.
- **P4. Settings read: one anchor portal, read through the app's cached `getGlobalSettings()`.**
  - Recommendation:
    - The anchor. `attachTelemetryPortal(portal, settingsMap?)` accepts a portal only when
      `portal.hubSiteId`, with braces stripped and lowercased, equals the page's
      `legacyPageContext.hubSiteId` normalised the same way. An empty hub id never matches. Every
      other portal is ignored for the gate, the settings read, the snapshot and `hubUrl`.
      BasePortfolioWebPart attaches nothing when its onInit received a portfolio, because
      PortfolioOverview's portfolios point the portal at another site (Inventory, "Portfolio
      portals").
    - The first accepted portal becomes the anchor and starts the gate. It is the only portal
      telemetry reads through, and `hubUrl` comes from it. An anchor whose `isAvailable` is false
      gives level 0 (P3, rule 4). The store keeps the anchor's normalised hub id and hub URL next
      to the decision. After an SPA navigation to a page whose hub id differs, the decision and
      the anchor are dropped.
    - The settings. The gate reads the level through the anchor's existing, cached
      `getGlobalSettings()`: enabled rows only, cached for 60 minutes in localStorage by the app
      itself. There is no new settings read, cached or uncached, and no new PortalDataService
      method for it. A disabled or missing row is absent from the map, and an unreadable hub
      gives an empty map; both mean level 0 (P3), so the gate need not tell them apart. A
      duplicated key resolves as `getGlobalSettings()` resolves it: the row read last.
    - The settings map is optional. Callers pass the map they already hold: the Footer's
      `this._globalSettings`, or the project and program adapters' global settings. The portfolio
      web parts, ProjectSetup and the catalog hold none (`PortfolioWebParts/src/data/types.ts:254-260`;
      `projectSetup/index.ts:177-180`; `TelemetryService.ts:129-136`) and attach without one; the
      gate then calls `getGlobalSettings()` on the anchor. A map that comes later, with another
      accepted portal, can only lower the decision, never raise it.
    - A decision is kept for at most 60 minutes (`GATE_MAX_AGE_MS` = 3,600,000). After that it is
      re-read in the background through the anchor's `getGlobalSettings()`: while the tab is
      visible, and when the tab becomes visible with an older decision. A flush never reads (P2).
      It uses the decision in memory, and one older than 60 minutes counts as pending. Items
      queued above a lowered level are dropped.
  - Promise to customers: a changed level, whether lowered, raised or turned off, applies within
    two hours. The user chose that wording on 2026-11-12 over "within an hour", which holds for a
    new page load and not for a tab left open (Cost).
  - Reason: the user's decision of 2026-11-12. The level travels the path every other hub setting
    travels, so telemetry adds no settings read of its own and no method to PortalDataService.
    Under P3 a disabled row and a missing row both mean 0, so the gate does not need the one thing
    an uncached read sees and the cached map does not. Tying the gate to the page's own hub keeps
    another hub's setting, or a portfolio URL an editor typed, from deciding for this hub (D4).
  - Cost: an opt-out is not immediate. A new page load follows a changed level once the cached
    settings expire, at most 60 minutes after the change. A tab left open re-reads when its own
    decision is 60 minutes old; if that decision was taken from settings near the end of their
    cache lifetime, that is up to an hour later still. Two hours is the outer bound, and it is
    what the texts promise. Duplicate rows, which only hand edits create, resolve to the row
    read last, not to the stricter one.
  - Alternatives: an uncached read of the two rows before anything is sent (the earlier proposal:
    an opt-out reaches a browser on its following page load, and disabled rows and duplicates are
    seen, but it costs a new PortalDataService method and one more request per page on every hub
    above level 0); the first attached portal of any kind (a PortfolioOverview configured with
    another portfolio's URL would decide the level and the `hubUrl` for the whole page).
- **P5. Catalog interplay (D4).**
  - Recommendation:
    - Catalog events need level 2 or 3, and `CatalogTelemetryEnabled` in the settings map with
      exactly `'1'` after trimming. No row, or a disabled one, means no catalog events.
    - An enabled `CatalogTelemetryEnabled` = `'0'` stops all of PP365's browser telemetry (usage
      statistics and catalog events), not only the catalog's. The instruction customers were given ("sett til 0") stays true in its strongest
      reading.
    - The key, its id, the seeded `'1'` and the title stay as they are.
    - `telemetryUrl: ''` still disables the catalog for the installation, and the upgrade carries
      it into level 0 (P7).
  - Reason: D2 puts features at Standard, and an explicit `'1'` ends the fail-open. The hard stop
    also covers paths the upgrade step cannot see: a hand-applied template, a custom
    `-UpgradeExcludeHandlers`, or Skip behaving otherwise than documented.
  - Cost: an admin who raises the level while `CatalogTelemetryEnabled` is `'0'` gets nothing.
    Install.ps1's summary and the wiki say so.
  - Alternatives: `CatalogTelemetryEnabled` as a catalog-only sub-switch (cleaner once an admin
    raises the level, but a carry-over failure would bring telemetry back); catalog events whenever
    the row is not `'0'` (keeps the fail-open).
- **P6. Catalog payload: no free text, and only the public catalog.**
  - Recommendation:
    - 1.15.0 catalog events stop sending `errorMessage` and `clientTs`.
    - They add `level` (2 or 3) and, at level 3 on errors only, an `errorCode` from the usage error
      list.
    - `detail` keeps only `taxonomySkipped` (a boolean) and `removedType` (a package type).
    - They are sent only when the command set's effective catalog URL (`catalogUrl` trimmed, or the
      default) is `DEFAULT_CATALOG_URL` (`services/CatalogService.ts:16-21`, `:60-61`).
    - `fetch` adds `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`.
    - The endpoint, the `application/json` body and `siteUrl` (the hub) stay unchanged in 1.15.0.
    - Assist accepts `level` and `errorCode`, allowlists `detail`, and keeps accepting events
      without `level` from 1.14 clients. From the slice 2 deploy it stores no `errorMessage` and no
      `clientTs` from any client, and migration 0041 clears the stored ones. It keeps only events
      whose `packageId` is in the public `catalog.json`; others get 204, are not stored, and are
      logged with the host only.
  - Reason: SharePoint and PnP error text can carry URLs, list and file names and login names
    (D3), and D2 asks for error codes. Hubs still on 1.14 keep sending error text after 1.15.0
    ships, so only Assist can stop storing it. A customer's own catalog names its packages itself,
    and those names must not leave the tenant (never-list item 4).
  - Alternatives: `errorMessage` at level 3 (support value, but free text leaves the tenant);
    moving the catalog to `text/plain` and dropping `siteUrl` now, deferred to 1.16 because it
    needs a coordinated validator change on a working path; keeping 1.14 clients' error text for
    90 days (free text from the hubs the never-list claims to cover).
- **P7. Upgrade carry-over of opt-outs.**
  - Recommendation: `PreInstallUpgrade.ps1` adds a missing `UsageStatisticsLevel` row before the
    apps and the template. It uses the template's `GtSettingsId`, and its value comes from
    `Resolve-InitialUsageStatisticsLevel`. The first matching rule wins:
    1. an explicit `-UsageStatisticsLevel` → that value;
    2. the hub's web custom action named `{bacfe2c8-77b4-4629-b84a-6d90f013f627}` (the catalog
       command set) has `"telemetryUrl": ""` in its `ClientSideComponentProperties` → 0. It is
       matched by Name, because channel builds swap component ids, not this Name;
    3. any `CatalogTelemetryEnabled` row disabled, or with a value other than exactly `'1'` → 0;
    4. no `CatalogTelemetryEnabled` row on a hub at 1.14.0 or later → 0;
    5. a hub at 1.15.0 or later, where the row was deleted → 0;
    6. otherwise 2. `-SkipPingback` plays no part (D7).

    The step:
    - is state-based, with no version gate;
    - is idempotent;
    - never touches an existing row;
    - runs under `-SkipTemplate` too.

    It finds the list by its URL, and a read or write error is not caught: Install.ps1 exits 1
    before the apps and the template (`Install.ps1:403-415`). The template's Skip row then finds
    the row and leaves it alone. Runs without `-Upgrade` take the same step right before the
    template when the list already exists (Settings, install and upgrade).
  - Reason: the template runs before PostInstallUpgrade, so only a step before the template can
    tell an opt-out from a default. After it, Skip has re-added a deleted `CatalogTelemetryEnabled`
    row as `'1'`. A value such as `nei`, an unticked Aktivert, or `telemetryUrl: ''` shows intent,
    even though 1.14 ignored the first two. Stopping is the only way a broken check cannot turn
    into an opt-in. Builds log 1.14.0 until the bump, so rule 5 stays shut on the test hubs until
    the release. Whether the template's CustomActions handler resets `telemetryUrl` to `{}` on
    upgrade is not verified; rule 2 keeps the opt-out either way.
  - Alternatives: carry over only an explicit `'0'` (misses unticked rows); warn and continue on
    error (a failed check silently opts the customer in); a PostInstallUpgrade "ensure" step
    (redundant once PreInstallUpgrade always creates the row); a check after the template that
    compares `Created` with the run's start time (it compares the installer's local-time string
    with SharePoint's time, and runs after Skip has re-added a deleted row).
- **P8. `-SkipPingback` (settled by D7).**
  - Recommendation: nothing left to confirm. `-SkipPingback` stops only the installation message,
    and the level follows P7 and P10 alone. Install.ps1's banner, summary and HelpMessage name both
    switches and what each covers, so an admin who wants nothing sent passes
    `-SkipPingback -UsageStatisticsLevel Off`.
  - Reason: the user chose two independent switches (D7).
  - Rejected alternative: `-SkipPingback` sets level 0 on a run that creates the row, as the design
    drafts proposed.
- **P9. The install pingback stays independent of the level.**
  - Recommendation: Install.ps1 keeps sending the pingback unless `-SkipPingback` is given, at any
    level, and prints one outcome line. Every text says that the installation message is a separate
    flow with its own switch, and that level 0 does not stop it. The user confirms this reading of
    D4 ("all PP365 telemetry") next to D7.
  - Reason: D7 makes the switches independent in one direction, and the same rule in the other
    direction keeps them easy to explain. Assist keeps learning about installs and upgrades of
    level-0 hubs, and those messages are what create tenant rows (D8).
  - Alternative: send the pingback only when the effective level is 1 or higher. One switch named
    Av would then stop everything, but the installs dashboard would lose level-0 hubs.
- **P10. Setting key, values, category and id.**
  - Recommendation:
    - Key `UsageStatisticsLevel`, with values `0` to `3` as text, seeded `3` (Extended, D1; `2` until 2026-11-13).
    - Install.ps1 writes the row only when `-UsageStatisticsLevel` is given, right after the
      Portfolio template has run. Without the parameter no script writes a starting value: the
      template's row is the default.
    - PreInstallUpgrade still adds a missing row before the template (P7), as `0` when it finds an
      opt-out, and the template's Skip leaves that row alone.
    - Category General (`Lists_Global_Settings_Category_General`).
    - Title key `Lists_Global_Settings_Category_General_UsageStatisticsLevel_Title`, with the levels
      spelled out in the title, as `AssistantAccessMode` does.
    - The row is appended after `AssistantAccessMode`.
    - `GtSettingsId` is a new GUID generated once in slice 3 with `[guid]::NewGuid()`, written into
      the slice log, and defined once as `$UsageStatisticsLevelSettingId` in
      `Install/Scripts/SharedFunctions.ps1`.
    - No new category and no CHOICE change. `CatalogTelemetryEnabled` keeps its row and title in
      the same General group.
    - Install.ps1's values are `Off`, `Basic`, `Standard` and `Extended`.
  - Reason: the smallest change to frozen templates, and the two switches already share a group in
    the view. Skip never rewrites titles, so the wording is final at release. A seeded `3` makes
    the default a fact of the template (D1): every hub that gets its row from the template runs at
    Extended, and a run that stops half-way leaves the same value as a completed one. Install.ps1
    then needs no step that writes a starting value at the end of a run, and no rule for the rerun
    of an install that never completed.
  - Cost: the apps are deployed tenant-wide before the template adds the row and the Footer. A new
    hub installed with `-UsageStatisticsLevel Off` or `Basic` therefore runs at Extended from the
    moment the template adds the row until Install.ps1 writes the explicit level right after the
    Portfolio template. A browser that opens the hub in that window follows the explicit level
    within two hours (P4). The window is short, and it is accepted.
  - Alternatives: a row that starts at `0`, with Install.ps1 writing the starting value at the end
    of every completed run (the earlier proposal: nothing is sent while an install runs, but it
    needs the end-of-run write, a record of whether the template created the list, and a rule for
    the rerun of an install that never completed). Or a new category, Bruksstatistikk, with a
    guarded step that moves and retitles `CatalogTelemetryEnabled`. That needs a template field
    change and a rewrite step in a frozen release; deferred to 1.16.
- **P11. The level 1 heartbeat comes from hub owners only, and Assist keeps it as current state.**
  - Recommendation: only a browser whose user holds `manageWeb` on the hub sends the heartbeat,
    and only on a hub page. The Footer computes the permission and passes it in. The heartbeat goes
    at most once per page load and is sent at once. Assist keeps only the latest heartbeat per hub,
    as current state with the ISO week it arrived in (`pp_usage_hub_state`), plus the last one of
    each month for the version and level history (`pp_usage_hub_monthly`). It stores no day for a
    heartbeat, and a level-1 hub gets no daily row. At level 1 nobody else sends anything. The user
    confirms this reading of D2's "about once a day": the client sends on every hub page load by an
    owner, and only what Assist stores is coarse.
  - Reason: the people who report installation facts are the people who control the setting.
    Owners see every Prosjekter item, so the counts do not vary with permissions. Far fewer
    requests, and so fewer IP addresses, reach Vercel, and no storage guard is needed. Sending from
    owners only is no privacy measure in itself. A hub has one or two owners, whom Puzzlepart knows
    from support, so a heartbeat stored per day would build a record of which days named people
    worked in PP (D3). Storing it as current state, by week, avoids that.
  - Alternatives: any browser once a day behind a localStorage guard (breaks P2); any hub reader on
    every load (many requests, and counts that vary by viewer); heartbeats stored per day for
    13 months (a record of owners' working days).
- **P12. How the site hash is built (D6).**
  - Recommendation:
    - At level 2 and up, the browser computes the site hash as the first 16 hex characters of
      SHA-256 of `pp365-site|<year-month in Europe/Oslo>|<site id, lowercase, no braces>`, with
      `crypto.subtle.digest`. The year-month comes from `Intl.DateTimeFormat` with the time zone
      `Europe/Oslo`, so it turns over with Assist's Oslo month.
    - It is computed in the background when a site id is first seen, next to the site type lookup,
      and kept in memory only. A batch lists the hashes of its sites with their site type
      (`sites`); usage counters still carry only the site type.
    - No other site, web, list, item, page, file or web part instance id leaves the tenant.
    - Assist stores each hash with the Oslo day it arrived for 90 days. Every night it writes the
      number of distinct hashes per day and per month into count tables, then deletes hashes older
      than 90 days. The dashboard shows counts only, never hashes.
    - In this plan "site hash" is the browser's value, and Assist's `siteKey()` stays the
      normalised hub URL behind `instance.site_key`; the two are never mixed.
  - Reason: D6 asks how many different sites are in use. The month in the hash means a hash cannot
    be followed from one month to the next, while counts per day and per calendar month still work.
    That meets the trust draft's objection that a stable hash is a lasting project pseudonym, which
    in a one- or two-person project comes close to one person's activity (D3). Only someone who
    already holds the tenant's site list can turn a hash back into a site, and the customer holds
    its own list anyway. PP Assistenten already sends site GUIDs in clear, so this is stricter than
    the existing precedent.
  - Cost: active sites are counted per calendar month, as the assistant's unique users are, not
    over a rolling 30 days, because the hashes change at the month boundary.
  - Alternatives: a stable unsalted hash (rolling windows work, but the hash never changes); a hash
    that rotates every day (daily counts only); no site hash at all, which D6 rejected.
- **P13. The hub URL and the hub's language only.**
  - Recommendation: the hub URL (the anchor portal's `url`, P4, lowercased, with no trailing
    slash) is the only URL sent, and it maps to `instance.site_key`. Usage on project and program
    sites is attributed to their hub. The language is the hub web's (1044 → `nb-NO`, 1033 →
    `en-US`, otherwise `other`), never a user's UI language.
  - Reason: the hub address is already disclosed for the catalog and the pingback, and it puts
    usage on the right instance. A UI language can single out a person in a small tenant.
  - Alternatives: the current site URL (project names often appear in URLs); the user's culture.
- **P14. One endpoint; test traffic filtered in Assist.**
  - Recommendation:
    - The client has one endpoint constant and no override; a frozen release cannot add a template
      row.
    - A DEBUG build resolves the gate as usual but never sends: it logs each batch at Info.
    - Every e2e spec sets `PP_DISABLE_TELEMETRY` and fulfils the telemetry routes with 204; one
      spec captures the batch.
    - The test channel posts to production Assist. The heartbeat's channel and the classification
      in P18 hide that traffic by default.
  - Reason: D5 needs the real path end to end, and no automated run writes rows.
  - Alternative: a per-hub endpoint row pointing test hubs at a preview. That needs a template row
    and a Neon branch that outlives previews.
- **P15. One contract in two repos, enforced strictly.**
  - Recommendation:
    - `SharePointFramework/shared-library/src/telemetry/contract.ts` holds every allowlist as
      `as const` data, with no imports.
    - Assist keeps a verbatim copy in `src/lib/pp-usage-contract.ts`, refreshed by
      `scripts/sync-pp-usage-contract.mjs <ref>`.
    - A byte-identical golden fixture lives in both repos.
    - Assist answers 400 with a reason to an unknown field name, a wrong schema, or data above the
      declared level.
    - Assist drops entries whose component, event or variant it does not know. It counts them in
      `pp_usage_batch.dropped` and never stores the values.
    - A new field or event changes both copies, the fixture and the wiki page in the same change,
      and Assist deploys first.
  - Reason: allowlists on both sides keep a field from leaving unannounced; the Assistant's stale
    client once sent `projectTitle`. Dropping unknown values loses only those entries when a newer
    PP365 meets an older Assist, and Assist stores no string it cannot vouch for.
  - Alternatives: reject unknown values with 400 (whole batches lost on version skew); accept and
    store unknown keys (would store whatever string a bug passes); a JSON registry imported by
    TypeScript (whether Heft copies JSON into `lib-commonjs` is not verified).
- **P16. Idempotent writes and a server-assigned day.**
  - Recommendation: every batch carries a random `batchId`. Assist writes the batch in one SQL
    statement:
    - it inserts the `batchId` into `pp_usage_batch` with `ON CONFLICT DO NOTHING`, only while the
      host is under its daily cap;
    - data-modifying CTEs then upsert the hub rows and add the counters, only when that insert
      happened. Each reads its rows from typed arrays, one parameter per column (Write).

    The day is the Oslo day at receipt; the contract has no client timestamp.
  - Reason: adding counts is not idempotent, and `db.batch` cannot skip a statement. One statement
    is atomic and costs one round trip, and the batch table also carries the per-host cap.
  - Alternatives: at-most-once with no dedupe table (cheaper, but counts a replay twice); a client
    day (needs a window and trusts client clocks).
- **P17. Hosts without a tenant row (settled by D8).**
  - Recommendation: ingest never creates tenant rows. Hosts that have data but no tenant row, or no
    organization, appear under "Ukoblede verter" on Logging › Prosjektportalen, with `OrgLinkSelect`
    and the existing `linkOrganizationTenant`.
  - Reason: the endpoint is unauthenticated, so creating tenants would let forged hosts into the
    register and the cleanup queue. Most hosts already have a tenant row from the pingback.
  - Rejected alternative: create tenant rows nightly for hosts with sustained data. That needs
    `getPpTenantDetail` and the cleanup queue to accept tenants known only from telemetry.
- **P18. Internal and test traffic.**
  - Recommendation: one helper, `classifyUsageHost`, in Assist.
    - Internal = `tenant.internal_override`; otherwise the governance internal list or CI-only
      pingbacks (the installs dashboard's rule).
    - Test = a heartbeat channel other than `main` (from the hub's state row), or a dev or test
      name match, unless `internal_override` is false.

    Both are hidden by default in every total, chart and table. `?internal=vis` and `?test=vis`
    show them with badges, as the installs dashboard does.
  - Reason: storing everything and filtering at read time is what lets the D5 check run in
    production Assist. `internal_override = false` lets an admin correct a real customer whose
    tenant name contains "dev" or "test".
  - Alternatives: drop such traffic at ingest (D5 could not be checked); a new
    `tenant.test_override` column (a migration; deferred).
- **P19. Retention and deletion (D9).**
  - Recommendation:

    | Data | Kept |
    |---|---|
    | Batch ids (`pp_usage_batch`) | 7 days |
    | Site hashes (`pp_usage_site_seen`) | 90 days; their counts per day and month stay (D6) |
    | Daily usage, error and timing rows, daily hub rows, hub state rows, monthly hub snapshots and the site counts | no time limit (D9) |
    | Catalog event rows | no time limit, as today |
    | Catalog `error_message` and `client_ts` | no longer stored; 0041 clears the old values |

    An audited admin action deletes all of a host's usage and catalog rows on request.
    Installation messages are outside it: Assist mirrors them nightly from the pingback table,
    which it can only read, so a deleted `pp_install` row would come back (a non-goal). Lowering
    the level stops new data; data already received stays unless deletion is asked for.
  - Reason: the user chose no time limit (D9). The batch ids are random and only stop a replay from
    being counted twice. The site hashes go after 90 days because D6 promised it. Without a time
    limit, deletion on request is the customer's way out, so it ships in 1.15.0.
  - Rejected alternatives: daily rows for 13 months, then monthly totals for 36 months, with level 3
    data kept for 90 days (the design drafts' proposal); cutting a catalog event's exact receipt
    time to the day after 90 days (only needed while the other flows had limits).
- **P20. Kill switches.**
  - Recommendation:
    - Customer: level 0, or `CatalogTelemetryEnabled` `0` (P3, P5).
    - Tester: the `PP_DISABLE_TELEMETRY` session flag.
    - Puzzlepart: the env variables `PP_USAGE_INGEST_DISABLED=1` (answer 204, store nothing) and
      `PP_USAGE_BLOCKED_HOSTS` (a comma list), which take effect after a redeploy of about two
      minutes; a Vercel Firewall rule on `/api/telemetry/usage` for an instant edge block; the
      per-host purge (P19).
    - Client guards: at least 60 seconds between `visibilitychange` sends, at most 500 sends per
      window, and 16 KB per batch.
  - Reason: env switches cost no database read per request, and the firewall covers the minutes
    before a redeploy.
  - Alternative: a switch in `app_setting` (instant, but one more database read per request).
- **P21. Browser privacy signals.**
  - Recommendation: `navigator.globalPrivacyControl === true` or `navigator.doNotTrack === '1'`
    stops sending from that browser, heartbeat included.
  - Reason: each employee gets an objection without any UI, customer IT can enforce it by policy,
    and it supports a legitimate-interest balancing test. It can only reduce what is sent.
  - Cost: some undercounting.
  - Alternative: the admin setting only.
- **P22. Missing data is not inactivity.**
  - Recommendation: usage only adds positive evidence to "sist i bruk". Its absence never sets
    "mulig død" and never starts a follow-up. The dashboard says "Ingen bruksstatistikk (kan være
    slått av)" and keeps the last known level with its day, or its week for a hub at level 1.
  - Reason: a customer who turns statistics off must not be chased for it.
  - Alternative: treat silence as a signal.
- **P23. PP Assistenten's own telemetry is out of scope for 1.15.0.**
  - Recommendation: the setting governs PP365's own code: the usage counters (including the
    Footer's count of drawer opens), the catalog and the pingback (P9). Every text says the
    Assistant's telemetry is described in "Sikkerhet i PP Assistenten". The user confirms this
    reading of D4.
  - Reason: the Assistant is a separate service with its own processor terms, and turning its SDK
    off is a change in its own repository.
  - Alternative: pass the level to the Assistant's iframe now, which is cross-repository work in a
    frozen release.
- **P24. One canonical text.**
  - Recommendation: a new wiki page, Bruksstatistikk, is canonical and goes live before the release
    is published. Every other text is short, links to it, and copies the level table and the
    never-list word for word. `privacyUrl` in all six `package-solution.json` files points to it.
    The words "anonym" and "anonymisert" are never used.
  - Reason: `prosjektportalen.no/personvern` returns 404, and the manual has already drifted.
  - Alternative: wait for `prosjektportalen.no/personvern`, which would block the release.
- **P25. Everything ships before the merge.**
  - Recommendation: the setting, the install and upgrade steps, the gate, the catalog under the
    gate, the contract with all four levels and every emitter ship together. Every event in the
    contract is instrumented in all five consumer solutions before the branch is merged, with
    `since` `'1.15.0'`. Nothing is left for 1.15.1 or 1.15.x. The work starts with the core
    (slice 4) and ProjectWebParts (slice 6); the other four solutions follow (slice 7). Assist's
    ingest goes live before the test channel sends. Assist's dashboard minimum ships independently
    of the PP365 release; its customer view and CSV export follow later.
  - Reason: the user's decision of 2026-11-12. One release then carries the whole contract: the
    texts, the contract and the code list the same events from the first day, and no customer
    text changes again in a patch release.
  - Cost: the emitters take about six to seven working days on the critical path instead of two,
    in solutions with thin coverage headroom. The critical path is about twelve working days plus
    CI runs.
  - Alternative: ship the emitters in three steps (the earlier proposal). Page views, web part
    loads, site hashes, setup outcomes and the level 3 render errors and init times in 1.15.0;
    the most used actions in 1.15.0 or 1.15.1; the remaining actions in 1.15.x. The critical path
    was about seven and a half working days, and the `since` field told the dashboard which
    version emits what.

## Levels and the data contract

Contract schema 1. The tables below are what `contract.ts` and its Assist copy hold.

**Transport.**
- `POST https://assist.prosjektportalen.no/api/telemetry/usage`, with a JSON body sent as
  `text/plain;charset=UTF-8` and no custom header.
- At most 16,384 bytes per request; the client splits batches at 15,000.
- Assist answers:

  | Status | Meaning |
  |---|---|
  | 204 | stored, a replay, over the cap, or switched off |
  | 400 | malformed, with a reason |
  | 403 | foreign Origin |
  | 413 | too large |
  | 500 | database error |

- The client ignores every response and never retries.
- Assist never reads `User-Agent`, `Referer`, `Cookie`, `Accept-Language`, `Sec-CH-UA*`,
  `X-Forwarded-For`, `X-Real-IP` or `X-Vercel-IP-*`.

**Envelope** (every batch; level 0 sends nothing):

| Field | Type and allowed values | Source |
|---|---|---|
| `schema` | integer `1` | constant |
| `batchId` | lowercase GUID v4, new for each batch, never stored in the browser | `crypto.randomUUID()` |
| `host` | `^[a-z0-9-]+\.sharepoint\.com$`, at most 128 characters, equal to the Origin host | `new URL(pageContext.web.absoluteUrl).host`, lowercased |
| `tenantId` | optional; lowercase GUID, dropped if it is not a GUID | `legacyPageContext.aadTenantId` |
| `hubUrl` | https on the same host; path empty, `/sites/<one segment>` or `/teams/<one segment>`; no query or fragment; lowercase, no trailing slash; at most 512 characters | the anchor portal's `url` (P4) |
| `level` | `1`, `2` or `3` | the gate |
| `appVersion` | `^\d{1,3}\.\d{1,3}\.\d{1,3}$` | `manifest.version` of the bundle that flushes |
| `heartbeat` | object (level 1 and up) | Footer, hub owners only |
| `usage` | 1 to 200 entries (level 2 and up) | counters |
| `sites` | 1 to 50 entries (level 2 and up, only with `usage`) | site hashes (P12) |
| `errors`, `timings` | 1 to 100 entries each (level 3) | counters |

A batch carries at least one of `heartbeat`, `usage`, `errors` and `timings`. Assist derives `day` (the Oslo day at
receipt) and `hub_key` (`siteKey(hubUrl)`). For a heartbeat it derives `seen_week` (the ISO week of
that day) instead, and stores no day (P11).

**Level 1, Grunnleggende: `heartbeat`.** Sent from a hub page by a `manageWeb` user, at most once
per page load. Assist keeps it as the hub's current state with the ISO week, and the last one of
each month; never with a day (P11).

| Field | Allowed values | Source |
|---|---|---|
| `channel` | `main`, `test`, `i18n`, `kurs`, `unknown` | `InstallChannel` of the newest Installasjonslogg item |
| `templateVersion` | optional, `^\d{1,3}\.\d{1,3}\.\d{1,3}$` | semver part of `InstallVersion` (`1.15.0.a1b2c3d` → `1.15.0`); the hash, `InstallUser` and `InstallCommand` are never read |
| `hubLanguage` | `nb-NO`, `en-US`, `other` | hub web LCID 1044, 1033, other |
| `projects` | optional, integer 0 to 100,000 | Prosjekter `ItemCount` (all rows) |
| `programs` | optional, integer 0 to 100,000 | rows with `GtIsProgram` = 1 (`top(5000)`) |
| `parentProjects` | optional, integer 0 to 100,000 | rows with `GtIsParentProject` = 1 (`top(5000)`) |
| `catalog` | boolean | whether P5 allows catalog events |

A count is left out when its read fails, for example at the list view threshold.

**Level 2, Standard: `usage` entries** `{ c, e, s, v?, n }`:

| Field | Allowed values |
|---|---|
| `c` | one of 28 aliases: the 29 in `channels/main.json` minus `ProjectUpgrade`; never `SharedLibrary` |
| `e` | an event from the table below, for its components only |
| `s` | `hub`, `project`, `program`, `parent`, `other` |
| `v` | only for events that list variants |
| `n` | integer 1 to 10,000 |

| Event | Components | Variants |
|---|---|---|
| `loaded` | the 20 web parts | |
| `page.viewed` | Footer | |
| `setup.completed` | ProjectSetup | `new`, `rerun`, `parent` |
| `setup.aborted`, `setup.failed` | ProjectSetup | |
| `statusReport.created`, `statusReport.published` | ProjectStatusWebPart | |
| `phase.changed` | ProjectPhasesWebPart | |
| `properties.edited` | ProjectInformationWebPart | |
| `excel.exported` | PortfolioOverviewWebPart, PortfolioAggregationWebPart, ProgramProjectOverviewWebPart, ProgramAggregationWebPart, DynamicListWebPart | |
| `timelineItem.opened` | PortfolioTimelineWebPart, ProjectTimelineWebPart, ProgramTimelineWebPart | |
| `catalog.opened` | TemplatePackageCatalog | |
| `assistant.opened`, `help.opened` | Footer | |
| `statusReport.edited`, `statusReport.deleted` | ProjectStatusWebPart | |
| `news.created` | ProjectNewsWebPart | |
| `postAction.toggled` | RiskMatrixWebPart, OpportunityMatrixWebPart | |
| `view.switched`, `view.saved` | PortfolioOverviewWebPart, ProgramProjectOverviewWebPart | |
| `portfolio.switched` | PortfolioOverviewWebPart | |
| `dataSource.switched`, `layout.toggled` | PortfolioAggregationWebPart, ProgramAggregationWebPart | |
| `viewAll.toggled` | LatestProjectsWebPart | |
| `tab.switched` | ProjectListWebPart | |
| `documentTemplates.copied` | TemplateSelectorCommand | |
| `riskAction.created` | RiskActionPlanner | |
| `idea.recommended` | IdeaRegistration | `approve`, `consider`, `reject`, `other` |
| `idea.decided` | IdeaProcessing | `approve`, `consider`, `reject`, `other` |
| `idea.projectDataCreated` | IdeaProjectData | |
| `childProjects.added`, `childProjects.removed` | ProgramAdministrationWebpart | |

Each event in the contract has a `since` field, the first release that emits it. It is `'1.15.0'`
for every event above (P25); an event added later carries its own release, or `null` while it is
only reserved. The dashboard lists a feature as unused only for customers whose version has it.

**Level 2, Standard: `sites` entries** `{ h, s }` (D6, P12):

| Field | Allowed values |
|---|---|
| `h` | `^[0-9a-f]{16}$`: the site hash, which changes with the Oslo month; never the site id itself |
| `s` | `hub`, `project`, `program`, `parent`, `other` |

At most 50 entries, one per distinct hash in the batch. Assist stores each hash with the Oslo day of
receipt for 90 days and keeps only the counts after that.

**Level 3, Utvidet:**

| Entry | Field | Allowed values |
|---|---|---|
| `errors[]` `{ c, code, http?, n }` | `code` | `permission_denied`, `not_found`, `throttled`, `server_error`, `timeout`, `network`, `render_failed`, `provisioning_failed`, `unknown`, set by `errorCodeFrom(error)` from the HTTP status of a PnP error or our own error type, never parsed from message text |
| | `http` | `0`, `400`, `401`, `403`, `404`, `409`, `412`, `429`, `500`, `502`, `503`, `504` |
| | `n` | 1 to 10,000 |
| `timings[]` `{ c, m, h }` | `m` | `init` in 1.15.0; `firstRender` and `dataLoad` are reserved |
| | `h` | exactly 7 integers from 0 to 10,000: counts in the buckets 0–249, 250–499, 500–999, 1,000–1,999, 2,000–3,999, 4,000–7,999 and 8,000 ms or more; no raw duration is sent |

An error is counted in three places (the user's decision of 2026-11-12 added the third):
- where a component fails to render, as `render_failed`;
- where provisioning fails, as `provisioning_failed`;
- where a component handles a failed load or save itself and shows a message, under the
  error's own code and HTTP status. Without these, level 3 says little about why something does
  not work for a customer.

Only the code and the status are sent. A fetch function that rethrows a localized, generic error
keeps the original as its `cause` (`errorWithCause`), and `errorCodeFrom` follows it.

**Catalog events** (the existing `/api/telemetry/catalog`, from 1.15.0), sent only when P5 allows
and the command set's effective catalog URL is the default (P6):

| Field | Values |
|---|---|
| `eventId`, `action`, `status`, `packageId`, `packageVersion`, `packageType`, `previousVersion?`, `ppVersion?`, `tenantId?`, `host`, `siteUrl` (the hub) | as today; Assist stores the event only when `packageId` is in the public `catalog.json` |
| `detail?` | only `{ taxonomySkipped: boolean }` or `{ removedType: <package type> }` |
| `level` (new) | `2` or `3` |
| `errorCode?` (new) | level 3 and `status: 'error'` only; the usage error codes |
| `errorMessage`, `clientTs` | removed in 1.15.0; Assist stores neither from any client |

**Example** (level 2; the golden fixture has this shape):

```json
{
  "schema": 1,
  "batchId": "0f8c6a52-6b1e-4c39-9d7e-2f0a5b8e1c34",
  "host": "contoso.sharepoint.com",
  "tenantId": "9a5c0f3e-1b2d-4c6e-8f70-1a2b3c4d5e6f",
  "hubUrl": "https://contoso.sharepoint.com/sites/prosjektportalen",
  "level": 2,
  "appVersion": "1.15.0",
  "heartbeat": { "channel": "main", "templateVersion": "1.15.0", "hubLanguage": "nb-NO",
                 "projects": 412, "programs": 7, "parentProjects": 12, "catalog": true },
  "usage": [
    { "c": "Footer", "e": "page.viewed", "s": "hub", "n": 5 },
    { "c": "PortfolioOverviewWebPart", "e": "loaded", "s": "hub", "n": 3 },
    { "c": "ProjectSetup", "e": "setup.completed", "s": "project", "v": "new", "n": 1 }
  ],
  "sites": [
    { "h": "3f9a0c1d2e4b5a69", "s": "hub" },
    { "h": "b07e5d2c91a4f386", "s": "project" }
  ]
}
```

**Never sent, at any level.** Assist rejects these or never reads them.
1. Anything that identifies a user: names, usernames, UPNs or login names, e-mail addresses, the
   Entra object id, the SharePoint user id, group memberships.
2. Any pseudonym, hash or identifier derived from a user, device, browser, tab or session,
   including "anonymous" ids and fingerprints. `batchId` is random for each batch and links nothing.
3. Any identifier that stays the same across batches, except `host`, `tenantId`, `hubUrl` and, at
   level 2 and up, the site hash, which changes every month (P12): no site, web, list, item, page,
   file, web part instance or term id, and no other hash of one.
4. Content: titles and names of projects, sites, pages, lists, libraries, folders, files, views,
   phases, terms, templates, reports, ideas or risks. Also no status report text, comments, filter
   values, search text, column values, or anything from PP Assistenten conversations.
5. URLs other than the hub URL, query strings, and the Referer header.
6. Free text: error messages, stack traces, log lines.
7. Browser and device information: user agent, browser or OS version, screen size, time zone, the
   user's UI language.
8. Network identifiers: IP addresses (Assist never reads or stores them), and SharePoint
   correlation or request ids.
9. Timestamps: no batch and no 1.15 catalog event carries one. Assist dates usage by the Oslo day
   at receipt and heartbeats by the ISO week.
10. Any Globale innstillinger value except the effective level and the catalog flag. No secret,
    token, key or endpoint, and nothing from the hub's Logg list. From Installasjonslogg, only
    `InstallChannel` and the semver part of `InstallVersion`.
11. Counts of distinct users, browsers or sessions.

Nothing is stored in the browser for telemetry.

Against today's promises, the contract keeps every existing one: "Ingenting om sluttbrukere eller
prosjektinnhold", the Assistant's never-list, Install.ps1's "no user name and no parameter values"
and Assist's "uten informasjonskapsler". It also tightens them:
- catalog events lose their free text, and events from a customer's own catalog are no longer
  sent;
- no pseudonym of a user is used, and the only value tied to a site is a hash that changes every
  month (P12), where PP Assistenten sends site GUIDs in clear;
- the hub URL is the only URL.

## Design

### PP365 client

**Module.** New folder `SharePointFramework/shared-library/src/telemetry/`, exported from
`src/index.ts` through an `index.ts` barrel that only re-exports. It follows three rules:
- No runtime import from `@pnp/*` or `@microsoft/sp-*`. Type-only imports are erased; callers pass
  plain values.
- No top-level side effects, since the package declares `sideEffects: false`.
- Everything is a no-op without `window`, because the integration tests run library code in Node.

Its files:
- `contract.ts`: the allowlists and `since` values from the contract above;
  `USAGE_TELEMETRY_URL`; `TELEMETRY_SCHEMA = 1`; `MAX_BATCH_BYTES = 15000`;
  `MIN_SEND_INTERVAL_MS = 60000`; `MAX_SENDS_PER_WINDOW = 500`; `GATE_MAX_AGE_MS = 3600000`
  (60 minutes).
- `gate.ts`: `resolveTelemetryGate(input)` returns `{ level, catalog, reason }`, a pure function
  implementing P3.
- `settings.ts`: the P4 read. It takes the map the caller passed, or calls the anchor's
  `getGlobalSettings()`, and hands the map to the gate; a read that rejects counts as an empty
  map. It makes no other settings read. A decision older than `GATE_MAX_AGE_MS` is re-read through
  the anchor in the background: while `document.visibilityState` is `'visible'`, and on
  `visibilitychange` to visible. It never runs inside a flush.
- `store.ts`: the global `window.__pp365UsageV1`. It holds:
  - counters keyed `siteId|c|e|v`, plus errors, timings and the heartbeat;
  - the anchor portal (P4), with its normalised hub id and hub URL;
  - the gate decision, with its read time and the hub id it belongs to;
  - the site types and site hashes (P12), keyed by site id, and the registered site type
    resolvers;
  - the page's current site id and hub id;
  - `lastPageViewKey`, the time of the last send, the send count and a listener flag.

  It holds live objects (the anchor portal and the resolvers), so it is never serialised; a new
  schema version gets a new global name.
- `track.ts`: `startTelemetry`, `trackUsage`, `trackError`, `queueHeartbeat`. All are synchronous,
  so call sites need neither `await` nor `void`. They are typed with the contract's literal unions,
  checked again at runtime, and do nothing after a level-0 decision.
- `flush.ts`: `attachTelemetryPortal` (the anchor rule in P4), `flushTelemetry({ urgent })`, the
  listeners and the transport (P2). A flush works from memory and never waits on the network:
  1. it uses the decision in memory. While that is pending, older than `GATE_MAX_AGE_MS`, or for
     another hub, nothing is sent and the counters stay; they are lost at `pagehide`;
  2. it drops every kind above the level;
  3. it replaces site ids with the site types already in memory, and lists each site's hash with
     its type in `sites`, leaving out hashes not computed yet. Counters whose site type is not
     known yet stay for the next flush;
  4. it splits batches under `MAX_BATCH_BYTES` and sends them: urgent flushes always, a
     `visibilitychange` flush only when the last send is at least `MIN_SEND_INTERVAL_MS` old, and
     none after `MAX_SENDS_PER_WINDOW`.

  A DEBUG build logs each batch instead of sending it. Errors are logged at Info and dropped.
- `siteType.ts`: site types in the window store, keyed by site id. `hub` comes from `isHubSite`.
  For any other site a bundle registers a resolver,
  `registerSiteTypeResolver(siteId, () => Promise<'project' | 'program' | 'parent' | 'other'>)`.
  The core calls it lazily, once per site id, only after the gate has resolved at level 2 or 3,
  and keeps the answer in memory. It never runs inside a flush, and counters whose site type is
  not known yet stay in memory for the next flush. Every resolver uses one mapping: `GtIsProgram`
  → `program`, `GtIsParentProject` → `parent`, a project with neither flag → `project`, anything
  else → `other`. ProjectWebParts' resolver reads the two flags from the site's own properties
  list, as its adapter's `isParentProject()` already does
  (`ProjectWebParts/src/data/SPDataAdapter/index.ts:85-103`), so it needs no read from the hub. A
  later slice may add `PortalDataService.getSiteKind()`, read through the anchor, for a bundle
  that holds no such flags.
- `siteHash.ts`: `computeSiteHash(siteId, now)` (P12), with `crypto.subtle.digest` and the
  year-month from `Intl.DateTimeFormat` in `Europe/Oslo`. It runs in the background next to the
  site type lookup. Without `crypto.subtle` it returns nothing, and no `sites` entry is sent.
- `setup.ts`: pure helpers for ProjectSetup, so its file gains no branches:
  - `setupOutcomeEvent(aborted)` → `setup.aborted` or `setup.failed`;
  - `setupVariantFrom(forceTemplate)`: `''` or undefined → `new`, `__SELECT_TEMPLATE__` → `rerun`,
    anything else → `parent`;
  - `siteTypeFromTemplate({ isProgram, isParentProject })`.
- `errorCode.ts`: `errorCodeFrom(error)`. `TelemetryContext.ts`: a React context holding the host
  web part's alias.
- `__fixtures__/usage-batch-v1.json`: the golden fixture.

**PortalDataService.** The gate needs no new method: it reads through the existing, cached
`getGlobalSettings()` (P4). One method is new, added with the Footer's heartbeat (slice 7), and
`INSTALLATION_LOG` is added to `PortalDataServiceList` and to the default list names
(`resource.Lists_InstallationLog_Title`). The method does not use `.using(...)` caching, so
nothing it reads lands in localStorage, and telemetry calls it only through the anchor (P4).
- `getUsageSnapshot()`. It reads the newest Installasjonslogg item by `InstallStartTime`, selecting
  `InstallVersion` and `InstallChannel` only, plus the Prosjekter `ItemCount` and the two flag
  counts. Each read has its own catch, and the method returns `null` when `!isAvailable`.

Site types come from registered resolvers (`siteType.ts`), not from a fixed PortalDataService
call. A later slice may add `getSiteKind()`, on the same terms as `getUsageSnapshot()`, for a
bundle that holds no site flags of its own.

**Flow on a page.**
1. Each bundle calls `startTelemetry` early in onInit, with plain values: host, tenant id, site id,
   the page's hub id (`legacyPageContext.hubSiteId`), whether this is a hub page, `appVersion`,
   `isDebug: DEBUG`, and `canManageHub` (Footer only). The first call creates the store and
   installs the listeners once. On an SPA navigation, the Footer's own `navigatedEvent` handler
   passes the new page's site id and hub id to the store.
2. After its data adapter is configured, the bundle calls
   `attachTelemetryPortal(portalDataService, settingsMap?)`. Only a portal that belongs to the
   page's hub is accepted (P4), and BasePortfolioWebPart attaches nothing when its onInit received
   a portfolio. The first accepted portal becomes the anchor and starts the gate, from the map it
   was given or from the anchor's cached `getGlobalSettings()`. A bundle on a site other than the
   hub also calls `registerSiteTypeResolver`. Once the gate has resolved at level 2 or 3, the core
   calls the resolver for the page's site id, once and in the background.
3. `trackUsage` only increments counters, so it is safe before the gate resolves.
4. Nothing is sent before the gate resolves, and a flush never waits for it. Counters still waiting
   at `pagehide` are lost: the module fails closed.

**Hook points** (paths under `SharePointFramework/`):

| What | Where |
|---|---|
| `startTelemetry`, `page.viewed`, own `navigatedEvent` subscription (it also updates the store's site id and hub id); page views deduplicated on `lastPageViewKey`, because a site can carry two channels' footers; heartbeat when the level is 1 or higher, on a hub page, for a `manageWeb` user: the snapshot is read through the anchor first, then the heartbeat is queued and sent at once | `PortfolioExtensions/src/extensions/footer/index.ts`, between the isAvailable return (`:51-59`) and the ShowFooter return (`:65`); the existing subscription (`:79`) runs only when the footer shows |
| `loaded` plus the `init` timing; attach the adapter's portal, which BasePortfolioWebPart skips when its onInit received a portfolio; register the bundle's site type resolver (BaseProjectWebPart first, from the site's own flags) | the three base onInit methods (`basePortfolioWebPart/index.tsx:102`, `baseProjectWebPart/index.tsx:73`, `baseProgramWebPart/index.ts:72`), never in `render()` |
| `render_failed` errors | `onError` of the ErrorBoundary (`basePortfolioWebPart/index.tsx:60`, `baseProjectWebPart/index.tsx:49`), the four `renderReact` error branches |
| Load and save failures a component handles itself, by the error's own code: `useTelemetry().trackError(error)` in the hook's catch, once per failure; a fetch function that rethrows a generic error wraps the original with `errorWithCause` | each web part's and extension's data fetch hook and its save, publish, delete and create handlers (ProjectWebParts in slice 6, the others in slice 7); the matrix web parts' `_loadItems` catch (`baseUncertaintyMatrixWebPart/index.ts`). Not counted: input validation, a cancelled dialog, and a failure swallowed on purpose because the feature is optional |
| its own `startTelemetry` (the Footer is not on the site during setup); `setup.completed`, with `setupVariantFrom(this.properties.forceTemplate)` and `siteTypeFromTemplate(...)` from the selected template's flags; `setup.aborted` and `setup.failed` both counted in the catch as `setupOutcomeEvent(this._setupAborted)`, because the dialog's dismissal rejects into that catch; onDismiss only sets `this._setupAborted = true`; urgent flush before the dismiss navigates (`:246-248`) | `ProjectExtensions/src/extensions/projectSetup/index.ts`: after `_startSetup` (`:211`); the catch (`:251-275`); onDismiss (`:495-503`) |
| catalog events under the gate | `PortfolioExtensions/src/services/TelemetryService.ts` (below) |
| `TelemetryContext` provider with `this.manifest.alias` | the three base `renderComponent` methods |
| `statusReport.created`, `statusReport.published` | `ProjectWebParts/.../EditStatusPanel/useEditStatusPanelSubmit.tsx:34`, `.../Commands/usePublishReport.ts:57` |
| `phase.changed`, urgent flush before the reload (`:48-52`) | `ProjectWebParts/src/components/ProjectPhases/useChangePhase.ts:38` |
| `properties.edited` | `useEditPropertiesPanelSubmit.ts:92` |
| `excel.exported`, after `export()` returns, with the alias from `useContext(TelemetryContext)` (`ExcelExportService` is a class instance and cannot read a context) | the three caller hooks: `PortfolioWebParts/src/components/PortfolioOverview/ToolbarItems/useExcelExport.tsx`, `PortfolioWebParts/src/components/PortfolioAggregation/ToolbarItems/useExcelExport.tsx`, `ProjectWebParts/src/components/DynamicList/hooks/useExcelExport.tsx` |
| `timelineItem.opened` | `shared-library/src/components/ProjectTimeline/Timeline/useTimeline.ts:33-34` |
| `catalog.opened`; `assistant.opened`; `help.opened` | `templatePackageCatalog/index.tsx:102`; `Footer/Assistant/useAssistant.ts:11-14`; `Footer/HelpContent/HelpContentDialog/index.tsx:45-47` |
| the remaining events in the contract | `useEditStatusPanelSubmit.tsx:47`, `useDeleteReport.ts:20`, `useNewsDialog.ts:103-112`, `RiskMatrix.tsx:51`, `OpportunityMatrix.tsx:51`, `useViewsMenuItems.ts:24-26`, `useProgramMenuItems.ts:20-28`, `useViewFormPanel.ts:43-85`, `portfolioOverview/index.ts:61-86`, `useToolbarItems.ts:40-42`/`:75-86`, `useLatestProjects.ts:50`, `ProjectList.tsx:226-229`, `useDocumentTemplateDialog.ts:53`, `useNewRiskActionPanel.ts:73-74`, `useAddProjectDialog.ts:59`, `Commands.tsx:53`, the idea handlers (`ideaRegistration/index.tsx:92-105`, `ideaProcessing/index.ts:73-86`, `ideaProjectData/index.tsx:141-152`), each with an urgent flush before its reload or redirect |

Actions are counted in handlers and hooks, never in reducers: `CHANGE_VIEW` is dispatched both by a
view switch and by a view save. Touchpoints in the solutions are straight-line calls into
shared-library. Any mapping, such as ProjectSetup's variant, site type and outcome, lives in pure
shared-library functions, so the solutions gain no branches against the thin floors.
ProjectExtensions has about six uncovered branches to spare.

**Catalog.** `TelemetryService` keeps its endpoint; its props gain the command set's `catalogUrl`.
`_isEnabledInGlobalSettings` (`:129-136`) gives way to the shared gate's catalog flag, with
`SPDataAdapter.portalDataService` attached without a map (P4). It also gets the P6 changes:
- adds `level`, and `errorCode` at level 3;
- removes `errorMessage` and `clientTs`;
- allowlists `detail`;
- sends nothing unless the effective catalog URL is `DEFAULT_CATALOG_URL`;
- sets `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`;
- corrects its JSDoc.

The JSDoc of `featureFlags.isTelemetryEnabled` says the flag now stops all PP365 telemetry.

**Tests** (Jest, no `@pnp` imports, structural stand-ins):
- The shared Jest setup gets
  `if (typeof globalThis.DEBUG === 'undefined') globalThis.DEBUG = false`
  (`SharePointFramework/.jest-config/lib/setup.js`). SPFx replaces `DEBUG` at build time; under
  Jest it is a plain global. Every bundle now passes it, the Footer included, and `footer.test.ts`
  defines none. Tests that set `DEBUG` themselves keep working.
- `gate.test.ts`:
  - every rule; values `''`, `' 2 '`, `'2.0'`, `'Standard'`, `'4'`, `'-1'`;
  - a map without the level key (a disabled or deleted row) gives 0, and so does an empty map (a
    hub that could not be read);
  - an anchor that is not available, the tester flag, GPC, DNT;
  - the catalog: the `'0'` stop; a missing key or `'true'` gives no catalog events; level 1 gives
    none either;
  - the anchor: a first attach without a map reads through the anchor's `getGlobalSettings()`; a
    portal from another hub, or one configured with a portfolio URL, never decides the gate or
    `hubUrl`; a page with no `hubSiteId` sends nothing, even if a portfolio portal attached; the
    Footer attaching second with a lower map lowers the decision, and a higher one never raises
    it; the catalog sends at level 2 without a map; the decision and the anchor are dropped after
    an SPA navigation to a page of another hub.
- `settings.test.ts`: a passed map makes no read; without one the anchor's `getGlobalSettings()`
  is called once, and no other method of the portal; a read that rejects gives level 0; a decision
  older than `GATE_MAX_AGE_MS` is re-read through the anchor, only while the tab is visible and
  never from a flush.
- `siteType.test.ts`: a hub page needs no resolver; a resolver is called once per site id, only at
  level 2 or 3 and never from a flush; counters wait in memory until it answers.
- `privacy.test.ts`: spies on `Storage.prototype.setItem`, `removeItem` and `clear`, on the
  `document.cookie` setter, `indexedDB.open` and `caches.open`. They record zero calls across start,
  track and flush.
- `transport.test.ts`:
  - the exact fetch options;
  - `sendBeacon` never called;
  - no request at level 0;
  - DEBUG logs and never fetches;
  - errors swallowed;
  - splitting under `MAX_BATCH_BYTES`;
  - a flush with a stale or pending gate, or an unknown site type, makes no ordinary
    (non-keepalive) request, and sends nothing it cannot type;
  - the 60-second interval for `visibilitychange` sends, urgent sends at `pagehide`, the 500-send
    cap, and the 21st hide still sending;
  - `hubUrl` comes from the anchor only;
  - two bundles sharing one store.
- `payload.test.ts`: output deep-equals the golden fixture, read with `fs` from `src/`, not from
  `lib-commonjs`. Keys stay within the allowlist. A component, event or variant containing `/`,
  `@` or `http` is dropped.
- `siteHash.test.ts`, with a stubbed `crypto.subtle`: 16 hex characters, never the site id, the
  same hash twice in one Oslo month, a new one in the next month, and nothing without
  `crypto.subtle`.
- `setup.test.ts`: the three ProjectSetup helpers.
- `PortalDataService.test.ts`: `getUsageSnapshot()`, not cached.
- `PortfolioExtensions/src/services/TelemetryService.test.ts` (new, with `jest.mock` of
  `data/SPDataAdapter`) and `footer.test.ts`:
  - telemetry starts even when `ShowFooter` is `'0'`;
  - the heartbeat goes only for `manageWeb` on the hub;
  - nothing is sent when the hub is unavailable;
  - no catalog event for a non-default catalog URL.
- `ProjectExtensions/src/extensions/projectSetup/projectSetup.test.ts`: an abort records
  `setup.aborted` and nothing else; a failure records `setup.failed`.
- Base classes, through the existing fixtures (`ProgramWebParts/src/webparts/testFixtures.ts`),
  including that BasePortfolioWebPart attaches no portal when its onInit receives a portfolio.

### Settings, install and upgrade

**Row**, appended after `AssistantAccessMode` (`Globale innstillinger.xml:205-212`):

```xml
<pnp:DataRow>
  <pnp:DataValue FieldName="GtSettingsId">{<generated once in slice 3>}</pnp:DataValue>
  <pnp:DataValue FieldName="Title">{resource:Lists_Global_Settings_Category_General_UsageStatisticsLevel_Title}</pnp:DataValue>
  <pnp:DataValue FieldName="GtSettingsKey">UsageStatisticsLevel</pnp:DataValue>
  <pnp:DataValue FieldName="GtSettingsValue">2</pnp:DataValue>
  <pnp:DataValue FieldName="GtSettingsEnabled">True</pnp:DataValue>
  <pnp:DataValue FieldName="GtSettingsCategory">{resource:Lists_Global_Settings_Category_General}</pnp:DataValue>
</pnp:DataRow>
```

The seed is `3` (P10), so the default is a fact of the template and no script writes a starting
value. The apps are already deployed tenant-wide when the template adds the row and the Footer in
the same run. A new hub installed with an explicit `-UsageStatisticsLevel` therefore runs at
Extended from the template's row until Install.ps1 writes the explicit level right after the
Portfolio template, and a browser that read the settings in that window follows the explicit
level within two hours (P4). The window is short, and it is accepted. On an existing hub, the
step before the template has already added a missing row, as `0` when P7 finds an opt-out, and
Skip leaves it alone.

**Resx.** One key, `Lists_Global_Settings_Category_General_UsageStatisticsLevel_Title`, on the same
line in both files: after `..._General_ShowFooter_Title` (`:1303-1305`) and before
`Lists_Global_Settings_Category_OpportunityMatrix` (`:1306`).

| File | Text |
|---|---|
| no-NB | `Bruksstatistikk til Prosjektportalen-teamet (0 = av, 1 = grunnleggende, 2 = standard, 3 = utvidet)` |
| en-US | `Usage statistics sent to the Prosjektportalen team (0 = off, 1 = basic, 2 = standard, 3 = extended)` |

Then the user runs `cd Templates && npm run build && npm run validate-loc`, reads
`resx-ts-report.json` and `pnp-missing-resource-tokens-report.json`, and reverts the
`-validation.md` files whose only change is the timestamp.

**`Install/Scripts/SharedFunctions.ps1`.** New definitions:
- `$UsageStatisticsLevelSettingId`;
- `Get-UsageStatisticsRows`: the level, catalog and `UseAssistant` rows, with id, trimmed key and
  value, and enabled;
- `Test-CatalogTelemetryUrlDisabled`: reads the web custom actions (`Get-PnPCustomAction -Scope Web`),
  finds the one named `{bacfe2c8-77b4-4629-b84a-6d90f013f627}`, and tells whether its
  `ClientSideComponentProperties` holds `"telemetryUrl": ""`;
- `Resolve-InitialUsageStatisticsLevel` (pure; P7): explicit level, the catalog command set's
  `telemetryUrl` opt-out, catalog rows and previous version in; value and reason out;
- `Get-EffectiveUsageStatisticsLevel` (pure; mirrors P3 over the enabled rows, the catalog stop
  included; for a duplicated key the row read last counts, as in the map `getGlobalSettings()`
  builds);
- `Convert-UsageStatisticsLevel` (`Off`/`Basic`/`Standard`/`Extended` ↔ `0` to `3`);
- `Initialize-UsageStatisticsSetting`: the step before the template, shared by PreInstallUpgrade
  and by Install.ps1 runs without `-Upgrade`:
  - it finds the list by its URL, `Get-PnPList -Identity (Get-Resource -Name "Lists_Global_Settings_Url") -ErrorAction Stop`,
    the way the template finds it;
  - when the result is `$null`, it reports that the list did not exist and stops. Get-PnPList
    returns nothing for a list that does not exist; confirm that once on the test hub. A read error
    or a renamed list title no longer reads as "no list";
  - when an item has the key `UsageStatisticsLevel` or the template id, it does nothing;
  - otherwise it adds the row with the resolver's value and reports that it did;
  - every read and write uses `-ErrorAction Stop`. It returns what it found (no list, a row that
    exists, or a row it added), and the caller prints it;
- `Set-UsageStatisticsLevel`: the explicit write, called only when `-UsageStatisticsLevel` is
  given. It finds the row by `GtSettingsId` and adds it when missing, with title and category from
  `Get-Resource`, and sets `GtSettingsEnabled` to true.
- `Write-UsageStatisticsSummary`.

**`Install/Scripts/PreInstallUpgrade.ps1`.** A new step at the end, outside the
`if ($null -ne $LastInstall)` block, so it runs on every upgrade:
1. Call `Initialize-UsageStatisticsSetting`. A missing list means the template creates the list
   with the row at `2`: a hub without the list has no setting rows to carry over. The catalog
   command set's `telemetryUrl` opt-out (P7, rule 2) is not carried over in that one case.
2. When it added the row, print `[INFO] Usage statistics: added UsageStatisticsLevel = <v> (<reason>)`.

The step has no try/catch, and every read and write in it uses `-ErrorAction Stop`, so an error ends
the upgrade through Install.ps1's handler, before the apps and the template. The resolver reads
`$UsageStatisticsLevel`, a script variable, because the file is dot-sourced.

**`Install/Install.ps1`.**
- Parameter after `-SkipPingback`:
  `[ValidateSet('Off','Basic','Standard','Extended')][string]$UsageStatisticsLevel`, with the
  HelpMessage "Usage statistics sent to the Prosjektportalen team: Off, Basic, Standard or
  Extended. Writes UsageStatisticsLevel in Globale innstillinger. Without it, a new installation
  gets Extended and an upgrade keeps the hub's level".
- `-SkipPingback`'s HelpMessage gains: "Usage statistics have their own switch,
  -UsageStatisticsLevel" (D7).
- Right after `Param`, before any dot-sourcing:
  `$UsageStatisticsLevelGiven = $PSBoundParameters.ContainsKey('UsageStatisticsLevel')`. Whether a
  dot-sourced script can change `$PSBoundParameters` is not verified.
- Banner (`:104-115`): one line, `### Usage statistics: Extended (3) ####` on a fresh install,
  `<Name> (from -UsageStatisticsLevel)`, or on an upgrade `kept as set on the hub ####`. It is followed by
  `[INFO] What is sent, and how to turn it off: https://github.com/Puzzlepart/prosjektportalen365/wiki/Bruksstatistikk`.
  There is no new prompt, which would break unattended installs.
- Before the template on runs without `-Upgrade`: in that branch, after the connection check and
  before the first `Invoke-PnPSiteTemplate` (`:533-534`), call `Initialize-UsageStatisticsSetting`.
  On an existing hub, it adds a missing row with the resolver before the template's Skip re-adds a
  deleted `CatalogTelemetryEnabled` row as `1` (`Globale innstillinger.xml:31`, `:144-151`) and
  seeds the level row as `3`. `$PreviousVersion` is read the way PreInstallUpgrade reads it when
  it is not already set. On a new hub the list does not exist yet, and the template creates it
  with the row at `3`.
- Right after the Portfolio template, in both template branches (after the Portfolio template's
  `EndAction`, before the content template): when the level was given, call
  `Set-UsageStatisticsLevel` and print `old -> new`. Nothing else in Install.ps1 writes the row,
  and without the parameter nothing runs here. With `-SkipTemplate` the same write runs in place
  of the template step, so an explicit level is never dropped. A write error prints a red
  `[ERROR]` naming the manual step ("set UsageStatisticsLevel to <n> in <list title> before users
  open the hub"). The row then still holds what it held: `2` on a new hub.
- New region "Usage statistics summary", after PostInstallUpgrade (`:628-637`) and before
  `$sw.Stop()`, while still connected. It writes nothing:
  1. Compute `$EffectiveUsageStatisticsLevel` from the rows on the hub. When they cannot be read,
     the summary says so and names the list; it never prints a level it has not read.
  2. Print the summary.
- Summary, in English like the rest of the script, with the list title from
  `Get-Resource Lists_Global_Settings_Title`:

  ```
  [INFO] Usage statistics (bruksstatistikk): Standard (2)
  [INFO]   Sent from browsers to the Prosjektportalen team (assist.prosjektportalen.no): version,
           channel, language, the number of projects and programs, which parts of
           Prosjektportalen are used and how many different sites, as counts per day.
  [INFO]   Never sent: users, names, e-mail addresses, content, or the addresses of project sites.
  [INFO]   Change it in '<list title>' on the hub: UsageStatisticsLevel (0 = off, 1 = basic,
           2 = standard, 3 = extended). A change applies within two hours.
  [INFO]   Template catalog events (CatalogTelemetryEnabled): on | off
  [INFO]   Details: https://github.com/Puzzlepart/prosjektportalen365/wiki/Bruksstatistikk
  [INFO] Installation pingback (a separate flow): sent | not sent (-SkipPingback)
  ```

  Variants:
  - Level 1 reads "... version, channel, language and the number of projects and programs, sent
    when a hub owner opens the hub; only the latest values are kept, with the week they arrived".
  - Level 3 adds "plus error codes and load times for troubleshooting".
  - Level 0 reads "Off (0): no usage statistics are sent to the Prosjektportalen team", with the
    reason: set to 0, row disabled, value not recognised, row missing, or "CatalogTelemetryEnabled
    is 0, which turns all usage statistics off; set it to 1 to use the level".
  - When the hub's `UseAssistant` row is enabled with `1`, one more line: "PP Assistenten has its
    own telemetry; see Sikkerhet i PP Assistenten."
- Pingback (`:705-728`): unchanged. It is sent unless `-SkipPingback` is given, at any level (P9).

**Order of steps.**
- Upgrade:
  1. PreInstallUpgrade adds a missing row with the resolver (`0` when P7 finds an opt-out), or
     records that the list does not exist yet.
  2. Apps.
  3. Template (Skip: the row exists; or the template creates the list with the row at `2`).
  4. Right after the Portfolio template: an explicit `-UsageStatisticsLevel` is written.
  5. PostInstall, then PostInstallUpgrade.
  6. The summary.
  7. Install log entry.
  8. Pingback, unless `-SkipPingback`.
- Fresh install, and any other run without `-Upgrade`:
  1. Apps.
  2. Before the template: when the list exists, the same add-if-missing step with the resolver.
  3. The template seeds `3` on a new hub, which runs at Extended from then on. On an existing hub
     Skip leaves the row alone.
  4. Right after the Portfolio template: an explicit `-UsageStatisticsLevel` is written.
  5. PostInstall.
  6. The summary.
  7. Install log entry, and the pingback unless `-SkipPingback`.

**CI.** No workflow passes the parameter, so manual changes on the test hub survive every run.
Commits that touch `Templates/` never carry `[apps-only]`. No `UpgradeAllSitesToLatest` step is
needed, because the setting lives on the hub. The repo has no Pester. A new
`.tasks/usage-statistics-level.test.js` dot-sources `Install/Scripts/SharedFunctions.ps1` (function
definitions only) in `pwsh -NoProfile`. It runs `Resolve-InitialUsageStatisticsLevel` and
`Get-EffectiveUsageStatisticsLevel` over a JSON table of scenarios
(`.tasks/fixtures/usage-statistics-level.json`): the resolver's rules (P7) and the effective level
(P3). It has no scenario for a starting value written at the end of a run, or for the rerun of an
install that never completed, because no such write exists (P10). `npm run test:tasks` runs it
locally and in the debug build, whose runner has `pwsh`; where `pwsh` is missing, it skips with a
notice. The slice 13 matrix still checks the paths on a real hub.
`integration/tests/template.test.ts` asserts, read-only, that the row exists with the generated id
and a value from `0` to `3`.

### Assist: ingest and storage

**Route** `prosjektportalen-assist/src/app/api/telemetry/usage/route.ts`. `allowedOrigin` and
`corsHeaders` move from the catalog route into `src/lib/telemetry-http.ts`, and both routes import
them; the catalog's behaviour does not change. `POST` runs these steps:
1. Answer 403 to a foreign Origin.
2. If `PP_USAGE_INGEST_DISABLED` is `1`, or the Origin host is in `PP_USAGE_BLOCKED_HOSTS`, answer
   204 without touching the database.
3. Answer 413 on `Content-Length`, and again on the body measured in bytes. The catalog route
   compares characters.
4. `JSON.parse`; answer 400 `Ugyldig JSON` on failure.
5. `parsePpUsageBatch(raw, origin.host)`; answer 400 with the reason.
6. One write; on error log `(telemetry/usage) skriving feilet` with the host only, and answer 500.
7. Answer 204.

The route sends no `Access-Control-Allow-Credentials` and no `Accept-CH`, and never logs the body
or the headers.

**Validator** `src/lib/pp-usage-telemetry.ts`, hand-rolled like `catalog-telemetry.ts`, on top of
`src/lib/pp-usage-contract.ts`. It enforces P15, the bounds in the contract, the hubUrl shape
(normalised with `siteKey()`), the `sites` rules (16 lowercase hex characters, at most 50, only
with `usage`), lowercase GUIDs and the level rules. It derives `seen_week` for a
heartbeat. Duplicate keys are merged before the insert, because `ON CONFLICT DO UPDATE` cannot
touch one row twice. Components and events are stored as text and validated in TypeScript (the
text-not-enum convention), so a new event needs no `ALTER TYPE`.

**Schema** in `src/db/schema.ts`. The user generates `drizzle/0041_pp_usage_telemetry.sql` and its
meta with `npm run db:generate`, which needs no database. The migration is additive and runs in
the Vercel build, on the preview's Neon branch first. None of these tables has an FK, or an IP,
user agent, referrer, geo or user-language column.

| Table | Columns | Primary key | Kept |
|---|---|---|---|
| `pp_usage_batch` | `batch_id`, `day`, `host`, `entries`, `dropped` | `batch_id`; index `(host, day)` | 7 days |
| `pp_usage_hub_daily` | `day`, `host`, `hub_key`, `aad_tenant_id` (default `''`), `level`, `app_version`; written only by batches with `usage`, `errors` or `timings` | `pp_usage_hub_daily_pk (day, host, hub_key)`; index `(host, day)` | no limit |
| `pp_usage_hub_state` | `host`, `hub_key`, `aad_tenant_id` (default `''`), `level`, `app_version`, `template_version`, `channel`, `hub_language` (`''` = unknown), `catalog`, `projects`, `programs`, `parent_projects` (null = unknown), `seen_week` (the Monday of the ISO week at receipt); replaced by each heartbeat | `pp_usage_hub_state_pk (host, hub_key)` | no limit (one row per hub) |
| `pp_usage_hub_monthly` | `month` (first day), `host`, `hub_key`, and the heartbeat columns of `pp_usage_hub_state`; replaced by each heartbeat in that month | `pp_usage_hub_monthly_pk (month, host, hub_key)` | no limit |
| `pp_usage_daily` | `day`, `host`, `hub_key`, `site_type`, `component`, `event`, `variant` (default `''`), `count` | `pp_usage_daily_pk` on all dimensions; index `(host, day)` | no limit |
| `pp_usage_site_seen` | `day`, `host`, `hub_key`, `site_type`, `site_hash` | `pp_usage_site_seen_pk` on all columns | 90 days (D6) |
| `pp_usage_sites_daily` | `day`, `host`, `hub_key`, `site_type`, `active_sites`; written by the nightly job | `pp_usage_sites_daily_pk (day, host, hub_key, site_type)` | no limit |
| `pp_usage_sites_monthly` | `month` (first day), `host`, `hub_key`, `site_type`, `active_sites`; written by the nightly job | `pp_usage_sites_monthly_pk (month, host, hub_key, site_type)` | no limit |
| `pp_usage_error_daily` | `day`, `host`, `hub_key`, `app_version`, `component`, `code`, `http_status` (default 0), `count` | `pp_usage_error_daily_pk` | no limit |
| `pp_usage_timing_daily` | `day`, `host`, `hub_key`, `app_version`, `component`, `metric`, `b0` … `b6` | `pp_usage_timing_daily_pk` | no limit |

Further changes:
- `pp_catalog_event` gets `level smallint` (null means a client older than 1.15) and
  `error_code text`. 0041 also clears `error_message` and `client_ts` on the existing rows, with an
  `UPDATE` appended by hand to the generated SQL. It changes data only, so the snapshot does not
  change. From the slice 2 deploy, the validator stores neither (P6).
- `PP_ACTIVITY_EVENT_TYPES` (`src/lib/pp-install.ts`) gets `pp_usage_deleted`, through
  `ALTER TYPE ... ADD VALUE`, as `0039_pp_sector.sql` does.

**Write** in `src/lib/pp-usage-store.ts`: one `db.execute(sql\`...\`)` statement, the first raw
statement in Assist.
1. `WITH ins AS (INSERT INTO pp_usage_batch ... SELECT ... WHERE (SELECT count(*) FROM
   pp_usage_batch WHERE host = $host AND day = $day) < 20000 ON CONFLICT DO NOTHING RETURNING 1)`.
2. Data-modifying CTEs, each guarded by `WHERE EXISTS (SELECT 1 FROM ins)`:
   - a batch with `usage`, `errors` or `timings` upserts the day's `pp_usage_hub_daily` row,
     replacing `level`, `app_version` and a non-empty `aad_tenant_id`. A heartbeat-only batch, and
     so every level-1 batch, writes no daily row;
   - a batch with a `heartbeat` replaces the hub's `pp_usage_hub_state` row (with `seen_week`)
     and the month's `pp_usage_hub_monthly` row;
   - counters, errors and timing buckets are added;
   - a batch with `sites` inserts its hashes into `pp_usage_site_seen` with
     `ON CONFLICT DO NOTHING`.
3. Each guarded insert reads its rows from typed arrays through `unnest`, one parameter per column.
   Untyped parameters in a `VALUES` list inside `FROM` would reach Postgres as text through
   neon-http and fail on the integer and date columns:

   ```sql
   INSERT INTO pp_usage_daily (day, host, hub_key, site_type, component, event, variant, count)
   SELECT * FROM unnest(
     ${sql.param(days)}::date[], ${sql.param(hosts)}::text[], ${sql.param(hubKeys)}::text[],
     ${sql.param(siteTypes)}::text[], ${sql.param(components)}::text[],
     ${sql.param(events)}::text[], ${sql.param(variants)}::text[], ${sql.param(counts)}::int[])
   WHERE EXISTS (SELECT 1 FROM ins)
   ON CONFLICT ON CONSTRAINT pp_usage_daily_pk
   DO UPDATE SET count = pp_usage_daily.count + excluded.count
   ```

   Each array goes in through `sql.param(...)`: a bare JS array in drizzle's `sql` template
   expands into a parenthesised list of parameters (`node_modules/drizzle-orm/sql/sql.js:93-103`).
   Errors, timings and the hub rows work the same way, and the batch row's parameters are cast
   too. The number of parameters stays the same whatever the batch size.

A replay or an over-cap batch changes nothing and gets 204. The cap is logged with
`console.warn` (host and reason only). Per-batch limits are 200 usage entries, 100 errors,
100 timings, `n` ≤ 10,000 and counts ≤ 100,000.

**Catalog validator** (`src/lib/catalog-telemetry.ts`):
- accepts `level` (2 or 3) and `errorCode` (from the list, level 3 with status `error` only);
- keeps only the two allowed `detail` keys;
- stores no `errorMessage` and no `clientTs` from any client (1.14 clients keep sending both);
- keeps only events whose `packageId` is in the public `catalog.json`. A new
  `src/lib/public-catalog.ts` reads it with the hourly revalidated fetch that prosjektportalen-web
  uses for the same file (`prosjektportalen-web/src/lib/malpakker.ts:11-14`). Other events, and
  every event while the list cannot be read, get 204, are not stored, and are logged with the host
  only.

**Tests.** Assist has none today; tsx is already a devDependency, so no new dependency is needed.
- `package.json` gets `"test": "tsx --test src/lib/*.test.ts"`, which the shell expands, and
  `.github/workflows/ci.yml` runs `npm test` after "Type check".
- `pp-usage-telemetry.test.ts`:
  - the golden fixture `src/lib/__fixtures__/pp-usage-batch-v1.json` parses to the expected rows;
  - a heartbeat maps to a state row with its ISO week and no day;
  - every 400 reason;
  - level enforcement;
  - unknown values dropped and counted;
  - hubUrl rules, the `sites` rules, bounds, GUID case;
  - no field taken from headers.
- `telemetry-http.test.ts`: https only, no port, the dot suffix, `evilsharepoint.com`.
- `catalog-telemetry.test.ts`: `level`, `errorCode`, the `detail` allowlist, no `errorMessage` or
  `clientTs` kept from any client, and an unknown `packageId` dropped. The id list is passed in, so
  the test needs no network.

The SQL and the route are verified on a preview deploy with curl and an Origin header. Expected
results:
- OPTIONS → 204;
- the fixture → 204 plus rows;
- a two-row batch → both rows, with integer counts; its replay → no change;
- a heartbeat-only batch → a state row and a monthly row, and no daily hub row;
- a batch with `sites` → `pp_usage_site_seen` rows; `sites` in a level-1 batch → 400;
- a replay → no change;
- a foreign Origin → 403;
- 17 KB → 413;
- a host mismatch → 400;
- data above the level → 400;
- the kill switch → 204 and no rows;
- the cap → nothing written;
- a catalog event with an unknown `packageId` → 204 and no row.

If Vercel Deployment Protection is on for previews (unknown), use its bypass header. The prod smoke
after merge sends invalid payloads only.

### Assist: dashboard and the customer thread

**Thread.**
- `host` joins `tenant.host`, which gives the organization through `tenant.organization_id`.
- `hub_key` joins `instance.site_key`; the pingback's `InstallUrl` gives the same key.
- `autoLinkAssistantKeys` takes `(lower(aad_tenant_id), host)` pairs from `pp_usage_hub_state` and
  `pp_usage_hub_daily` where the id is not empty, in a union with the `pp_catalog_event` pairs
  (`assistant-telemetry-sync.ts:298-305`). It still links only unambiguous GUIDs and never
  overwrites, so assistant browser data links to more tenants.

**Readers** in `src/lib/pp-usage-dal.ts`. Each starts with `await requireAdmin()` from `dal.ts`
and aggregates in SQL (`sum` and `max(day)`, grouped), never by loading rows:
- `getPpUsageOverview({ start, end }, { includeInternal, includeTest })`;
- `getPpUsageForOrg(orgId, range)`, which sums all the organization's tenants;
- `listPpUsageUnlinkedHosts(range)`;
- `lastUsageDayByOrg(orgIds)`, from `pp_usage_daily`.

Readers use inclusive Oslo days, with the logic of `assistantDayRange` (`dal.ts:5118`) moved to
`src/lib/date.ts`. Heartbeat facts come from `pp_usage_hub_state`, one row per hub. The latest level
and version of a hub at level 2 or 3 come from `pp_usage_hub_daily` through `DISTINCT ON`. Active
sites come from `pp_usage_sites_daily` and `pp_usage_sites_monthly`, which the nightly job fills,
and the level and version history by month from `pp_usage_hub_monthly`. The pure fold and
`classifyUsageHost` live in `src/lib/pp-usage-aggregate.ts`, with tests.

**Minimum for 1.15.0** (slice 9):
- **Logging › Prosjektportalen** replaces the placeholder, in the Assistent page's shape:
  - `resolveStatPeriod(..., 'last_30_days')` and `PeriodFilter` with `LOGGING_PP_PATH`;
  - a `STAT_LIST`: aktive kunder, sidevisninger, webdel-lastinger, handlinger, aktive
    prosjektområder i måneden, kunder per nivå;
  - a per-customer table. The name links to `customerPath(orgId)`, with badges intern, test and
    ukoblet. Columns: nivå (the latest, with its day, or its week for a hub at level 1), versjon,
    kanal, prosjekter, programmer, overordnede, aktive områder i måneden (out of prosjekter),
    sidevisninger, webdeler i bruk, sist mottatt (a day, or a week for a hub at level 1);
  - a feature table: label, key, count, customers n of N;
  - "Ukoblede verter" with `OrgLinkSelect`;
  - an "Om dataene" box with the level table, the never-list and the retention;
  - the empty state "Ingen bruksstatistikk (kan være slått av)", figures marked "veiledende", and a
    `loading.tsx` copied from `assistent/loading.tsx`.
- **Overview card** (`src/app/admin/logging/page.tsx:62-104`):
  - `getPpUsageOverview` joins the `Promise.all`;
  - figures for aktive kunder, sidevisninger, handlinger and aktive prosjektområder;
  - "Siste data <dag>", or "Ingen data ennå – kommer med Prosjektportalen 1.15";
  - "N ukoblede verter" in amber.
- **Customer card.** `getPpUsageForOrg(orgId, last 30 days)` runs best-effort next to the
  assistant promise. `CustomerLogging` gets a `pp` prop, and its Prosjektportalen row shows "N
  sidevisninger · M webdeler i bruk siste 30 dager · K av P prosjekter aktive i <måned>" and "Nivå Standard · v1.15.0 · sist mottatt
  <dato>", with "uke N" instead of a date for a hub at level 1. Without data it shows "Kommer med
  1.15 (kunden har v1.14.1)" when the newest pingback is older, otherwise "Ingen bruksstatistikk
  (kan være slått av)".
- **Sist i bruk.** `OrgSignals` gets `lastUsageAt`, and `getCustomers` (`dal.ts:4507`) and
  `getFollowupOverview` (`dal.ts:4224`) take it into `latestOf`. It comes from usage days only; a
  hub at level 1 adds nothing, since its heartbeat has no day. Its absence never sets `maybeDead`
  (P22).
- **Deletion.** `src/lib/actions/pp-usage.ts` `deletePpUsageForHost(host)`, behind
  `requireAdmin`:
  - deletes the host's rows in every `pp_usage_*` table and in `pp_catalog_event`;
  - logs `pp_usage_deleted` on the tenant with the row counts (best-effort `logPpEvent`);
  - revalidates the Logging and Kunder layouts.

  It leaves `pp_install` alone: the nightly sync would copy those rows back from the pingback
  table, which Assist can only read (P19). The button sits on the customer card and asks for
  confirmation.

**After the release** (slice 15):
- a customer view (`?kunde=`, `?vert=`): a weekly series, per-component tables, "Ikke i bruk i
  perioden" (using `since`), level 3 errors and load-time buckets, and the version and level
  history;
- a generic `TimeSeriesChart`;
- a CSV export at `src/app/admin/logging/prosjektportalen/eksport/route.ts`. It checks
  `role === 'admin'` (404 otherwise; the statistics export uses `isStaff`) and uses
  `csvResponse`;
- a health footer: last data, batches the last day, dropped entries, cron history.

**Nightly job** `src/app/api/cron/bruksstatistikk/route.ts`: a GET handler with the copied
`authorized()` CRON_SECRET check, `maxDuration = 60` and `?dryRun=1`. It is scheduled in
`vercel.json` as `'15 4 * * *'` (UTC). One `db.batch` in `src/lib/pp-usage-maintenance.ts`:
- upserts `pp_usage_sites_daily` for the last three Oslo days and `pp_usage_sites_monthly` for the
  current and the previous month, from the distinct hashes in `pp_usage_site_seen` (replace, not
  add);
- then deletes `pp_usage_site_seen` rows older than 90 days. Their months were counted while they
  were the current or the previous month;
- deletes `pp_usage_batch` rows older than 7 days.

Nothing else is deleted (D9). History goes in `app_setting` (`pp_usage_maintenance_synced`,
`pp_usage_maintenance_history`).

### Transparency and texts

**Texts to add or change.**

prosjektportalen365:
1. The resx key (above) and the Install.ps1 and PreInstallUpgrade output.
2. `readme/2-Installering.md:6`, which regenerates `README.md`, never edited by hand: two short
   paragraphs, one on the install message and `-SkipPingback`, and one on bruksstatistikk (on at
   Standard, how to lower it or turn it off, link).
3. `CHANGELOG.md`, under `## 1.15.0 - 19.11.2026`:
   - "Ny funksjonalitet": **Bruksstatistikk.**
   - "Feilrettinger": the catalog sent statistics when its row was disabled, missing or unreadable,
     and no longer sends error text, or anything from a customer's own catalog.
   - "Merk": the level is 2 after upgrade; existing catalog opt-outs, `telemetryUrl: ''`
     included, are carried over as 0; `CatalogTelemetryEnabled = 0` now turns all browser
     telemetry off; `-SkipPingback` still covers only the installation message.
4. `releasenotes/1.15.0.md`: a highlight in the list at the top, and `## Bruksstatistikk` before
   `## Andre forbedringer verdt å nevne` (`:123`). It covers what happens at upgrade, how to choose
   beforehand (`-UsageStatisticsLevel Off`), the level table, the never-list and the link.
5. The catalog README's Telemetry section (`templatePackageCatalog/README.md:77-100`), the JSDoc in
   `TelemetryService.ts` (`:7-13`, `:58-71`, `:122-128`) and in `featureFlags.ts` (`:44-49`).
6. `privacyUrl` in the six `package-solution.json` files.
7. `.development-guide/spfx/bruksstatistikk.md` (new, indexed in `.development-guide/README.md`).
   Pointers in the pp365-ui, pp365-templates, pp365-testing and pp365-release skills, and one
   AGENTS.md gotcha: "the usage contract has two copies, a fixture and a wiki page that change
   together; every sender goes through the one gate, never its own settings test".

Wiki:

8. New page **Bruksstatistikk** (canonical). It covers:
   - the purposes;
   - a level table listing every field, and the never-list;
   - the default, how to change the level, and how fast a change applies (within two hours);
   - that Aktivert = nei and a deleted row both mean off, and that `CatalogTelemetryEnabled = 0`
     stops everything;
   - GPC and DNT, and blocking `assist.prosjektportalen.no/api/telemetry/*` at the network;
   - the site hash: what it is, that it changes every month, and that it is deleted after 90 days
     while the counts stay;
   - that the installation message is a separate flow with its own switch, `-SkipPingback`;
   - region and retention for every flow (wording principle 6), and deletion on request, which
     covers bruksstatistikk and catalog events but not installation messages;
   - role and legal basis (after legal review);
   - how to see the requests in the browser's developer tools;
   - that PP Assistenten's telemetry and the GitHub fetches are separate.
9. "Grunnlag for DPIA og ROS":
   - the intro names four flows;
   - the Roller row adds "og hvilke deler av Prosjektportalen som brukes, og hvor mye" (legal to
     confirm);
   - a new row in "Hva som sendes ut av tenanten", and a "Lagres hvor lenge" column filled for
     every row in the words of wording principle 6: installasjonsmeldinger (ingen fastsatt
     sletting), malpakkekatalogen (ingen fastsatt sletting), bruksstatistikk (tallene uten
     tidsbegrensning, områdekodene i 90 dager) and PP
     Assistenten (90 dager i Application Insights, from its telemetry contract,
     `telemetri/README.md#L11-L12`);
   - deletion on request covers bruksstatistikk and catalog events, not installation messages;
   - the catalog row loses "avkortet feilmelding";
   - the install row keeps `-SkipPingback` as its switch and says that the level does not affect it
     (P9);
   - a risk row: in a very small tenant, counts can reflect one person's use, and within one month
     a small project's activity can be followed through its site hash.
10. "Fotavtrykk i Microsoft 365" (line 1 and a bullet), "Installasjon" (a row for the new
    parameter, and a sentence that `-SkipPingback` does not change it), "Sikkerhet i PP Assistenten" (one sentence),
    `_Sidebar` (a link under "Personvern og sikkerhet").

Manual:

11. `3.11-Malpakkekatalog.md:183-187`: drop "anonymisert", state the fields and the new rule, and
    link the wiki. A new admin page for the level, for example
    `Brukermanual/3 Portefolje/3.12-Bruksstatistikk.md`.

Assist:

12. `src/app/personvern/page.tsx`:
    - widen the opening sentence (`:33-37`), which limits the page to people who use the support
      portal, so it also covers the statistics from PP365;
    - rename its own bullet to "Sidestatistikk for Assist" (`:94-96`);
    - add a section "Bruksstatistikk fra Prosjektportalen 365";
    - limit "utelukkende for å levere support" (`:121`) to the support data;
    - update "ingen automatisk sletting" (`:158-159`) and `LAST_UPDATED` (`:15`).
13. `docs/logging.md`: replace decision 2 (`:20-23`), add "Prosjektportalen: datagrunnlag", and
    extend Personvern (`:89-97`), pointing to the wiki instead of the 404 page. Add internal rules:
    never try to tie counts to people; never use the figures in marketing aimed at users. The
    README's Logging section documents both ingest contracts, the cron and the switches;
    `.env.sample` gets the two variables.

Other:

14. prosjektportalen-web, `feat/personvern-pp-assistenten`: the DPA draft's "behandler ikke data
    der" (`#L60-L61`) and the landing page must not contradict this flow. Flag it to legal, and add
    a PP365 document when the branch merges. The private `pp365-install-pingback` README still
    shows the full command line being posted; fix it later, as it does not block the release.

**Wording principles.**
1. One canonical page. Other texts copy its level table and never-list word for word, and change
   in the same change as the contract.
2. Precise, not reassuring. Never "anonym" or "anonymisert": the data names the tenant and the hub
   by design. Say "Vi teller bruk, ikke personer" and "uten opplysninger om brukerne".
3. "På som standard (nivå 2, Standard), kan senkes eller slås av". Never "samtykke" or "opt-in".
4. The same purposes everywhere:
   - prioritere videreutvikling og feilretting;
   - se hvilke versjoner og kanaler som er i bruk;
   - support og feilsøking (nivå 3);
   - kundeoppfølging, to see which installations are in use.

   Plus: "Brukes ikke til markedsføring mot brukerne, selges ikke og deles ikke med andre."
5. Name the switch exactly: list, key, values, and when a change applies: "En endring gjelder
   innen to timer."
6. Region and retention, in the same words everywhere, for every flow: "Bruksstatistikk og
   hendelser fra malpakkekatalogen behandles i EU (Stockholm) og lagres i EU (Frankfurt) hos
   Puzzlepart. Tallene lagres uten tidsbegrensning. Kodene som brukes til å telle ulike områder,
   slettes etter 90 dager, og da er bare antallet igjen. Opplysningene på nivå 1 lagres bare som
   siste verdi med uken de kom, og som siste verdi per måned. Hendelser fra malpakkekatalogen
   lagres uten tidsbegrensning.
   Installasjonsmeldinger lagres i Prosjektportalen-teamets Azure-abonnement [region bekreftes] og
   hos Puzzlepart i EU (Frankfurt), uten fastsatt sletting. Sletting på forespørsel gjelder
   bruksstatistikk og hendelser fra malpakkekatalogen, ikke installasjonsmeldinger."
7. Promise only what the code does: "IP-adressen lagres ikke av oss; driftsleverandøren logger
   forespørsler en kort periode".
8. Klarspråk bokmål first, with the English mirroring it. Legal sentences are published only after
   sign-off.

**Canonical paragraph (draft).** "Prosjektportalen sender bruksstatistikk til
Prosjektportalen-teamet i Puzzlepart, slik at vi ser hvilke versjoner som er i bruk, hvilke deler
av løsningen som brukes, og hvor mye. Vi teller bruk, ikke personer: ingenting om brukerne,
innholdet eller adressene til prosjektområdene sendes, og ingenting lagres i nettleseren.
Bruksstatistikk er på som standard (nivå 2) og kan senkes eller slås av i listen Globale
innstillinger på porteføljeområdet (UsageStatisticsLevel: 0 = av, 1 = grunnleggende, 2 = standard,
3 = utvidet). En endring gjelder innen to timer."

Level lines:
- "Nivå 1: versjon, kanal, språk og antall prosjekter, programmer og overordnede prosjekter. Det
  sendes når en eier åpner porteføljeområdet, og vi tar bare vare på siste verdi med uken den kom,
  og siste verdi hver måned."
- "Nivå 2: i tillegg hvilke webdeler, utvidelser og funksjoner som brukes, og hvor mange ulike
  områder som er i bruk, som antall per dag. Områdene telles med en kode som regnes ut av områdets
  ID og byttes hver måned. Navn og adresser sendes ikke."
- "Nivå 3: i tillegg feilkoder og lastetider, for feilsøking."

**Legal checks**, all needed before the release is published. Owner: Puzzlepart's legal adviser
with the personvernombud, named by the user.
- **L1. Ekomloven's storage rule.** § 3-15 in the 2024 act, in force from 1 January 2025; legal to
  confirm the citation. Questions:
  - Does sending in-memory counts of our own UI events fall outside the rule, given the broad
    reading of "gaining access" in EDPB Guidelines 2/2023?
  - Are level 3 load times device information?
  - Can the customer decide for its users?
- **L2. GDPR.**
  - Is any of it personal data (IP addresses in transit; very small tenants)?
  - Puzzlepart as controller.
  - Art. 6(1)(f), with a written balancing test.
  - Art. 13/14 information, including whether an in-product link is required.
  - The right to object (GPC, DNT, the setting).
  - Whether the monthly site hash is personal data in very small projects (D6).
- **L3. Sub-processors.** Owner: the Assist owner. Vercel's edge and function logs (IP and user
  agent; their retention, region and DPA), and Neon's restore window, in which deleted rows still
  exist.
- **L4. Retention.** **L5. Purposes, including customer follow-up.** Owner of both: the user.
- **L6. Notice to customers.** Public-sector agreements, customers' own DPIA/ROS, the release notes,
  and the DPA draft's contradiction. Owner: the user with account management.

## Slices and order

1. **Contract and fixture.**
   - Repo: prosjektportalen365.
   - Depends on: nothing. The user confirmed P1 to P25 on 2026-11-12.
   - Files: `SharePointFramework/shared-library/src/telemetry/contract.ts`,
     `__fixtures__/usage-batch-v1.json`, `contract.test.ts`. The test reads `channels/main.json`
     with `fs` and checks every alias.
   - Done when: the contract matches this plan's tables, every event has `since` `'1.15.0'`, and
     the test is green. The user commits.
   - Effort: S (½ day).
2. **Assist ingest, live and empty.**
   - Repo: prosjektportalen-assist.
   - Depends on: 1.
   - Files: `src/lib/pp-usage-contract.ts`, `scripts/sync-pp-usage-contract.mjs`,
     `src/lib/telemetry-http.ts`, `src/lib/pp-usage-telemetry.ts`, `src/lib/pp-usage-store.ts`,
     `src/lib/public-catalog.ts`, `src/app/api/telemetry/usage/route.ts`,
     `src/app/api/telemetry/catalog/route.ts` (imports the helpers), `src/lib/catalog-telemetry.ts`,
     `src/db/schema.ts`, `src/lib/pp-install.ts`, `drizzle/0041_pp_usage_telemetry.sql` with its
     meta (generated by the user, plus the hand-appended `UPDATE` that clears `error_message` and
     `client_ts`), `src/lib/__fixtures__/pp-usage-batch-v1.json`, the tests, `package.json`,
     `.github/workflows/ci.yml`, `.env.sample`, `README.md`.
   - Done when: CI is green (tsc, lint, drizzle check, drift, `npm test`); the preview curl matrix
     passes, the two-row batch, its replay, the heartbeat-only batch and a batch with `sites`
     included; the code is
     merged to main; the prod migration ran; an invalid payload gets 400; the tables are empty.
   - Effort: M (2 days).
3. **Setting, install and upgrade.**
   - Repo: prosjektportalen365 (Templates, Install).
   - Depends on: P7 to P10.
   - Files: `Templates/Portfolio/Objects/Lists/Globale innstillinger.xml`, both
     `Templates/Portfolio/Resources.*.resx`, `Install/Scripts/SharedFunctions.ps1`,
     `Install/Scripts/PreInstallUpgrade.ps1`, `Install/Install.ps1`,
     `.tasks/usage-statistics-level.test.js`, `.tasks/fixtures/usage-statistics-level.json`,
     `integration/tests/template.test.ts`, `CHANGELOG.md`, `.claude/skills/pp365-templates/SKILL.md`.
     The generated id goes into the slice log.
   - Done when: the user's `validate-loc` shows no gap; resx line parity holds; `Get-Help` lists the
     parameter; the user's `npm run test:tasks` passes; the upgrade rows of slice 13 pass.
   - Effort: M (1½–2 days).
4. **Telemetry core.**
   - Repo: prosjektportalen365 (shared-library, Jest config).
   - Depends on: 1.
   - Files: `src/telemetry/*`, `src/index.ts`,
     `SharePointFramework/.jest-config/lib/setup.js` (the `DEBUG` default). PortalDataService is
     not touched: the gate reads through the existing `getGlobalSettings()` (P4), and
     `getUsageSnapshot()` comes with the Footer in slice 7.
   - Done when: the user's `npm test` in shared-library is green, `test:runtime` included; every
     gate rule and anchor case has a test; the privacy spies record zero calls; the payload equals
     the fixture; a queued heartbeat is accepted and sent; the setup helpers, the site type
     resolvers and the site hash are tested; coverage is at least 79.13 / 83.23 / 62.73 / 79.13.
   - Effort: M (2½ days).
5. **Catalog under the gate.**
   - Repo: prosjektportalen365 (PortfolioExtensions).
   - Depends on: 4, and 2 in prod.
   - Files: `src/services/TelemetryService.ts`, `TelemetryService.test.ts` (new),
     `src/services/featureFlags.ts`, `src/extensions/templatePackageCatalog/README.md`.
   - Done when the tests show:
     - no event for a missing, disabled or non-`1` catalog row, and none at level 1;
     - that `'0'` stops everything;
     - no event for a non-default catalog URL;
     - `errorCode` only at level 3, and never `errorMessage` or `clientTs`.

     PortfolioExtensions coverage is re-measured and meets its floors.
   - Effort: S (1 day).
6. **Emitters: ProjectWebParts.**
   - Repo: prosjektportalen365 (ProjectWebParts; shared-library for `TelemetryContext` and the
     timeline hook).
   - Depends on: 4.
   - Files: `baseProjectWebPart/index.tsx` (`startTelemetry`, the portal, the site type resolver,
     `loaded`, the `init` timing, the ErrorBoundary's `onError`, the `TelemetryContext`
     provider), `baseUncertaintyMatrixWebPart/index.ts`, and every ProjectWebParts call site in
     the hook points table: the status report, phase, property, news and matrix handlers, the
     DynamicList `useExcelExport` hook and the shared timeline hook, each with its test.
   - Done when: `npm test` in ProjectWebParts is green at its floors; every event the contract
     lists for a ProjectWebParts component has a test; every load and save failure a
     ProjectWebParts component handles itself is counted by its code, with a test; a local watch
     (DEBUG) logs the batches it would send and makes no request.
   - Effort: M (2 days).
7. **Emitters: the other four solutions.**
   - Repo: prosjektportalen365 (PortfolioExtensions, PortfolioWebParts, ProgramWebParts,
     ProjectExtensions; shared-library for `getUsageSnapshot()`).
   - Depends on: 6.
   - Files: `footer/index.ts`, `footer.test.ts`, the portfolio and program base classes, the four
     error branches, `projectSetup/index.ts`, `projectSetup.test.ts`, the remaining call sites in
     the hook points table (the two PortfolioWebParts `useExcelExport` hooks among them), the
     providers, and
     `src/services/PortalDataService/{PortalDataService.ts,types.ts,PortalDataService.test.ts}`
     (`getUsageSnapshot()`, and `getSiteKind()` for a bundle that holds no site flags of its own).
   - Done when: `npm test` is green at every floor; every event in the contract has a test and is
     emitted with `since` `'1.15.0'`; the load and save failures the components handle themselves
     are counted by their code, with tests; an abort records `setup.aborted` and nothing else; a page
     view on a project list page gets a site type; the ProgramWebParts bundle is confirmed to hold
     one copy of shared-library (otherwise an explicit alias prop replaces the context); a local
     watch (DEBUG) logs the batches it would send and makes no request.
   - Effort: L (4–5 days).
8. **e2e guard and usage spec.**
   - Repo: prosjektportalen365 (e2e).
   - Depends on: 7, for the Footer's page view and heartbeat. The guard can land with 4.
   - Files:
     - `e2e/tests/fixtures/pp365.ts`: `addInitScript` sets `PP_DISABLE_TELEMETRY`, and a context
       route fulfils `assist.prosjektportalen.no/api/telemetry/**` with 204;
     - `auth.setup.ts`, `deployment.setup.ts`;
     - `fixtures/rest.ts`, which receives `hubSetting`, now matching keys client-side;
     - `smoke/usage-statistics.spec.ts` (new): `page.route` captures and fulfils 204; asserts the
       allowlisted keys, host, hubUrl, the hub's level, channel, `text/plain`, no Cookie, no
       Referer, `sites` hashes of 16 hex characters none of which is the site id, and no
       never-list strings (the e2e username, `@`, the page title, URLs other than
       the hub's); at level 0, no request; on `E2E_PROJECT_URL`, project loads. It also loads the
       same hub page twice, each in a fresh browser context, once with telemetry on and once with
       `PP_DISABLE_TELEMETRY` set, flushes both, and fails if localStorage or sessionStorage holds
       a key after the first run that the second lacks (the flag key aside);
     - `e2e/README.md`, the pp365-testing skill.
   - Done when: green on the test channel, and no other spec's request reaches Assist.
   - Effort: S (1 day).
9. **Assist dashboard minimum and deletion.**
   - Repo: prosjektportalen-assist.
   - Depends on: 2.
   - Files: `src/lib/pp-usage-dal.ts`, `src/lib/pp-usage-aggregate.ts` (with a test),
     `src/lib/date.ts`, the page, `loading.tsx`, the overview card, `CustomerLogging.tsx`, the
     customer card page, `src/lib/dal.ts` (OrgSignals), `src/lib/assistant-telemetry-sync.ts`,
     `src/lib/actions/pp-usage.ts`, `docs/pp-kundekort.md`.
   - Done when, on a preview seeded with fixture POSTs:
     - the figures are right;
     - active sites per day and month show after the nightly job runs on seeded hashes;
     - a hub at level 1 shows a week and no day;
     - a support user gets 404;
     - a deletion leaves a `pp_activity` row and no data;
     - an empty hub reads "Ingen bruksstatistikk (kan være slått av)".
   - Effort: L (3–4 days).
10. **Assist nightly job and Assist texts.**
    - Repo: prosjektportalen-assist.
    - Depends on: 2.
    - Files: the cron route, `src/lib/pp-usage-maintenance.ts`, `vercel.json`, `docs/logging.md`,
      `src/app/personvern/page.tsx`, `README.md`.
    - Done when: `?dryRun=1` and a real run on a preview with seeded rows count active sites per day
      and per month, delete site hashes older than 90 days and batch ids older than 7 days, and
      delete nothing else (D9); the personvern page describes the flow.
    - Effort: S (1 day).
11. **Developer guidance.**
    - Repo: prosjektportalen365.
    - Depends on: 4.
    - Files: `.development-guide/spfx/bruksstatistikk.md`, `.development-guide/README.md`, four
      skills, `AGENTS.md`.
    - Done when: the user's `npm run check-skills` passes.
    - Effort: S (½ day).
12. **Customer-facing texts.**
    - Repos: the wiki, prosjektportalen-manual, prosjektportalen365 (readme, CHANGELOG, release
      notes, privacyUrl).
    - Depends on: the legal answers; the final output of 3 and the final event list of 6 and 7.
      Drafting starts at once.
    - Done when: the wiki page is live before the release is published; every text lists the
      contract's fields; the legal sentences are approved; "anonymisert" appears nowhere.
    - Effort: M (2 days).
13. **Test-channel verification (D5).**
    - Repos: both.
    - Depends on: 2 in prod, 3, 5, 6, 7 and 8. The user dispatches `ci-channel-test.yml` on the
      work branch, with a head commit that does not ask for `[apps-only]`, and verifies right
      after the run, since the test hub is shared.
    - The matrix. A changed row reaches a browser only when its cached settings expire (P4), so
      every case that changes a row is checked in a new private window, or after an hour:
      - the row is created as `3`;
      - levels 1 (owner heartbeat only; Assist shows a week and writes no daily row), 2 and 3,
        each in the network tab and in Assist with `?internal=vis&test=vis`;
      - level 0 sends nothing, catalog included;
      - a level-0 hub with a multi-portfolio PortfolioOverview, one of whose portfolios is a hub at
        level 2, sends nothing;
      - lowering the level: a new private window follows it at once, and a tab left open follows
        it when its decision is re-read (`GATE_MAX_AGE_MS`);
      - Aktivert = nei, a deleted row and `Standard` each give nothing;
      - catalog `'0'` with level 2 gives nothing; a disabled catalog row gives usage but no catalog
        events;
      - a guest without hub access, GPC and the tester flag each give nothing;
      - carry-over: delete the level row, set the catalog row to `0`, dispatch, and the row returns
        as `0`;
      - carry-over: delete the level row, set `telemetryUrl: ""` on the catalog custom action,
        dispatch, and the row returns as `0`;
      - the user's manual runs: `-UsageStatisticsLevel Extended`; `-SkipPingback` on a scratch fresh
        install, which ends at level 2 with no pingback sent (D7); and an idempotent rerun;
      - a scratch fresh install with `-UsageStatisticsLevel Off`: the row is `0` right after the
        Portfolio template step and at the end of the run;
      - a project page's batch carries one `sites` entry whose hash is not the site id, and Assist
        counts the site as active after the nightly job;
      - catalog rows with `level` and without `error_message`;
      - hub, project, program and list pages reach Assist (CSP and CORS), and a project list page,
        where no web part runs, still sends its page view with a site type;
      - the Vercel log settings (L3);
      - Skip leaves an existing row alone;
      - the level is restored to `3`.
    - Done when: the signed checklist is in the slice log.
    - Effort: M (1½ days, plus about 45 minutes per CI run).
14. **Release gate and first week.**
    - Repos: both.
    - Depends on: 13, 12 and legal sign-off.
    - Steps:
      - a PR from the work branch into `main`, which holds 1.15.0 (milestone 1.15.0), squash-merged
        by the user without `[apps-only]`;
      - `[fresh-install]` once;
      - after the release, a daily check in Assist for a week (rows per host, 4xx share, unknown
        hosts, dropped entries), with the kill switches ready. 1.15.1 is the hotfix path.
    - Effort: S.
15. **After the release.** The rest of the Assist dashboard (customer view, CSV, unused features,
    health; depends on 9; M, 2 days). No emitter is left for after the release (P25).

What runs in parallel:
- After 1, slices 2, 3 and 4 run in parallel; 3 needs only the decisions.
- 9 and 10 follow 2, alongside the PP365 work. 5 and 6 follow 4; 7 follows 6; 8 follows 7; 11
  follows 4.
- The critical path is 1 → 4 → 6 → 7 → 8 → 13 → 14: about 12 working days plus serialized CI runs
  on the shared test hub.
- 9 is off that path (P25), but its deletion action must exist before the texts promise deletion
  on request.

## Rules for the executing agent

- Read `AGENTS.md`, the pp365-templates, pp365-testing, pp365-ui, pp365-release and pp365-toolchain
  skills, and this plan, before the first edit. In Assist, read `docs/logging.md`, and follow its
  Norwegian comments and UI text.
- Never run git. The user creates the branches (in prosjektportalen365 the worktree branch
  `worktree-logging`, cut from `main`; in Assist `feat/logging`), commits, pushes and dispatches CI.
  End every batch of edits with a ready-to-use semantic commit message in the chat, with the CI
  tags the pp365-release skill prescribes. Changes under `Templates/` never carry `[apps-only]`,
  and a commit that needs the floors checked carries `[build-debug]`.
- In the worktree the agent installs, builds and runs the tests itself (the user's choice on
  2026-11-12), with Node 26 first on the PATH
  (`PATH="$HOME/.nvm/versions/node/v26.13.0/bin:$PATH"`; the worktree guard refuses `source` and
  nvm). In the main checkout and in Assist the user runs them: hand over the exact commands, for
  example `cd SharePointFramework/shared-library && npm test`, `npm run test:tasks`, or
  `cd Templates && npm run build && npm run validate-loc`.
- Never send or store anything on the never-list. The site id never leaves the tenant; only its
  monthly hash does, computed in memory (P12). A new field or event changes `contract.ts`, its
  Assist copy, both fixtures and the wiki page in the same change, and Assist deploys first.
- No browser storage for telemetry state. The module writes no cookie, localStorage,
  sessionStorage, IndexedDB or Cache API entry, and reads only the `PP_DISABLE_TELEMETRY` flag.
  The settings come through the app's own `getGlobalSettings()`, whose 60-minute localStorage
  cache the app keeps with or without telemetry; the module adds no key of its own. A new
  PortalDataService method for telemetry never uses `.using(...)` caching. `privacy.test.ts` and
  the e2e storage comparison (slice 8) guard this.
- One gate for every sender: `resolveTelemetryGate`, fed by the anchor's `getGlobalSettings()` map
  (P4). No sender reads a setting itself or uses a `!== '0'` test, and no settings read is added
  beside `getGlobalSettings()`. Only the anchor portal is read for telemetry, and a flush never
  waits on the network (P2).
- Unit tests must not import `@pnp/*`; use structural stand-ins. The telemetry module has no
  runtime import from `@pnp/*` or `@microsoft/sp-*`.
- Loc triad: a new UI string goes into the solution's `.d.ts`, `nb-no.js` and `en-us.js`. Then run
  `validate-loc` and read its report. Never leave `,,`.
- Resx: a new key goes into both `Resources.no-NB.resx` and `Resources.en-US.resx`, on the same
  line, as a non-empty single line. Revert the `-validation.md` files whose only change is the
  timestamp.
- Assist: test on a preview deploy with its own Neon branch. Never run `db:migrate`, `db:push` or
  the app against `.env.local`, which is prod. `db:generate` needs no database. Prod smoke tests
  send invalid payloads only.
- Paths are case sensitive on CI. Spell them as the filesystem does (`Install/Install.ps1`,
  `Install/Scripts/PreInstallUpgrade.ps1`, `Templates/Portfolio/Objects/Lists/Globale innstillinger.xml`
  with its space), and check with `ls`.
- Coverage: read `jest-output/coverage/coverage-summary.json` in every touched solution. Never
  lower a floor; raise one that has grown.
- Install and upgrade steps are idempotent. The step before the template (in PreInstallUpgrade, or
  in Install.ps1 without `-Upgrade`) lets errors propagate. Only an explicit
  `-UsageStatisticsLevel` changes an existing level row, and no script writes a starting value:
  the template seeds `3` (P10). Never compare SharePoint's times with the installer's clock.
- Use no real customer names in fixtures or examples (`contoso`).
- End each slice with its log entry below: what was done, what was found, what was left.

## Risks

| Risk | Mitigation | Owner |
|---|---|---|
| Legal reads the ekom storage rule broadly (EDPB 2/2023), and browser telemetry needs each user's consent | Brief legal on day one with this contract (L1). The design holds the strongest position: no storage, no device data, no identifiers. The ingest kill switch stops storage at once. A fallback (owners-only heartbeat) is ready | User, Legal |
| Legal answers arrive too late for November | Start L1–L6 now and keep legal sentences bracketed in drafts. Sign-off is a release gate (slice 14) | User |
| A later change brings back fail-open behaviour | One gate for every sender, the full truth table in tests, the rule in the guide, a skill and AGENTS.md | Agent |
| Another site's portal decides the gate or `hubUrl` (a PortfolioOverview configured with another portfolio's URL) | The anchor rule (P4): only a portal of the page's own hub, and an anchor that is not available gives 0; BasePortfolioWebPart attaches none with a portfolio; gate and transport tests; a slice 13 case | Agent |
| Counts are lost at unload, or a tab left open all day stops reporting | Flushes build from memory with no network wait; the gate and site types are read in the background; a 60-second interval instead of a fixed send count; transport tests | Agent |
| A field is added without the texts changing | Two allowlists, the fixture, Assist's 400 on unknown field names, the e2e payload spec, the skill checklist | Agent |
| A project URL or cookie reaches Vercel | `no-referrer` and `credentials: 'omit'` on every fetch, never `sendBeacon`; the e2e spec asserts no Referer or Cookie | Agent |
| Vercel processes and logs end users' IP addresses and user agents | The route never reads them and nothing is keyed on IP. Check log drains and log retention (L3); disclose precisely | Assist owner |
| Daily counts in a tiny tenant reflect one person, or a small project's site hash shows its activity within a month | Day granularity, no user ids, a site hash that changes every month and is deleted after 90 days, the dashboard showing counts only, no user language, heartbeats stored by ISO week and never by day, admin-only access, a DPIA risk row, it can be turned off | User, Legal |
| Owner-only heartbeats show when named hub owners work | Assist keeps heartbeats as current state with the ISO week, plus the last one of each month; a level-1 batch writes no daily row; the texts say so | Assist owner |
| Catalog events carry names from a customer's own catalog, or error text from 1.14 hubs | Catalog events only for the default catalog URL; Assist keeps only package ids from the public `catalog.json` and stores no error text or client time from any client | Agent, Assist owner |
| A failed upgrade or install check lets the seeded `3` override an opt-out | The step before the template lets errors propagate, so Install.ps1 exits 1 before the template can seed the row; the catalog `'0'` runtime stop; the resolver's scenario table in `npm run test:tasks` | Agent |
| A new hub installed with an explicit level runs at Extended until that level is written | Accepted (P10). Install.ps1 writes the explicit level right after the Portfolio template, so the window is short; a browser that read the settings in it follows within two hours; a slice 13 case | User |
| A lowered or disabled level keeps sending until the cached settings expire | Accepted (P4). The app's 60-minute settings cache and `GATE_MAX_AGE_MS` bound the delay at two hours; every text says a change applies within two hours; Puzzlepart can block a host at ingest (P20) | User |
| Counters on a site where no bundle registered a site type resolver never get a type, and are never sent | Every bundle that counts on a site other than the hub registers a resolver: ProjectWebParts from the site's own flags (slice 6), the others in slice 7, with `getSiteKind()` where a bundle holds none; `siteType.test.ts`; the slice 13 case on a project list page | Agent |
| Existing customers are switched on without noticing | A release-notes highlight, a CHANGELOG "Merk" line, the banner and the summary, the wiki live before release, opt-outs carried over | User |
| Tenant-wide 1.15 apps on un-upgraded hubs send nothing and pause catalog events | Accepted (P3). The release notes say to upgrade every hub; the dashboard says "ingen data" | User |
| Forged traffic inflates a tenant's numbers | Origin and host checks, per-batch bounds, the per-host daily cap, figures marked "veiledende", nothing automated on them, the firewall rule | Assist owner |
| Test or CI traffic pollutes customer figures | Classification with the channel (P18), the e2e flag and route fulfilment, DEBUG never sends | Agent |
| The template change in a frozen release breaks the upgrade or localization | One appended row and one key, `validate-loc`, line parity, a full test-channel run, the integration row test, `[fresh-install]` once | User |
| PnP Skip semantics are unverified | Slice 13 checks both that a missing row is added and that an existing row is left alone | User, Agent |
| SharePoint's CSP `connect-src` or CORS blocks some pages | `text/plain` keeps the request simple; the catalog already posts from hubs; slice 13 checks every page type | Agent |
| 26 bundle copies double-count, or two footers on one site do | One window global, listeners installed once, page views deduplicated on `lastPageViewKey`, tests that simulate two bundles | Agent |
| Coverage floors are missed; PortfolioExtensions' local summary is below its floor | Re-measure it first; logic stays in shared-library with tests, and touchpoints are straight-line calls; ProjectSetup's mapping lives in pure shared-library helpers, since ProjectExtensions has about six uncovered branches to spare; `[build-debug]` before the PR | Agent |
| The Footer's tests break once it passes `DEBUG` | The shared Jest setup defines a `DEBUG` default in slice 4 | Agent |
| ProgramWebParts bundles two copies of shared-library, so the context does not reach shared components | Check the bundle in slice 7; fall back to an explicit alias prop | Agent |
| Neon migration mistakes, or someone migrates prod from `.env.local` | Additive tables, the preview branch first, CI's drift guard; never migrate locally | Assist owner |
| The schedule: everything ships before the merge (P25), the user runs every build and local builds are slow | Slices 2–4 in parallel; ProjectWebParts first, so the pattern is settled on one solution before the other four; CI's `[build-debug]` instead of local full builds; the dashboard off the critical path | User |
| An admin raises the level while the catalog row is `'0'` and expects data | The summary line and the wiki state the stop explicitly | User |
| Customers expect deletion on request to cover installation messages | The texts say it covers bruksstatistikk and catalog events only; the pingback table is outside Assist's reach (a non-goal) | User |
| Deleted data survives in Neon's restore history and Vercel's logs | Confirm both windows (L3) and state them next to deletion on request | Assist owner, Legal |
| Retention without a time limit (D9) is questioned by legal or a customer | Deletion on request ships in 1.15.0; every text states the rule plainly; legal reviews it (L4) | User |
| `crypto.subtle` is missing, or a page closes before the hash is ready | The hash is computed in the background when a site is first seen; without it no `sites` entry is sent and active sites undercount slightly; `siteHash.test.ts` covers it | Agent |

## Definition of done

- Slices 1 to 14 are merged and green. Every event in the contract is emitted by its components
  in all five consumer solutions, with `since` `'1.15.0'`, and has a test (P25).
- The signed slice 13 checklist shows every gate rule and upgrade path behaving as this plan says
  on the test channel, with matching rows in production Assist.
- In production Assist, the ingest, the nightly job, the deletion action and the dashboard minimum
  are live.
- Install.ps1 prints the level and the pingback outcome on every run, and `npm run test:tasks`
  runs the resolver's scenario table.
- The Bruksstatistikk wiki page is live before the release is published, legal has signed off, and
  every text lists the same fields as `contract.ts`. No text says "anonym".
- The coverage floors are met, the guide and skills describe what the code does, and each slice has
  its log entry.

## Slice log

### Decisions round (2026-11-12)

- Done: the user went through P1 to P25 one by one. All stand as written except P4, P10 and P25,
  and this plan was brought in line with the outcome the same day.
- P4: the gate reads the level through the anchor's existing, cached `getGlobalSettings()`
  (60 minutes). There is no new settings read and no new PortalDataService method for it. A
  decision is kept for at most 60 minutes, and customers are told a change applies within an
  hour. A disabled row and a missing row both mean 0, and duplicate rows resolve as
  `getGlobalSettings()` resolves them.
- P10: the template seeds the row as `2`. Install.ps1 writes it only when `-UsageStatisticsLevel`
  is given, right after the Portfolio template; the short window at Standard before an explicit
  level lands on a new hub is accepted. PreInstallUpgrade still adds a missing row before the
  template, as `0` on an opt-out (P7). The starting value written at the end of a run and the
  rerun case are gone.
- P25: everything ships before the merge. Every event in the contract is instrumented in all five
  solutions, with `since` `'1.15.0'`, starting with the core and ProjectWebParts. The emitter
  tiers are gone, and slices 6 and 7 are now ProjectWebParts and the other four solutions.
- Also: site types come from resolvers each bundle registers (`registerSiteTypeResolver`), not
  from a fixed `PortalDataService.getSiteKind()` call. D5 stands: 1.15.0 is merged to `main`, and
  the work runs in the worktree `.claude/worktrees/logging` (branch `worktree-logging`).
- Found, for the user to settle:
  - a tab left open can follow a changed level up to two hours after the change, against the
    promised hour (P4, Cost). Settled the same day: the texts promise two hours (below);
  - a failed explicit write on a new hub leaves the row at `2`, and a hub that has the catalog's
    `telemetryUrl` opt-out but no Globale innstillinger list gets `2` (Settings, install and
    upgrade);
  - the critical path is now about 12 working days, and the changelog dates 1.15.0 at 19.11.2026.

_Each slice adds its entry below._

### Decisions after the first review (2026-11-12)

- The texts promise that a change applies within two hours, not one. The code is unchanged: the
  app's 60-minute settings cache and the 60-minute decision age together bound the delay (P4).
- Level 3 also counts the load and save failures a component handles itself and shows in a
  message, under the error's own code and HTTP status. The contract is unchanged: it already
  lists the codes. The hook points table and slices 6 and 7 carry the new sites.

### Slice 4: telemetry core (2026-11-12)

- Done: `shared-library/src/telemetry/`, exported from `src/index.ts` through a curated,
  re-export-only barrel. The limits, the store and the batch builder stay out of the package root.
  - `contract.ts` (data only), `validate.ts`, `gate.ts`, `store.ts`, `track.ts`, `flush.ts`,
    `batch.ts`, `siteInfo.ts`, `siteHash.ts`, `errorCode.ts`, `setup.ts` and
    `TelemetryContext.tsx`.
  - The fixture `__fixtures__/usage-batch-v1.json` and the Jest helpers
    `__fixtures__/testFixtures.ts`; `.npmignore` keeps `__fixtures__/` out of the package.
  - `test/runtime/telemetry.runtime.test.mjs`: every call is a no-op without a window.
- Verified: `npm test` in shared-library gives 847 Jest tests in 99 files and 9 runtime tests,
  with 0 failures (after slice 6's changes to the library). Coverage is 81.44 / 86.13 / 69.27 / 81.44,
  and every telemetry file has 100 % lines. The contract's 28 components equal the manifests' aliases; `ProjectUpgrade` is left out
  on purpose.
- Found, and built differently from the design text above:
  - The core enforces the heartbeat's rules itself (a hub page, `canManageHub`, once per page
    load) and fills `catalog` from the gate. The Footer queues the heartbeat and calls
    `flushTelemetry({ urgent: true })`.
  - `getTelemetryGate()` gives a sender the level and the catalog flag synchronously (for
    slice 5).
  - The tester flag, Global Privacy Control and Do Not Track are read again before every send and
    every gate lookup. A signal set after the decision closes it and drops what was counted;
    taking the signal away reopens the gate only at the next settings read.
  - Every tracking call renews a decision older than 60 minutes, also a call the old level
    drops, and without a check that the tab is visible. A flush never reads.
  - `trackUsage` ties the component to the event at compile time
    (`TelemetryEventComponent<E>`); `useTelemetry()` checks at runtime.
  - A DEBUG build is sticky per window: once one bundle on the page is a DEBUG build, nothing
    is sent from that window.
  - On a navigation to another hub, what was counted goes out under the old hub's decision
    before the anchor and the decision are dropped.
  - `host` must match `*.sharepoint.com`, so a sovereign cloud (`sharepoint.us`,
    `sharepoint.de`, `sharepoint.cn`) never sends. Assist's ingest allows the same hosts only.
- Left:
  - `getTelemetryGate()` does not renew a stale decision itself. Slice 5 lets the catalog's
    sender renew it.
  - The `DEBUG` default in `.jest-config/lib/setup.js` was not needed and is not added.
  - The floors (78 / 82 / 61 / 78) are unchanged. Raise them from CI's figures before the merge:
    the first push with `[build-debug]` on a `feat/**` branch prints them.
  - Assist takes its copy of `contract.ts` as TypeScript, `TelemetryEventComponent` included,
    and copies the fixture as formatted here.
  - A level 3 flush that splits into more than four 15 KB batches can pass the browser's 64 KB
    limit for keepalive requests in flight, and the later batches are then lost. It takes
    hundreds of distinct entries, and no cap guards it.

### Slice 6: emitters in ProjectWebParts (2026-11-12)

- Done:
  - `BaseProjectWebPart.onInit` starts telemetry once the adapter is configured, unless the web
    part was disposed in the meantime: the page, the adapter's portal with its global settings,
    the site type resolver, `loaded` and the `init` timing. `renderComponent` wraps the element
    in `TelemetryProvider`, and the ErrorBoundary's `onError` counts `render_failed`.
  - `SPDataAdapter.getSiteType()` is memoized and `isParentProject()` derives from it, so a
    bundle still reads the two flags once. The mapping is in `SPDataAdapter/siteType.ts`.
  - Each event is counted once, on success: `statusReport.created`, `statusReport.edited`,
    `statusReport.published`, `statusReport.deleted`, `phase.changed` (with an urgent flush
    right before the reload or navigation), `properties.edited`, `news.created`,
    `excel.exported`, `postAction.toggled` (both matrices) and `timelineItem.opened` (the
    shared `useTimeline`).
  - `useChangePhase` no longer calls `sessionStorage.clear()`. Its `clearSessionCache()`
    removes every key except the tester flag `PP_DISABLE_TELEMETRY`.
  - The failures the components handle themselves are counted once, in the hook that catches
    them, by the error's own code (the decision above):
    - the load of every web part: status, information, phases, news, dynamic list, timeline,
      and the matrices' items and configuration;
    - the status report's save, publish, delete and section list read; the properties' save
      and hub sync; the phase change with its hub sync and archive log; the news creation;
    - the dynamic list's delete, new document, save, upload, Excel export and custom actions.
      A custom action's hook that answers with an error status now has the status on its
      error.
  - `errorWithCause` (`shared-library/src/util`) keeps the caught error as the `cause` of the
    generic, localized error a fetch function rethrows. `errorCodeFrom` and
    `errorHttpStatusFrom` follow `cause` up to three deep, and still never read a message.
- Verified: `npx heft test` in ProjectWebParts gives 459 tests in 73 files with 0 failures.
  Coverage is 70.54 / 75.19 / 68.79 / 70.54.
- Found:
  - ProjectWebParts imports telemetry by path (`pp365-shared-library/lib/telemetry`). Its tests
    take `startTestTelemetry`, `clearTestTelemetry` and `countedTelemetry` from
    `pp365-shared-library/lib/telemetry/__fixtures__/testFixtures`. They read the window's real
    store, so a test also proves that the contract accepts the alias and event pair. A test
    fixture's context needs `manifest: { alias, version }`.
  - The matrix web parts count a failed item fetch where it fails (`_loadItems`), by the error's
    own code, not in `renderMatrix`, which runs on every render.
  - `useRiskMatrix` and `useOpportunityMatrix` return `onTogglePostAction` in place of
    `setShowPostAction`. The post-action switch inside the status report is not counted: the
    contract lists the event for the two matrix web parts only.
  - Errors a component shows itself in a `UserMessage` (the status page, the dynamic list, the
    timeline, the matrix configuration) were not counted: the hook points table listed only
    `render_failed`. The user decided the same day that they are (above).
- Left:
  - The manual check: a local DEBUG watch logs the batches it would send and makes no request.
    It needs a browser and a tenant.
  - The floors (60 / 72 / 58 / 60) are unchanged, as in slice 4.
  - No workflow runs on a branch named `worktree-logging`. `ci-build-debug.yml` runs on
    `feat/**`, so the branch needs such a name before its first push.
  - A hub out of reach counts as `unknown`. ProjectStatus and ProjectTimeline throw a plain
    error when `portalDataService.isAvailable` is false, because PortalDataService has
    swallowed the 401 or 403. Slice 7 lets PortalDataService keep the status that made it
    unavailable, so these count as `permission_denied`.
  - Not counted: `CreateParentDialog` and `RunProjectSetupDialog`, whose calls sit in the
    component and not in a hook, and the `configure()` calls that reject outside a `try`
    (`usePublishReport`, `useDeleteReport`, `useProjectInformationDataFetch`, the web parts'
    `onInit`).
  - PortfolioWebParts and ProgramWebParts import ProjectWebParts' `ProjectInformation` and
    `ProjectInformationPanel`. They were not built or tested in this slice; without a provider
    the new calls do nothing there.
  - Seen, not changed: `webparts/dynamicList/index.ts` holds hard-coded Norwegian text (an
    `alert` and `'Alle felt'`), against the loc rule.

### Groundwork for slices 5 and 7 in shared-library (2026-11-12)

- Done:
  - The shared Jest setup defines `DEBUG` as `false` when a test has not set it, so every bundle
    can pass it to `startTelemetry` under Jest.
  - `PortalDataService`:
    - `INSTALLATION_LOG` is a list of the service, named by `Lists_InstallationLog_Title`.
    - `getUsageSnapshot()` reads the hub's installation facts for the heartbeat, as designed:
      not cached, each read in its own catch, `null` when the hub is out of reach. The result
      holds contract values only.
    - `getSiteKind(siteId)` gives a site's type from its row in Prosjekter (`GtSiteId`), for a
      bundle that holds no flags of the site itself. No row, a denied list and a failed read all
      give `other`.
    - The queries are in `usageQueries.ts`, and a runtime test checks their OData URLs against
      the real PnPjs.
    - `unavailableStatus` keeps the HTTP status of the answer that took the hub out of reach.
  - `errorWithStatus(message, status?)` (`shared-library/src/util`). ProjectStatus and
    ProjectTimeline throw their no-hub error with `unavailableStatus`, so a hub out of reach
    counts as `permission_denied` with 403 where the service kept a status, and as `unknown`
    where it kept none. The text the user sees is unchanged.
  - `readSiteType` moved from ProjectWebParts to `telemetry/siteType.ts`, with the answer for a
    missing item as a parameter: `project` for the site's own properties item, `other` for the
    hub's list.
  - `getTelemetryGate()` renews a decision older than `GATE_MAX_AGE_MS` in the background, as a
    tracking call does.
  - `trackPageView(component)` counts `page.viewed` once per page, however many Footer bundles
    report it. The store keeps `lastPageViewKey`: the site id and a hash of the path, never the
    path, and never in a batch. The query and the fragment are left out of the key.
  - `requestHeartbeat(hubLanguage)` and `hubLanguageFromLcid(lcid)`. The core reads the snapshot
    through the anchor, only on a hub page for a user who may manage the hub, once per page
    load, and only once the gate has resolved at level 1 or higher. A request made while the
    gate is pending waits for the decision.
  - `setSiteType(siteId, siteType)` sets a site's type at once and replaces a resolver's answer.
    It is for ProjectSetup, which knows the type from the template.
  - `attachTelemetryPortal` takes an empty settings map as no map. An adapter that never read
    the settings would otherwise close the gate for every bundle on the page.
  - The shared `ProjectTimeline` counts its handled load failure in
    `useProjectTimelineDataFetch`, for the web part it sits in.
  - Test fixtures: `spfxTestContext`, `hubPortal()` with `getUsageSnapshot` and `getSiteKind`,
    `navigateTestPage` and `bed.navigate`.
- Verified:
  - `npm test` in shared-library gives 938 Jest tests in 103 files and 15 runtime tests, with
    0 failures. Coverage is 81.77 / 86.58 / 70.1 / 81.77.
  - `npx heft test` in ProjectWebParts gives 460 tests in 73 files with 0 failures. Coverage is
    70.54 / 75.21 / 68.79 / 70.54.
  - No lint errors in either build. `contract.ts` is unchanged.
- Found:
  - `requestHeartbeat` replaces the Footer reading the snapshot itself. Only the core can read
    through the anchor, and a Footer that attaches second often meets a pending gate and would
    lose the heartbeat. `queueHeartbeat` is unchanged.
  - The store got two optional fields (`heartbeatRequest`, `lastPageViewKey`) under the same
    global name, `__pp365UsageV1`. Nothing has shipped, so no reader of the old shape exists.
  - `getUsageSnapshot()` returns `null`, as designed, which gives two `@rushstack/no-new-null`
    warnings.
- Left:
  - The first `getTelemetryGate()` after a decision has gone stale still answers closed, so
    that one catalog event is dropped. A tracking call before it, such as `catalog.opened`,
    renews the decision earlier.
  - `getSiteKind` gives `other` for a user who may not read Prosjekter (a member of «Minimum
    lesetilganger på hub»), so their usage on a project site counts under `other` unless a web
    part of ProjectWebParts answered first.
  - A page reached again through an SPA navigation to the same path is not counted again. A
    full reload is.
  - The two `onInit` catches that set `unavailableStatus` have no unit test: `onInit` cannot
    run under the PnP stub.
  - `getUsageSnapshot` and `getSiteKind` are not verified against a tenant. `integration/` is
    untouched.

### Slice 5: catalog events under the gate (2026-11-12)

- Done:
  - `TelemetryService` asks the shared gate (`getTelemetryGate().catalog`) in place of
    `_isEnabledInGlobalSettings`. The command set attaches `SPDataAdapter.portalDataService`
    without a map as it starts, and the service attaches it again before it asks.
  - The payload gains `level`, and `errorCode` at level 3 for `status: 'error'`. It loses
    `errorMessage` and `clientTs`. `detail` is cut to `{ taxonomySkipped: boolean }` or
    `{ removedType: Lokal | Importert | Sentral }`.
  - Nothing is sent unless the catalog URL in effect is exactly `DEFAULT_CATALOG_URL`, which
    moved to `services/catalogUrl.ts` with `resolveCatalogUrl()`.
  - `fetch` adds `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`. The endpoint, the
    JSON body and `siteUrl` are unchanged.
  - The JSDoc of `TelemetryService`, `featureFlags.isTelemetryEnabled` and the two `types.ts`,
    and the Telemetry section of the command set's README, describe the gate.
- Verified: the PortfolioExtensions run under slice 7 below. `TelemetryService.test.ts` (42
  tests) shows no event for a missing, disabled, empty or non-`1` catalog row, at level 0 or 1,
  without a level row, with the hub out of reach or for another catalog URL; `errorCode` only at
  level 3 for an error; never `errorMessage` or `clientTs`; and the exact fetch options.
- Found:
  - The local coverage summary was 70.58 before any edit, not below the floor as the risk table
    feared.
  - An event that finds the decision pending or older than an hour is dropped, and the next one
    is sent. Opening the catalog renews an old decision.
- Left:
  - Assist must accept `level`, `errorCode` and the three `removedType` values (slice 2).
  - A DEBUG build still sends catalog events, as before: P14 speaks of usage batches only. The
    gate does not say whether the window is a DEBUG build.
  - A custom, non-empty `telemetryUrl` is still honoured, under the same gate.

### Slice 7: emitters in the other four solutions (2026-11-12 and 2026-11-13)

- Done, PortfolioWebParts:
  - `BasePortfolioWebPart.onInit` starts telemetry once the adapter is configured, unless the
    web part was disposed: the page, `loaded` and the `init` timing. `renderComponent` wraps the
    element in `TelemetryProvider`, and the ErrorBoundary's `onError` counts `render_failed`.
  - A web part set up with a portfolio attaches no portal and registers no site type resolver
    (P4). Without one it attaches the adapter's portal with no settings map, and the resolver is
    `PortalDataService.getSiteKind`.
  - Events, each counted once in a handler or hook: `view.switched` (views and programs),
    `view.saved`, `portfolio.switched` (in the web part's `setPortfolio`, after the
    configuration is read), `excel.exported` (both overviews), `dataSource.switched`,
    `layout.toggled`, `viewAll.toggled` and `tab.switched`.
  - Handled failures, once each by the error's own code: the configuration load of the
    overview, the aggregation and the idea module; the data fetch of the overview, the
    aggregation, the latest projects, the project list and the project card; each hub a merged
    view could not read; a refused column save or delete, a refused aggregation view save and a
    failed Excel export.
  - `GetPortfolioConfigError` keeps the original error as its `cause`, `fetchItemsWithSource`
    and `fetchDataSources` rethrow with `errorWithCause`, and `fetchMergedViewData` returns
    `failedPortfolioErrors`.
- Done, ProgramWebParts:
  - `BaseProgramWebPart.onInit` starts telemetry once the adapter is configured and the child
    projects are read, unless the web part was disposed: the page, the adapter's portal with
    its global settings, `getSiteKind` as the site type resolver, `loaded` and the `init`
    timing. `renderComponent` wraps the element in `TelemetryProvider` and in an error boundary
    whose `onError` counts `render_failed`.
  - The base had no error boundary. `baseProgramWebPart/ErrorBoundary` is a small class of the
    solution's own, since `react-error-boundary` is not among its dependencies. It shows the
    error in a `UserMessage` under the existing `ErrorTitle`; before, React emptied the web
    part.
  - `childProjects.added` (`useAddProjectDialog`) and `childProjects.removed` (`Commands`) are
    counted once per add or removal that went through, however many projects it held.
  - Handled failures, by the error's own code: the aggregation's and the overview's
    configuration; in the administration a hub that cannot be resolved, child projects that
    cannot be read, the hubs' projects for the dialog, a failed add and a failed removal.
  - `SPDataAdapter` keeps the cause where it rethrows a generic text, and gives its three
    hub-out-of-reach errors the service's `unavailableStatus`.
- Done, PortfolioExtensions:
  - The Footer starts usage statistics between the isAvailable return and the ShowFooter
    return: the page, the portal with the settings it just read, `getSiteKind` as the site type
    resolver, `page.viewed` and the heartbeat request. Its own `navigatedEvent` subscription
    repeats that on every navigation, without the settings map, and is removed in `onDispose`.
  - `assistant.opened` and `help.opened` are counted through `TelemetryProvider`.
  - `idea.recommended` and `idea.decided` are counted with the variant from the choice's key in
    the idea configuration (`helpers/ideaChoiceVariant.ts`), never from its display text.
    `idea.projectDataCreated` is counted. Each has an urgent flush before the reload or
    redirect.
  - The three idea command sets and the catalog start through `helpers/commandSetTelemetry.ts`.
    IdeaProcessing and IdeaProjectData get a `PortalDataService` made in the background.
  - The catalog counts `catalog.opened` and renders under `TelemetryProvider`.
  - Handled failures, by code: the Footer's installation log, help, links and favourites; the
    catalog's load, import, publish, update, remove, package history, contents and file
    preview, and its failed set-up; IdeaRegistration's processing-list link. Fetch errors in
    `CatalogService` and `PackageInstaller._download` carry their HTTP status.
  - A refusal to read Prosjekter for the favourites is not counted: a member of «Minimum
    lesetilganger på hub» is denied that list by design.
- Done, ProjectExtensions:
  - ProjectSetup starts telemetry itself in `onInit`, attaches the hub's data service where its
    check first configures it, and registers `getSiteKind` as the site type resolver. A run is
    counted once: `setup.completed` with its variant after the last step that can fail, with the
    site type set from the template first (`setSiteType`); `setup.aborted` or `setup.failed` in
    the catch, told apart by `_setupAborted`. The completion dialog flushes urgently before it
    navigates.
  - The conditional rules are in `projectSetup/setupTelemetry.ts`, so the extension file gained
    no branch: `siteTypeAfterSetup`, `trackSetupStopped`, `trackSetupCheckFailure`.
  - A failed setup counts one error: the failure's own code and HTTP status when it or its
    cause has one, else `provisioning_failed`. `ProjectSetupError` keeps what it was made from
    as its `cause`.
  - A read that fails before the setup starts, and a cloud template that cannot be read, are
    counted for `ProjectSetup` by their code. The answers of the setup's own checks are not.
  - RiskActionPlanner starts telemetry once per list view in `onInit`, with the settings its
    adapter has read, and gives each cell's root the alias. `riskAction.created` is counted per
    task added from the panel. A failed save, sync and migration are counted in their hooks.
  - TemplateSelectorCommand starts telemetry in `onInit` and attaches the hub when the command
    first loads its data. `documentTemplates.copied` is counted once per copy in which at least
    one template went through; each template that fails, and a failed load, by its code. The
    dialog flushes urgently before the reload.
- Done, shared-library, after the solutions asked for it:
  - `CloudTemplatePackage.fromUrl` throws with the HTTP status on the error
    (`errorWithStatus`), so a cloud template that cannot be read counts by it.
  - The test bed's `batches()` reads only what went to the usage endpoint, so it can be used
    where the component under test calls `fetch` itself.
- Verified, by the main agent's own runs after the last edit, all with 0 failures and no lint
  errors:
  - shared-library (`npm test`): 938 Jest tests in 103 files and 15
    runtime tests. Coverage 81.78 / 86.58 / 70.1 / 81.78.
  - ProjectWebParts: 460 tests in 73 files. Coverage 70.54 / 75.21 / 68.79 / 70.54.
  - PortfolioWebParts: 431 tests in 67 files. Coverage 81.15 / 81.35 / 73.25 / 81.15
    (76.06 / 80.49 / 69.04 / 76.06 before).
  - ProgramWebParts: 114 tests in 14 files. Coverage 51.94 / 84.31 / 82.66 / 51.94
    (48.9 / 80.57 / 71.01 / 48.9 before).
  - PortfolioExtensions: 320 tests in 20 files. Coverage
    73.2 / 84.96 / 86.99 / 73.2 (70.58 / 83.76 / 84.87 / 70.58 before).
  - ProjectExtensions: 331 tests in 35 files. Coverage 82.17 / 85.85 / 83.13 / 82.17
    (81.83 / 85.39 / 82.77 / 81.83 before).
  - One copy of the shared library per bundle. After `npx heft build` (not production) in
    ProgramWebParts, each of its four bundles holds each telemetry module once, with one
    definition of `__pp365UsageV1` and one `TelemetryContext`; the base web part,
    PortfolioWebParts' hooks and the shared timeline require the same module. No alias prop is
    needed. Tests load the real `PortfolioOverview`, `PortfolioAggregation` and
    `ProjectTimeline` under the program aliases.
- Found:
  - The web parts' configuration errors are counted where the load fails, by the error's own
    code, not as `render_failed` in `render`, which runs many times (as the matrices in slice
    6).
  - On a navigation the Footer must not hand its settings map over again: an old map lowers a
    level the hub has raised since.
  - The hub's parent template has no `GtIsParentProject`; the setup sets the flag itself, so
    `siteTypeAfterSetup` adds it for the `parent` variant.
  - ProjectExtensions compiles to ES5, where `instanceof ProjectSetupError` is never true. A
    setup error is recognised by its `messageType`.
  - Counted right after `_startSetup`, a run whose later step threw would be both completed and
    failed. It is counted after `deleteCustomizer`.
  - A migration of risk actions moves existing actions and is not `riskAction.created`.
  - The contract drops the aggregation's events under `IdeaModuleWebPart` and
    `timelineItem.opened` under `ResourceAllocationWebPart`. The project information panel
    from ProjectWebParts sits under PortfolioWebParts' provider with all actions hidden, so
    only its load failure is counted.
  - `countedTelemetry()` names usage without the site type; tests read the type from the
    store.
- Left:
  - The portfolio overview fetches twice as it mounts (`useFetchData` has two effects), so one
    failed load counts two errors, in the program overview too.
  - A pick of the entry already shown counts as a switch (`view.switched`,
    `dataSource.switched`, `layout.toggled`, `tab.switched`).
  - Not counted, because the rejection has no catch and nothing is shown either: the overview's
    view save, the saves of "edit view columns", `setPortfolio`, the fetches of
    ResourceAllocation and IdeaModule, the idea saves, the program administration's first
    read, and in ProjectExtensions the Planner task preview, the folder list and the libraries
    of the template dialog.
  - A refused column delete counts as `unknown`: `PortalDataService.deleteItemFromList`
    swallows the answer. Setup tasks that rethrow without the original error count as
    `provisioning_failed`.
  - A setup that completes with errors in its log, or without registering the project on the
    hub, counts as completed. With `skipReload` the count waits for `pagehide`.
  - A hub whose URL cannot be resolved makes the program timeline fail with a TypeError, which
    counts as `unknown`.
  - A render failure in a program web part now shows a message where the web part was empty
    before. The user has not confirmed that change.
  - The floors of the four solutions are unchanged. Raise them from CI's figures before the
    merge.
  - The production bundle was not inspected, and nothing was checked in a browser or with a
    local DEBUG watch.

### Rebase on main and three counting fixes (2026-11-13)

- Decided by the user on 2026-11-13:
  - The error boundary in `BaseProgramWebPart` stays (slice 7, Left): a program web part that
    fails to render shows the error under `ErrorTitle`, and counts `render_failed`.
  - A DEBUG build keeps sending catalog events, as before (slice 5, Left). Only usage batches are
    held back from a DEBUG build (P14).
  - Three weaknesses left by slice 7 are fixed, below: one failed load of the portfolio overview
    counted twice, a pick of what is shown counted as a switch, and saves with no error handling.
- Done:
  - The branch was rebased on `main` twice. At `6a934fcc8`, 16 newer commits, among them the
    comment audit of all six packages: 47 files conflicted, each in JSDoc or an import line, and
    main's wording was kept with the sentence on usage statistics added to it. At `decc7c48a`,
    6 more UU fixes: one conflict, in `EditViewColumnsPanel.tsx`, where main had replaced the
    panel's title with a help text, and the save error's message bar sits above it; and the
    merge left a second `react` import in `useEditViewColumnsPanel.ts`, which TypeScript caught.
    Nothing is pushed.
  - `useFetchData` counts what a fetch failed with once per view, merged state and portfolio. The
    two fetches as the overview mounts count one error, and the same view counts again only after
    a fetch got through. Each hub a merged view could not read is counted the same way. The
    program overview uses the same hook.
  - A pick of what is shown already is no switch: `view.switched` (views and programs),
    `dataSource.switched`, `layout.toggled`, `tab.switched` and `portfolio.switched` count only a
    pick that changes what is shown.
  - Saves that had no error handling now tell the user and count the failure once, by its code,
    in the catch that handles it. A save that failed counts no usage.
    - PortfolioWebParts. The view form of the portfolio overview and of the aggregation, and the
      panel that edits a view's columns (its save, and its revert of the order, in both
      overviews), show `ViewSaveErrorText` under `ErrorTitle` and stay open with what was chosen.
      The aggregation's form threw its error on to a click handler, which showed it to no one.
    - A switch of portfolio changes nothing in the web part until the picked portfolio's
      configuration is read. When it cannot be, the portfolio shown stays shown, the selectors
      are put back and can be used again (`PORTFOLIO_SWITCH_FAILED`), and a toast tells which
      switch failed (`PortfolioSwitchErrorTitle`, `PortfolioSwitchErrorText`). `onSetPortfolio`
      now resolves to whether the pick is shown.
    - PortfolioExtensions, the idea saves. IdeaRegistration and IdeaProcessing tell the user in an
      alert (`IdeaRecommendationSaveErrorMessage`), as their dialog is closed when the save runs,
      and reload nothing. IdeaProjectData shows the error in its dialog, which stays open for
      another try (`IdeaProjectDataSaveErrorMessage`), or in an alert when it was closed, and
      leaves no page. The read of the content columns no longer rewraps its error, which lost the
      HTTP status.
    - Project data that was created but could not be linked to the idea is linked by the next
      try, while the page is open, and not created again.
  - ProgramWebParts' tests follow the overview: its failed read is counted once for the program
    web part, and the stand-in context of the view menu has a `state`, as the overview's has.
- Verified by the main agent's own runs on `decc7c48a`, after the last edit, all with 0 failures
  and no lint errors:
  - shared-library (`npm test`): 956 Jest tests in 106 files and 15
    runtime tests. Coverage 81.46 / 86.63 / 70.37 / 81.46.
  - ProjectWebParts: 468 tests in 74 files. Coverage 71.03 / 75.13 / 68.69 / 71.03.
  - ProjectExtensions: 333 tests in 35 files. Coverage 82.72 / 85.9 / 83.18 / 82.72.
  - PortfolioWebParts: 457 tests in 68 files. Coverage 81.13 / 81.64 / 75 / 81.13.
  - PortfolioExtensions: 341 tests in 20 files. Coverage
    73.32 / 85.15 / 87.25 / 73.32.
  - ProgramWebParts: 114 tests in 14 files. Coverage 51.71 / 84.36 / 82.66 / 51.71.
  - `validate-loc` in PortfolioWebParts (348 keys) and PortfolioExtensions (291 keys): no key
    missing from either bundle.
- Left:
  - Loads that have no catch are still neither shown nor counted: the fetches of ResourceAllocation
    and IdeaModule, the program administration's first read, and in ProjectExtensions the Planner
    task preview, the folder list and the libraries of the template dialog.
  - An approval in IdeaRegistration can fail half-way: the idea keeps «Godkjent» and the comment
    with no processing item, and once the list refreshes the command answers «allerede godkjent».
    Project data that could not be linked is left without an idea once the page is reloaded.
  - As before: «Opprett» in the project data dialog has no busy state, so a double click creates
    two; the recommendation dialog loses the typed comment when the save fails; a rejected
    `Dialog.alert` is unhandled; the link command rethrows `new Error(error)`.
  - Read from the code, not reproduced: a pick of the portfolio or the view shown already starts
    a change of view that no fetch ends, so the selectors would stay disabled and the list in
    its loading state. It was so before this branch, and such a pick is not counted.
  - As before: a column form closed with its cancel button still shows its save error when it
    opens again. A message bar can be scrolled out of view in a low window, but is announced.
  - The new texts were not proofread with the other 1.15.0 texts, and nothing was checked in a
    browser or with a screen reader.

### Slice 3: setting, install and upgrade (2026-11-13)

- Done:
  - The level row in `Globale innstillinger.xml`, appended after `AssistantAccessMode`: key
    `UsageStatisticsLevel`, seeded `2`, category General, `GtSettingsId`
    `{b4d62fcd-26ac-4bc3-aeb8-c7d5e4503248}`, generated once with `[guid]::NewGuid()`. The id is
    `$UsageStatisticsLevelSettingId` in `Install/Scripts/SharedFunctions.ps1` and
    `USAGE_STATISTICS_LEVEL_SETTING_ID` in `integration/tests/template.test.ts`.
  - The title key `Lists_Global_Settings_Category_General_UsageStatisticsLevel_Title`, on line
    1306 of both resx files, after `..._General_ShowFooter_Title`, with the plan's texts.
  - `SharedFunctions.ps1`, in a region of its own:
    - pure: `Convert-UsageStatisticsLevel`, `Test-SameGuid`, `Test-TelemetryUrlOptOut`,
      `Resolve-InitialUsageStatisticsLevel` (P7), `Get-EffectiveUsageStatisticsLevel` (mirrors
      `resolveTelemetryGate`: enabled rows by their exact key, the row read last, trimmed values)
      and `Format-UsageStatisticsSummary`;
    - on the hub: `Test-CatalogTelemetryUrlDisabled`, `Get-UsageStatisticsRows`,
      `Get-LastInstalledVersion`, `Initialize-UsageStatisticsSetting`, `Set-UsageStatisticsLevel`,
      `Write-ExplicitUsageStatisticsLevel` and `Write-UsageStatisticsSummary`.
  - `PreInstallUpgrade.ps1` ends with the step, outside the version block: on every upgrade,
    `-SkipTemplate` included, with no try/catch.
  - `Install.ps1`:
    - `-UsageStatisticsLevel` (`Off`, `Basic`, `Standard`, `Extended`), and
      `$UsageStatisticsLevelGiven` before any dot-sourcing;
    - the banner line and the wiki link;
    - the step before the Portfolio template on runs without `-Upgrade`;
    - the explicit write right after the Portfolio template in both branches, and in the
      template's place under `-SkipTemplate`;
    - the summary region after PostInstallUpgrade.
    `-SkipPingback`'s help names the other switch, and the pingback is unchanged.
  - `.tasks/usage-statistics-level.test.js` with `.tasks/fixtures/usage-statistics-level.json`:
    49 scenarios over the pure functions in one pwsh process, skipped where pwsh is missing.
  - `integration/tests/template.test.ts` reads the row: the template's id and a value from 0 to
    3. It is not gated on the templates, as the step runs under `-SkipTemplate` too.
  - A line under `### Ny funksjonalitet` in `CHANGELOG.md`, and the pp365-templates skill: the
    step before the template, and the pwsh test.
- Differs from the plan:
  - `Set-UsageStatisticsLevel` writes the last row with the key when no row has the template's
    id, rather than adding a second row with the key: the browsers read the last one.
  - Rule 5's version is one constant, `$UsageStatisticsLevelSinceVersion`, set to 1.15.0 (Found).
  - The summary's pingback line says "sent at the end of this run": the summary comes first.
  - `Get-Help ./Install/Install.ps1` lists the parameter in the syntax. `Get-Help -Parameter`
    finds none of the script's parameters, as it has no comment-based help, as before.
- Verified:
  - `npm run test:tasks`: 96 tests, 0 failures, 49 of them new.
  - The three scripts parse (`[Parser]::ParseFile`); the parameter has the four values.
  - `cd Templates && npm run build && npm run validate-loc`: 1481 shared keys, none missing from
    either bundle, and `pnp-missing-resource-tokens-report.json` empty. The six `-validation.md`
    files changed only their version line (1.14.0 to 1.15.0, from the root package), and were put
    back.
  - `tsc --noEmit` in `integration`, Prettier with the repository's settings, and
    `npm run check-skills`.
- Found:
  - Main was bumped to 1.15.0 before this feature was merged, so the dev and test hubs log 1.15.0
    without ever having had the row. Rule 5 gives them 0 on their first upgrade with this code,
    and "Builds log 1.14.0 until the bump" (P7) no longer holds. Customer hubs on 1.14.x get 2 if
    usage statistics ship in 1.15.0. If they ship in a later release,
    `$UsageStatisticsLevelSinceVersion` must be that release, or every hub upgraded to 1.15.0
    starts at 0.
- Left:
  - Nothing ran against a tenant: that `Get-PnPList` returns nothing for a missing list (assumed,
    as the plan does), that `Get-PnPCustomAction -Scope Web` loads
    `ClientSideComponentProperties`, the add, the write and the summary. Slice 13 runs the paths
    on a hub.
  - `ParseVersionString` asks on the console when the newest installation log entry has no valid
    version, and runs without `-Upgrade` over an existing hub now read the log too.
  - The wiki page Bruksstatistikk that the banner and the summary link to does not exist yet, and
    the changelog line has no release notes section (slice 12).
  - No workflow passes the parameter, as planned.

### Slice 8: e2e guard and usage spec (2026-11-13)

- Done:
  - `e2e/tests/fixtures/pp365.ts`: `guardTelemetry(context)` sets the session flag
    `PP_DISABLE_TELEMETRY` to `1` in every page (`addInitScript`), and answers
    `https://assist.prosjektportalen.no/api/telemetry/**` with 204 and CORS headers in Assist's
    place (a context route). The suite's `test` overrides `context` with it, behind the option
    `telemetryGuard`, on by default: every spec that takes `test` from the fixture is guarded,
    the local and diagnostic ones included.
  - `auth.setup.ts` and `deployment.setup.ts` call it in a `beforeEach`, and
    `diagnostics/placeholders.spec.ts` on the contexts it makes. The flag lives in session
    storage, which the saved sign-in state leaves out.
  - `fixtures/rest.ts` takes `listWithField` and `hasField` from `risk-action.spec.ts`, and gains
    `hubSettings` and `hubSetting`, which read the hub's settings as `getGlobalSettings` does: the
    enabled rows, by their exact key, the row read last. `risk-action.spec.ts` uses them; its
    `$filter` on the key also returned disabled rows.
  - `smoke/usage-statistics.spec.ts`, with the guard off and its own capture route:
    - the hub's home, at the level the hub's settings give as the gate reads them: at 0 nothing is
      sent, at 1 only heartbeats. At 2 and 3 every request goes to the usage route as
      `text/plain`, without a cookie or a referrer, with only the allowed fields (the spec's own
      copy of `TELEMETRY_FIELDS`), the hub's host, URL and level, the channel in a heartbeat,
      16-character site hashes that are no site's id, and no test user, `@`, page title or other
      URL; and the Footer counts the hub's page view;
    - a project's home counts its web parts loaded on a project, from level 2;
    - two fresh contexts load the hub's home, with usage statistics on and off, and the first may
      keep no storage key the second lacks. Keys are compared without ids and numbers, and the
      second load waits longer.
  - `e2e/README.md` and the pp365-testing skill.
- Verified:
  - `tsc --noEmit` in `e2e`; `playwright test --list` finds 124 tests in 29 files, the three new
    among them; Prettier with the repository's settings; `npm run check-skills`.
  - An offline probe in Chromium, outside the repository, with pages served by routes: the guard
    sets the flag and answers the usage POST and the catalog's preflighted JSON POST without a
    CORS error. A capture sees the `text/plain` body without a cookie or a referrer when it is sent
    as the core sends it, and sees both when it is sent with credentials and the default referrer
    policy, so the spec's header checks can fail. The suite's `test` guards its page by default,
    and not with `telemetryGuard: false`.
- Found:
  - Nothing ran against the tenant: the test channel's bundles hold this branch's code only once
    it is merged. The test hub's level is 0 after its first upgrade with slice 3 (rule 5), so the
    hub test then checks only that nothing is sent, and the project test skips.
  - The channel is checked only in a heartbeat, which only a user who manages the hub sends.
- Left:
  - Green on the test channel, after the merge. The payload checks run once the test hub's level is
    2 or 3: set by hand, or by a flow that sets the row and restores it (not built).
  - The storage comparison has not met SharePoint's own storage keys: a key SharePoint writes in
    one load and not in the other would fail it falsely.
  - The guide's test overview (`.development-guide/spfx/testoversikt.md`) has no row for usage
    statistics yet (slice 11).

### On main before the rest (2026-11-13)

- Decided by the user on 2026-11-13: the five commits went to `main` before Assist, the texts and
  the legal checks, against P25 ("everything before the merge"). They were pushed to origin as a
  fast-forward (`decc7c48a..4dd1338d0`); GitHub let the account bypass the branch protection
  (changes through a pull request, the status check «task-list-completed»).
- So 1.15.0 carries usage statistics unless they are taken out before the release. Hubs upgraded
  from 1.14.x start at 2 and send to Assist, whose route does not exist yet: the requests fail
  quietly in the browsers, and nothing is stored. The dev and test hubs start at 0 (rule 5, slice
  3).
- The push's subject carried `[skip-ci] [build-debug]`: `build-release.yml` built the packages,
  and nothing was deployed. The next push to `main` that deploys brings the code to the dev and
  test hubs.
- Slice 2 (Assist's ingest) runs in a session of its own in prosjektportalen-assist, beside slice
  11 here.

### Slice 11: developer guidance (2026-11-13)

- Done:
  - `.development-guide/spfx/bruksstatistikk.md` (new, in Norwegian): the levels and the setting,
    the contract and its copies, the gate, starting telemetry, counting an event and an error, a
    checklist for a new event, storage and privacy in the code, testing, and install and upgrade.
    It is loaded in `.development-guide/.README` after the accessibility chapters, and the guide's
    `README.md` was generated again (`@appnest/readme`, from the npx cache), which also brought in
    chapter changes made on `main` since its last generation.
  - Pointers in the pp365-ui (counting in a component), pp365-templates (the setting row),
    pp365-testing (the Jest helpers) and pp365-release (a contract change goes with Assist's copy,
    the fixture and the wiki, Assist first) skills.
  - Gotcha 9 in `AGENTS.md`: the contract's two copies, the fixture and the wiki page change
    together; every sender goes through the one gate; no browser storage, no error message.
  - `.development-guide/spfx/testoversikt.md`: a row for the telemetry core (16 files, 258 tests,
    the integration test and the e2e spec), and `.tasks/usage-statistics-level.test.js` among the
    tests outside the components.
- Verified: `npm run check-skills`; the function names and signatures the chapter gives against
  `shared-library/src/telemetry/index.ts` and `track.ts`.
- Left: the chapter names Assist's `src/lib/pp-usage-contract.ts` and
  `scripts/sync-pp-usage-contract.mjs`, which slice 2 is building; and the wiki page Bruksstatistikk
  (slice 12).

### Default level 3 (2026-11-13)

- Decided: the user made Extended (3) the default instead of Standard (2), on a new hub and on an
  upgraded hub without the row. An earlier opt-out still gives 0, and a row that exists is never
  changed. D1, D7 and P10 follow it. Level 2 keeps its name, Standard (`-UsageStatisticsLevel
  Standard`, the summary, the setting's title «2 = standard»), though it is no longer the default.
- Done:
  - The template seeds `3` (`Globale innstillinger.xml`), and rule 6 of
    `Resolve-InitialUsageStatisticsLevel` gives 3 (`the default, Extended`).
  - `Install.ps1`: the banner of a run without `-Upgrade` reads `Extended (3)`, and the
    HelpMessage says a new installation gets Extended. `PreInstallUpgrade.ps1` says the template
    creates the row at 3.
  - The four default scenarios in `.tasks/fixtures/usage-statistics-level.json`.
  - The guide (`bruksstatistikk.md` and the README generated from it), the CHANGELOG line and the
    pp365-templates skill.
- Verified: `npm run test:tasks` (96 tests, the four default scenarios at 3); the three install
  scripts parse in pwsh; the guide's README equals the generator's output; `npm run check-skills`.
  Not run against a tenant: the dev and test hubs keep their row at 0, which no run changes.
- Left: the legal checks (L2, L4, L6) and the customer texts must say that error codes and load
  times are sent by default, and that Standard (2) is not the default.
