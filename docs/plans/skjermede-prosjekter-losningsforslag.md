# Skjermede prosjekter – løsningsforslag

**Status:** vedtatt plan for 1.15, 9. november 2026. Forslaget bygger på kartleggingen i `skjermede-prosjekter.md`, på `releases/1.15` og på PR #1805 («Minimum lesetilganger på hub»), som merges før arbeidet starter.

## 1. Hva vi lager

Et nytt prosjekttillegg, «Skjerming», som kobles til prosjektmalene som skal være skjermet. For et skjermet prosjekt lagres statusrapporter, øyeblikksbilder, prosjektinformasjon og arkivlogg på prosjektområdet i stedet for på porteføljehuben. Dataene følger dermed prosjektets tilganger. Porteføljeledere og andre som skal ha innsyn, legges i en innsynsgruppe. De ser status og prosjektinformasjon i portefølje- og programoversiktene, men ikke prosjektets dokumenter eller sider.

Løsningen er generisk. Den virker på en eksisterende hub med både vanlige og skjermede prosjekter, og på en ny hub.

## 2. Beslutninger

| Tema | Beslutning |
|---|---|
| Hvordan skjerming slås på | Per prosjekt, styrt av malen. Maloppsett kobler malen til tillegget «Skjerming» via `GtProjectExtensions` og låser det med `IsDefaultExtensionsLocked`. |
| Leveranse | Lister, innholdstyper og tilganger leveres av Prosjekttillegget «Skjerming». Standardmalene endres ikke. |
| Huboppføring | Et skjermet prosjekt får **ingen** oppføring i hublisten Prosjekter, og den må aldri opprettes senere. |
| Hva som skjermes | Statusrapporter (også utkast), Prosjektstatusvedlegg (øyeblikksbilde og persistert seksjonsdata), prosjektinformasjon og Arkiveringslogg. |
| Tidslinje | Tidslinjeelementer på prosjektnivå er **ikke med** i 1.15. Prosjekttidslinjen viser prosjektperioden og leveransene, men det går ikke å legge til elementer. |
| Program | Full støtte. Både programmer og underprosjekter kan være skjermet. Et program som ikke er skjermet, lagrer fortsatt tittel og URL for skjermede underprosjekter i `GtChildProjects`. Det er akseptert. |
| Tilgang på huben for prosjektdeltakere | Minimumsgruppen fra #1805 er nok når webdelene kjører. Den som oppretter prosjektet, må være leser eller medlem på huben, fordi oppsettet leser lister som minimumsgruppen ikke dekker. |
| Innsynsgruppe | Konfigureres i Tillatelseskonfigurasjon med en ny kolonne, `GtPermissionScope`. Standardraden bruker gruppen Porteføljeinnsyn. Medlemmene kopieres når prosjektet opprettes, som i dagens SitePermissions. |
| Hva innsynsgruppen ser | Bare data i portefølje og program, inkludert informasjonspanelet. Prosjektets sider kan ikke åpnes. |
| Logg | Skrives til huben som i dag. Siden #1805 kan også brukere med bare minimumsgruppen skrive til Logg, og hver bruker ser bare egne oppføringer (`LogSecurity.xml`). |
| Porteføljesiden | Leser skjermede data via søk. Endringer vises etter noen få minutter. |
| Statuskolonnen | Felt som ikke finnes i Prosjektkolonner, vises ikke for skjermede prosjekter. |
| Malspesifikke innholdstyper | Støttes for status, som for andre prosjekter. De må arve fra `0x010022252E35737A413FB56A1BA53862F6D5`. |
| Migrering | **Ikke inkludert.** Beskrivelsen av tillegget sier at eksisterende prosjekter ikke flyttes automatisk. |
| Fjerne skjerming | Ikke støttet. Skjerming går én vei. |
| Issue | Ett hovedissue med avkrysningsliste per fase, uten kundedetaljer. Underissues lages når arbeidet starter. |

## 3. Prinsipper

