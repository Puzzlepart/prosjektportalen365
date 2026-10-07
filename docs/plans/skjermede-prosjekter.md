# Skjermede prosjekter – teknisk kartlegging

**Status:** utkast til diskusjon, 7. oktober 2026. Kartleggingen bygger på kodebasen og er ikke verifisert mot en tenant. Linjenumre kan avvike noe fra `main`. Løsningsforslaget står i `skjermede-prosjekter-losningsforslag.md`. Punkter som må sjekkes i en tenant står i avsnitt 7.

## 1. Sammendrag

Et skjermet prosjekt lagrer prosjektdata på eget prosjektområde i stedet for på porteføljehuben. Dataene følger dermed prosjektets tilganger. Kartleggingen viser følgende:

- **Prosjektdata ligger i fem hublister i dag:**
  - Prosjekter
  - Prosjektstatus
  - Prosjektstatusvedlegg
  - Tidslinjeinnhold
  - Arkiveringslogg (og Logg, med mindre sensitivt innhold)

  Ingen av listene har egne tilganger, bortsett fra Arkiveringslogg, der medlemmer har lesetilgang. Alle med lesetilgang på huben kan derfor lese alle prosjektenes egenskaper, statusrapporter (også utkast), øyeblikksbilder og tidslinjeelementer via REST.
- **Det lekker mer enn statusen.** `PersistedSectionDataJson.json` i Prosjektstatusvedlegg er en frosset kopi av det statusseksjonene hentet fra prosjektområdet ved publisering, blant annet risikoer og leveranser. Data som er lukket på prosjektområdet, blir altså kopiert til huben.
- **Tilgangsfiltrert søk gjør mye av jobben på porteføljesiden.** Søkene i portefølje- og programoversikten spør på `DepartmentId:{hub}` og innholdstype. Prosjektområder som er koblet til huben, har samme `DepartmentId`. Hvis lister på prosjektområdet bruker de samme innholdstypene og blir gjennomsøkt, finner dagens spørringer elementene, filtrert etter tilgang, uten nye spørringer.
- **Det som må skrives om, er de direkte REST-lesingene av huben:** statuskolonnen, prosjektlisten og prosjektkortet, tidslinjen i portefølje og program, program- og underprosjektkoblingene, footeren og prosjektnyheter.
- **Hvem som har innsyn, er den største produktbeslutningen.** I dag ser porteføljeledere (gruppen PortfolioInsight) alle prosjekter i ledervisningen uten tilgang til prosjektområdene. Med skjerming må innsyn gis på prosjektområdet.
- **Programmer er det vanskeligste området.** Koblingene skrives på tvers av områder (`GtParentProjects` skrives inn i underprosjektets element). Programvisningen viser også data om underprosjekter brukeren ikke har tilgang til.
- **Skjermingen må være trygg som utgangspunkt.** Hvis et skjermet prosjekt feilaktig blir behandlet som vanlig, skriver koden til huben og data lekker. Hvor dataene ligger, må derfor avgjøres av prosjektet selv. Det må aldri komme av at huben ikke svarer.

## 2. Hva ligger på huben i dag

