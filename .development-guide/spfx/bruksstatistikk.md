## Bruksstatistikk

Prosjektportalen teller fra 1.15.0 hvilke deler av løsningen som brukes, og sender tallene fra nettleserne til Prosjektportalen-teamet i Prosjektportalen Assist. Vi teller bruk, ikke personer: ingenting om brukerne, innholdet eller adressene til prosjektområdene sendes, og ingenting lagres i nettleseren. Dette kapittelet er for deg som legger til eller endrer en hendelse, starter telemetri i en ny webdel eller utvidelse, eller tester den. Begrunnelsene for valgene står i planen, `docs/plans/usage-logging.md`, med beslutningene P1–P25 og en slice-logg over det som er bygget.

### Nivåene og innstillingen

Hubens rad `UsageStatisticsLevel` i listen Globale innstillinger bestemmer hva nettleserne sender. Malen legger inn raden med verdien `3`.

| Nivå | Sendes |
|---|---|
| 0, av | Ingenting |
| 1, grunnleggende | En heartbeat med versjon, kanal, språk og antall prosjekter, programmer og overordnede prosjekter. Bare fra en bruker som kan administrere huben, og bare på en side på huben |
| 2, standard | I tillegg hvilke webdeler, utvidelser og funksjoner som brukes, og hvor mange ulike områder, som antall per dag. Et område telles med en kode som regnes ut av områdets ID og byttes hver måned |
| 3, utvidet | I tillegg feilkoder og lastetider, for feilsøking |

- `CatalogTelemetryEnabled` = `0` stopper all bruksstatistikk, ikke bare malpakkekatalogens. Hendelser fra katalogen sendes bare på nivå 2 og 3 og bare når raden er `1`.
- En deaktivert rad og en rad som mangler, betyr begge av. Det finnes ingen standardverdi i koden.
- En endring gjelder innen to timer: appen holder innstillingene i 60 minutter, og en åpen fane leser dem på nytt når beslutningen er en time gammel.
- Nettleserens Global Privacy Control og Do Not Track slår av, og det samme gjør flagget `PP_DISABLE_TELEMETRY` = `1` i session storage, som testerne og e2e-testene bruker.
- En DEBUG-build sender aldri bruksstatistikk. Den skriver hver batch til konsollen («(pp365) Usage statistics batch, not sent from a DEBUG build»). Hendelser fra malpakkekatalogen sendes fra en DEBUG-build som før.

### Kontrakten

Alt som kan sendes, står i `SharePointFramework/shared-library/src/telemetry/contract.ts`: komponentene (webdelenes og utvidelsenes alias fra manifestet), hendelsene med variantene sine og versjonen de kom i (`TELEMETRY_EVENTS`), feilkodene, tidsmålene og feltnavnene i en batch (`TELEMETRY_FIELDS`). Filen har ingen importer, med vilje.

Kontrakten finnes flere steder som må endres sammen, i samme endring:

- Assist har en ordrett kopi (`src/lib/pp-usage-contract.ts` i prosjektportalen-assist, hentet med `scripts/sync-pp-usage-contract.mjs <ref>`). Assist svarer 400 på et ukjent feltnavn og forkaster komponenter, hendelser og varianter det ikke kjenner. Assist rulles derfor ut først.
- Gullfiksturen `shared-library/src/telemetry/__fixtures__/usage-batch-v1.json` er byte-lik i begge repoene.
- E2E-spesifikasjonen `e2e/tests/smoke/usage-statistics.spec.ts` har sin egen kopi av feltnavnene, slik at et nytt felt ikke glir ut ubemerket.
- Wikisiden Bruksstatistikk lister hvert felt og det som aldri sendes, og kundetekstene kopierer den.

### Porten

Alle avsendere går gjennom den samme porten, også malpakkekatalogen: `resolveTelemetryGate` avgjør nivået, og `getTelemetryGate()` gir avgjørelsen som gjelder nå. Ingen avsender tester innstillingene selv. Porten leser nivået gjennom `getGlobalSettings()` på ankeret, som er hubens egen `PortalDataService`, festet med `attachTelemetryPortal(portal, settings?)`. En portal for en annen hub enn sidens egen blir ikke anker. Porteføljeoversikten som er satt opp med en portefølje, fester derfor ingen portal.

### Starte telemetri

- Basisklassene `BaseProjectWebPart`, `BasePortfolioWebPart` og `BaseProgramWebPart` starter telemetri i `onInit` når adapteren er satt opp, teller `loaded` og oppsettstiden (`init`), og pakker det de rendrer inn i `TelemetryProvider` med webdelens alias. En ny webdel på en av dem får dette uten egen kode, men aliaset må stå i kontrakten.
- Utvidelser starter selv: `startTelemetry(telemetryInitFromContext(this.context, { isDebug: DEBUG }))`, deretter `attachTelemetryPortal` når de har hubens `PortalDataService`. Kommandosettene i PortfolioExtensions bruker `helpers/commandSetTelemetry.ts`.
- Footer teller sidevisningen (`trackPageView('Footer')`) og ber om heartbeaten (`requestHeartbeat`), på hver side og etter hver navigasjon i SharePoint.
- Områdetypen (`hub`, `project`, `program`, `parent`, `other`) kommer fra en resolver per område: `registerSiteTypeResolver(siteId, () => portal.getSiteKind(siteId))`, eller `setSiteType` når koden vet den selv, som prosjektoppsettet etter at malen er brukt.

### Telle en hendelse

