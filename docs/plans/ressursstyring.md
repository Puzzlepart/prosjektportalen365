# Ressursstyring – sentralt ressursregister og nytt uke-grid

## Context

Prosjektportalen 365 har i dag en enkel ressursallokeringsmodul: hver prosjektside har en liste `Ressursallokering` (innholdstype `0x010004EAFF7AFCC94C2680042E6881264120`), hubområdet har en liste med samme navn for fravær og linjeoppgaver (innholdstype `0x010029F45E75BA9CE340A83EFFB2927E11F4`), og porteføljesiden `Ressursallokering.aspx` viser alt via **søk** (datakilde `Alle ressursallokeringer`, id `22880c29-12a8-484b-b51c-6d3859eb07df`) i webdelen `PortfolioWebParts/src/webparts/resourceAllocation` (id `2ef269b2-6370-4841-8b35-2185b7ccb22a`). Webdelen tegner en tidslinje med det delte `Timeline`-komponentet i `shared-library/src/components/ProjectTimeline/Timeline/`, som pakker inn tredjepartsbiblioteket `react-calendar-timeline@0.28.0` (siste utgivelse i v0-linjen, ikke vedlikeholdt).

Begrensningene er kjente: søk gir 15–60 minutters forsinkelse og et tak på 500 rader (`RowLimit: 500` i `useResourceAllocationDataFetch.ts`), det finnes ingen prosjektvisning (prosjektene har bare en rå SharePoint-liste), ingen forespørsels-/godkjenningsflyt, ingen kobling mellom allokeringer og prosjektets faser eller tidslinje, ingen kapasitets- eller kompetansebegrep og ingen historikk.

Lørenskog kommune har samlet ressursstyringen på tvers av avdelinger og trenger ett verktøy som viser hvem som er i bruk, hvem som er 100 % belagt, hvilken kompetanse ressursene har, og som lar et ressurskontor planlegge, godkjenne og tildele allokeringer i samlingsmøter annenhver uke. Ønsket visning er et uke-grid slik Dynamics 365 Project Operations gjør det: én rad per ressurs med totalbelastning per uke (fargekodet), ekspanderbar til én underrad per prosjekt- eller linjeallokering.

Denne planen beskriver en ny ressursstyringsmodul som erstatter dagens modul, med sentralt register i huben, egenutviklet uke-grid uten tredjepartsavhengighet, portefølje- og prosjektvisning, forespørsel → godkjenning → tildeling, kobling til tidslinjeelementer og eksport som snapshot. Oppgraderingsvei fra dagens modul er en del av planen.

## Decisions

### D1. Sentralt register i huben – én kilde til sannhet

Prosjektallokeringer flyttes fra per-prosjekt-listene inn i **hublisten `Ressursallokering`** (`Templates/Portfolio/Objects/Lists/Ressursallokering.xml`) med `GtSiteIdLookup → Prosjekter`, etter samme mønster som `Tidslinjeinnhold` (hubliste skrevet fra prosjektområdet i `ProjectSetup`-oppgaven `TimelineConfiguration`, lest av både prosjekt- og porteføljewebdel). Begge nye webdeler leser og skriver via REST (PnPjs), ikke søk.

Begrunnelse:

- Forespørsel/godkjenning er en flyt på tvers av områder. Ressurskontoret må se og redigere alle forespørsler ett sted. Med per-områdelister måtte kontoret hatt skrivetilgang til hvert prosjektområde, og godkjenning ville skjedd i N ulike lister.
- «Kun personer med aktive allokeringer i perioden», ressurspool og «hvem er ledig» krever server-side filtrering på indekserte datokolonner. Søk har 500-raders sidetak og ingen pålitelig periodefiltrering.
- Kobling til tidslinjeelementer (`Tidslinjeinnhold`) er et vanlig oppslag når allokeringen ligger i huben; fra et prosjektområde er kryss-områdeoppslag umulig.
- Ingen indekseringsforsinkelse: det ressurskontoret godkjenner i møtet vises umiddelbart i prosjektet.

Avveininger som håndteres:

- **Skrivetilgang i huben.** Hubmedlemmer er i praksis lesere (`Objects/Lists/Security/DefaultSecurity.xml` gir medlemmer Read, og `Install.ps1` nedgraderer den tilknyttede medlemsgruppen til Reader). Den nye listen får derfor egen sikkerhetsfil: medlemmer Contribute, `WriteSecurity="2"` (opprett og rediger egne), og gruppen `Ressurskontor` med Edit (Edit inkluderer Manage Lists og omgår «rediger egne»). Prosjektledere må være hubmedlemmer – dette er en reell driftsendring som må stå i releasenotes.
- **Listeterskel 5 000.** Én liste for hele porteføljen passerer 5 000 elementer etter noen år. Alle spørringer filtrerer først på periodevindu (`GtEndDate ge X and GtStartDate le Y`) mot indekserte kolonner (`GtStartDate`, `GtEndDate`, `GtResourceUser`, `GtSiteIdLookup`, `GtAllocationStatus`, `GtAllocationSourceRef`), paginerer med `getPaged`, og SharePoint-visningene er filtrerte (Aktive, Forespurte, Mine, Per prosjekt) i stedet for «alle».
- **Ingen elementnivå-ACL-er.** Kun `WriteSecurity=2` og gruppebaserte rolletildelinger; ingen unike rettigheter per element.
- **Parent-/programaggregering.** Dagens `ProgramAggregation`-webdel filtrerer på underområdenes `SiteId` i søk og ser ikke hubelementer. Den nye prosjektwebdelen får en `children`-modus (REST-filter på `GtSiteIdLookup/GtSiteId` i underprosjektenes id-er via `PortalDataService.getChildProjects`), og program-/overordnet-malene bytter webdel på siden. Datakilden `fbe4dcc8-…` (`_Children`) merkes utgått.
- **Eksisterende kunder med mye data i prosjektlistene.** Idempotent migreringsskript med `-WhatIf` og rapport per område; legacy-listen beholdes skjult og med `NoCrawl` – ingenting slettes.

Alternativet «behold per-prosjekt-lister + søk og legg på forespørselsfelt» er forkastet: sentral godkjenning, tilgjengelighetsberegning og tidslinjekobling blir enten umulig eller skjørt, og modellen arver 500-raders- og forsinkelsesproblemene.

### D2. Egenutviklet uke-grid, ingen ny kjøretidsavhengighet

`react-calendar-timeline` fjernes fra ressursmodulen. Vurderte alternativer:

