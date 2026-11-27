# Skjermede prosjekter – løsningsforslag

**Status:** vedtatt plan, 9. november 2026. Den ble lagt for 1.15 og gjelder nå 1.16.0. Avgjørelsene fra gjennomgangen 25. november 2026 står i avsnitt 17 og går foran det som ellers står her. Prøvingen i en tenant 26. og 27. november 2026 står i avsnitt 18. Forslaget bygger på kartleggingen i `skjermede-prosjekter.md`, på `releases/1.15` og på PR #1805 («Minimum lesetilganger på hub»), som merges før arbeidet starter.

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
| Tidslinje | Tidslinjeelementer på prosjektnivå er **ikke med** i 1.16.0. Prosjekttidslinjen viser prosjektperioden og leveransene, men det går ikke å legge til elementer. |
| Program | Full støtte. Både programmer og underprosjekter kan være skjermet. Et program som ikke er skjermet, lagrer fortsatt tittel og URL for skjermede underprosjekter i `GtChildProjects`. Det er akseptert. |
| Tilgang på huben for prosjektdeltakere | Minimumsgruppen fra #1805 er nok når webdelene kjører. Den som oppretter prosjektet, må være leser eller medlem på huben, fordi oppsettet leser lister som minimumsgruppen ikke dekker. |
| Innsynsgruppe | Konfigureres i Tillatelseskonfigurasjon med en ny kolonne, `GtPermissionScope`. Standardraden bruker gruppen Porteføljeinnsyn. Medlemmene kopieres når prosjektet opprettes, som i dagens SitePermissions. |
| Hva innsynsgruppen ser | Bare data i portefølje og program, inkludert informasjonspanelet. Prosjektets sider kan ikke åpnes. |
| Logg | Skrives til huben som i dag. Siden #1805 kan også brukere med bare minimumsgruppen skrive til Logg, og hver bruker ser bare egne oppføringer (`LogSecurity.xml`). |
| Porteføljesiden | Leser skjermede data via søk. Endringer vises etter noen få minutter. |
| Statuskolonnen | Søket finner siste publiserte rapport. Selve rapporten leses fra listen på prosjektområdet, med alle seksjoner og kommentarer. |
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

Tillegget er en sp-js-provisioning-fil i hubbiblioteket Prosjekttillegg (`Skjerming.txt` / `Shielding.txt`). Det leveres som standardinnhold fra `Templates/Content/Portfolio_content.<språk>/ProjectExtensions/`, med `GtShieldsProjectData = 1`, på samme måte som prosjektmalene lastes opp til Prosjektmaler.

**Endret under implementasjonen:** Filen er et tomt skjema. Lister, innholdstyper, felt og tilganger lages av oppsettsoppgaven `ShieldProjectData` (7) med `ShieldedProjectService` i shared-library, ikke av statiske `SiteFields`, `ContentTypes`, `Lists` og `Security` i tillegget. Grunnene:
- Innholdstypene og feltene kopieres fra huben, så malens egne innholdstyper og egne felt støttes uten at tillegget må vedlikeholdes ved siden av hubens innholdstyper.
- Listetitlene kommer fra ressursene, så samme kode virker på begge språk.
- Oppsettet kan kjøres på nytt («Kjør oppsettveiviser») og tar da med nye felt, som `syncList` gjør for prosjektegenskaper.
- Arbeidsantakelse 3 og 4 (13) gjelder dermed ikke sp-js-provisioning.

**Prosjekttillegg-listen** får en ny ja/nei-kolonne, `GtShieldsProjectData`. Den markerer at tillegget skjermer, slik at oppsettet vet det før oppgavene kjører.

## 7. Prosjektoppsett (ProjectExtensions)

**Skjermet oppsett** er avgjort av at et av de valgte tilleggene har `GtShieldsProjectData`, eller at prosjektet er skjermet fra før (skjerming kan ikke fjernes).