| Hubliste | Innhold | Skrives av | Leses av | Tilgang |
|---|---|---|---|---|
| **Prosjekter** | Én kopi per prosjekt av alle `Gt*`-felt og egendefinerte felt: identitet, klassifisering, fase, datoer, personer, mål og program-/underprosjekt-JSON | Prosjektoppsett (`SetupProjectInformation._addEntryToHub`), lagring av prosjektinformasjon (`syncPropertyItemToHub`), faseendring (`ProjectDataService.updateProjectPhase`), `_ensureParentProjectPatch`, programadministrasjon | Porteføljeoversikt (søk), prosjektliste og prosjektkort (REST), PortfolioAggregation, program, prosjekttidslinje, prosjektnyheter, footer, reservekilde i `ProjectDataService` | Arver huben |
| **Prosjektstatus** | Statusrapporter, også utkast (`GtModerationStatus=Draft`), med budsjett, kostnader, prognose, statusfelt og kommentarer. I tillegg `GtAi*`-felt som ingen kode i repoet skriver til | ProjectStatus: opprett, rediger, publiser og slett via `PortalDataService` | ProjectStatus, ProjectInformation, statuskolonnen (REST), portefølje og program (søk), tidslinjen (søk) | Arver huben |
| **Prosjektstatusvedlegg** | Én mappe per rapport-ID med `Snapshot.png` og `PersistedSectionDataJson.json` | `publishStatusReport` og `ensureAttachmentsFolder`, som også kalles ved lesing | ProjectStatus og SnapshotDialog (bilde- og fanelenker går direkte til hubfilen) | Arver huben |
| **Tidslinjeinnhold** | Tidslinjeelementer per prosjekt, koblet via oppslaget `GtSiteIdLookup` mot Prosjekter | ProjectTimeline (legg til, oppdater, slett) og oppsettsoppgaven `TimelineConfiguration`, som kopierer standardelementer per prosjekt | Prosjekttidslinje, porteføljetidslinje og programtidslinje (REST, ingen filtrering) | Arver huben |
| **Arkiveringslogg** | Tittel, URL og fase for arkiverte dokumenter og lister | Arkivering ved faseendring | ProjectPhases (`getArchiveStatus`) | `DefaultSecurity` (medlemmer har lesetilgang) |
| **Logg** | Feilmeldinger og hendelser med webadresse | `ListLogger` fra oppsett, Planner, prosjektinformasjon og faser | Ingen | Arver huben |
| **Prosjektdata / Idébehandling** | Idédata før prosjektet finnes, og vedtak | Idémodulen og `SetupProjectInformation` | Oppsett | `Prosjektdata` er `NoCrawl` |

Følgende er **konfigurasjon** og kan bli liggende på huben: Statusseksjoner, Prosjektkolonner og Prosjektkolonnekonfigurasjon, Tidslinjekonfigurasjon og Tidslinjeelementer (malelementer), Maloppsett, Prosjekttillegg, Listeinnhold, Datakilder, Prosjektinnholdskolonner, Globale innstillinger, Tillatelseskonfigurasjon og JSON-konfigurasjon i SiteAssets.

**Om skrivetilgang i dag:** `Install.ps1:274-291` nedgraderer hubens medlemsgruppe til Lese ved førstegangsinstallasjon. Ingen mal eller skript gir skrivetilgang til Prosjekter, Prosjektstatus eller Tidslinjeinnhold. Prosjektledernes skrivetilgang på huben må altså gis manuelt i hver tenant. Skjerming fjerner behovet for at prosjektbrukere har skrivetilgang på huben, og det er en gevinst i seg selv.

## 3. Designvalg

### 3.1 Omfang: hele huben, per mal eller per prosjekt

| Alternativ | Hvordan | Vurdering |
|---|---|---|
| **Hele huben** | En nøkkel i Globale innstillinger, for eksempel `ShieldedProjects=1`, satt med en parameter til `Install.ps1` og lagt inn i `PostInstallUpgrade.ps1` | Enklest å resonnere om, og passer Bydelsreformen med egen hub. Prosjektoppsettet leser ikke Globale innstillinger i dag (`projectSetup/index.ts:173`), så det må legges til. |
| **Per mal** | En ny kolonne på Maloppsett, etter samme mønster som `GtTimelineContentType` → `ProjectTemplate.getSchema` | Hubadministratorer styrer hvilke maler som er skjermede, og vanlige og skjermede prosjekter kan ligge på samme hub. Krever blandet kildehåndtering på porteføljesiden. |
| **Per prosjekt** | Et flagg på prosjektet, i property bag (som `pp_*_template`) og/eller på Prosjektegenskaper-elementet | Mest fleksibelt. Å endre flagget på et eksisterende prosjekt betyr migrering av prosjektets data. |

**Anbefaling:** Lagre flagget på prosjektet. Sett det fra malen, med Globale innstillinger som standard for nye prosjekter. Prosjektets webdeler trenger bare å kjenne sitt eget prosjekt. Porteføljesiden trenger ikke flagget så lenge den leser via søk, og blandet drift kommer da nesten gratis.

### 3.2 Avtrykk på huben

