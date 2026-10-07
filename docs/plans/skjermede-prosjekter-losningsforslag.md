# Skjermede prosjekter – løsningsforslag

**Status:** forslag til diskusjon, 7. oktober 2026. Forslaget bygger på kartleggingen i `skjermede-prosjekter.md` og på beslutningene i avsnitt 1. Ingenting er prototypet ennå. Avsnitt 9 viser arbeidsantakelsene om plattformen. Bare søk i `GtChildProjects` er uavklart.

## 1. Beslutninger

| Tema | Beslutning |
|---|---|
| Omfang | Skjerming gjelder **per prosjekt** og styres fra malen. Maloppsett kobler malen til tillegget «Skjerming» via `GtProjectExtensions` og låser det med `IsDefaultExtensionsLocked`. Ingen ny kolonne trengs i Maloppsett. |
| Leveranse | Lister, innholdstyper og tilganger leveres som **Prosjekttillegget «Skjerming»**. Standardmalene endres ikke. |
| Huboppføring | Et skjermet prosjekt får **ingen oppføring** i hublisten Prosjekter. |
| Innsyn | En **SharePoint-gruppe som kopieres ved oppsett**, etter dagens mønster i SitePermissions. Gruppen får lesetilgang på de skjermede listene, ikke på hele området. |
| Logg | Skrives **til huben som i dag**. |
| Porteføljesiden | Leser via **søk**. Endringer vises etter neste gjennomsøking, og det er akseptert. |
| Program | **Full støtte.** Både programmer og underprosjekter kan være skjermet. |
| Underprosjekter i program | Et program som ikke er skjermet, lagrer fortsatt tittel og URL for skjermede underprosjekter i `GtChildProjects`. Det er akseptert. |
| Tidslinjetype | Lokale tidslinjeelementer lagrer typen som **tekst**, og typen matches mot Tidslinjekonfigurasjon på tittel. |
| Migrering | Et **engangsskript** for Bydelsreformen. Det er ikke en del av standard Prosjektportalen. |

## 2. Prinsipper

1. **Skjermingen må være trygg som utgangspunkt.** Hvor prosjektdata ligger, avgjøres av prosjektområdet selv og aldri av at huben ikke svarer. Hvis det ikke kan avgjøres, skrives ingenting.
2. **Konfigurasjonen blir på huben.** Statusseksjoner, kolonnekonfigurasjon, Tidslinjekonfigurasjon, maler og innholdstypedefinisjoner leses fortsatt fra huben. Prosjektbrukere trenger bare lesetilgang der.
3. **Lagrede spørringer skal ikke måtte endres.** Kundene kan ha egne søkespørringer i Portefoljevisninger og Datakilder. Skjermede data må derfor bruke de samme innholdstype-ID-ene, slik at `ContentTypeId:0x…*`-spørringene finner dem.
4. **Vanlige prosjekter merker ingen forskjell.** Uskjermede prosjekter bruker de samme kodestiene som i dag, bortsett fra at noen porteføljelesere får et ekstra søk for de skjermede.

## 3. Arkitektur

```
Hub (konfigurasjon + uskjermede prosjekter)          Skjermet prosjektområde
┌──────────────────────────────────────┐            ┌──────────────────────────────────────┐
│ Maloppsett ──► Prosjekttillegg       │  oppsett   │ Prosjektegenskaper  (CT 0x0100805E…) │
│               «Skjerming»            │ ─────────► │ Prosjektstatus      (CT 0x010022252E…)│
│ Tillatelseskonfigurasjon (innsyn)    │            │ Prosjektstatusvedlegg                │
│ Statusseksjoner, kolonnekonfig,      │  leses av  │ Tidslinjeinnhold    (CT 0x01006EE3…) │
│ Tidslinjekonfigurasjon, CT-er        │ ◄───────── │ Arkiveringslogg                      │
│ Prosjekter / Prosjektstatus / …      │            │                                      │
│   (bare uskjermede prosjekter)       │            │ Tilgang: områdets grupper + innsyn   │
│ Logg (alle prosjekter)               │            └──────────────────────────────────────┘
└──────────────────────────────────────┘                          ▲
                 ▲                                                │ søk (filtrert etter tilgang,
                 │ REST (uskjermede) + søk (alle)                 │  DepartmentId = hubens ID)
        Portefølje- og programwebdeler ───────────────────────────┘
```

