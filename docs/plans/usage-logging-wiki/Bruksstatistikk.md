> **Utkast, ikke publisert.** Avsnitt i [hakeparentes] venter på juridisk vurdering (L1–L6 i
> `docs/plans/usage-logging.md`) og publiseres først når de er godkjent. Fjern denne boksen før siden
> publiseres i wikien.

# Bruksstatistikk

Prosjektportalen sender fra versjon 1.15 bruksstatistikk til Prosjektportalen-teamet i SoftwareOne,
slik at vi ser hvilke versjoner som er i bruk, hvilke deler av løsningen som brukes, og hvor mye. Vi
teller bruk, ikke personer: ingenting om brukerne, innholdet eller adressene til prosjektområdene
sendes, og ingenting lagres i nettleseren.

Bruksstatistikk er på som standard (nivå 3, Utvidet) og kan senkes eller slås av i listen
**Globale innstillinger** på porteføljeområdet (`UsageStatisticsLevel`: 0 = av, 1 = grunnleggende,
2 = standard, 3 = utvidet). En endring gjelder innen to timer.

## Hva vi bruker tallene til

- Prioritere videreutvikling og feilretting.
- Se hvilke versjoner og kanaler som er i bruk.
- Support og feilsøking (nivå 3).
- Kundeoppfølging: se hvilke installasjoner som er i bruk.

Tallene brukes ikke til markedsføring mot brukerne, selges ikke og deles ikke med andre.

[Juss, L5: formålene, også kundeoppfølging, bekreftes.]

## Nivåene

| Nivå | Hva som sendes |
| --- | --- |
| 0, av | Ingenting. |
| 1, grunnleggende | Versjon, kanal, språk og antall prosjekter, programmer og overordnede prosjekter. Det sendes når en eier åpner porteføljeområdet, og vi tar bare vare på siste verdi med uken den kom, og siste verdi hver måned. |
| 2, standard | I tillegg hvilke webdeler, utvidelser og funksjoner som brukes, og hvor mange ulike områder som er i bruk, som antall per dag. Områdene telles med en kode som regnes ut av områdets ID og byttes hver måned. Navn og adresser sendes ikke. |
| 3, utvidet | I tillegg feilkoder og lastetider, for feilsøking. **Dette er standardvalget.** |

Nivå 2 heter «standard», men standardvalget er nivå 3.

Nivå 1 sendes bare fra porteføljeområdet, og bare fra en bruker som kan administrere det. Nivå 2 og 3
sendes fra nettleseren til alle som bruker Prosjektportalen. Det er porteføljeområdets innstilling
som gjelder, også på prosjektområdene, programmene og de overordnede prosjektene som hører til det.

## Hva som sendes, felt for felt

Nettleseren samler tallene i minnet og sender dem samlet når fanen skjules eller lukkes. Hver sending
er et JSON-objekt med feltene under. Ingen andre felt sendes, og Prosjektportalen-teamets mottak
avviser en sending med felt det ikke kjenner.

### I hver sending

| Felt | Innhold |
| --- | --- |
| `schema` | Versjonen av formatet, alltid `1`. |
| `batchId` | En tilfeldig ID som lages for hver sending, slik at samme sending ikke lagres to ganger. Den lagres ikke i nettleseren og knytter ingen sendinger sammen. |
| `host` | Tenantens SharePoint-adresse, for eksempel `contoso.sharepoint.com`. |
| `tenantId` | Tenantens ID i Microsoft Entra ID. Kan mangle. |
| `hubUrl` | Adressen til porteføljeområdet, for eksempel `https://contoso.sharepoint.com/sites/prosjektportalen`. |
| `level` | Nivået: `1`, `2` eller `3`. |
| `appVersion` | Versjonen av Prosjektportalen i nettleseren, for eksempel `1.15.0`. |

### Nivå 1: `heartbeat`