1. **Skjermingen må være trygg som utgangspunkt.** Hvor prosjektdata ligger, avgjøres av prosjektområdet selv. Kan det ikke avgjøres, skrives ingenting. Huben brukes aldri som reserve, verken av ruting eller av synkronisering.
2. **Konfigurasjonen blir på huben.** Statusseksjoner, kolonnekonfigurasjon, maler, Tidslinjekonfigurasjon og Globale innstillinger leses fortsatt fra huben. Prosjektdeltakere trenger bare lesetilgang til dem, og det gir minimumsgruppen fra #1805.
3. **Lagrede spørringer skal ikke måtte endres.** Skjermede data bruker de samme innholdstype-ID-ene (eller typer som arver fra dem), så `ContentTypeId:0x…*`-spørringene i Portefoljevisninger og Datakilder finner dem.
4. **Vanlige prosjekter merker ingen forskjell.** De bruker de samme kodestiene som i dag. Porteføljeleserne får et ekstra søk for skjermede prosjekter.

## 4. Arkitektur

```
Hub                                                   Skjermet prosjektområde
┌──────────────────────────────────────┐            ┌───────────────────────────────────────┐
│ Maloppsett ──► Prosjekttillegg       │  oppsett   │ Prosjektegenskaper  (CT arver 0x0100805E…)│
│               «Skjerming»            │ ─────────► │ Prosjektstatus      (CT 0x010022252E…) │
│ Tillatelseskonfigurasjon             │            │ Prosjektstatusvedlegg                 │
│   (Porteføljeinnsyn, Skjermede lister)│            │ Arkiveringslogg                       │
│ Statusseksjoner, kolonnekonfig,      │  leses av  │                                       │
│ Tidslinjekonfigurasjon, CT-er        │ ◄───────── │ Tilgang: områdets grupper             │
│ Prosjekter / Prosjektstatus / …      │            │   + Porteføljeinnsyn (Les, listenivå) │
│   (bare vanlige prosjekter)          │            └───────────────────────────────────────┘
│ Logg (alle prosjekter)               │                              ▲
└──────────────────────────────────────┘                              │ søk, filtrert etter tilgang
                 ▲ REST (vanlige) + søk (skjermede)                    │ (DepartmentId = hubens ID)
        Portefølje- og programwebdeler ────────────────────────────────┘
```

## 5. Avhengigheter i 1.15

**PR #1805 (Minimum lesetilganger på hub)**
- `resolveHubUrl` finner huben via `_api/web/HubSiteData`, så brukere uten tilgang til selve huben finner den likevel.
- `isListAvailable(list)` og `_deniedLists` i `PortalDataService` merker en liste som avvist for resten av økten etter en 403. Listen identifiseres bare med nøkkel, ikke med område. **Det må endres:** for nøkler som rutes til prosjektområdet, skal tilgjengeligheten gjelde prosjektområdet, og en 403 på huben skal ikke stenge den lokale listen.
- `getStatusReports` returnerer `[]` når huben er utilgjengelig. For et skjermet prosjekt er det feil, fordi dataene ligger lokalt.
- Prosjektstatus, Prosjekttidslinje og Prosjektnyheter viser «ingen tilgang» ved 403 fra huben. Disse kodestiene rutes på nytt for skjermede prosjekter.
- Release notes for #1805 ber administratorer gi minimumsgruppen tilgang til Prosjektstatus, Prosjektstatusvedlegg og Tidslinjeinnhold for å låse opp status. Det gjelder ikke skjermede prosjekter, og det må stå i release notes for skjerming.
- Logg får egne tilganger (`LogSecurity.xml`): minimumsgruppen kan skrive, og hver bruker leser bare egne oppføringer. Arkiveringslogg er lesbar for alle med tilgang, og minimumsgruppen har ingen rolle der. Det er enda en grunn til at skjermede prosjekter har sin egen Arkiveringslogg.
- **Ikke verifisert:** at minimumsgruppen kan lese hubens innholdstyper og felt. Skjermet prosjektstatus leser derfor statusfeltene fra den lokale innholdstypen.

**PR #1794 (oppsett og synkronisering uten skrivetilgang til huben)**
- Oppsettet har en bryter, `hasHubWriteAccess === false`, som hopper over huboppføring, idédata, TimelineConfiguration og hubloggen. Skjerming bruker samme mekanisme, men **hubloggen skilles ut** og skrives fortsatt.
- `SpEntityPortalService.ensureEntityItem` oppretter huboppføringen hvis den mangler, ved lagring av prosjektinformasjon (`syncPropertyItemToHub`) og ved faseendring (`syncPhaseToHub`). **For skjermede prosjekter må begge stoppes før de kaller tjenesten.** Ellers gjenoppretter en bruker med skrivetilgang på huben oppføringen.
- `hubSyncError` gir advarselen «Porteføljeområdet ble ikke oppdatert». Den skal ikke vises for skjermede prosjekter, fordi det ikke er en feil at huben ikke oppdateres.