## 4. Prosjekttillegget «Skjerming»

Tillegget er en JSON-fil med sp-js-provisioning-skjema i hubbiblioteket Prosjekttillegg. Biblioteket bruker versjon 1.3.15, som støtter alt tillegget trenger: innholdstyper med fast ID, binding av innholdstyper til lister, og `Security` på lister.

**Innhold:**
- **`SiteFields`:** feltene i statusinnholdstypen (`Templates/Portfolio/Objects/SiteFields/ProjectStatus/*.xml`, samt `GtSiteId` og `GtModerationStatus`) og tidslinjefeltene. De ligger i porteføljegruppen og kopieres derfor ikke av ProvisionSiteFields i dag.
- **Et nytt tekstfelt `GtTimelineTypeText`.** Det erstatter oppslaget `GtTimelineTypeLookup` lokalt.
- **`ContentTypes` med samme ID som på huben:**
  - Prosjektstatus `0x010022252E35737A413FB56A1BA53862F6D5`
  - Tidslinjeinnhold `0x01006EE320A23C8F4A6C83F3E36A19F076B9` (med tekstfeltet i stedet for oppslaget)
  - En prosjektinnholdstype som arver fra `0x0100805E9E4FEAAB4F0EABAB2600D30DB70C` (se 5.2)
- **`Lists`:** Prosjektstatus, Prosjektstatusvedlegg (dokumentbibliotek), Tidslinjeinnhold og Arkiveringslogg. Listene får samme titler som på huben, slik at `PortalDataService` kan bruke de eksisterende listenøklene.
- **`Security` på alle skjermede lister og på Prosjektegenskaper:**
  - `BreakRoleInheritance` med kopiering, slik at områdets eier-, medlems- og besøksgruppe beholder tilgangen.
  - Innsynsgruppen får rollen Les, angitt med navnet på SharePoint-gruppen.

Tillegget er låst for skjermede maler, så prosjektlederen kan ikke velge det bort.

**Tilpasning per innholdstype.** Skjermede prosjekter skal kunne tilpasses på samme måte som andre prosjekter, ut fra malens innholdstyper.
- Malspesifikke innholdstyper for status og tidslinje (Maloppsett `GtProjectStatusContentType` og `GtTimelineContentType`) og egne felt i hubens innholdstyper skal derfor støttes.
- Tillegget dekker standardinnholdstypene.
- Oppsettsoppgaven i 5.2 oppretter i tillegg malens innholdstype lokalt, med samme ID som på huben. Den kopierer også feltene som mangler. Det er samme mønster som `syncList` bruker for prosjektegenskaper.
- **Krav:** En malspesifikk statusinnholdstype må arve fra `0x010022252E35737A413FB56A1BA53862F6D5`, og en tidslinjeinnholdstype fra `0x01006EE320A23C8F4A6C83F3E36A19F076B9`. Ellers finner ikke søket i porteføljen elementene.

## 5. Prosjektsiden

### 5.1 Hvordan et prosjekt vet at det er skjermet

- **Sannheten er den lokale listen Prosjektstatus.** Den finnes bare hvis tillegget er brukt. `SPDataAdapterBase.configure` sjekker den én gang, med `web.lists.filter("Title eq '…'")`, og resultatet bufres for økten.
- **Hvis sjekken feiler med noe annet enn «finnes ikke», blir prosjektdata skrivebeskyttet.** Prosjektdata skrives da verken til huben eller lokalt, og brukeren får en lokalisert feilmelding.
- `TemplateParameters` på Prosjektegenskaper-elementet får `ShieldedProject: true`. Det er til informasjon og konsistenssjekk, ikke som sannhet. `TemplateParameters` gir tomme verdier hvis elementet mangler, og kan derfor ikke avgjøre noe trygt alene.
- **Property bag brukes ikke.** Gruppeområder har NoScript slått på, så property bag kan ikke skrives fra klienten.