| Felt | Innhold |
| --- | --- |
| `channel` | Utgivelseskanalen: `main`, `test`, `i18n`, `kurs` eller `unknown`. |
| `templateVersion` | Versjonsnummeret porteføljeområdet sist ble installert eller oppgradert med, for eksempel `1.15.0`. Hvem som installerte og hvilken kommando som ble brukt, leses ikke. |
| `hubLanguage` | Språket til porteføljeområdet: `nb-NO`, `en-US` eller `other`. Aldri brukerens språk. |
| `projects`, `programs`, `parentProjects` | Antall prosjekter, programmer og overordnede prosjekter i listen Prosjekter. Et antall som ikke kan leses, sendes ikke. |
| `catalog` | Om malpakkekatalogen kan sende hendelser (se under). |

### Nivå 2: `usage` og `sites`

Hver oppføring i `usage` sier hvor mange ganger noe har skjedd siden forrige sending:

| Felt | Innhold |
| --- | --- |
| `c` | Webdelen eller utvidelsen, med navnet den har i løsningen, for eksempel `PortfolioOverviewWebPart`. Hele listen står under. |
| `e` | Hva som skjedde, fra listen over hendelser under. |
| `s` | Hva slags område det skjedde på: `hub` (porteføljeområdet), `project`, `program`, `parent` (overordnet prosjekt) eller `other`. |
| `v` | En fast verdi for noen få hendelser, for eksempel om et prosjektoppsett var nytt eller en ny kjøring. Aldri tekst fra brukerne. |
| `n` | Antallet. |

Hver oppføring i `sites` er et område som var i bruk:

| Felt | Innhold |
| --- | --- |
| `h` | Områdekoden: 16 tegn som regnes ut av områdets ID og måneden, og som byttes hver måned. Aldri selve ID-en. Se [Områdekoden](#områdekoden). |
| `s` | Hva slags område det er, som i `usage`. |

| Hendelse (`e`) | Betyr | Telles av |
| --- | --- | --- |
| `loaded` | En webdel ble lastet. | Alle webdelene |
| `page.viewed` | En side ble vist. | `Footer` |
| `setup.completed` | Prosjektoppsettet ble fullført, med verdien `new` (nytt prosjekt), `rerun` (oppsettet kjørt på nytt) eller `parent` (gjort om til overordnet prosjekt). | `ProjectSetup` |
| `setup.aborted`, `setup.failed` | Prosjektoppsettet ble avbrutt eller feilet. | `ProjectSetup` |
| `statusReport.created`, `statusReport.published`, `statusReport.edited`, `statusReport.deleted` | En statusrapport ble opprettet, publisert, redigert eller slettet. | `ProjectStatusWebPart` |
| `phase.changed` | Prosjektet byttet fase. | `ProjectPhasesWebPart` |
| `properties.edited` | Prosjektegenskapene ble redigert. | `ProjectInformationWebPart` |
| `excel.exported` | En liste ble eksportert til Excel. | `PortfolioOverviewWebPart`, `PortfolioAggregationWebPart`, `ProgramProjectOverviewWebPart`, `ProgramAggregationWebPart`, `DynamicListWebPart` |
| `timelineItem.opened` | Et element i en tidslinje ble åpnet. | `PortfolioTimelineWebPart`, `ProjectTimelineWebPart`, `ProgramTimelineWebPart` |
| `catalog.opened` | Malpakkekatalogen ble åpnet. | `TemplatePackageCatalog` |
| `assistant.opened`, `help.opened` | Assistenten eller hjelpen ble åpnet fra bunnteksten. | `Footer` |
| `news.created` | En nyhet ble opprettet. | `ProjectNewsWebPart` |
| `postAction.toggled` | Visningen etter tiltak ble slått av eller på i en matrise. | `RiskMatrixWebPart`, `OpportunityMatrixWebPart` |
| `view.switched`, `view.saved` | En visning ble byttet eller lagret. | `PortfolioOverviewWebPart`, `ProgramProjectOverviewWebPart` |
| `portfolio.switched` | Porteføljen ble byttet. | `PortfolioOverviewWebPart` |
| `dataSource.switched`, `layout.toggled` | Datakilden ble byttet, eller visningen ble gjort kompakt eller vanlig. | `PortfolioAggregationWebPart`, `ProgramAggregationWebPart` |
| `viewAll.toggled` | «Vis alle» ble slått av eller på. | `LatestProjectsWebPart` |
| `tab.switched` | En fane i prosjektlisten ble valgt. | `ProjectListWebPart` |
| `documentTemplates.copied` | Dokumentmaler ble kopiert til prosjektet. | `TemplateSelectorCommand` |
| `riskAction.created` | Et tiltak ble opprettet i Planner fra en usikkerhet. | `RiskActionPlanner` |
| `idea.recommended` | En idé fikk en anbefaling, med verdien `approve`, `consider`, `reject` eller `other`. | `IdeaRegistration` |
| `idea.decided` | En idé fikk en beslutning, med de samme verdiene. | `IdeaProcessing` |
| `idea.projectDataCreated` | Prosjektdata ble opprettet fra en idé. | `IdeaProjectData` |
| `childProjects.added`, `childProjects.removed` | Prosjekter ble lagt til i eller fjernet fra et program. | `ProgramAdministrationWebpart` |

<details>
<summary>Webdelene og utvidelsene som kan stå i <code>c</code></summary>

Webdeler: `LatestProjectsWebPart`, `PortfolioAggregationWebPart`, `PortfolioOverviewWebPart`,
`ProjectListWebPart`, `PortfolioTimelineWebPart`, `ResourceAllocationWebPart`, `IdeaModuleWebPart`,
`ProjectCardWebPart`, `ProgramAdministrationWebpart`, `ProgramAggregationWebPart`,
`ProgramProjectOverviewWebPart`, `ProgramTimelineWebPart`, `OpportunityMatrixWebPart`,
`ProjectInformationWebPart`, `ProjectPhasesWebPart`, `ProjectStatusWebPart`,
`ProjectTimelineWebPart`, `RiskMatrixWebPart`, `ProjectNewsWebPart` og `DynamicListWebPart`.

Utvidelser: `Footer` (bunnteksten), `IdeaProcessing`, `IdeaProjectData`, `IdeaRegistration`,
`TemplatePackageCatalog` (malpakkekatalogen), `ProjectSetup` (prosjektoppsettet),
`RiskActionPlanner` og `TemplateSelectorCommand` (dokumentmaler).

</details>

### Nivå 3: `errors` og `timings`

Hver oppføring i `errors` sier hvor mange ganger en webdel eller utvidelse fikk en feil:

| Felt | Innhold |
| --- | --- |
| `c` | Webdelen eller utvidelsen. |
| `code` | Feilkoden: `permission_denied`, `not_found`, `throttled`, `server_error`, `timeout`, `network`, `render_failed`, `provisioning_failed` eller `unknown`. |
| `http` | HTTP-statusen når den er kjent: `0`, `400`, `401`, `403`, `404`, `409`, `412`, `429`, `500`, `502`, `503` eller `504`. |
| `n` | Antallet. |

En feil telles når en webdel ikke kan vises (`render_failed`), når prosjektoppsettet feiler
(`provisioning_failed`), og når en webdel ikke får lastet eller lagret noe og viser en melding om
det. Bare koden og statusen sendes, aldri feilmeldingen, som kan inneholde navn og adresser.

Hver oppføring i `timings` sier hvor lang tid noe tok:

| Felt | Innhold |
| --- | --- |
| `c` | Webdelen eller utvidelsen. |
| `m` | Hva som ble målt. I 1.15 bare `init`: tiden en webdel bruker på å starte. |
| `h` | Antall målinger i hvert av sju intervaller: under 250 ms, 250–499 ms, 500–999 ms, 1–2 s, 2–4 s, 4–8 s og 8 s eller mer. Enkeltmålinger sendes ikke. |

### Hendelser fra malpakkekatalogen

Malpakkekatalogen sender en hendelse når en malpakke installeres, oppdateres, fjernes eller
publiseres. Fra 1.15 sendes den bare på nivå 2 og 3, bare når `CatalogTelemetryEnabled` er `1`, og
bare fra Prosjektportalens egen katalog, aldri fra en katalog virksomheten har satt opp selv. En
hendelse lagres bare når pakken finnes i den offentlige katalogen.

| Felt | Innhold |
| --- | --- |
| `eventId` | En tilfeldig ID for hendelsen. |
| `action`, `status` | Hva som ble gjort (`install`, `update`, `remove` eller `publishCentral`), og om det lyktes. |
| `packageId`, `packageVersion`, `packageType`, `previousVersion` | Hvilken pakke og versjon det gjaldt, hva slags pakke det er, og versjonen før en oppdatering. |
| `ppVersion` | Versjonen av Prosjektportalen. |
| `tenantId`, `host`, `siteUrl` | Tenantens ID og SharePoint-adresse, og adressen til porteføljeområdet. |
| `detail` | Bare om termene ble hoppet over, eller hva slags pakke som ble fjernet. |
| `level` | Nivået, `2` eller `3`. Nytt i 1.15. |
| `errorCode` | Feilkoden, bare på nivå 3 og bare når noe feilet. Nytt i 1.15. |

Feilmeldingen og tidspunktet i nettleseren sendes ikke lenger fra 1.15.

### Eksempel

En sending på nivå 3 fra en eier på porteføljeområdet kan se slik ut:

```json
{
  "schema": 1,
  "batchId": "0f8c6a52-6b1e-4c39-9d7e-2f0a5b8e1c34",
  "host": "contoso.sharepoint.com",
  "tenantId": "9a5c0f3e-1b2d-4c6e-8f70-1a2b3c4d5e6f",
  "hubUrl": "https://contoso.sharepoint.com/sites/prosjektportalen",
  "level": 3,
  "appVersion": "1.15.0",
  "heartbeat": {
    "channel": "main",
    "templateVersion": "1.15.0",
    "hubLanguage": "nb-NO",
    "projects": 412,
    "programs": 7,
    "parentProjects": 12,
    "catalog": true
  },
  "usage": [
    { "c": "Footer", "e": "page.viewed", "s": "hub", "n": 5 },
    { "c": "PortfolioOverviewWebPart", "e": "loaded", "s": "hub", "n": 3 },
    { "c": "ProjectSetup", "e": "setup.completed", "s": "project", "v": "new", "n": 1 }
  ],
  "sites": [
    { "h": "3f9a0c1d2e4b5a69", "s": "hub" },
    { "h": "b07e5d2c91a4f386", "s": "project" }
  ],
  "errors": [{ "c": "ProjectStatusWebPart", "code": "throttled", "http": 429, "n": 1 }],
  "timings": [{ "c": "PortfolioOverviewWebPart", "m": "init", "h": [0, 2, 1, 0, 0, 0, 0] }]
}
```

## Hva som aldri sendes

1. Noe som identifiserer en bruker: navn, brukernavn, innloggingsnavn, e-postadresser, objekt-ID-en
   i Entra ID, bruker-ID-en i SharePoint eller gruppemedlemskap.
2. Koder eller ID-er som er laget ut fra en bruker, en enhet, en nettleser, en fane eller en økt,
   heller ikke fingeravtrykk. `batchId` er tilfeldig for hver sending og knytter ingenting sammen.
3. ID-er som er de samme fra sending til sending, bortsett fra `host`, `tenantId`, `hubUrl` og
   områdekoden, som byttes hver måned: ingen ID for område, liste, element, side, fil, term eller
   webdel.
4. Innhold: navn og titler på prosjekter, områder, sider, lister, biblioteker, mapper, filer,
   visninger, faser, termer, maler, rapporter, idéer eller usikkerheter. Heller ikke tekst fra
   statusrapporter, kommentarer, filterverdier, søketekst, kolonneverdier eller samtaler med
   Prosjektportalen Assistenten.
5. Andre adresser enn porteføljeområdets, spørrestrenger eller adressen til siden brukeren kom fra.
6. Fritekst: feilmeldinger, stakksporinger eller logglinjer.
7. Opplysninger om nettleser og enhet: nettleser, operativsystem, skjermstørrelse, tidssone eller
   brukerens språk.
8. Nettverksopplysninger: IP-adresser og SharePoints korrelasjons-ID-er. IP-adressen lagres ikke av
   oss; driftsleverandøren logger forespørsler en kort periode. [Juss, L3: driftsleverandørens
   loggtid og region bekreftes.]
9. Tidspunkter: ingen sending har tidsstempel. Bruken dateres med dagen den kom fram, i norsk tid,
   og nivå 1 med uken.
10. Verdier fra Globale innstillinger, bortsett fra nivået og om malpakkekatalogen kan sende. Ingen
    hemmeligheter, nøkler eller adresser, og ingenting fra loggen. Fra installasjonsloggen bare
    kanalen og versjonsnummeret.
11. Antall ulike brukere, nettlesere eller økter.

Ingenting lagres i nettleseren: bruksstatistikk lagrer ingenting i informasjonskapsler, local
storage, session storage eller andre lagre i nettleseren. Tallene ligger i minnet til de er sendt.

## Standardvalget, og hvordan det endres

- **Ny installasjon:** porteføljeområdet får nivå 3.
- **Oppgradering til 1.15:** et porteføljeområde uten innstillingen får nivå 3. Hadde dere slått av
  statistikken for malpakkekatalogen, får det nivå 0: når `CatalogTelemetryEnabled` er `0`, raden er
  deaktivert eller slettet, eller `telemetryUrl` er tom på katalogen. Er innstillingen slettet etter
  at porteføljeområdet fikk 1.15, legges den inn igjen som 0. En innstilling som finnes, endres
  aldri av en oppgradering.
- **Velg på forhånd:** kjør installasjonen eller oppgraderingen med
  `-UsageStatisticsLevel Off`, `Basic`, `Standard` eller `Extended`. Se [Installasjon](Installasjon).
- **Endre senere:** i listen Globale innstillinger på porteføljeområdet, raden
  «Bruksstatistikk til Prosjektportalen-teamet (0 = av, 1 = grunnleggende, 2 = standard,
  3 = utvidet)», med nøkkelen `UsageStatisticsLevel`. Verdien er `0`, `1`, `2` eller `3`.
- En endring gjelder innen to timer: Prosjektportalen holder innstillingene i inntil en time, og en
  fane som står åpen, leser dem på nytt når den har brukt dem i en time.

Bruksstatistikk er også av når:

- raden har **Aktivert** = Nei, er slettet eller har en annen verdi enn `0`, `1`, `2` eller `3`;
- `CatalogTelemetryEnabled` er `0`. Den stopper all bruksstatistikk, ikke bare malpakkekatalogens;
- nettleseren sender Global Privacy Control eller Do Not Track. Da sendes ingenting fra den
  nettleseren.

Dere kan også stenge for `assist.prosjektportalen.no/api/telemetry/*` i brannmuren eller proxyen.
Prosjektportalen virker som før uten.

## Områdekoden

Områdekoden lar oss telle hvor mange ulike områder som er i bruk per dag og per måned, uten at
områdets ID forlater tenanten. Nettleseren regner den ut av områdets ID og måneden (norsk tid), så
samme område får en ny kode hver måned, og et område kan ikke følges fra én måned til den neste.
Bare den som allerede har ID-ene til områdene i tenanten, kan finne ut hvilket område en kode hører
til. Kodene slettes etter 90 dager, og da er bare antallet igjen.

I en svært liten tenant, eller et prosjekt med én eller to personer, kan tallene innenfor en måned
gjenspeile det de få gjør. [Juss, L2: om områdekoden er en personopplysning i svært små prosjekter.]

## Hvor det behandles, og hvor lenge det lagres

Bruksstatistikk og hendelser fra malpakkekatalogen behandles i EU (Stockholm) og lagres i EU
(Frankfurt) hos SoftwareOne. Tallene lagres uten tidsbegrensning. Kodene som brukes til å telle ulike
områder, slettes etter 90 dager, og da er bare antallet igjen. Opplysningene på nivå 1 lagres bare
som siste verdi med uken de kom, og som siste verdi per måned. Hendelser fra malpakkekatalogen lagres
uten tidsbegrensning. Installasjonsmeldinger lagres i Prosjektportalen-teamets Azure-abonnement
[region bekreftes] og hos SoftwareOne i EU (Frankfurt), uten fastsatt sletting. Sletting på
forespørsel gjelder bruksstatistikk og hendelser fra malpakkekatalogen, ikke installasjonsmeldinger.

ID-ene som hindrer at samme sending lagres to ganger (`batchId`), slettes etter sju dager.

**Sletting på forespørsel:** send en e-post til [kontaktadresse] med adressen til tenanten
(`contoso.sharepoint.com`). Vi sletter bruksstatistikken og hendelsene fra malpakkekatalogen for
tenanten. [Juss, L4: lagringstiden uten tidsbegrensning bekreftes.]

## Roller og behandlingsgrunnlag

[Juss, L2: SoftwareOne er behandlingsansvarlig for bruksstatistikken. Grunnlaget er
personvernforordningen artikkel 6 nr. 1 bokstav f, berettiget interesse, med en skriftlig
interesseavveining. Retten til å protestere ivaretas med innstillingen, Global Privacy Control og
Do Not Track.]

[Juss, L1: ekomloven § 3-15 og hvorfor bruksstatistikken ikke lagrer eller leser noe på brukerens
enhet.]

[Juss, L3: underleverandører, region og loggtid.]

[Juss, L6: hva virksomheter med offentlige avtaler, egen DPIA eller ROS bør vite. Se også
[Grunnlag for DPIA og ROS](Grunnlag-for-DPIA-og-ROS).]

## Slik ser du hva som sendes

1. Åpne utviklerverktøyene i nettleseren (F12) og velg fanen **Nettverk**.
2. Filtrer på `telemetry`.
3. Bruk Prosjektportalen, og bytt til en annen fane: da sendes tallene.
4. Velg forespørselen til `https://assist.prosjektportalen.no/api/telemetry/usage`. Den er en
   `POST` med innholdstypen `text/plain`, uten informasjonskapsler og uten adressen til siden du kom
   fra. Under **Nyttelast** ser du sendingen, med feltene på denne siden. Svaret er `204`.

På nivå 0 ser du ingen slike forespørsler.

## Det som ikke er bruksstatistikk

- **Installasjonsmeldingen** sendes av installasjonsskriptet når en installasjon eller oppgradering
  er ferdig. Den er en egen flyt med sin egen bryter, `-SkipPingback`, og nivået for bruksstatistikk
  påvirker den ikke. Se [Installasjon](Installasjon) og [Grunnlag for DPIA og ROS](Grunnlag-for-DPIA-og-ROS).
- **Prosjektportalen Assistenten** har sin egen telemetri. Se
  [Sikkerhet i Prosjektportalen Assistenten](Sikkerhet-i-PP-Assistenten).
- **GitHub:** Prosjektportalen henter versjonsinformasjon og malkatalogen fra GitHub i nettleseren.
  Det sendes ingen data om virksomheten utover en vanlig nettleserforespørsel.

## Når dette endres

Nye hendelser eller felt kommer bare med nye versjoner av Prosjektportalen, og denne siden oppdateres
samtidig. Andre tekster om bruksstatistikk, som release notes, manualen og
[Grunnlag for DPIA og ROS](Grunnlag-for-DPIA-og-ROS), bruker nivåtabellen og listen over det som
aldri sendes herfra.