**sp-js-provisioning 1.5.0**
- Oppretter innholdstyper med fast ID, binder dem til lister og setter `Security` på lister, med gruppen angitt med navn. SitePermissions kjører før ApplyTemplate, så gruppen finnes når tillegget brukes.
- Ved ny kjøring oppdateres eksisterende listekolonner, og lister beholder innholdstyper og visninger.

## 6. Prosjekttillegget «Skjerming»

Tillegget er en sp-js-provisioning-fil i hubbiblioteket Prosjekttillegg. Det leveres som standardinnhold fra `Templates/Content/Portfolio_content.<språk>/`, på samme måte som prosjektmalene lastes opp til Prosjektmaler. Det er i dag ingen standardtillegg i repoet, så leveransen er ny.

**Innhold:**
- **`SiteFields`:** feltene i statusinnholdstypen (`Templates/Portfolio/Objects/SiteFields/ProjectStatus/*.xml`, samt `GtSiteId` og `GtModerationStatus`). De ligger i porteføljegruppen og kopieres derfor ikke av ProvisionSiteFields.
- **`ContentTypes`:** Prosjektstatus med ID `0x010022252E35737A413FB56A1BA53862F6D5`, og prosjektegenskaper med en ID som arver fra `0x0100805E9E4FEAAB4F0EABAB2600D30DB70C`.
- **`Lists`:** Prosjektstatus, Prosjektstatusvedlegg (dokumentbibliotek) og Arkiveringslogg, med samme titler som på huben. Da kan `PortalDataService` bruke de eksisterende listenøklene.
- **`Security`** på de tre listene og på Prosjektegenskaper:
  - `BreakRoleInheritance` med kopiering, slik at områdets eier-, medlems- og besøksgruppe beholder tilgangen.
  - Porteføljeinnsyn får Les. Gruppene kommer fra radene med omfanget *Skjermede lister* i Tillatelseskonfigurasjon.
- **Beskrivelse** (vises i oppsettsveiviseren): sier at eksisterende data på huben ikke flyttes, og at skjerming ikke kan fjernes.

**Prosjekttillegg-listen** får en ny ja/nei-kolonne, `GtShieldsProjectData`. Den markerer at tillegget skjermer, slik at oppsettet vet det før oppgavene kjører.

## 7. Prosjektoppsett (ProjectExtensions)

**Skjermet oppsett** er avgjort av at et av de valgte tilleggene har `GtShieldsProjectData`.

| Oppgave | Endring ved skjermet oppsett |
|---|---|
| PreTask | Ingen endring. Entitetstjenesten trengs for å lese hubens felt. |
| SitePermissions | Leser den nye kolonnen `GtPermissionScope`. *Område* er dagens oppførsel. *Skjermede lister* oppretter gruppen og legger inn medlemmene, men gir ingen tilgang på området. Tillegget gir tilgangen. Rader med *Skjermede lister* hoppes over for vanlige prosjekter. |
| SetupProjectInformation | Hopper over `_addEntryToHub` og `updateIdeaData`, som ved `hasHubWriteAccess === false`. Hubloggen skrives. |
| ApplyTemplate | Tillegget brukes. Lister, innholdstyper og tilganger opprettes. |
| **Ny: ShieldProjectData** (rett etter ApplyTemplate) | 1. Binder innholdstypen for prosjektegenskaper til Prosjektegenskaper, gir elementet den og setter `GtSiteId`. 2. Oppretter malens statusinnholdstype lokalt hvis malen har en egen, og kopierer felt som mangler. 3. Skriver `ShieldedProject: true` i `TemplateParameters`. Det må gjøres her fordi «Kjør prosjektoppsett på nytt» setter `skipUpdateTemplateParameters`. |
| TimelineConfiguration | Hoppes over. |
| `_ensureParentProjectPatch` | Setter `GtIsParentProject` lokalt. |
| Fullføringsdialogen | Viser ikke advarselen om at prosjektet ikke er registrert på huben. |

## 8. Datalaget (shared-library)

**Hvordan et prosjekt vet at det er skjermet**
- Sannheten er den lokale listen Prosjektstatus. Den finnes bare hvis tillegget er brukt.
- `SPDataAdapterBase.configure` sjekker listen én gang, sammen med lastingen av Globale innstillinger, og bufrer svaret for økten.
- Feiler sjekken med noe annet enn «finnes ikke», blir prosjektdata skrivebeskyttet med en lokalisert melding.
- `TemplateParameters.ShieldedProject` brukes bare til informasjon. Property bag brukes ikke, fordi gruppeområder har NoScript.