### 5.2 Prosjektoppsett (ProjectExtensions)

**Skjermet oppsett** er avgjort fra `selectedExtensions` før oppgavene kjører. Prosjekttillegg-elementet får en ny ja/nei-kolonne, `GtShieldsProjectData`, som markerer at tillegget skjermer.

| Oppgave | Endring ved skjermet oppsett |
|---|---|
| PreTask | Ingen endring. Entitetstjenesten opprettes fortsatt, fordi den trengs for å lese hubens felt. |
| SitePermissions | Ny kolonne i Tillatelseskonfigurasjon, `GtPermissionScope` (*Område* / *Skjermede lister*). For *Skjermede lister* opprettes gruppen og fylles med brukere som i dag, men den får ingen tilgang på områdenivå. Tilgangen gis av `Security` i tillegget. |
| SetupProjectInformation | `_addEntryToHub` hoppes over. `syncList` oppretter Prosjektegenskaper som før. |
| ApplyTemplate | Tillegget brukes. Lister, innholdstyper og tilganger opprettes. |
| **Ny: ShieldProjectData** (rett etter ApplyTemplate) | 1. Binder prosjektinnholdstypen til Prosjektegenskaper. 2. Gir elementet den innholdstypen og setter `GtSiteId`. 3. Oppretter malens status- og tidslinjeinnholdstype lokalt med samme ID, kopierer felt som mangler, og binder typene til listene. 4. Skriver `ShieldedProject` til `TemplateParameters`. |
| TimelineConfiguration (via CopyListData) | Kopierer standardelementene til den lokale Tidslinjeinnhold-listen, med `GtTimelineTypeText` i stedet for oppslag. |
| `_ensureParentProjectPatch` | Setter `GtIsParentProject` lokalt. |
| Idébehandling | Ingen endring. Idédataene ligger på huben før prosjektet finnes. |

**Om innholdstypen for prosjektegenskaper.** Søket i porteføljen bruker prefikset `ContentTypeId:0x0100805E9E4FEAAB4F0EABAB2600D30DB70C*`. En lokal innholdstype som *arver* fra denne ID-en (`0x0100805E…00<guid>`) treffes derfor av de lagrede spørringene, uten at feltene må være identiske med hubens innholdstype. Feltene som kopieres av `syncList`, er listefelt. Søket bruker de interne navnene, så de gir samme gjennomsøkte egenskaper. Dette må bekreftes i en tenant (avsnitt 9).

### 5.3 Datalaget (shared-library)

- **`PortalDataService` får `projectDataWeb?: IWeb` i konfigurasjonen og en privat metode `_webFor(listKey)`:**
  - `PROJECT_STATUS`, `PROJECT_STATUS_ATTACHMENTS` og `TIMELINE_CONTENT` går til `projectDataWeb` når prosjektet er skjermet. Alt annet går til hubens web.
  - Er prosjektet skjermet og `projectDataWeb` mangler, kastes en feil. Huben brukes aldri som reserve.
  - `_getList`, `getStatusReportAttachments` (filoppslaget) og `getListFields` bruker `_webFor`.
- **Faste feil som må rettes uansett:**
  - `getContentTypeFields` ignorerer `web`-parameteren.
  - `getStatusReportAttachments` oppretter en mappe ved lesing (`ensureAttachmentsFolder`). Det feiler for innsynsgruppen, som bare har lesetilgang.
  - `usePublishReport` og `useDeleteReport` oppretter hver sin egen `PortalDataService`. De må bruke `SPDataAdapter.portalDataService`, slik at instansen er konfigurert med riktig mål.