| Alternativ | Konsekvens |
|---|---|
| **Ingen huboppføring** | Ingen lekkasje. Alle lesere som trenger «alle prosjekter», må gå via søk: prosjektlisten, footeren, programkandidater og tidslinjeoppslaget. |
| **Minimal oppføring** med `GtSiteId`, `GtGroupId` og flagg, uten tittel | Bevarer koblinger (oppslag, eksistenssjekk), men prosjektlisten får kort uten navn, og hver leser må likevel vite at feltene mangler. Selv eksistensen av et prosjekt kan være sensitiv. |

**Anbefaling:** Ingen huboppføring. Kun eksistenssjekker trenger en oppføring, og de dekkes av søk mot `STS_Site` eller prosjektegenskapene.

### 3.3 Hvordan porteføljesiden leser

| Alternativ | Konsekvens |
|---|---|
| **Søk** | Filtrert etter tilgang, og dagens spørringer fungerer om innholdstypene beholdes. Endringer vises først etter neste gjennomsøking. |
| **REST mot hvert prosjektområde** | Ingen gjennomsøkingsforsinkelse, men ett kall per prosjekt, og prosjektene må uansett finnes via søk først. |

**Anbefaling:** Søk. Statuskolonnen og prosjektlisten, som i dag gir øyeblikkelig oppdatering, får forsinkelse for skjermede prosjekter. Det må aksepteres.

### 3.4 Innsyn for porteføljeledere og kortliste

| Alternativ | Konsekvens |
|---|---|
| **Medlemskap på prosjektområdet** | Ingen kode, men innsyn gir også tilgang til dokumenter, logger og registre. |
| **Innsynsgruppe med lesetilgang på listenivå** | Oppgaven `SitePermissions` leser allerede Tillatelseskonfigurasjon og hubgrupper. Den kan utvides til å bryte arven på de skjermede listene (med kopiering av eksisterende tilganger) og legge til en innsynsgruppe. Prosjektets egen gruppe beholder tilgangen. Innsynsgruppen ser status, egenskaper og tidslinje, men ikke dokumenter. |
| **Ingen innsyn** | Porteføljeledere ser bare prosjekter de er medlem av. Ledervisningen mister sin funksjon for skjermede prosjekter. |

**Anbefaling:** En innsynsgruppe på listenivå, konfigurert i Tillatelseskonfigurasjon. Det gir samme ansvarsdeling som i dag (status er for porteføljen, dokumenter for prosjektet), men styrt per prosjekt.

## 4. Konsekvenser per område

### 4.1 Statusrapporter

**Godt utgangspunkt:**
- Status-CRUD er samlet i `PortalDataService`: `addStatusReport` (:823), `updateStatusReport` (:533), `publishStatusReport` (:492), `deleteStatusReport` (:551), `getStatusReports` (:1023), `getStatusReportAttachments` (:1141) og `ensureAttachmentsFolder` (:469).
- `PortalDataService` kan allerede konfigureres med `url`. En egen instans mot prosjektområdet er derfor det naturlige byttepunktet.
- `GtSiteId` er et tekstfelt, ikke et oppslag, så multirapportering (`{siteId}-{scopeKey}`) fungerer uendret lokalt.

**Endringer som må til:**
- **Lister på prosjektområdet.** Prosjektstatus og Prosjektstatusvedlegg legges inn i prosjektmalen `Templates/JsonTemplates/_JsonTemplateProject.json`, eller leveres som et Prosjekttillegg. Eksisterende områder trenger et skript i `UpgradeAllSitesToLatest/`.
- **Innholdstype med samme ID** (`0x010022252E35737A413FB56A1BA53862F6D5`) på prosjektområdet. Uten den finner ikke dagens søk statusrapportene. `addStatusReport` slår også opp innholdstypen i listen.
  - Malspesifikke statusinnholdstyper (Maloppsett `GtProjectStatusContentType`, `PackageInstaller`) må også opprettes lokalt.
  - `syncList` kopierer i dag bare felt, ikke innholdstyper. Det må derfor avklares om sp-js-provisioning kan opprette en innholdstype med fast ID.