| Alternativ | Vurdering |
|---|---|
| Egen komponent (CSS grid) | Eksakt treff for behovet: deterministiske ISO-ukekolonner, sticky navnekolonne og header, ekspanderbare rader, stolper som spenner over kolonner. Ingen dra-og-slipp nødvendig. Full Fluent v9-styling. Enkel PNG-eksport (ren DOM). **Valgt.** |
| Fluent v9 `DataGrid`/`Table` | Frosset kolonne + stolper over N kolonner + nestede underrader kjemper mot tabellmodellen. |
| `@tanstack/react-virtual` | Kun radvirtualisering (MIT, React 17-kompatibel, ~4 kB). **Valgfritt tillegg** dersom målt behov over ~300 rader; med «kun aktive i perioden» på som standard er radantallet normalt under 200. |
| `react-calendar-timeline` 0.30 (community) | Samme arkitektur som 0.28, krever fortsatt `moment` + `interactjs`, ingen aggregerte celler per uke. |
| `vis-timeline` | Imperativt, ikke React, ~400 kB, ingen aggregeringsgrid. |
| `dhtmlx-gantt` | GPL v2 i gratisutgaven eller kommersiell lisens – uegnet. |
| `frappe-gantt`, `gantt-task-react`, `@svar-ui/react-gantt` | Oppgave-gantt uten ressursbelastning per uke; `@svar-ui` krever React 18. |
| `planby` | EPG-modell (timeslots), delvis kommersiell. |

Komponenten `ResourceGrid` legges i `shared-library` slik at portefølje og prosjekt deler kode. Ukevisning er obligatorisk; månedsvisning leveres som granularitetsbytte i samme komponent (bøttene bygges av samme funksjon).

**Prosjekttidslinje beholder `react-calendar-timeline`** i denne omgangen (webdelene `PortfolioWebParts/projectTimeline`, `ProjectWebParts/projectTimeline`, `ProgramWebParts/programTimeline`). Migrering av disse og fjerning av avhengigheten fra `shared-library/package.json` er eget oppfølgingspunkt (fase 2).

### D3. Datamodell

Gjenbrukte områdekolonner: `GtResourceUser`, `GtResourceRole` (taksonomi, termsett `54da9f47-c64e-4a26-80f3-4d3c3fa1b7b2`), `GtStartDate`, `GtEndDate`, `GtResourceLoad` (prosent, lagres som brøk), `GtAllocationComment`, `GtSiteIdLookup`, `GtResourceAbsence`, `GtResourceAbsenceComment`, `GtDescription`.

Endret områdekolonne: `GtAllocationStatus` får valgene `Approved` og `Cancelled` i tillegg til dagens `Requested / Assigned / Rejected / Other`. Statusmaskin: `Requested → Approved → Assigned`; `Requested/Approved → Rejected`; alle → `Cancelled` (av forespørrer). `Other` beholdes for legacy.

Nye områdekolonner i `Templates/Portfolio/Objects/SiteFields/ResourceAllocation/` (GUID-er genereres ved implementering):

| Internt navn | Type | Formål |
|---|---|---|
| `GtTimelineElementLookup` | Lookup → `Tidslinjeinnhold` (`ShowField="Title"`, `RelationshipDeleteBehavior="None"`) | Kobling til fase/tidslinjeelement |
| `GtFollowElementDates` | Boolean | Følg elementets datoer |
| `GtRequestedBy`, `GtRequestedDate` | User, DateOnly | Hvem meldte behovet, når |
| `GtApprovedBy`, `GtApprovedDate` | User, DateOnly | Ressurskontorets beslutning |
| `GtAllocationDecisionComment` | Note | Begrunnelse ved avvisning/justering |
| `GtAllocationSourceRef` | Text, indeksert, skjult i skjema | Migreringsnøkkel `<prosjektSiteId>:<legacyItemId>` |
| `GtResourceCompetence` | TaxonomyFieldTypeMulti, samme termsett | Personens kompetanser (pool) |
| `GtResourceCapacity` | Number (prosent), default 1 | Kapasitet (100 % = full stilling) |
| `GtResourceDepartment` | Text | Forhåndsutfylt fra brukerprofil (`Department`) |
| `GtResourceActive` | Boolean, default 1 | Myk sletting fra pool |

Nye innholdstyper (`Objects/ContentTypes/`):

- `Prosjektallokering.xml` – **ny ID** (ikke gjenbruk av `0x010004EAFF…`, slik at migrering, søk og webdeler kan skille legacy fra hubelementer). Felt i rekkefølge: `Title` (skjult), `GtSiteIdLookup` (påkrevd), `GtResourceRole` (påkrevd), `GtResourceUser` (valgfri – tom betyr «ubesatt rolle»), `GtStartDate`, `GtEndDate` (påkrevd), `GtResourceLoad` (påkrevd), `GtTimelineElementLookup`, `GtFollowElementDates`, `GtAllocationStatus`, `GtAllocationComment`, `GtRequestedBy`, `GtRequestedDate`, `GtApprovedBy`, `GtApprovedDate`, `GtAllocationDecisionComment`, `GtAllocationSourceRef` (skjult).
- `Ressurs.xml` – for `Ressurspool`: `Title`, `GtResourceUser` (påkrevd), `GtResourceRole` (primærrolle), `GtResourceCompetence`, `GtResourceCapacity`, `GtResourceDepartment`, `GtResourceActive`, `GtDescription`.
- Eksisterende `Ressursallokering.xml` (`0x010029F45E…`) beholdes uendret for linje/fravær.

Ny liste `Objects/Lists/Ressurspool.xml` (TemplateType 100, CT `Ressurs`, visninger Alle / Aktive / Per rolle, sikkerhet: standard + `Ressurskontor` Edit).

Bevisste utelatelser:

- **Ikke eget `GtAllocationKind`-felt.** Type (prosjekt / linje / fravær) avledes av innholdstype og `GtResourceAbsence` (`Linjeoppgaver` → linje, øvrige → fravær). Dagens webdel skiller allerede på `ContentTypeId`; et redundant valgfelt inviterer til inkonsistens.
- **Ikke eget kompetanse-termsett.** Etterspurt rolle (`GtResourceRole`, én verdi) og personens kompetanse (`GtResourceCompetence`, flere verdier) bruker samme termsett «Ressursroller», slik at matching mellom behov og person er triviell og kunden vedlikeholder én vokabular. Finere inndeling løses med undertermer. Dermed trengs ingen `Templates/Upgrade/1.15.0`-taksonomidelta.

### D4. Kobling til prosjekt og tidslinjeelementer

En allokering knyttes først til prosjekt (`GtSiteIdLookup`). Deretter kan den valgfritt knyttes til et tidslinjeelement i `Tidslinjeinnhold` som tilhører prosjektet (spørring `GtSiteIdLookup/GtSiteId eq '<siteId>'`, samme mønster som `ProjectWebParts/src/components/ProjectTimeline/data/fetchTimelineData.ts`). Bryteren «Følg elementets datoer» kopierer elementets datoer og låser datofeltene; ved lasting sammenlignes datoene, og avvik skrives tilbake til allokeringen (write-through) slik at portefølje og eksport alltid viser gjeldende datoer. Faser som ikke finnes som tidslinjeelementer knyttes ikke direkte; kunder som vil allokere per fase legger fasene inn i prosjektets tidslinje (standardinnhold i `Tidslinjeelementer`).