- I en komponent: `const telemetry = useTelemetry()` og `telemetry.track('view.switched')`, `telemetry.trackError(error)` eller `telemetry.trackTiming('init', ms)`. Komponenten teller for webdelen den står i, ut fra `TelemetryProvider` over den. Komponenter i det delte biblioteket teller derfor for den webdelen som bruker dem.
- I en klasse uten React: `trackUsage(alias, event, variant?)`, `trackError(alias, error)` og `trackTiming(alias, metric, ms)`.
- Tell én gang, i handleren der handlingen gikk gjennom, aldri i `render`, som kjører mange ganger. Et valg av det som allerede vises, er ikke et bytte. En lagring telles når listen har tatt den, ikke når knappen trykkes.
- Rett før koden laster siden på nytt eller forlater den: `flushTelemetry({ urgent: true })`. Ellers sendes tallene når fanen skjules eller lukkes.

### Telle en feil (nivå 3)

- Tell en last- eller lagringsfeil som komponenten selv håndterer og viser, én gang, i `catch`-blokken som håndterer den: `telemetry.trackError(error)`.
- Feilen telles på koden sin (`errorCodeFrom`) og HTTP-statusen, aldri på meldingen. En melding kan inneholde navn og adresser, og den forlater aldri tenanten.
- Kaster koden en ny feil med en generell tekst, skal den ta med den opprinnelige: `errorWithCause(tekst, error)`, eller `errorWithStatus(tekst, status)` når bare statusen er kjent. `errorCodeFrom` følger `cause`.
- Tell ikke validering, avbrutte dialoger, feil som svelges fordi funksjonen er valgfri, eller et avslag som er villet. Et eksempel på det siste: en bruker i «Minimum lesetilganger på hub» får ikke lese Prosjekter.

### Legge til en hendelse

1. Legg hendelsen i `TELEMETRY_EVENTS` med komponentene som kan telle den, variantene og `since` lik versjonen den kommer i. Varianter er faste nøkler, aldri tekst fra brukerne eller visningsnavn.
2. Oppdater Assists kopi og rull ut Assist først (se Kontrakten).
3. Oppdater hendelseslisten på wikisiden Bruksstatistikk.
4. Tell hendelsen der handlingen gikk gjennom, og skriv en test som viser at den telles én gang og ikke telles når handlingen feiler.

Et nytt felt i batchen er en større endring. Det må inn i begge kontraktene, gullfiksturen, e2e-spesifikasjonens feltliste og wikisiden, og må godkjennes på samme måte som kundetekstene.

### Lagring og personvern i koden

- Telemetri skriver ingenting til cookies, localStorage, sessionStorage, IndexedDB eller Cache API, og lagrer ingen identifikator. Den leser bare flagget `PP_DISABLE_TELEMETRY`. Tellerne ligger i minnet, på `window.__pp365UsageV1`, som alle buntene deler.
- Batchen sendes med `fetch` som `text/plain`, med `keepalive`, `credentials: 'omit'` og `referrerPolicy: 'no-referrer'`, aldri med `sendBeacon`.

### Teste

- Jest: hjelperne i `pp365-shared-library/lib/telemetry/__fixtures__/testFixtures`. `startTestTelemetry()` i `beforeEach` gir en side med porten åpen. `countedTelemetry()` gir det som er talt, med nøklene `'<komponent> <hendelse> <variant>'` for bruk og `'<komponent> <kode> <http>'` for feil. `telemetryTestBed()` fanger det som sendes, og `hubPortal`, `settingsMap` og `spfxTestContext` gir ankeret og konteksten. `pp365-jest-config` setter `DEBUG` til `false`.
- E2E: hver test holder bruksstatistikken i nettleseren (`guardTelemetry` i `e2e/tests/fixtures/pp365.ts`). Bare `smoke/usage-statistics.spec.ts` slår vakten av og sjekker batchen på hubens nivå. Se [Testing](testing.md).
- Installasjon: `.tasks/usage-statistics-level.test.js` kjører de rene PowerShell-funksjonene i `Install/Scripts/SharedFunctions.ps1` med pwsh, over scenariene i `.tasks/fixtures/usage-statistics-level.json` (`npm run test:tasks`).
- Integrasjon: `integration/tests/template.test.ts` leser nivåraden på testhuben.
- For hånd: filtrer på `telemetry` i nettleserens nettverksfane, eller kjør en lokal watch (DEBUG) og les batchene i konsollen.

### Installasjon og oppgradering

- Malen legger inn raden med verdien 3 (`Objects/Lists/Globale innstillinger.xml`, `GtSettingsId` `{b4d62fcd-26ac-4bc3-aeb8-c7d5e4503248}`).
- En oppgradering legger inn en manglende rad før appene og malen (`Initialize-UsageStatisticsSetting` til slutt i `PreInstallUpgrade.ps1`), også med `-SkipTemplate`. Et tidligere avslag på katalogstatistikken følger med som 0, ellers får huben 3, og en rad som finnes, endres aldri.
- `Install.ps1 -UsageStatisticsLevel Off|Basic|Standard|Extended` skriver et valgt nivå rett etter Portfolio-malen. Uten parameteren skriver ingen kjøring nivået. Til slutt skriver skriptet en oppsummering av nivået huben faktisk har.
- `$UsageStatisticsLevelSinceVersion` i `SharedFunctions.ps1` må være versjonen som først gir raden: en hub på den versjonen eller nyere som mangler raden, regnes som at raden er slettet, og får 0.
- Installasjonsmeldingen er en egen flyt med sin egen bryter, `-SkipPingback`, og nivået påvirker den ikke.