- **Prosjektets webdeler:**
  - `useProjectStatusDataFetch`, `useCreateNewStatusReport`, `useEditStatusPanelSubmit`, `usePublishReport`, `useDeleteReport` og `useToolbarItems` (vedlegg): `usePublishReport` og `useDeleteReport` oppretter hver sin egen `PortalDataService`, så begge må få riktig mål.
  - `EditProjectStatusPanel` sender *ikke* `targetWeb`, så `ensureUser` kjører allerede mot prosjektområdet (`CustomEditPanel/useModel.ts:44-45`). I dag er det en latent feil, fordi bruker-ID-er fra prosjektområdet skrives til hublisten. Med skjerming blir det riktig.
  - ProjectInformation (`fetchProjectStatusReportData.ts`).
- **Øyeblikksbilde og lenker:** `snapshotUrl` (`StatusReport.ts:66-70`) og `imageLink` i `useSnapshotDialog.ts:43` peker på hubens bibliotek. De vil peke på prosjektområdet, som er riktig for skjerming. `selectedReport`-ID-er blir lokale, så gamle lenker og bokmerker brytes ved migrering.
- **`ensureAttachmentsFolder` kalles fra en lesesti** (:1142). Brukere med bare lesetilgang (innsynsgruppen) vil feile der, så det må rettes.
- **Statuskolonnen i porteføljen** (`StatusReportColumn/data.ts:19-41`) leser hublisten med REST (topp 500) og må gå over til søk eller to kilder.
- **Kildefallback:** `PortalDataService.onInit` setter `this.web` til det lokale området når huben ikke kan løses opp (:129). Skriveoperasjonene sjekker ikke `isAvailable`. Med skjerming må målet velges eksplisitt fra prosjektets flagg og aldri komme av en fallback. Ellers kan et feilkonfigurert prosjekt skrive til feil sted.
- **Ekstern skriver:** `GtAi*`-feltene skrives av noe utenfor repoet, antakelig assistenten. Den må også håndtere skjermede prosjekter.
- **Gevinst:** `PersistedSectionDataJson` blir liggende lokalt, så lekkasjen av risikoer og leveranser til huben forsvinner.

### 4.2 Prosjektegenskaper (Prosjekter)

**Godt utgangspunkt:** Prosjektegenskaper finnes allerede på prosjektområdet som kilde (en skjult liste opprettet av `PortalDataService.syncList`). ProjectInformation leser den lokalt først (`ProjectDataService.ts:239-282`).

**Skrivesteder som må hoppes over eller pekes lokalt:**
- `SetupProjectInformation._addEntryToHub` (:195-222)
- `syncPropertyItemToHub` (`ProjectWebParts/src/data/SPDataAdapter/index.ts:177-205`)
- `updateProjectPhase` (`ProjectDataService.ts:304-317`)
- `_ensureParentProjectPatch` (`projectSetup/index.ts:154-163`)

**Lesesteder som må få ny kilde:**

| Leser | Hvor | Endring |
|---|---|---|
| Reservekilde i ProjectInformation | `ProjectDataService.ts:253-268` | Slås av for skjermede prosjekter |
| Prosjekttidslinje (datoer og ID) | `ProjectTimeline/data/fetchProjectData.ts:20-24` | Lokalt element |
| Prosjektnyheter | `ProjectNews/util.ts:315-331` | Lokalt element |
| Footer (hjelpenivå og fulgte prosjekter) | `footer/index.ts:176, 276-279` | Lokalt, og søk for listen over fulgte prosjekter |
| Prosjektliste | `PortfolioWebParts/src/data/DataAdapter.ts:735-745` | Søk. I dag lastes *alle* hubelementer til nettleseren, og `hasUserAccess` er bare visuelt |
| Prosjektkort | `DataAdapter.ts:902-959` | Søk eller lokalt |
| PortfolioAggregation `fetchProjectsByDataSource` | `DataAdapter.ts:980-994` | Søk |
| Porteføljeoversikt, innsikt og refinere | `DataAdapter.ts:387-468, 771-808` | Kan fungere uendret via søk (se under) |

For at dagens søk (`DepartmentId:{hub} ContentTypeId:0x0100805E…*`) skal finne lokale egenskaper, må tre ting endres:
- Listen Prosjektegenskaper må bruke innholdstypen `0x0100805E9E4FEAAB4F0EABAB2600D30DB70C`. I dag legges feltene på listens standard Element-type, og den får en lokal ID.
- `GtSiteId` må settes på det lokale elementet. Det ser ut til å stå som null-GUID i dag.
- Listen må bli gjennomsøkt. Den er `Hidden`, men ikke `NoCrawl`. Må verifiseres.