| Oppgave | Endring ved skjermet oppsett |
|---|---|
| PreTask | Ingen endring. Entitetstjenesten trengs for å lese hubens felt. |
| SitePermissions | Leser den nye kolonnen `GtPermissionScope`. *Område* er dagens oppførsel. *Skjermede lister* oppretter gruppen og legger inn medlemmene, men gir ingen tilgang på området; navnene sendes videre til `ShieldProjectData`. Rader med *Skjermede lister* hoppes over for vanlige prosjekter. |
| SetupProjectInformation | Hopper over `_addEntryToHub` og `updateIdeaData`. Hubloggen skrives. |
| ApplyTemplate | Tillegget brukes (tomt skjema). |
| **Ny: ShieldProjectData** (rett etter ApplyTemplate) | 1. Prosjektegenskaper: malens prosjektinnholdstype opprettes lokalt med samme ID (og innholdstypene den bygger på), bindes til listen og gis elementet, med `GtSiteId`, `GtSiteUrl` og `GtGroupId`. Innholdstypen opprettes med JSOM, siden REST-API-et gir den en egen ID (18). 2. Arkiveringslogg og Prosjektstatusvedlegg opprettes. 3. Prosjektstatus opprettes **sist**, med malens statusinnholdstype og feltene fra huben, fordi listen avgjør at prosjektet er skjermet. 4. Alle fire listene bryter arven med kopi og gir gruppene fra SitePermissions lesetilgang. 5. `ShieldedProject: true` skrives i `TemplateParameters` (til informasjon). Prosjektegenskaper og Prosjektstatus er synlige lister, fordi søket ikke tar med skjulte; de to andre er skjulte, som på huben (18). Feltene legges til listene fra områdekolonner på prosjektområdet, som lages fra hubens skjema der området mangler dem, også når prosjektegenskapene lages i `SetupProjectInformation` (18). Det tjenesten går videre uten, står som advarsel i veiviserens avanserte logg. |
| TimelineConfiguration | Hoppes over. |
| `_ensureParentProjectPatch` | Hoppes over; `GtIsParentProject` settes lokalt som før. |
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
- Statusfeltene leses fra den lokale innholdstypen, ikke fra hubens: fra statuslistens egen kopi av den, siden innholdstypen på prosjektområdet opprettes uten felt (17, punkt 11).
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

**Prosjektnyheter** kopierer ingen prosjektfelt til nyhetssiden for et skjermet prosjekt. Siden ligger på nyhetsområdet (huben som standard), der flere kan lese den, så bare område- og hub-ID knytter den til prosjektet. Siden #1805 tåler den også at Prosjekter-oppføringen mangler.

**Footer** (PortfolioExtensions): `getProjectDetails` leser lokalt på skjermede prosjekter.

## 10. Porteføljesiden

| Leser | Endring |
|---|---|
| Porteføljeoversikt, ledervisning og refinere | Ingen kodeendring. Lagrede spørringer finner skjermede prosjekter og status via innholdstype og `DepartmentId`. Duplikatsjekken (nøyaktig ett prosjekttreff per område) holder, fordi skjermede prosjekter ikke har huboppføring. |
| Sammenslått visning over flere huber (`mergedViewData`) | Hver hub leses med visningens søk rettet mot den, så et skjermet prosjekt får rad og hub fra søket. Rader fra andre huber enn webdelens egen viser ikke status, heller ikke for skjermede prosjekter (17, punkt 1). |
| **Statuskolonnen** | Søket etter publiserte rapporter finner også rapportene på skjermede prosjektområder. Raden får rapportens id (`StatusReportId`) og, når rapporten ligger utenfor huben, prosjektområdets adresse (`StatusReportWebUrl`). Kolonnen leser rapporten etter id fra listen på det området, med samme navn og felt som hublisten. |
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
| Finne overordnede prosjekter | `getParentProjects` spør i dag hubens Prosjekter med `Contains(GtChildProjects, webUrl)`. For skjermede programmer suppleres dette med søk. Implementert som søk på `GtChildProjectsOWSMTXT` (site-ID eller URL), der treff på hubens egne oppføringer filtreres bort. Virker ikke søket i testtenanten, legges et eget felt med underprosjektenes site-ID-er til, skrevet sammen med `GtChildProjects` og koblet til en administrert egenskap (13, punkt 5). |
| Kandidater i programadministrasjonen | Søket etter prosjekter (`hubSiteProjects`) viser skjermede prosjekter bare for dem med tilgang. Programadministratoren må derfor være i innsynsgruppen. |
| Programoversikt | Som porteføljen. Data om underprosjekter filtreres etter tilgang. |
| Usikkerhetsmatrisen på overordnede prosjekter | Virker når listen over underprosjekter leses lokalt. Risikoene hentes via søk. |

## 12. Drift