### D5. Roller, tilganger og innstillinger

- Ny SharePoint-gruppe `Ressurskontor` i `Objects/Security.xml` (eier `{associatedownergroupid}`).
- Ny prosjektadministrasjonstilgang `RequestResources` (rad i `Lists/Prosjektadministrasjonstilganger.xml`, enum i `shared-library/src/data/SPDataAdapterBase/types.ts`), tildelt prosjektleder/eier/støtte/prosjektkontor i oppgraderingsskriptet etter mønsteret for `AssistantAccess` (1.13.0).
- Globale innstillinger (`Lists/Globale innstillinger.xml`, ny kategori Ressursstyring): `ResourceManagementEnabled` (1), `ResourceOfficeGroup` (gruppenavn, default `Ressurskontor`), `ResourcePoolMode` (`pool` | `hubmembers` | `group`), `ResourcePoolGroup`, `ResourceAllocationRequireApproval` (1), `ResourceAllocationShowOnlyActive` (1).
- Lesetilgang: alle med hubtilgang. Forespørsel: hubmedlemmer (Contribute + rediger egne) med UI-gating på `RequestResources`. Godkjenne/tildele/avvise/redigere alt: medlemmer av gruppen i `ResourceOfficeGroup`. Kansellere: forespørrer eller ressurskontor. UI sjekker gruppemedlemskap via `sp.web.currentUser` + `siteUsers.getById().groups` (cache per sesjon) og skjuler knapper; serveren håndhever uansett.

### D6. Snapshot og historikk (v1)

Eksport av gjeldende visning som **PNG** og **XLSX** fra verktøylinjen, nedlasting i nettleser. PNG via `html-to-image` (MIT, vedlikeholdt, foreignObject-tilnærming, håndterer CSS custom properties fra Fluent-tokens; erstatter det uvedlikeholdte `dom-to-image` som `useCaptureReportSnapshot.ts` bruker i dag). XLSX via utvidelse av `shared-library/src/services/ExcelExportService` med `exportSheets(sheets, fileNamePart)` (gjenbruker `xlsx` + `file-saver` som allerede ligger i shared-library). Lagring i et hubbibliotek `Ressurssnapshots` med planlagt-vs-faktisk-sammenligning er fase 2.

---

## Implementation

### 1. Templates (`Templates/Portfolio/`)

Alle strenger legges i **både** `Resources.no-NB.resx` og `Resources.en-US.resx`; `npm run build` i `Templates/` regenererer `src/loc/shared/*` for SPFx-løsningene.

- `Objects/SiteFields/ResourceAllocation/` – 12 nye feltfiler (D3), `GtAllocationStatus.xml` utvides; alle registreres i `Objects/SiteFields/@.xml`.
- `Objects/ContentTypes/Prosjektallokering.xml`, `Objects/ContentTypes/Ressurs.xml`; registreres i `ContentTypes/@.xml`.
- `Objects/Lists/Ressursallokering.xml` (endres): ny CT-binding som `Default="true"`, `WriteSecurity="2"`, ny `Objects/Lists/Security/ResourceAllocationSecurity.xml` (eiere Full Control, besøkende Read, medlemmer Contribute, `Ressurskontor` Edit), visninger `Alle elementer` (oppdatert), `Forespurte`, `Mine`, `Aktive`, `Per prosjekt` (gruppert på `GtSiteIdLookup`), `Linjearbeid og fravær`. Tittel/URL beholdes (URL-stabilitet for eksisterende lenker og navigasjon).
- `Objects/Lists/Ressurspool.xml` (ny) + `Security/ResourcePoolSecurity.xml`; registreres i `Lists/@.xml`.
- `Objects/Lists/Datakilder.xml`: rad `22880c29-…` får ny spørring `(ContentTypeId:0x0100<NY-CT>* OR ContentTypeId:0x010029F45E…*) DepartmentId:{{sitecollectionid}}` (gjelder nyinstallasjoner; eksisterende oppdateres i skript). Rad `fbe4dcc8-…` beholdes men merkes utgått ved oppgradering.
- `Objects/Lists/Prosjektinnholdskolonner.xml`: nye rader (nøkkel `GtInternalName`) for `GtTimelineElementLookup`, `GtRequestedBy`, `GtApprovedBy`, `GtRequestedDate`, `GtSiteIdLookup` (kontroller først at `GtSiteIdLookup` ikke allerede finnes som rad for en annen kategori).
- `Objects/ClientSidePages/Ressursstyring.xml` (ny, `SingleWebPartAppPage`, `Overwrite="false"`) med den nye porteføljewebdelen; registreres i `ClientSidePages/@.xml`. Dagens `Ressursallokering.xml`-side beholdes én release som «legacy-visning».
- `Objects/Navigation.xml`: ny node «Ressursstyring» etter dagens Ressursallokering-node (nyinstallasjoner; oppgradering via skript siden Navigation-handleren er ekskludert).
- `Objects/Security.xml`: gruppen `Ressurskontor`.
- `Objects/Lists/Globale innstillinger.xml`: seks rader (D5), faste `GtSettingsId`.
- `Objects/Lists/Prosjektadministrasjonstilganger.xml`: rad `RequestResources`.
- `Objects/Lists/Hjelpeinnhold.xml`: ny porteføljerad `Lists_HelpContent_ResourceManagementUserManual`; prosjektraden `…ResourceAllocationProjectUserManual` pekes til den nye prosjektsiden (`UpdateBehavior="Overwrite"` gjør at dette slår inn ved oppgradering).
- `Install/SearchConfiguration.xml`: forvaltede egenskaper `RefinableString75 ← ows_GtSiteIdLookup`, `RefinableString76 ← ows_GtTimelineElementLookup`, `RefinableString77 ← ows_GtAllocationStatus` (kun for overgangs-/aggregeringsvisninger; primær-UI er REST).

### 2. JSON-prosjektmaler (`Templates/JsonTemplates/`)

- `_JsonTemplateProject.json`: ny side `{{ClientSidePages_ResourceAllocation_PageName}}` (`SingleWebPartAppPage`) med kontroll `{{ControlId_ProjectResourceAllocationWebPart}}` og egenskaper `{"mode":"project"}`; navigasjonsnoden (ca. linje 557) peker til siden via endret `Navigation_ResourceAllocation_Url`; lokal liste `Ressursallokering` (ca. linje 1461) og CT `0x010004EAFF…` (ca. linje 432) fjernes fra malen (eksisterende områder påvirkes ikke – JSON-provisjonering sletter aldri). Verifiser med grep at ingen andre lister i malen bruker feltene før de fjernes.
- `_JsonTemplateProgram.json` (ca. linje 433, 790–815, 1626) og `_JsonTemplateParent.json` (ca. linje 44, 161–186): `ProgramAggregation`-kontrollen på Ressursallokering-siden erstattes av prosjektwebdelen i `{"mode":"children"}`; lokal liste fjernes fra programmalen.
- `ControlId_*`-tokens genereres fra komponentnøklene i `channels/*.json` på tvers av alle løsninger (`Templates/.tasks/generate-project-templates.js`). Nøkkelen for den nye webdelen må derfor være unik: `ProjectResourceAllocationWebPart` (ikke `ResourceAllocationWebPart`, som allerede brukes av PortfolioWebParts).
- `npm run validate-project-template` i `Templates/`.