**Duplikater:** Porteføljesøket beholder bare områder med *nøyaktig ett* prosjekttreff (`DataAdapter.ts:456-458`, `ProgramWebParts/src/data/SPDataAdapter.ts:421-423`). Et skjermet prosjekt med både huboppføring og et søkbart lokalt element vil derfor *forsvinne* fra den vanlige visningen. Det taler også for at skjermede prosjekter ikke skal ha noen huboppføring (3.2).

### 4.3 Tidslinje

- **Lister på prosjektområdet:** Tidslinjeinnhold med innholdstypen `0x01006EE320A23C8F4A6C83F3E36A19F076B9`. `GtSiteIdLookup` er et oppslag mot hublisten Prosjekter og kan ikke peke på tvers av områder. Lokalt trengs ingen kobling, eller eventuelt `GtSiteId` som tekst for søk.
- **Prosjektets webdeler:**
  - `fetchTimelineData.ts:46-179` (henter listen, innholdstyper og elementer)
  - `TimelineList/useToolbarItems.tsx:26-36, 112, 153`
  - `ProjectTimeline.tsx:55-62` (`CustomEditPanel` med `targetWeb` satt til huben, `ensureUser` og oppslag i `useLookup.tsx:14`)
  - `fetchData.ts:25`, som feiler hardt uten tilgang til huben (bra, ettersom konfigurasjonen uansett ligger der)
- **Oppsett:** `TimelineConfiguration` (`tasks/TimelineConfiguration/index.ts:63-96`) kopierer standardelementer fra hublisten Tidslinjeelementer inn i hublisten Tidslinjeinnhold. Den må skrive lokalt.
- **Portefølje og program:**
  - `PortfolioWebParts/src/data/DataAdapter.ts:520-570` og `ProgramWebParts/src/data/SPDataAdapter.ts:499-560` leser hele hublisten direkte, uten filtrering.
  - De må over på søk. Mønsteret finnes allerede: leveranser hentes via Datakilder og `fetchItemsWithSource` (`DataAdapter.ts:579-625, 1109-1139`).
  - Det trengs administrerte egenskaper for tidslinjefeltene (type, start, slutt, beskrivelse og tag).
- **Delt filter:** `useProjectTimelineDataFetch.ts:158-163` kobler innhold til prosjekt via *tittel*. Det er skjørt, men fungerer så lenge prosjektene også hentes via søk.

### 4.4 Program og overordnede prosjekter

- **Lagring:** `GtChildProjects` (JSON med `SiteId`, `Title`, `SPWebURL` og `HubSiteId`) ligger på programmets eget element, både lokalt og på huben. `GtParentProjects` skrives inn i *underprosjektets* huboppføring, eventuelt på en annen hub (`ProgramWebParts/src/data/SPDataAdapter.ts:1018-1061`).
- **Skjermet underprosjekt:** Programadministratoren har normalt ikke skrivetilgang på underprosjektets område. `GtParentProjects` kan derfor ikke skrives. **Alternativ:** utled overordnede prosjekter ved å søke på `GtChildProjects` i stedet for å lagre dem på underprosjektet. `getParentProjects` gjør allerede en `Contains(GtChildProjects, webUrl)`-spørring (`PortalDataService.ts:243-331`).
- **Skjermet program:** `GtChildProjects` leses i dag fra hubelementet (`getChildProjects`, `PortalDataService.ts:340-398`) og må leses lokalt. JSON-feltet lekker titler og URL-er for underprosjektene til alle som kan lese programmet. Det må aksepteres eller reduseres til `SiteId`.
- **Programoversikten:** Den henter først prosjektene (`fetchDataForViewBatch`) og viser hubdata om underprosjekter uten tilgangssjekk. Med `ShowChildProjectInfoInProgram=1` åpnes infopanelet også for prosjekter brukeren ikke har tilgang til (`TitleColumn/index.tsx:32-35`). Via søk blir dette filtrert automatisk, men programleder mister innsyn i skjermede underprosjekter, med mindre innsynsgruppen (3.4) dekker det.
- **Kandidater i programadministrasjonen:** `getHubSiteProjects` (`:1145-1189`) søker etter alle prosjekter. Skjermede prosjekter vises bare for dem som har tilgang.