**Rutingen i `PortalDataService`**
- Konfigurasjonen får `projectDataWeb?: IWeb` og en privat metode `_webFor(listKey)`. `PROJECT_STATUS` og `PROJECT_STATUS_ATTACHMENTS` går til `projectDataWeb` når prosjektet er skjermet. Alt annet går til huben.
- `_getList`, filoppslaget i `getStatusReportAttachments` og `getListFields` bruker `_webFor`.
- Er prosjektet skjermet og `projectDataWeb` mangler, kastes en feil. `this.web` starter som det lokale området og blir huben først når huben er funnet. Den reserven skal aldri avgjøre hvor prosjektdata skrives.
- `isListAvailable` og `_deniedLists` tar hensyn til ruting (se 5).

**Feil som rettes samtidig**
- `getContentTypeFields` ignorerer `web`-parameteren.
- `getStatusReportAttachments` oppretter mappen ved lesing (`ensureAttachmentsFolder`). Det feiler for innsynsgruppen, som bare har Les.
- `usePublishReport` og `useDeleteReport` oppretter hver sin egen `PortalDataService`. De skal bruke `SPDataAdapter.portalDataService`.

**`ProjectDataService` og synkronisering**
- `getProjectInformationData` faller ikke tilbake til hubentiteten for skjermede prosjekter.
- `updateProjectPhase` og `syncPhaseToHub` skriver bare lokalt. `syncPropertyItemToHub` hoppes over. Ingen av dem kaller `ensureEntityItem` (se 5).

## 9. Prosjektets webdeler

**Prosjektstatus**
- Lister og vedlegg rutes via `_webFor`. `snapshotUrl` og lenkene i SnapshotDialog peker da automatisk til prosjektområdet.
- Statusfeltene leses fra den lokale innholdstypen, ikke fra hubens.
- Sjekkene for hubtilgang (`useProjectStatusDataFetch`, prøvelesing av Statusseksjoner) skal ikke stoppe et skjermet prosjekt. Statusseksjoner og kolonnekonfigurasjon leses fortsatt fra huben.
- Redigeringspanelet sender ikke `targetWeb`, så `ensureUser` kjører allerede mot prosjektområdet. Det blir riktig med skjerming.

**Prosjektinformasjon**
- Ingen hubsynkronisering og ingen advarsel om at porteføljeområdet ikke ble oppdatert.
- Statussammendraget leser lokalt via `_webFor`.
- Overordnede og underordnede prosjekter, se 11.

**Prosjektfaser og arkiv**
- `writeToArchiveLog` og `getArchiveStatus` leser `portalDataService.web` direkte og trenger egen ruting til den lokale Arkiveringslogg.
- Logg skrives fortsatt til huben.

**Prosjekttidslinje**
- `fetchData` krever i dag huben, og `fetchProjectData` leser datoene fra hublisten Prosjekter. For skjermede prosjekter leses datoene fra det lokale egenskapselementet.
- Leveranser fra prosjektområdet vises som i dag når det er slått på.
- Knappen for å legge til elementer skjules, og en kort melding forklarer at elementer ikke støttes på skjermede prosjekter.
- **Garanti:** ingen kode skriver til hublisten Tidslinjeinnhold for et skjermet prosjekt.

**Prosjektnyheter** leser prosjektfeltene fra det lokale elementet. Siden #1805 tåler den også at Prosjekter-oppføringen mangler.

**Footer** (PortfolioExtensions): `getProjectDetails` leser lokalt på skjermede prosjekter.

## 10. Porteføljesiden