### 3. shared-library

**Modell og rene funksjoner**

- `src/interfaces/IResourceAllocation.ts`: `AllocationKind { Project, Line, Absence }`, `AllocationStatus { Requested, Approved, Assigned, Rejected, Cancelled, Other }`, `LoadLevel { None, Under, Full, Over, Unavailable }`, `ResourceGridGranularity = 'week' | 'month'`, `IResource` (id = UPN i småbokstaver eller `role:<rolle>` for ubesatte forespørsler, navn, avdeling, roller, kapasitet), `IAllocation` (id, resourceId, kind, status, tittel, prosjekt, rolle, `loadPercent` 0–100, `start`/`end` lokal midnatt inklusiv, tidslinjeelement, `source` med web/liste/element-id), `IWeekBucket` (nøkkel `2026-W39` / `2026-09`, start/slutt, etikett «21–27», gruppeetikett «september 2026», antall arbeidsdager, `isCurrent`), `IResourceLoadCell` (bøtte, `load`, `peakLoad`, `count`, `level`, allokerings-id-er), `IResourceGridRow`, `IResourceGridData`, `ILoadThresholds`.
- `src/util/resourceLoad/`: `dateHelpers.ts` (ISO-ukestart mandag, ukenummer/ukeår, månedsgrenser), `workingDays.ts` (man–fre; hook `isNonWorkingDay?` for helligdager som oppfølging), `buildBuckets.ts` (uke-/månedsbøtter; etiketter via `moment` for locale), `aggregateLoad.ts` (`computeCell`: bidrag = `loadPercent × overlappende arbeidsdager / bøttens arbeidsdager`; `load` = sum; `peakLoad` = maks samtidig belastning én arbeidsdag; `computeRows`), `loadLevel.ts` (`DEFAULT_LOAD_THRESHOLDS = { fullMin: 95, fullMax: 100 }`, kapasitet skalerer), `filterActive.ts`, `toResourceGridData.ts` (bygger ressurskart fra allokeringer + valgfri pool), `mapping.ts` (type fra CT + fraværsvalg, status fra valgtekst via `resource.Choice_GtAllocationStatus_*`, `GtResourceLoad` brøk × 100). Datoaritmetikk med ren `Date` slik at testene kjører i Node uten moment-locale.
- **Testoppsett (WP0).** Repoet har ingen testrunner i dag. `shared-library` får `jest@^29`, `ts-jest@^29`, `@types/jest`, `jest.config.js` (`preset: ts-jest`, `testEnvironment: node`, `roots: ['<rootDir>/src/util/resourceLoad']`), `tsconfig.test.json` (`module: commonjs`) og script `"test": "jest"`. `build` endres ikke, så `rush build` påvirkes ikke; `test` kjøres som eget CI-steg.

**Tjeneste**

- `src/services/ResourceAllocationService/`: typet CRUD mot hublisten (`PortalDataService.listNames` får `RESOURCE_ALLOCATION`, `RESOURCE_POOL`), periodevindu-spørringer på indekserte kolonner med `getPaged`, statusmaskin (`approve`, `assign`, `reject`, `cancel` med sporingsfelt), pool-oppslag etter `ResourcePoolMode`, oppløsing av tidslinjeelementets datoer for `GtFollowElementDates`, taksonomiskriving (én verdi via PnPjs-objekt, flere verdier via skjult notatfelt `GtResourceCompetence_0`), og en **skjemaprobe** (`list.contentTypes` inneholder ny CT, `Ressurspool` finnes) som webdelene bruker til å vise en `UserMessage` når malen ikke er oppgradert (`-SkipTemplate`/apps-only).
- `src/services/ExcelExportService`: ny `exportSheets(sheets: IExcelExportSheet[], fileNamePart)` (gjenbruker `book_new/aoa_to_sheet/book_append_sheet/write/saveAs`).

**Komponent `src/components/ResourceGrid/`** (registreres i `components/index.ts`)

```
ResourceGrid/
├── index.ts, ResourceGrid.tsx, ResourceGrid.module.scss, useResourceGrid.ts, types.ts, context.ts, reducer.ts
├── GridHeader/        månedsrad + ukerad («21–27»), markering av gjeldende uke
├── ResourceRow/       sticky navnecelle (Persona, rolle-tag, chevron) + N LoadCell
├── AllocationRow/     underrad per allokering: stolpe med grid-column start/slutt, etikett, statusstil
├── LoadCell/          «83 % (2)», farge etter LoadLevel, aria-label, tooltip med nedbrytning
├── TodayMarker/       vertikal linje beregnet fra bøtteindeks + dagsforskyvning
├── Legend/            farger/mønstre for nivåer, typer og status
├── AllocationPopover/ detaljer + «Rediger» (Fluent v9 Popover; DetailsPopover gjenbrukes ikke – den er bundet til .rct-scroll)
├── ToolbarItems/      useToolbarItems.tsx (ListMenuItem: filter, uke/måned, i dag, ‹ periode ›, «kun aktive», søk via setSearchBox, «Ny allokering», eksport)
└── AllocationFormDrawer/  Fluent v9 OverlayDrawer for ny/rediger (delt av begge webdeler), validation.ts
```

Tilstand i `reducer.ts` (Redux Toolkit `createReducer`): `rangeStart`, `granularity`, `count`, `expanded`, `search`, `onlyActive`, `activeFilters`, `popover`, `showFilterPanel`. Avledet med `useMemo`: `buckets`, synlige ressurser, `rows = computeRows(...)`, i-dag-forskyvning. Layout: `grid-template-columns: <sidebar>px repeat(N, minmax(<min>px, 1fr))`, `position: sticky` for første kolonne og header. Tastatur: navnecelle er `button` med `aria-expanded`; celler har `aria-label` «Uke 39: 83 % fordelt på 2 allokeringer».

**Skjema (`AllocationFormDrawer`)**