### 4.5 Logg, arkiv og idé

- **Logg** (`ListLogger`): innholdet er lite sensitivt (URL og feiltekst). Det kan bli liggende på huben eller logges lokalt. Dette er et valg, ikke et krav.
- **Arkiveringslogg** (`ProjectWebParts/src/data/SPDataAdapter/index.ts:372-418, 492-509`) inneholder dokumenttitler og URL-er og bør ligge lokalt.
- **Idémodulen:** Prosjektdata og Idébehandling ligger på huben *før* prosjektet finnes. Skjermingen starter ved prosjektoppsettet, så idéfasen er ikke dekket.
- **Hubens brukerliste:** `ensureUser` med `targetWeb` satt til huben legger brukere inn i hubens brukerliste. Det forsvinner når redigeringspanelene peker lokalt.
- **DynamicList i `WebContextMode.HubSite`** kan konfigureres til å skrive til vilkårlige hublister. Dette er et eget valg i hver webdel og bør dokumenteres som utenfor skjermingen.

### 4.6 Porteføljens webdeler samlet

| Webdel | Kilde i dag | Med skjerming |
|---|---|---|
| Porteføljeoversikt, vanlig visning | Søk på områder, prosjekter og status | Fungerer uendret om innholdstyper og gjennomsøking er på plass |
| Porteføljeoversikt, ledervisning | Søk på prosjekter, uten filtrering per område | Viser bare skjermede prosjekter der innsynsgruppen gir tilgang |
| Statuskolonnen | REST mot hubens Prosjektstatus | Søk |
| Excel-eksport | Sammenslåtte rader fra søk | Uendret (filtrert) |
| Prosjektliste og prosjektkort | REST mot alle hubens Prosjekter | Søk |
| Siste prosjekter | Søk på områder | Uendret |
| PortfolioAggregation | Søk og REST (`fetchProjectsByDataSource`) | REST-delen over på søk |
| Ressursallokering og gevinstoversikt | Søk på prosjektområder | Uendret |
| Porteføljetidslinje | Søk (prosjekter, status) og REST (innhold) | Innholdet over på søk |
| Programoversikt og -tidslinje | Søk og REST | Som portefølje, pluss koblingene i 4.4 |
| Flere porteføljer (`AvailableProgramHubs`) | Søk per hub | Uendret |

### 4.7 Provisjonering og oppgradering

- **Nye lister** legges i `Lists` i `_JsonTemplateProject.json`, som bygges til Standardmal, Programmal og Overordnet. Alternativet er et eget Prosjekttillegg «Skjerming», som gjør det valgfritt uten å endre standardmalene.
- **`syncList` for Prosjektegenskaper** må få innholdstypen og `GtSiteId` på plass (4.2).
- **`SitePermissions`** utvides med tilganger på listenivå for innsynsgruppen (3.4).
- **Oppgradering av eksisterende prosjekter** skjer bare via `Install/Scripts/UpgradeAllSitesToLatest.ps1` og versjonsstyrte delskript. `ProjectUpgrade`-utvidelsen er en tom stub.
- **Migrering av et eksisterende prosjekt til skjermet modus** krever et skript som:
  1. flytter statusrapporter og vedleggsmapper (nye ID-er gir nye mappenavn),
  2. flytter tidslinjeelementer,
  3. setter innholdstyper og `GtSiteId` på det lokale egenskapselementet,
  4. sletter huboppføringene til slutt.

### 4.8 Søk

- `Install/SearchConfiguration.xml` har ingen egne resultatkilder eller administrerte egenskaper, bare alias og koblinger fra gjennomsøkte egenskaper. Statusfeltene (`GtSiteIdOWSTEXT`, `GtModerationStatusOWSCHCS` og andre) er autogenererte.
- Så lenge feltene på prosjektområdet har samme interne navn, bør de gi samme gjennomsøkte egenskaper. Koblingene virker da for begge kilder. Må verifiseres.
- `Prosjektdata` er `NoCrawl` for å unngå duplikattreff på samme innholdstype. Det samme hensynet gjelder i blandet drift (4.2).
- Gjennomsøkingsforsinkelse: en publisert status vises i statuskolonnen og prosjektlisten etter neste gjennomsøking, ikke umiddelbart.