- **Installasjon og oppgradering:**
  - Prosjekttillegg får kolonnen `GtShieldsProjectData`, og Tillatelseskonfigurasjon får `GtPermissionScope`.
  - Standardraden for Porteføljeinnsyn med omfanget *Skjermede lister* legges inn **bare hvis den mangler**. DataRows i Tillatelseskonfigurasjon bruker `GtSPGroupName` som nøkkel med `Overwrite`. En kunde som allerede har en rad for Porteføljeinnsyn, ville ellers fått den overskrevet. Bruk mønsteret i `PostInstallUpgrade.ps1`.
  - Tillegget «Skjerming» lastes opp til Prosjekttillegg.
  - Søkekonfigurasjonen får koblingen for site-ID-ene til underprosjektene (11).
- **Oppgradering av skjermede områder:** 1.16.0 har ingen skjermede områder å oppgradere og får ikke noe delskript. Listene bygges fra hubens innholdstyper når prosjektet settes opp, og «Kjør oppsettveiviser» legger til det som har kommet til siden. En senere versjon som endrer innholdstypene for status, arkivlogg eller prosjekt, må ta med hvordan skjermede områder får endringen (17, punkt 2).
- **Innsynsgruppen** er et øyeblikksbilde fra oppsettet. SitePermissions hopper over grupper som er tomme på huben, så Porteføljeinnsyn må ha medlemmer når prosjektet opprettes.
- **PP-assistenten** skriver `GtAi*`-feltene i Prosjektstatus. Den oppdateres til å skrive til prosjektområdet for skjermede prosjekter og avgjør skjerming på samme måte som i 8. Feltene ligger på hubens liste, utenfor statusinnholdstypen, så oppsettet gir den lokale statuslisten det hublisten har gitt sin egen kopi av innholdstypen, og ikke feltene til hublistens andre innholdstyper (17, punkt 4, og 18).
- **Lokalisering:** nye meldinger og kolonnenavn legges i alle tre lokaliseringsfilene og i resx-filene for malene.
- **Dokumentasjon:** release notes, CHANGELOG, `.development-guide` og wikitekst. Release notes skal si at migrering ikke er inkludert, at skjerming ikke kan fjernes, og at tilgangene i #1805 til Prosjektstatus, Prosjektstatusvedlegg og Tidslinjeinnhold ikke trengs for skjermede prosjekter.

## 13. Arbeidsantakelser om plattformen

| # | Antakelse | Konsekvens hvis den ikke holder |
|---|---|---|
| 1 | Skjulte lister på et prosjektområde koblet til huben blir gjennomsøkt med hubens `DepartmentId`. | **Holder ikke** (18): søket tar ikke med elementer i skjulte lister. Synlige lister på prosjektområder er indeksert med hubens `DepartmentId`, så Prosjektegenskaper og Prosjektstatus er synlige på et skjermet prosjekt. |
| 2 | `ContentTypeId:0x0100805E…*` treffer en lokal innholdstype som arver fra prosjektinnholdstypen, og listefelt gir de samme `*OWS*`-egenskapene. | **Holder ikke for kolonner opprettet på listen** (18): søket gir `*OWS*`-verdier bare for et felt som er lagt til listen fra en områdekolonne. Feltene opprettes derfor som områdekolonner på prosjektområdet først. |
| 3 | Innholdstyper kan opprettes med fast ID på prosjektområdet (`web.contentTypes.add`), og felt kan legges til listens innholdstype med JSOM. | **Holder ikke for REST** (18): `web.contentTypes.add` gir innholdstypen en egen ID under Element. Den opprettes med JSOM (`SP.ContentTypeCreationInformation.set_id`), som sp-js-provisioning gjør med CSOM. Feltlenkene virker. SharePoint lenker selv et nytt listefelt til listens standardinnholdstype, så lenkene leses etter at feltene er lagt til. En slik lenke sier det feltet selv sier, så listens kopi av innholdstypen får etterpå det hubens innholdstype sier om feltet (skjult, obligatorisk). |
| 4 | Lesetilgang på listene gis til gruppene SitePermissions opprettet i samme oppsett. | Gjøres nå i `ShieldedProjectService.grantRead` (6). |
| 5 | Usikkert om `GtChildProjectsOWSMTXT:"{siteId}"` er søkbar. | Implementert med søk i JSON-feltet. Eget felt for site-ID-er lages bare hvis søket ikke virker i testtenanten (11). |
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

## 17. Avgjørelser fra gjennomgangen 25. november 2026