| Felt | Kontroll | Regler |
|---|---|---|
| Type | `RadioGroup` (kun porteføljemodus) | påkrevd |
| Prosjekt | `Combobox` over hubens `Prosjekter` (porteføljemodus) | påkrevd for prosjekt |
| Ressurs | `PeoplePicker` (`@pnp/spfx-controls-react`, brukes allerede i `CustomEditPanel`) | påkrevd for linje/fravær og for status Tildelt; valgfri for Forespurt |
| Rolle / kompetanse | `ModernTaxonomyPicker` mot termsett `54da9f47-…` | påkrevd for prosjekt |
| Tidslinjeelement | `Combobox` over prosjektets `Tidslinjeinnhold` (type + datoer) | valgfri |
| Følg elementets datoer | `Switch` | låser datofelt, kopierer datoer |
| Start / slutt | `DatePicker` (`@fluentui/react-datepicker-compat`) | påkrevd, `slutt ≥ start`, advarsel > 2 år |
| Belastning | `SpinButton` 5–100 steg 5 | påkrevd, lagres som `verdi / 100` |
| Status | `Dropdown` | default Forespurt; Godkjent/Tildelt/Avvist kun for ressurskontor; Tildelt krever ressurs |
| Fraværstype | `Dropdown` (`GtResourceAbsence`) | påkrevd for linje/fravær |
| Kommentar | `Textarea` | valgfri |
| Forhåndsvisning | `LoadCell`-stripe for ressursens berørte uker inkl. denne allokeringen | markerer overbelastning |

**Farger og legend (Fluent v9-tokens, satt som CSS-variabler fra `ResourceGrid.tsx` slik at `.module.scss` er statisk og PNG-eksport får oppløste farger)**

| Nivå / type | Fyll | Merknad |
|---|---|---|
| Full (95–100 %) | `colorPaletteGreenBackground3` | mål |
| Under (1–94 %) | `colorPaletteYellowBackground3` | |
| Over (> 100 %) | `colorPaletteRedBackground3` (101–120 `colorPaletteDarkOrangeBackground3`) | |
| Utilgjengelig (fravær ≥ 100 %) | `colorPaletteTealBackground2` | |
| Ingen | `colorNeutralBackground3`, tekst «–» | |
| Prosjektstolpe | heltrukket `colorBrandBackground2` | |
| Linjestolpe | `colorNeutralBackground4` med 45° striper | skilles uten farge |
| Fraværsstolpe | teal med prikket toppkant | |
| Status Forespurt | stiplet ramme, opacity .75, `QuestionCircle`-ikon | |
| Status Avvist / Kansellert | gjennomstreket, opacity .5, skjult som standardfilter | |

Prosenttekst vises alltid i cellen; tooltip og `aria-label` bærer samme informasjon (WCAG 1.4.1).

### 4. PortfolioWebParts – omskriving av `components/ResourceAllocation`

Webdel-id `2ef269b2-…` og siden `Ressursallokering.aspx` beholdes (eksisterende installasjoner virker). Ny porteføljeside `Ressursstyring.aspx` bruker samme webdel med `dataMode: "list"`.

- `index.tsx` → `index.ts` (kun barrel) + `ResourceAllocation.tsx` som rendrer `<ResourceGrid>` og `<AllocationFormDrawer>`.
- `useFilteredData.ts` og `useResourceAllocationDataFetch.ts` slettes. `enrichWithDepartmentInfo` flyttes til `data/enrichWithDepartment.ts` (UPN-er i bolker på 100), `transformGroups/transformItems` erstattes av `data/mapListItems.ts` → `IAllocation[]`.
- Datahenting: `ResourceAllocationService` (REST, periodevindu = synlig periode ± 1 bøtte) som primær; `data/fetchAllocationsFromSearch.ts` med `StartRow`-paginering (mønster `shared-library/src/data/searchAggregatedItems.ts`) som fallback for `dataMode: "search"` i overgangsperioden.
- Pool: `data/fetchResourcePool.ts` etter `ResourcePoolMode` (liste `Ressurspool`, hubmedlemmer, eller navngitt gruppe) → ressurser uten allokeringer vises når «kun aktive» er av.
- Verktøylinje: filter (rolle, avdeling, prosjekt, status, type), uke/måned, i dag, ‹ periode ›, «kun aktive i perioden» (default på), søk, «Ny allokering», «Eksporter ▾» (PNG / Excel).
- Ressurskontor-flyt: godkjenn/tildel/avvis i `AllocationFormDrawer` med personvalg fra pool sortert på kompetansetreff og gjeldende belastning i perioden.
- Egenskapsrute: `defaultWeeks` (8/12/16/26), `defaultGranularity`, `dataMode`, brytere for legend/eksport/ny allokering/statusendring. Dagens `defaultTimeframeStart/End` tolkes om til uker for eksisterende instanser.
- `interfaces/IAllocationSearchResult.ts` utvides med `ListItemID`, `ListID`, `Path`, `GtResourceAbsenceCommentOWSMTXT` for søk-fallback.

### 5. ProjectWebParts – ny webdel `webparts/resourceAllocation`

- `manifest.json`: ny GUID, `alias: "ProjectResourceAllocationWebPart"`, `hiddenFromToolbox: true`, tittel «Ressursallokering», ikon `PeopleTeam`, forhåndskonfigurert `mode: "project"`. Bundle i `config/config.json`. Komponent-id registreres i `channels/*.json` under ProjectWebParts (leses av oppgraderingsskript via `$global:__CurrentChannelConfig.spfx.solutions.ProjectWebParts.components.ProjectResourceAllocation`).
- `webparts/resourceAllocation/index.ts` utvider `BaseProjectWebPart` (mønster `webparts/projectTimeline/index.ts`); egenskapsrute: `mode` (`project` | `children`), `defaultWeeks`, brytere.
- `components/ResourceAllocation/`: `data/fetchAllocations.ts` (hubliste via `SPDataAdapter.portalDataService.web`, filter `GtSiteIdLookup/GtSiteId eq '<siteId>'`, eller `in (<underprosjekt-id-er>)` i `children`-modus), `data/fetchTimelineElements.ts` (guard på `portalDataService.isAvailable`, som `ProjectTimeline/data/fetchData.ts`), `data/syncFollowedDates.ts`, `data/mapListItems.ts`.
- Skjema i prosjektmodus: type fast = prosjekt, prosjekt fast = gjeldende område; «Be om ressurs» gates på `RequestResources`. Hub utilgjengelig → grid vises fortsatt, elementvelger skjules, `UserMessage` forklarer.
- Fersk data via REST; etter lagring hentes listen på nytt.

### 6. Lokalisering

Triaden `myStrings.d.ts` / `nb-no.js` / `en-us.js` må balanseres i hver løsning; kjør `npm run validate-loc`.