### 4.9 Tilganger

- Skjermede lister på prosjektområdet arver områdets tilganger. Med en innsynsgruppe brytes arven per liste med kopiering av tilgangene. Prosjektets M365-gruppe beholder dermed tilgangen, og endringer i gruppens medlemskap slår gjennom.
- `ProjectStatusAdmin` (prosjektadministrasjonsroller på huben, `SPDataAdapterBase/index.ts:156-254`) styrer bare grensesnittet og kan beholdes.
- Prosjektbrukere trenger bare lesetilgang på huben (for konfigurasjonen), ikke skrivetilgang.

### 4.10 Tester

- **e2e:** `e2e/tests/fixtures/status-report.ts` leser hublisten direkte. Det samme gjelder `flows/status-report.spec.ts`, `smoke/project.spec.ts`, `smoke/timeline-list.spec.ts` og `fixtures/timeline-list.ts`. Disse må parametriseres for kilde, og det trengs et testprosjekt i skjermet modus.
- **Enhetstester:** `PortalDataService.test.ts`, `ProjectDataService.test.ts`, `SPDataAdapterBase.test.ts`, `projectSetup.test.ts` og ProjectStatus- og ProjectTimeline-hookene.

## 5. Hva skjerming ikke løser

- Konfigurasjonen på huben, som malnavn og statusseksjoner, er fortsatt synlig, men den er ikke prosjektdata.
- Idédata før prosjektet finnes (4.5).
- Titler og URL-er for underprosjekter i et programs `GtChildProjects` (4.4).
- Det brukere med innsynsgruppetilgang eksporterer eller tar skjermbilde av.
- Offentleglova. Skjerming er tilgangsstyring, ikke unntak fra innsyn.

## 6. Foreslått oppbygging

1. **Kilde:** innfør et eksplisitt mål for hvor prosjektdata ligger, i `shared-library`. Målet avgjøres av prosjektets flagg og aldri av en fallback. `PortalDataService` beholdes for konfigurasjon, mens en instans mot prosjektområdet håndterer status, vedlegg og tidslinje.
2. **Prosjektsiden:** lister, innholdstyper og innsynsgruppe i oppsettet. Status, tidslinje, egenskaper, nyheter og arkiv peker lokalt.
3. **Porteføljesiden:** REST-lesingene i 4.6 over på søk.
4. **Program:** utled overordnede prosjekter ved søk, og les koblinger lokalt.
5. **Drift:** installasjonsparameter, nøkkel i Globale innstillinger, kolonne i Maloppsett, oppgraderings- og migreringsskript, tester og dokumentasjon.

## 7. Må verifiseres i en tenant

1. Blir skjulte lister (`Hidden`, ikke `NoCrawl`) på prosjektområdet gjennomsøkt, og får elementene hubens `DepartmentId`?
2. Gir felt med samme interne navn på prosjektområdet de samme gjennomsøkte og administrerte egenskapene, slik at koblingene i `SearchConfiguration.xml` virker?
3. Kan sp-js-provisioning eller oppsettet opprette innholdstyper med fast ID, for eksempel `0x010022252E…` og `0x0100805E…`, på prosjektområdet?
4. Fungerer taksonomifelt og personfelt i `CustomEditPanel` mot lokale lister uten hubkontekst?
5. Hvor lang er gjennomsøkingsforsinkelsen i praksis for statuskolonnen og prosjektlisten?

## 8. Spørsmål til produktteamet

1. Hvem skriver `GtAi*`-feltene i Prosjektstatus, og hvordan påvirkes de av skjerming?
2. Hvordan gir kundene i dag prosjektlederne skrivetilgang til hublistene?
3. Er en innsynsgruppe på listenivå akseptabel som modell, eller skal innsyn alltid gå via medlemskap?
4. Skal skjerming være et Prosjekttillegg eller en del av standardmalene?
5. Er det akseptabelt at statuskolonnen og prosjektlisten får gjennomsøkingsforsinkelse for skjermede prosjekter?