| Leser | Endring |
|---|---|
| Porteføljeoversikt, ledervisning og refinere | Ingen kodeendring. Lagrede spørringer finner skjermede prosjekter og status via innholdstype og `DepartmentId`. Duplikatsjekken (nøyaktig ett prosjekttreff per område) holder, fordi skjermede prosjekter ikke har huboppføring. |
| Sammenslått visning over flere huber (`mergedViewData`) | Sjekk at sammenslåingen per hub (`_hubId`) håndterer prosjekter uten huboppføring. |
| **Statuskolonnen** | Bruker statusfeltene som allerede finnes i søkeresultatet for raden, i stedet for egen REST-lesing av hublisten (topp 500). Feltene kobles via Prosjektkolonner. |
| **Prosjektliste og prosjektkort** | Leser hubelementer med REST som før, og supplerer med søk etter skjermede prosjekter (`ContentTypeId:0x0100805E…* -SiteId:{hub}`). Personer bygges fra `RefinableString50/51`, siden bruker-ID fra huben ikke finnes. |
| **PortfolioAggregation `fetchProjectsByDataSource`** | OData-filteret kan ikke oversettes automatisk. Skjermede prosjekter hentes med datakildens KQL (`GtSearchQuery`) når den er fylt ut. Begrensningen dokumenteres. |
| **Informasjonspanelet** (tittelkolonnen) | Leser prosjektinformasjonen fra prosjektområdets Prosjektegenskaper, som innsynsgruppen kan lese. |
| Porteføljetidslinje | Ingen endring. Prosjektets periode og budsjett kommer fra søk. |
| Ressursallokering, gevinster, siste prosjekter, Excel-eksport | Ingen endring. |

## 11. Program og overordnede prosjekter

| Situasjon | Løsning |
|---|---|
| Skjermet program | `GtChildProjects` lagres bare lokalt. `updateProjectInHub` hoppes over. `fetchChildProjects` leser det lokale egenskapselementet, som allerede har samme JSON. |
| Skjermet underprosjekt | `_updateChildProjectParents` skriver ikke `GtParentProjects`. Underprosjektet har ingen huboppføring, og programadministratoren har normalt ikke skrivetilgang på området. |
| Finne overordnede prosjekter | `getParentProjects` spør i dag hubens Prosjekter med `Contains(GtChildProjects, webUrl)`. For skjermede programmer suppleres dette med søk. Det er usikkert om `GtChildProjectsOWSMTXT:"{siteId}"` er søkbar, så vi bygger med et eget felt med underprosjektenes site-ID-er, skrevet sammen med `GtChildProjects` og koblet til en administrert egenskap. Søket i JSON-feltet testes først, og feltet fjernes hvis det virker. |
| Kandidater i programadministrasjonen | Søket etter prosjekter (`hubSiteProjects`) viser skjermede prosjekter bare for dem med tilgang. Programadministratoren må derfor være i innsynsgruppen. |
| Programoversikt | Som porteføljen. Data om underprosjekter filtreres etter tilgang. |
| Usikkerhetsmatrisen på overordnede prosjekter | Virker når listen over underprosjekter leses lokalt. Risikoene hentes via søk. |

## 12. Drift

- **Installasjon og oppgradering:**
  - Prosjekttillegg får kolonnen `GtShieldsProjectData`, og Tillatelseskonfigurasjon får `GtPermissionScope`.
  - Standardraden for Porteføljeinnsyn med omfanget *Skjermede lister* legges inn **bare hvis den mangler**. DataRows i Tillatelseskonfigurasjon bruker `GtSPGroupName` som nøkkel med `Overwrite`. En kunde som allerede har en rad for Porteføljeinnsyn, ville ellers fått den overskrevet. Bruk mønsteret i `PostInstallUpgrade.ps1`.
  - Tillegget «Skjerming» lastes opp til Prosjekttillegg.
  - Søkekonfigurasjonen får koblingen for site-ID-ene til underprosjektene (11).
- **Oppgradering av skjermede områder:** Endringer i statusinnholdstypen i senere versjoner må også inn i tillegget og i et delskript under `UpgradeAllSitesToLatest/` som bare kjører på skjermede områder. Følg strukturen fra 1.15.
- **Innsynsgruppen** er et øyeblikksbilde fra oppsettet. SitePermissions hopper over grupper som er tomme på huben, så Porteføljeinnsyn må ha medlemmer når prosjektet opprettes.
- **PP-assistenten** skriver `GtAi*`-feltene i Prosjektstatus. Den oppdateres til å skrive til prosjektområdet for skjermede prosjekter og avgjør skjerming på samme måte som i 8.
- **Lokalisering:** nye meldinger og kolonnenavn legges i alle tre lokaliseringsfilene og i resx-filene for malene.
- **Dokumentasjon:** release notes, CHANGELOG, `.development-guide` og wikitekst. Release notes skal si at migrering ikke er inkludert, at skjerming ikke kan fjernes, og at tilgangene i #1805 til Prosjektstatus, Prosjektstatusvedlegg og Tidslinjeinnhold ikke trengs for skjermede prosjekter.