- **shared-library:** `ResourceGrid*` (uke/måned/i dag/forrige/neste/kun aktive/søk/ny/rediger/eksport PNG/Excel/utvid alle/slå sammen/ingen ressurser/aria/tooltip/ubesatt-prefiks/kapasitet), `Legend*` (tittel, fem nivåer, tre typer, forespurt), `AllocationKind*`, `AllocationStatus*` (seks statuser), `AllocationForm*` (titler, etiketter, lagre/avbryt/lagrer/feil), `AllocationValidation*` (ressurs, rolle, prosjekt, datoer, slutt før start, belastningsintervall, ressurs ved tildelt, fraværstype), `ExcelSheet*`/`ExcelColumn*`, `PngExport*`. Gjenbrukes: `FilterText`, `RoleLabel`, `DepartmentLabel`, `ResourceLabel`, `ResourceAbsenceLabel`, `StartDateLabel`, `EndDateLabel`, `AllocationStatusLabel`, `AllocationPercetageLabel`, `CommentLabel`.
- **PortfolioWebParts:** `ResourceAllocationDefaultWeeksLabel`, `…DefaultGranularityLabel`, `…DataModeLabel`, `…ShowLegendLabel`, `…ShowExportLabel`, `…AllowNewAllocationLabel`, `…AllowStatusChangeLabel`, `…SchemaNotUpgradedText`, `…NoPermissionText`, `…KindFilterLabel`, `…StatusFilterLabel`, `…SelectProjectLabel`.
- **ProjectWebParts:** `ResourceAllocationGroupName`, `…InfoText`, `…ModeLabel`, `…DefaultWeeksLabel`, `…ShowLegendLabel`, `…ShowExportLabel`, `…AllowEditLabel`, `…ErrorFetchText`, `…NoHubAccessText`, `…SchemaNotUpgradedText`, `…FollowedDatesSyncedText`.
- **Templates resx:** alle nøkler i seksjon 1, inkl. `ContentTypes_ProjectAllocation_*`, `ContentTypes_Resource_*`, `Lists_ResourcePool_*`, `View_ResourceAllocation_*`, `ClientSidePages_ResourceManagement_*`, `Security_SiteGroup_ResourceOffice_*`, `Lists_Global_Settings_Category_ResourceManagement*`, `SiteFields_Gt*` for nye felt, `Choice_GtAllocationStatus_Approved/_Cancelled`.

### 7. Fjerning av `react-calendar-timeline` fra ressursmodulen

Slettes/endres: `PortfolioWebParts/src/components/ResourceAllocation/{useFilteredData.ts, useResourceAllocationDataFetch.ts}`, `Timeline`-import, `itemColor`/`itemAbsenceColor`-egenskaper, moment-tuppelen `defaultTimeframe`.

Blir (brukes av Prosjekttidslinje i tre løsninger): `shared-library/src/components/ProjectTimeline/**`, `ITimelineItem/ITimelineGroup/ITimelineData`, avhengighetene `react-calendar-timeline` + `@types/react-calendar-timeline` i `shared-library/package.json`, radene i `SBOM.md`. Feltene `role/resource/resourceUpn/department/allocation/status` i `ITimelineItemData` blir ubrukte men harmløse.

**Oppfølging (eget issue, fase 2):** migrer `PortfolioWebParts/projectTimeline`, `ProjectWebParts/components/ProjectTimeline` og `ProgramWebParts/programTimeline` til en egenutviklet tidslinje (stolper, milepæler/diamanter, zoom) basert på `ResourceGrid`-primitivene, fjern avhengigheten, `Timeline.css`-importen og `interactjs`/`moment`-bruken, oppdater `SBOM.md`, og rydd `DetailsPopover.tsx`.

### 8. Oppgraderingssti 1.14.0 → 1.15.0

**Automatisk i `Install.ps1 -Upgrade`** (Portfolio.pnp kjøres med kun `Navigation`, `SupportedUILanguages` og `Files` ekskludert, så Fields/ContentTypes/Lists/Security/ClientSidePages-handlerne kjører): nye områdekolonner, utvidet `GtAllocationStatus`, nye innholdstyper, CT-binding + visninger + `WriteSecurity` + rolletildelinger på hublisten, `Ressurspool`, gruppen `Ressurskontor`, siden `Ressursstyring.aspx`, nye rader i Datakilder / Prosjektinnholdskolonner / Globale innstillinger / Prosjektadministrasjonstilganger (`UpdateBehavior="Skip"`), overskrevne hjelperader. `Set-PnPSearchConfiguration` importerer nye forvaltede egenskaper. Ingen `PreInstallUpgrade`-blokk trengs (ingen taksonomidelta, ingen listeomdøping).

**`Install/Scripts/PostInstallUpgrade.ps1`** – ny blokk `if ($PreviousVersion -lt [version]"1.15.0" -and -not $SkipTemplate.IsPresent)`:

1. Navigasjonsnode «Ressursstyring» (`Add-PnPNavigationNode`, mønster fra 1.2.7-blokken, med eksistenssjekk).
2. Listeindekser på hublisten `Ressursallokering` (`Set-PnPField -List … -Values @{Indexed=$true}` for `GtStartDate`, `GtEndDate`, `GtResourceUser`, `GtSiteIdLookup`, `GtAllocationStatus`) og `GtResourceUser` på `Ressurspool`. Indeksene settes på listeinstansen, ikke områdekolonnen, for å unngå indeksering i alle andre hublister.
3. Defensiv sikring av `Ressurskontor`-rolletildelingen og de seks globale innstillingene (mønster `AssistantAccessMode`, nøkkel `GtSettingsId`).
4. Datakilder: `Set-PnPListItem` på rad `22880c29-…` med ny spørring; `GtDataSourceDeprecated = 1` på `fbe4dcc8-…`.
5. Tildel `RequestResources` til adminrollene (1.13.0-løkken for `AssistantAccess`).
6. Tilstandsstyrt advarsel dersom ny CT ikke er bundet til hublisten (mal feilet eller `-SkipTemplate`).

**Eksisterende prosjektområder – `Install/Scripts/UpgradeAllSitesToLatest/EnsureResourceAllocationPage.ps1`** (`$TargetVersion = 1.15.0`, mønster `EnsureProjectTimelinePage.ps1` + `EnsureRiskActionPlanner.ps1`): komponent-id fra kanalkonfig med fallback; opprett `Ressursallokering.aspx` (`Add-PnPPage -LayoutType SingleWebPartAppPage`, `Add-PnPPageWebPart -Component <id> -WebPartProperties '{"mode":"project"}'`, eller `children` når `Prosjektegenskaper` har `GtIsParentProject`/`GtIsProgram`); pek QuickLaunch-noden som i dag går til `Lists/Ressursallokering/AllItems.aspx` (nb) / `Lists/Resource Allocation/AllItems.aspx` (en) til siden, eller legg til node; idempotent.

**Datamigrering – `Install/Scripts/MigrateResourceAllocations.ps1`** (frittstående, kan kjøres flere ganger; trenger to tilkoblinger): parametre `-Url`, `-ClientId`, `-Tenant`, `-CertificateBase64Encoded`, `-CI`, `-Sites <string[]>`, `-WhatIf`, `-KeepLegacyVisible`.