- **`isAvailable`** skal fortsatt bety «huben svarer». For et skjermet prosjekt skal `getStatusReports` ikke returnere `[]` bare fordi huben er utilgjengelig, når dataene ligger lokalt.
- **`SPDataAdapterBase.configure`** avgjør `isShielded` (5.1) og sender det videre til `ProjectDataService` og `PortalDataService`.
- **`ProjectDataService`:**
  - Reserven til hubentiteten (`getProjectInformationData`) slås av for skjermede prosjekter.
  - `updateProjectPhase` skriver bare lokalt.

### 5.4 Prosjektets webdeler (ProjectWebParts)

**Prosjektstatus**
- Får skjerming gjennom `_webFor` uten egne endringer.
- `snapshotUrl` og `imageLink` blir automatisk lenker til prosjektområdet.
- Statusseksjoner og kolonnekonfigurasjon leses fortsatt fra huben.

**Prosjektinformasjon**
- `syncPropertyItemToHub` hoppes over for skjermede prosjekter.
- Statussammendraget leser lokalt via `_webFor`.
- Overordnede og underordnede prosjekter, se 7.

**Prosjekttidslinje**
- `fetchProjectData` leser datoene fra det lokale egenskapselementet. `projectId` og `GtSiteIdLookupId` trengs ikke lokalt.
- `fetchTimelineData`:
  - Listen hentes via `_webFor`.
  - Filteret på `GtSiteIdLookup` og kravet om at feltet ikke er tomt (`.filter(item.GtSiteIdLookup !== null)`) fjernes for lokale data. Hvert element tilhører jo prosjektet.
  - Typen leses fra `GtTimelineTypeText` og matches mot konfigurasjonen på tittel.
- `CustomEditPanel` får det lokale området som `targetWeb`. Feltet `GtTimelineTypeText` får en nedtrekksliste fylt med titlene fra Tidslinjekonfigurasjon, slik at brukeren ikke skriver fritt.
- Sletting går via `deleteItemFromList`. Dagens `await forEach` venter i praksis ikke på slettingene, og det rettes samtidig.

**Prosjektnyheter** leser prosjektfeltene fra det lokale elementet.

**Prosjektfaser og arkiv**
- `writeToArchiveLog` og `getArchiveStatus` bruker det lokale området.
- Logg skrives fortsatt til huben.

**Footer** (PortfolioExtensions)
- `getProjectDetails` leser lokalt på skjermede prosjekter.
- Listen over fulgte prosjekter suppleres med søk.

## 6. Porteføljesiden

| Leser | Endring |
|---|---|
| Porteføljeoversikt og refinere | Ingen kodeendring. Lagrede spørringer finner skjermede prosjekter og status via innholdstype og `DepartmentId`. Duplikatsjekken (nøyaktig ett prosjekttreff per område) holder, fordi skjermede prosjekter ikke har noen huboppføring. |
| Ledervisningen (PortfolioInsight) | Ingen kodeendring. Den viser skjermede prosjekter der innsynsgruppen gir tilgang. |
| **Statuskolonnen** | Bruker statusfeltene som allerede finnes i søkeresultatet for raden, i stedet for en egen REST-lesing av hublisten (topp 500). Det trengs en kobling fra administrert egenskap til internt feltnavn via Prosjektkolonner. Felt som ikke finnes i Prosjektkolonner, vises ikke for skjermede prosjekter, og det er akseptert. |
| **Prosjektliste og prosjektkort** | Leser hubelementer med REST som før, og supplerer med søk etter skjermede prosjekter (`ContentTypeId:0x0100805E…* -SiteId:{hub}`). Personer bygges fra `RefinableString50` og `51`, siden bruker-ID fra huben ikke finnes. `GtGroupId` må bekreftes som søkbar. |
| **PortfolioAggregation `fetchProjectsByDataSource`** | OData-filteret kan ikke oversettes automatisk. Skjermede prosjekter hentes med datakildens KQL (`GtSearchQuery`) når den er fylt ut. Begrensningen dokumenteres. |
| **Porteføljetidslinje** | Innhold fra huben leses med REST som før. Skjermet innhold hentes med søk via en ny datakilde, «Tidslinjeinnhold (skjermede prosjekter)»: `ContentTypeId:0x01006EE3…* DepartmentId:{hub} -SiteId:{hub}`, etter samme mønster som `fetchItemsWithSource`. Det krever at `ows_GtTimelineTypeText` kobles til en `RefinableString`. |
| Ressursallokering, gevinster og siste prosjekter | Ingen endring. |