## 13. Arbeidsantakelser om plattformen

| # | Antakelse | Konsekvens hvis den ikke holder |
|---|---|---|
| 1 | Skjulte lister på et prosjektområde koblet til huben blir gjennomsøkt med hubens `DepartmentId`. | Portefølje og program finner ikke skjermede data. Krever endrede spørringer. |
| 2 | `ContentTypeId:0x0100805E…*` treffer en lokal innholdstype som arver fra prosjektinnholdstypen, og listefelt gir de samme `*OWS*`-egenskapene. | Porteføljeoversikten trenger endringer for skjermede prosjekter. |
| 3 | Tillegget kan opprette innholdstyper med fast ID og felt fra `SiteFields` i samme kjøring. | Endres i sp-js-provisioning. |
| 4 | `Security` kan gi tilgang til en gruppe som SitePermissions opprettet tidligere i samme oppsett. Bekreftet i koden for sp-js-provisioning 1.5.0. | Endres i sp-js-provisioning. |
| 5 | Usikkert om `GtChildProjectsOWSMTXT:"{siteId}"` er søkbar. | Vi bygger med eget felt for site-ID-er (11). |
| 6 | Gjennomsøkingsforsinkelsen er noen få minutter. | Akseptert. |

## 14. Ikke omfattet

- Migrering av eksisterende prosjekter fra huben.
- Å fjerne skjerming fra et prosjekt.
- Tidslinjeelementer på prosjektnivå.
- Idédata som ligger på huben før prosjektet finnes.
- Synkronisering av innsynsgruppens medlemskap etter oppsettet.
- Tilgang til prosjektets sider for innsynsgruppen.
- DynamicList konfigurert mot hublister.

## 15. Faser

1. **Datalag:** deteksjon av skjerming, `_webFor`, rutingsbevisst `isListAvailable`, feilrettingene i 8, `ProjectDataService` og stopp av hubsynkronisering. Enhetstester.
2. **Tillegg og oppsett:** tillegget, kolonnene `GtShieldsProjectData` og `GtPermissionScope`, standardraden, SitePermissions, oppsettsflagget, ShieldProjectData og levering av tillegget.
3. **Prosjektstatus og prosjektinformasjon:** ruting, lokale statusfelt, lenker, statussammendrag, arkiv, nyheter og footer.
4. **Prosjekttidslinje:** lokale datoer, skjult legg-til og meldingen.
5. **Porteføljen:** statuskolonnen, prosjektliste og prosjektkort, PortfolioAggregation, informasjonspanelet og sammenslått visning over flere huber.
6. **Program:** lokal lagring, ingen `GtParentProjects`, felt og søk for overordnede prosjekter, kandidater.
7. **Drift og dokumentasjon:** installasjon og oppgradering, søkekonfigurasjon, PP-assistenten, lokalisering, release notes, CHANGELOG, utviklerguide og wikitekst.
8. **Test:** integrasjonstest etter mønsteret i `integration/tests/hub-minimum-read.test.ts`, og e2e med et skjermet testprosjekt. Testene skal vise at status, vedlegg, prosjektinformasjon og arkivlogg havner på prosjektområdet, at ingenting skrives til hublistene, og at innsynsgruppen ser data i porteføljen.

## 16. Akseptansekriterier

1. Et prosjekt opprettet med en mal som har «Skjerming», har ingen oppføring i hublistene Prosjekter, Prosjektstatus, Prosjektstatusvedlegg eller Tidslinjeinnhold, verken etter oppsett, lagring av prosjektinformasjon, faseendring eller publisering av status.
2. Statusrapporter, utkast, øyeblikksbilder og arkivlogg ligger på prosjektområdet og kan bare leses av prosjektets grupper og innsynsgruppen.
3. En prosjektdeltaker med bare minimumsgruppen fra #1805 kan opprette, redigere og publisere status og redigere prosjektinformasjon.
4. Porteføljeoversikten, statuskolonnen, prosjektlisten og programoversikten viser det skjermede prosjektet for innsynsgruppen og prosjektets medlemmer, og ikke for andre.
5. Prosjekttidslinjen på et skjermet prosjekt viser prosjektperioden uten feil, og det går ikke å legge til elementer.
6. Vanlige prosjekter på samme hub oppfører seg som før.
7. Kan ikke skjermingen avgjøres, skrives ingen prosjektdata, og brukeren får en melding.