1. Koble til hub; les `Prosjekter` (`GtSiteId`, `Id`), ny CT-id, eksisterende `GtAllocationSourceRef`-verdier (paginert CAML på indeksert felt), termsettet `Ressursroller` (etikett → GUID).
2. Enumerer hub-tilknyttede `GROUP#0`-områder (samme kode som `UpgradeAllSitesToLatest.ps1`).
3. Per område: finn `Prosjekter`-rad via `GtSiteId` (hopp over + advarsel hvis mangler); les lokal `Ressursallokering` (hopp over hvis mangler).
4. Per element: nøkkel `<siteId>:<Id>`; hopp over hvis finnes i hub. Verdier: ny CT, `GtSiteIdLookup`, `GtResourceUser`/`GtRequestedBy` løst på **hub-weben** via `New-PnPUser -LoginName` (bruker-id-er er ulike per områdesamling), `GtResourceRole` som `"<etikett>|<termGuid>"`, datoer, belastning, status (uten person og status Tildelt → Forespurt med beslutningskommentar «Migrert uten person»), kommentar, `GtRequestedDate = Created`, `GtAllocationSourceRef`, `Title`. Aldri kast på enkeltfeil; tell suksess/feil.
5. Når et område er fullstendig migrert uten feil og ikke `-KeepLegacyVisible`: `Set-PnPList -Hidden $true -NoCrawl`, fjern QuickLaunch-node som fortsatt peker på listen. Listen beholdes som arkiv.
6. CSV per område + transkript, vedlegg på `Installasjonslogg` (som `UpgradeAllSitesToLatest.ps1`).

**Runbook for kunden**

1. `.\Install.ps1 -Url <hub> -Upgrade` (full oppgradering, **ikke** `-SkipTemplate`).
2. `.\Scripts\UpgradeAllSitesToLatest.ps1 -Url <hub>` (side + navigasjon på alle prosjektområder).
3. `.\Scripts\MigrateResourceAllocations.ps1 -Url <hub> -WhatIf`, gå gjennom CSV, kjør uten `-WhatIf`.
4. Legg ressurskontorets brukere i gruppen `Ressurskontor`; sørg for at prosjektledere er hubmedlemmer (eller sett `ResourcePoolMode`); fyll `Ressurspool`.
5. Vent på søkeindeksering før legacy-siden brukes.

**Apps-only-forbehold.** En release bygget med `[apps-only]` (eller `Install.ps1 -SkipTemplate`) deployer kun `.sppkg` og hopper over maler. Webdelene kjører da mot en hub uten ny CT/felt/liste. Skjemaproben i `ResourceAllocationService` gjør at webdelene viser en tydelig `UserMessage` («Ressursstyring krever oppgradert mal – kjør Install.ps1 -Upgrade uten -SkipTemplate»), og all 1.15.0-kode i `PostInstallUpgrade.ps1` som berører nytt skjema er gated på `-not $SkipTemplate.IsPresent`. Denne funksjonen skal aldri utgis som apps-only.

### 9. Faser

**Fase 1 – v1 (1.15.0):** `ResourceGrid`, portefølje- og prosjektwebdel, sentralt register med forespørsel → godkjenning → tildeling, kobling til tidslinjeelementer med «følg datoer», ressurspool og kompetanse, farger for linje/prosjekt/status, «kun aktive i perioden», uke- og månedsvisning, PNG/XLSX-eksport, migrering og oppgraderingssti, dokumentasjon.

**Fase 2:** snapshot-bibliotek `Ressurssnapshots` (planlagt vs. faktisk, lagring på forespørsel og periodisk, sammenligning mellom to snapshots), kapasitets-/heatmap-visning per rolle med `GtResourceCapacity`, poolforvaltnings-UI med import fra gruppe/avdeling, helligdagskalender for arbeidsdagsvekting, resynk-skript for `GtFollowElementDates`, og migrering av Prosjekttidslinje av `react-calendar-timeline` med fjerning av avhengigheten.

**Fase 3 – Assistent:** porteføljeoperasjon «Ressursanalyse». Assistenten er i dag en `iframe` mot en ekstern backend (`PortfolioExtensions/src/components/Footer/Assistant/`, `EndpointUrl` i Globale innstillinger); operasjoner defineres server-side og styres per tenant via `DisabledOperations` og `PortfolioAccessGroups` i `AssistantConfig` (`Install/Scripts/Setup-PPAssistant.ps1`). Operasjonen spør hublistene `Ressursallokering` (status Godkjent/Tildelt, periodevindu), `Ressurspool` (kapasitet, kompetanse), `Prosjekter` (fase, livssyklus, prosjektleder) og `Tidslinjeinnhold` (fasedatoer), og svarer på flaskehalser (roller/personer over kapasitet per måned), forespørsler uten svar over N dager, ubesatt etterspørsel per rolle og trend per fase. I dette repoet: dokumentasjon av konfigurasjonsnøklene, hjelpeinnhold og gating på `Ressurskontor`; ingen kodeendring i `Footer/Assistant`.

### 10. Arbeidspakker og estimat (senior SPFx/PnP-utvikler)

| WP | Innhold | Timer |
|---|---|---|
| 0 | Jest/ts-jest i shared-library, `html-to-image`, `rush update`, tsconfig.test | 4 |
| 1 | Områdekolonner, CT-er, hublisteendringer, `Ressurspool`, visninger, sikkerhets-XML, resx (begge), Datakilder/kolonner/hjelperader, hubside + navigasjon, SearchConfiguration | 32 |
| 2 | Globale innstillinger, `Ressurskontor`, adminrettighet + enum, `PostInstallUpgrade` 1.15.0-blokk | 12 |
| 3 | Domenetyper, `util/resourceLoad/*`, mapping, enhetstester | 16 |
| 4 | `ResourceAllocationService` + modeller, `PortalDataService`-listenavn, pool, tidslinjeelement-datoer, statusmaskin, skjemaprobe | 32 |
| 5 | `ResourceGrid`-kjerne: layout, header, rader, celler, ekspandering, stolper, i-dag-markør, popover, legend, periode/granularitet, SCSS | 40 |
| 6 | Verktøylinje, `FilterPanel`-kobling, søk, «kun aktive», tilgjengelighet | 12 |
| 7 | Porteføljewebdel: REST-datahenting med søk-fallback, avdelingsberikelse, pool, egenskapsrute, fjerning av RCT, tilgangssjekk, godkjenningsflyt | 32 |
| 8 | `AllocationFormDrawer` (begge modi), pickers, validering, lagring, forhåndsvisning | 24 |
| 9 | Prosjektwebdel: manifest/bundle/base, hubliste-henting, tidslinjeelementer, følg-datoer-synk, `children`-modus | 20 |
| 10 | PNG + XLSX-eksport (`exportSheets`, arkbygger, print-modus) | 10 |
| 11 | `MigrateResourceAllocations.ps1`, `EnsureResourceAllocationPage.ps1`, kanalkonfig | 32 |
| 12 | JSON-maler (prosjekt/program/overordnet), ProjectSetup/ReRunSetup-regresjon | 12 |
| 13 | Lokalisering i tre løsninger + resx, `.development-guide`, README-komponenttabell, `SBOM.md` | 8 |
| 14 | `docs/plans`, CHANGELOG, releasenotes, hjelpeinnhold, runbook | 12 |
| 15 | Ende-til-ende-test i dev-tenant: fersk installasjon, 1.14→1.15-øvelse med legacy-data, migrering dry-run, tilgangsmatrise, eksport, Teams | 40 |
| | **Sum fase 1** | **338** |