`-SiteId:{hub}` i de nye spørringene gjør at uskjermede elementer ikke hentes to ganger. De hentes allerede med REST fra huben.

## 7. Program og overordnede prosjekter

| Situasjon | Løsning |
|---|---|
| **Skjermet program** | `GtChildProjects` lagres bare lokalt. `updateProjectInHub` hoppes over. `fetchChildProjects` leser det lokale egenskapselementet, som allerede har samme JSON. |
| **Skjermet underprosjekt** | `_updateChildProjectParents` skriver ikke `GtParentProjects`, fordi underprosjektet ikke har noen huboppføring og programadministratoren normalt ikke kan skrive på underprosjektets område. |
| **Finne overordnede prosjekter** | `getParentProjects` søker allerede med `Contains(GtChildProjects, webUrl)` på huben. For skjermede programmer suppleres det med et søk på `GtChildProjectsOWSMTXT` mot innholdstypen for prosjektegenskaper. Det er usikkert om ID-er inne i JSON blir søkbare, så vi bygger med en egen administrert egenskap med site-ID-ene til underprosjektene (avsnitt 9, punkt 5). |
| **Kandidater i programadministrasjonen** | `getHubSiteProjects` søker etter alle prosjekter. Skjermede prosjekter vises bare for dem med tilgang, så programadministratoren må være i innsynsgruppen. |
| **Programoversikt og -tidslinje** | Som porteføljen (6). Data om underprosjekter filtreres etter tilgang. |
| **Usikkerhetsmatrisen på overordnede prosjekter** | Henter underprosjektene fra `getChildProjects` og risikoene via søk. Den virker når listen over underprosjekter leses lokalt. |

## 8. Drift

- **Installasjon:**
  - Tillegget «Skjerming» lastes opp til Prosjekttillegg sammen med de andre tilleggene.
  - Prosjekttillegg får kolonnen `GtShieldsProjectData`, og Tillatelseskonfigurasjon får `GtPermissionScope`. Begge legges inn i `PreInstallUpgrade` eller `PostInstallUpgrade` med versjonsvakt.
  - Søkekonfigurasjonen får koblingen for `GtTimelineTypeText`, og eventuelt for site-ID-ene til underprosjektene.
  - Datakilden «Tidslinjeinnhold (skjermede prosjekter)» legges til i Datakilder.
- **Oppgradering:** Endringer i status- eller tidslinjeinnholdstypen i senere versjoner må også inn i tillegget og i et delskript under `UpgradeAllSitesToLatest/` som bare kjører på skjermede områder. Dette er den varige vedlikeholdskostnaden.
- **Innsynsgruppen er et øyeblikksbilde fra oppsettet,** som i dagens SitePermissions. Synkronisering av medlemskap i drift er utenfor omfanget. Merk at SitePermissions hopper over grupper som er tomme på huben, så gruppen må ha medlemmer når prosjektet opprettes.
- **PP-assistenten** skriver `GtAi*`-feltene i Prosjektstatus og oppdateres til å skrive til prosjektområdet for skjermede prosjekter. Den må avgjøre skjerming på samme måte som i 5.1.
- **Lokalisering:** nye feilmeldinger for skrivebeskyttede prosjektdata og nye kolonnenavn legges i alle tre lokaliseringsfilene og i resx-filene for malene.
- **Migrering (engangsjobb for Bydelsreformen, ikke en del av standard Prosjektportalen),** for hvert prosjekt:
  1. Bruk tillegget på prosjektområdet.
  2. Kjør trinnene i ShieldProjectData.
  3. Kopier statusrapportene og vedleggsmappene med de nye ID-ene.
  4. Kopier tidslinjeelementene og sett typen som tekst.
  5. Fjern prosjektet fra programmenes `GtParentProjects`.
  6. Slett huboppføringene til slutt.

  Gamle lenker med `selectedReport` slutter å virke.