Gjennomgangen tok de åpne punktene i saken og funnene fra kartleggingen av grenen. Punktene har samme nummer som i gjennomgangen.

| # | Tema | Avgjørelse |
|---|---|---|
| 1 | Sammenslått visning over flere huber | Et skjermet prosjekt fra en annen hub viser ikke status, som de andre radene fra den huben. Statuskolonnen tegner en rapport med seksjonene til huben webdelen står på, og de er ikke nødvendigvis den andre hubens. |
| 2 | Oppgradering av skjermede områder | Ikke noe delskript i 1.16.0. «Kjør oppsettveiviser» dokumenteres som måten å oppdatere et skjermet prosjekt på. Selvreparering i statuswebdelen er foreslått som egen sak, og er ikke avgjort. |
| 3 | Søkekonfigurasjon for `GtChildProjects` | Venter på prøving i tenant: et skjermet program med ett underprosjekt. Svikter søket, letes det først etter en løsning uten nytt felt. |
| 4 | PP-assistenten | Støtten for skjermede prosjekter tas i denne runden, ikke som egen sak: assistenten skal kunne brukes i et skjermet prosjekt og finne informasjon om dem. Den leser med brukerens egne rettigheter. Oppsettet legger hublistens egne kolonner, `GtAi*`, på den lokale statuslisten. |
| 5 | Utviklerguide og wikitekst | Skrives etter rettelsene og prøvingen i tenant. |
| 6 | Integrasjonstest | Før merge: struktur og tilganger, ingen hubrader, datalaget og søk, mot et skjermet testprosjekt reservert for testen. |
| 7 | e2e | Før merge: statusutkast, prosjektinformasjon, prosjekttidslinje og porteføljen, mot et eget skjermet testprosjekt. Hvem som ikke ser prosjektet, og oppsettet av et skjermet prosjekt, prøves for hånd. |
| 8 | Program | Programmets prosjektliste, tidslinje og aggregeringer tar med skjermede prosjekter, lest fra prosjektets eget område. Det gjelder også programmets egen rad når programmet er skjermet. |
| 9 | Et eksisterende prosjekt som får tillegget | Oppsettet flytter og sletter ingenting. Det forteller hva som blir liggende på huben, med lenker til listene og følgen av å la det ligge: der tillegget velges, og igjen når oppsettet er ferdig. Oppføringen i Prosjekter må fjernes for at porteføljen skal vise prosjektet riktig. Porteføljen får ingen egen regel for dette, og det lages ingen nye felt. |
| 10 | Enhetstester | Etter risiko: reglene som verner selve skjermingen. Feltkopieringen og søkespørringene festes av integrasjonstesten. |
| 11 | Statusfeltene på et skjermet prosjekt | Leses fra statuslistens egen kopi av innholdstypen. Innholdstypen på prosjektområdet opprettes uten felt, så redigeringspanelet fikk bare tittelen. Funnet er lest fra koden og må bekreftes i tenant. |

**Nye felt:** Løsninger uten nye felt foretrekkes. Skjerming avgjøres fortsatt av at prosjektområdet har sin egen statusliste, og `ShieldedProject` i `TemplateParameters` er bare til informasjon.

**Ikke prøvd ennå:** Ingenting av løsningen er kjørt i en tenant per 25. november 2026. Arbeidsantakelsene i avsnitt 13 og akseptansekriteriene i avsnitt 16 står derfor ubekreftet.

## 18. Prøving i tenant, 26. og 27. november 2026

Tre nye prosjektområder på testhuben ble satt opp med Standardmal og tillegget «Skjerming». Det første (26. november, bygget av `fc5be371f`) stoppet i `ShieldProjectData`. Det andre (27. november, bygget av `b8770b5df`) fullførte alle ti stegene og er det første skjermede prosjektet i en tenant. Det tredje (27. november, en lokal bunt med rettelsene for feltene under) fullførte også, med feltene lagt til fra områdekolonner. Det som står under, er målt i tenanten.

**Det som virker på det skjermede prosjektet**