Fase 2 anslås til ~210 t (snapshot-bibliotek 40, kapasitets-/heatmap 40, pool-UI 40, Prosjekttidslinje-migrering 80, resynk 10). Fase 3: ~24 t i dette repoet, ~80 t i assistent-backend.

Rekkefølge: WP0 → WP1/2 og WP3 parallelt → WP4 → WP5/6 parallelt med WP8 → WP7 og WP9 parallelt → WP10 → WP11/12 → WP13/14 → WP15.

### 11. Release-artefakter

- `CHANGELOG.md` 1.15.0, «Ny funksjonalitet»: **Ressursstyring.** Sentralt register for ressursforespørsler og -allokeringer i huben, ny `Ressurspool`, ny gruppe `Ressurskontor`, forespørsel/godkjenning/tildeling, kobling til tidslinjeelementer, ny porteføljeside `Ressursstyring`, ny prosjektside `Ressursallokering`, eksport til PNG/Excel. Migreringsskript `MigrateResourceAllocations.ps1`. Under «Forbedringer»: nye statusvalg, listeindekser. Eksplisitt oppgraderingsnote: full maloppgradering kreves, ikke apps-only.
- `releasenotes/1.15.0.md`: nytt høydepunkt «Ressursstyring» med «Slik fungerer det», «Roller og tilganger», «Migrering av eksisterende allokeringer», «Verdt å vite» (legacy-liste skjult, søkeforsinkelse på legacy-side), skjermbilder i `releasenotes/assets/1.15/`.
- Hjelpeinnhold som i seksjon 1.

## Edge cases

- Tom pool eller `ResourcePoolMode = hubmembers` med store medlemsgrupper → pool hentes paginert og caches per sesjon; «kun aktive» skjuler dem uansett som standard.
- Prosjektområde uten rad i `Prosjekter` → migrering hopper over og rapporterer; prosjektwebdel viser melding om manglende hubkobling.
- Prosjekt slettes fra `Prosjekter` (`RelationshipDeleteBehavior=None`) → allokeringer blir foreldreløse; visning «Uten prosjekt» for ressurskontoret.
- Hublisten passerer 5 000 → alle spørringer er vindusbaserte på indekserte kolonner; uindekserte ad hoc-filtre unngås.
- Hub utilgjengelig fra prosjektområdet (bruker uten hubtilgang) → grid vises fra det som er lesbart, elementvelger skjules, tydelig melding.
- `-SkipTemplate`/apps-only → skjemaprobe og `UserMessage`, ingen krasj.
- Forespørsel uten person → rad «Ubesatt: <rolle>» i gridet; status Tildelt krever person.
- Følg-datoer der elementet er slettet → bryteren slås av automatisk, datoene beholdes, brukeren varsles.
- Uke 53 og årsskifte (2026 har 53 ISO-uker) → etikett «29–4», gruppeetikett bytter måned/år midt i bøtten.
- Deltidsallokering innen én uke (ons–fre 50 %) → bidrag 30 % i uken; `peakLoad` viser 50 %.
- Kapasitet 50 % (deltid) → 50 % belastning vises som Full.
- Bruker-id-er på tvers av områdesamlinger i migrering → løses via `LoginName` på hub.
- Taksonomi multi-verdi (`GtResourceCompetence`) → skrives via skjult notatfelt; dekkes av tjenestetester.

## Verification

**Enhetstester** (`shared-library/src/util/resourceLoad/__tests__/`): ISO-ukestart søn/man-grense, uke 53, årsskifte-etikett; arbeidsdager (hel uke = 5, lør–søn = 0, fre–man = 2); 8 ukebøtter fra 2026-09-21 til 2026-11-15; månedsbøtter; aggregering (100 % → Full; 50 + 50 → «100 (2)»; 50 % ons–fre → 30; 80 + 40 → 120 Over; fravær 100 % → Utilgjengelig; 0 → Ingen; terskel 95; kapasitet 50; `peakLoad` vs snitt ved overlapp); `toResourceGridData` (gruppering på UPN uavhengig av store/små bokstaver, ubesatt rolle-rad, poolressurser uten allokeringer, `filterActive`); mapping (type fra CT + fraværsvalg, status fra norsk valgtekst, brøk × 100).

**Manuelt testskript (dev-tenant):**

1. Fersk installasjon 1.15.0: hubliste med to CT-er, `Ressurspool`, gruppe, side, navigasjon, innstillinger; prosjektmal gir side `Ressursallokering.aspx` uten lokal liste.
2. Oppgraderingsøvelse 1.14.0 → 1.15.0 med legacy-data i tre prosjektområder: `Install.ps1 -Upgrade`, `UpgradeAllSitesToLatest.ps1`, `MigrateResourceAllocations.ps1 -WhatIf` → CSV korrekt → ekte kjøring → hubelementer med riktig prosjekt, person, rolle, status; legacy-lister skjult; kjør migrering på nytt → 0 nye elementer.
3. Porteføljeside: standard ukevisning 8 uker fra forrige mandag, i-dag-markør riktig dag, header «september 2026 / 21–27»; person med 50 % + 33 % → «83 % (2)» gul; 100 % grønn; 120 % rød; fravær hel uke teal; ekspander → stolper over riktige uker; Forespurt stiplet.
4. Uke/måned, ‹ ›, i dag; «kun aktive» av → poolressurser uten allokeringer vises.
5. Filtre (rolle, avdeling, prosjekt, status, type) kombineres med OG; søk på navn/UPN.
6. Ressurskontor: godkjenn forespørsel, tildel person fra pool (sortert på kompetansetreff og belastning), avvis med kommentar; sporingsfelt fylles; bruker utenfor gruppen ser ikke knappene og får 403 ved direkte forsøk.
7. Prosjektside: kun eget prosjekts allokeringer; ny forespørsel med tidslinjeelement og «følg datoer» → datoer kopiert og låst; endre elementets datoer i `Tidslinjeinnhold`, last på nytt → synkronisert; valideringsmeldinger for hver regel; belastning lagret som brøk (listevisning viser 50 %).
8. Program-/overordnet område i `children`-modus viser underprosjektenes allokeringer.
9. Bruker uten hubtilgang på prosjektside → grid uten elementvelger, forklarende melding.
10. Eksport PNG (hele perioden, sticky kolonne, legend, datostempel) og Excel (to ark, tall som tall, datoer som datoer).
11. Tastatur: Tab til navnecelle, Enter ekspanderer, `aria-expanded`; skjermleser leser celleetiketter; smal skjerm (Teams-tab) gir horisontal scroll med sticky sidebar.
12. `-SkipTemplate`-installasjon → webdeler viser skjemamelding, ingen feil i konsoll.
13. `npm run validate-loc` i alle tre løsninger; `rush rebuild -o pp365-shared-library`; `npx tsc --noEmit`; `npm run lint`; `npm test` i shared-library; `npm run validate-project-template` i Templates.