## 9. Arbeidsantakelser om plattformen

Svarene under er primærteorien vi bygger på. Om noen av antakelsene feiler, viser det seg i fase 2. Da justeres løsningen, ikke tilnærmingen.

| # | Spørsmål | Antakelse | Konsekvens |
|---|---|---|---|
| 1 | Blir skjulte lister på prosjektområdet gjennomsøkt med hubens `DepartmentId`? | **Ja.** | Lagrede spørringer i Portefoljevisninger og Datakilder finner skjermede data. |
| 2 | Treffer `ContentTypeId:0x0100805E…*` en lokal innholdstype som arver fra prosjektinnholdstypen, med de samme `*OWS*`-egenskapene? | **Ja.** | Porteføljeoversikten trenger ingen kodeendring (6). |
| 3 | Kan tillegget opprette innholdstyper med fast ID og felt fra `SiteFields` i samme kjøring? | **Ja, det må gå.** Verste fall endrer vi sp-js-provisioning. | sp-js-provisioning er Puzzlepart sitt eget bibliotek, så en endring der er innenfor vår kontroll. |
| 4 | Kan `Security` gi tilgang til en gruppe som ble opprettet av SitePermissions tidligere i samme oppsett? | **Må støttes i sp-js-provisioning.** | Støtte for gruppenavn som opprettes i samme oppsett, legges inn i sp-js-provisioning hvis den ikke virker allerede. |
| 5 | Er `GtChildProjectsOWSMTXT:"{siteId}"` søkbar? | **Usikkert.** | Bygg med reserveløsningen: en egen administrert egenskap med site-ID-ene til underprosjektene, skrevet ved siden av `GtChildProjects`. Test søket i JSON-feltet først, og fjern reserven hvis det virker. |
| 6 | Hvor lang er gjennomsøkingsforsinkelsen? | **Noen få minutter.** | Akseptert for statuskolonnen og prosjektlisten. |

## 10. Rekkefølge

1. **Avklaring av punkt 5 i avsnitt 9.** Sjekk at sp-js-provisioning håndterer punkt 3 og 4, og utvid biblioteket ved behov.
2. **Prosjektsiden, status:**
   - tillegget med statuslistene og innsynet
   - ShieldProjectData
   - `_webFor` og `isShielded`
   - de faste feilene i 5.3
   - Prosjektstatus og Prosjektinformasjon
3. **Porteføljen, status og prosjekter:** statuskolonnen, prosjektliste og prosjektkort.
4. **Tidslinjen:** lokal liste, tekstfelt, prosjekttidslinje, datakilde og porteføljetidslinje.
5. **Program:** lagring, utledning av overordnede prosjekter og kandidater.
6. **Arkiv, nyheter og footer.** PP-assistenten oppdateres for skjermede prosjekter.
7. **Drift:** installasjon, oppgraderingsdelskript, synkroniseringsskript for innsyn, e2e med et skjermet testprosjekt og dokumentasjon.
8. **Migreringsskript for Bydelsreformen**, levert separat.

## 11. Avklart

1. **`GtAi*`-feltene** skrives av PP-assistenten. Den oppdateres til å håndtere skjermede prosjekter (8).
2. **Statusfelt som ikke finnes i Prosjektkolonner,** vises ikke i statuskolonnen for skjermede prosjekter. Det er akseptert.
3. **Skjermede maler** skal kunne tilpasses ut fra innholdstype, slik som andre prosjekter (4 og 5.2).
4. **Synkronisering av innsynsgruppen** i drift er utenfor omfanget.