- Oppsettet: de tre innholdstypene med hubens ID-er, de fire listene med egne tilganger og Porteføljeinnsyn som leser, prosjektegenskapene med prosjektinnholdstypen og områdets ID, adresse og gruppe, og ingen rad i hubens Prosjekter, Prosjektstatus eller Tidslinjeinnhold. `SitePermissions` laget Porteføljeinnsyn med medlemmet fra huben, uten tilgang på området.
- Prosjektsiden: statusrapport som kladd og publisert (redigeringspanelet har statusfeltene, 17 punkt 11), øyeblikksbilde og seksjonsdata i det lokale Prosjektstatusvedlegg, prosjektinformasjon lagret uten huboppføring og uten advarsel, faseendring, og prosjekttidslinjen med prosjektperioden og meldingen om at elementer ikke kan registreres. Hublistene var uendret gjennom alt dette.
- Porteføljen (det tredje området): prosjektet står i porteføljeoversikten «Alle prosjekter» med verdiene fra søket, for en eier av området. Statuskolonnen sier «Ingen publisert rapport»: ingen rapport er publisert der. Prosjektlisten på hubens forside viste det ikke (se funnene).

**Funn og følger**

| Funn | Følge |
|---|---|
| Det første oppsettet stoppet med «Finner ikke innholdstype». REST-API-et hadde gitt prosjektinnholdstypen en egen ID under Element, så listen kunne ikke få den under hubens ID. | Innholdstypen opprettes med JSOM. Lagrer SharePoint den likevel under en annen ID, stopper oppsettet med begge ID-ene i meldingen. |
| Søket tar ikke med skjulte lister. På fire prosjektområder og huben hadde hver skjulte liste 0 elementer i søk og hver synlige liste alle, også Arkiveringslogg og Prosjektstatusvedlegg på huben. | Prosjektegenskaper og Prosjektstatus er synlige lister på et skjermet prosjekt, og synkroniseringen av prosjektegenskaper (`syncList`) skjuler ikke listen igjen. Prosjektstatusvedlegg og Arkiveringslogg er skjulte, som på huben. |
| Søket gir `*OWS*`-verdier bare for felt som er lagt til listen fra en områdekolonne. Elementet i Prosjektegenskaper på det første området ble indeksert med alle elleve prøvde egenskaper tomme, også for felt som har en områdekolonne med samme ID på området. Forskjellen står i listefeltets `SourceID`: områdets ID når feltet er lagt til fra en områdekolonne, listens ID når det er opprettet på listen fra XML. `syncList` og skjermingstjenesten opprettet nesten alle feltene på listen (36 av 37, 42 av 43 og 14 av 14 `Gt`-felt på det andre området). | Feltene legges til fra områdekolonner på prosjektområdet, som lages fra hubens områdekolonner der området mangler dem: i skjermingstjenesten, og i `syncList` for et skjermet prosjekt (`fromSiteColumns`, som oppsettet setter selv, siden prosjektet ikke er skjermet ennå når prosjektegenskapene lages). Kan en områdekolonne ikke lages, får listen en egen kolonne som før, og loggen sier hva det koster. Et skjermet prosjektområde får dermed rundt 75 områdekolonner til. På det tredje området er alle `Gt`-feltene i de tre listene lagt til fra områdekolonner (37, 34 og 14). Etter gjennomsøkingen har prosjektegenskapene der verdiene (`GtSiteIdOWSTEXT`, `GtProjectLifecycleStatusOWSCHCS`, `GtInstalledVersionOWSTEXT`, `GtProjectTemplateOWSTEXT`), og porteføljeoversikten på huben viser prosjektet med mal og livssyklus. Det andre området, med kolonner opprettet på listene, står i oversikten uten verdier og uten sin publiserte rapport. |
| På det tredje området manglet statuspanelet de fire budsjettfeltene, viste tittelen som obligatorisk felt og krevde ingen av de sju statusfeltene (22 felt til redigering mot hubens 25). Områdekolonnen var laget fra feltet slik prosjektinnholdstypen har det, og den skjuler budsjettfeltene i skjemaene sine: kolonnen ble skjult i statuslisten også. En feltlenke SharePoint lager på prosjektområdet, sier det feltet selv sier, ikke det hubens innholdstype sier (tittelen skjult, statusfeltene obligatoriske). | En områdekolonne lages fra hubens egen områdekolonne, som i oppsettets eget steg for områdekolonner. Et felt hubens innholdstype skjuler i skjemaene sine uten at feltet selv er skjult, blir en kolonne på listen i Prosjektegenskaper, skjult som på andre prosjekter: «Rediger prosjektinformasjon» leser listens felt, og porteføljeoversikten viser budsjettallene fra den publiserte statusrapporten. Listens kopi av innholdstypen får det hubens innholdstype sier om hvert felt (skjult, obligatorisk), og det er den kopien statuspanelet leser. **Rettet etter det tredje oppsettet, ikke prøvd i tenant ennå.** |
| Prosjektlisten på hubens forside viste ingen skjermede prosjekter, enda søket finner egenskapselementene deres. Søket navngir en egenskap i svaret slik spørringen navngir den, med skrivemåten spørringen bruker først: områdets adresse ble bedt om som `SPWebURL` og lest som `SPWebUrl`. Det samme gjaldt prosjektkortet for ett skjermet prosjekt. Radene innsynsgruppen får i porteføljeoversikten ba ikke om adressen i det hele tatt, så informasjonspanelet fikk ikke vite hvor prosjektet skulle leses. Enhetstestene svarte med navnene koden leser, og fanget det ikke. | De tre spørringene ber om `SPWebUrl` under det navnet, og testene har en stedfortreder for søket som svarer slik SharePoint gjør. **Rettet, ikke prøvd i tenant ennå:** krever at PortfolioWebParts rulles ut til testkanalen. |
| Et eksisterende prosjekt som får tillegget, har allerede feltene i Prosjektegenskaper som kolonner på listen. Porteføljen finner elementet, men uten verdier i kolonnene. | **Ikke avgjort** (berører 17, punkt 9). Enten gjør oppsettet feltene om, med verdiene til det ene elementet tatt vare på, eller så tilbys ikke «Skjerming» for et prosjekt som er satt opp. |
| Statuspanelet på det skjermede prosjektet viste 33 felt, mot 24 på et vanlig prosjekt: de åtte bygg- og anleggsfeltene og «Delprosjektleder» i tillegg. Oppsettet tok med alle feltene hublisten har utenfor statusinnholdstypen, og de hører til hublistens andre innholdstyper. KI-kolonnene ligger i hublistens egen kopi av statusinnholdstypen (36 lenker mot innholdstypens 29). | Listen får det hublisten har gitt sin egen kopi av innholdstypen, og ingenting fra hublistens andre innholdstyper. |
| Avansert logg hadde 47 advarsler «Could not add the field … Ukjent feil» for felt som var på plass. SharePoint lenker selv et nytt listefelt til listens standardinnholdstype, og koden lenket en gang til. | Lenkene leses etter at feltene er lagt til, og bare de som mangler, lages. På det tredje området sto seks advarsler igjen, for de skjulte hjelpefeltene til taksonomifeltene (notatfeltene, `TaxCatchAll` og `TaxCatchAllLabel`): SharePoint lenker dem sammen med taksonomifeltet og avviser en lenke til. Avviser SharePoint en lenke, leses lenkene på nytt, og det advares bare om et felt som fortsatt mangler. En advarsel betyr da at noe mangler. |
| En innholdstype-ID som slutter på to sifre, ble tatt for innebygd og aldri opprettet på prosjektområdet (lest fra koden, ikke prøvd): «Prosjekt (ByggAnlegg)» `…0CBA`, «Enkel prosjektmal» `…0C01` og statusinnholdstypene deres. Oppsettet ville stoppet for hver mal med egen innholdstype. | Hele rekken av innholdstyper under Element opprettes, unntatt dem området har. Må prøves med en slik mal. |
| Et oppsett som stopper i `ShieldProjectData`, etterlater et prosjekt som ikke er skjermet og ikke står på huben. Lagres prosjektinformasjon der, opprettes huboppføringen. | **Ikke avgjort.** |
| En nettleser får utdelt en komponents gamle manifest ved første forespørsel etter en oppgradering, uansett hvor lenge siden oppgraderingen var: oppsettveiviseren lastet ikke 18 timer etter, og porteføljeoversikten viste «Noe gikk galt» i én nettleser mens samme bruker fikk den riktige i en annen. | Skrevet inn i `.development-guide/spfx/testing.md` og release-ferdigheten. |

**Innsynsgruppen må ha medlemmer:** Porteføljeinnsyn var tom på testhuben. Da hopper `SitePermissions` over gruppen, og listene får ikke egne tilganger (12).

**Ikke prøvd ennå:** rettelsene etter det tredje oppsettet (statuspanelets felt og de seks advarslene), resten av porteføljesiden (statuskolonnen med en publisert rapport, prosjektlisten og prosjektkortet etter rettelsen, aggregeringene), hva innsynsgruppen ser og ikke ser, program med underprosjekt, to huber, en mal med egen innholdstype, og et eksisterende prosjekt som får tillegget.
