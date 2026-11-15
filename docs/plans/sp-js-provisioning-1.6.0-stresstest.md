# Stresstest: prosjektoppsett, tillegg og maler med sp-js-provisioning 1.6.0

Dato: 2026-11-15
Status: Plan

## Formål

sp-js-provisioning 1.6.0 (JSOM-exit, se `docs/specs/jsom-exit.md` i motorens repo) bytter ut hvordan
fire handlere snakker med SharePoint. PP365 er fortsatt på 1.5.1. Før 1.6.0 tas inn i en utgivelse
kjører vi oppsettveiviseren, malpakkekatalogen og listeinnholdet hardt på en fersk 1.15.0-hub.
Hver feilmelding som dukker opp noteres ordrett i [feilloggen](#feillogg) og gjennomgås.

Testprosjektene får realistiske navn og innhold, slik at huben etterpå ser ut som en ekte kundes
portefølje og også kan brukes til demo og visuelle tester.

## Hva 1.6.0 endrer, og hvor det treffer PP365

| Endring i 1.6.0 | Hvor i PP365 | Hva som kan gå galt | Scenario |
|---|---|---|---|
| `ContentTypes` over CSOM via HTTP i stedet for JSOM. Uendret innholdstype sendes ikke `Update(true)` | Standardmal og Programmal (15 innholdstyper hver), hub-import av 9 pakker | Feil id, manglende feltlenke, feil rekkefølge, endring som ikke når listene. Ny kjøring skal ikke skrive noe | P1–P14, R1–R3, K1–K2 |
| Feltref til en kolonne som mangler gir en Error-linje, ikke stopp. Feltref slås opp på internt navn, id, så tittel, også i overordnede web | Hub-import; `CompatibilityService.stripConflicts` fjerner fortsatt slike feltrefs | Kolonne knyttes til feil felt (tittel-treff); meldingen er uforståelig for en administrator | K6 |
| `Taxonomy` over CSOM: leser termlageret én gang, skriver bare det som mangler. Ulesbart termlager stopper med grunn | Hub-import av anlegg, bygg, forskning, test og vei. `PackageInstaller` sjekker termlageret med REST før importen | Termsett med feil id eller sortering; REST-sjekken stopper der CSOM ville lyktes (tenanter med «OAuth only») | K1, K2, K5, S7 |
| `Files` kjører under SPFx (stoppet før), leser bytes, henter fra annen origin uten credentials, laster ikke opp en uendret fil | pp-testprosjekt (kilde på raw.githubusercontent.com) | Ødelagt binærfil, 401 fra egen origin, ny opplasting hver gang | K3, P13 |
| `PropertyBagEntries` kjører under SPFx; nektet skriving på moderne område er en Error-linje som ikke stopper | pp-testprosjekt | Importen ender ikke som «fullført med advarsler», eller stopper likevel | K3, P13 |
| `Navigation` leser nivåets rekkefølge før flytting (rettet: «The nodes in the Quick Launch are not in the template's order after moving them») | Tillegg som legger noder etter Områdeinnhold: EnkelVenstremeny, TestVenstremeny, Forskningsmal | Oppsettet stopper fortsatt, eller noder havner i feil rekkefølge | P11–P13, R3 |
| `spfx-jsom` er ute av motoren | PP365s egne steg (`PreTask`, `SetTaxonomyFields`) bruker egen kopi i ProjectExtensions og shared-library | `SetTaxonomyFields` binder ikke termsettene | Alle P |
| Klassiske webdeler i `Files` er fjernet | Ingen mal i PP365 eller hosting bruker dem | En Error-linje om webdeler viser en mal vi ikke kjenner til | (alle) |

## Miljø

- **Fersk hub med 1.15.0 og 1.6.0.** Anbefalt vei: én commit på `main` med bumpen og
  `[fresh-install]` i emnelinjen. `ci-releases.yml` bygger, oppgraderer dev-huben og main-kanalens
  apper i tenantens appkatalog, og installerer `sites/pp365_<sha>` (uten apper, områdedesign,
  taksonomi og søkekonfigurasjon, som tenanten har fra før). Main-kanalens apper gjelder alle
  main-huber på testtenanten, også de andre tester bruker.
  - Bumpen: `"sp-js-provisioning": "1.6.0"` i `SharePointFramework/ProjectExtensions/package.json` og
    `SharePointFramework/PortfolioExtensions/package.json`, så `npm run rush:update` og
    `npm run generate-sbom`. Linjen i `CHANGELOG.md` (1.15.0) endres fra 1.5.1 til 1.6.0 hvis
    motoren skal med i 1.15.0.
- **Innlogging:** Claude in Chrome, i brukerens egen Chrome-økt. Mangler økten, logger brukeren inn
  selv.
- **Områder** opprettes fra hubens «Opprett område» med «Norsk (bokmål)» valgt eksplisitt. Sjekk
  `/_api/site?$select=HubSiteId` etterpå; uteblir hub-tilknytningen (kjent på denne tenanten),
  `POST /_api/site/JoinHubSite('<hub-id>')` før veiviseren.
- **Katalogen:** `catalog.json` i prosjektportalen-hosting (12 pakker). Katalogen hurtigbufres i
  `localStorage` i 24 timer (`pp_template_catalog_*`).
- **Personer** i prosjektinformasjonen tas fra brukerne som finnes i testtenanten.
- **Testdata beholdes** til brukeren sier at de skal slettes. Alt som opprettes, føres i
  [Testdata](#testdata).

## Slik fanger vi feil i hver kjøring

1. Før start: `sessionStorage.DEBUG = '1'` på området, så motoren logger Info-linjer i konsollen.
   Notér klokkeslett.
2. Under kjøringen: dialogens fremdrift og den avanserte loggen (motorens Warning- og
   Error-linjer, `captureEngineLog`).
3. Etter: sluttstatus (fullført, fullført med advarsler og antall, feilet) og skjermbilde av
   sluttdialogen.
4. Konsollen: feil og advarsler, filtrert på `ProjectSetup`, `ApplyTemplate`,
   `TemplatePackageCatalog`, `PackageInstaller` og `CSOM`.
5. Nettverket: `_vti_bin/client.svc/ProcessQuery` (CSOM svarer 200 med feilen i svaret, så svaret
   må leses), REST-kall med 4xx og 5xx, og 429 eller 503 (struping).
6. Hubens `Logg`-liste: radene med komponent `ProjectSetup` for området.
7. Les tilbake det som ble laget: innholdstyper (id og feltlenker), lister og kolonner, menyen,
   filer, og termsett etter hub-import.

Hver linje som avviker fra det ventede, blir én rad i feilloggen, ordrett, med scenario-ID.

## Testmatrise

### Fase 0 – Grunnlinje med 1.5.1 (valgfri)

Må kjøres før main-kanalen får 1.6.0. Gir fasit for «ny i 1.6.0 eller fantes fra før».
Kjøres på en eksisterende fersk 1.15.0-hub med 1.5.1.

| ID | Scenario | Ventet med 1.5.1 |
|---|---|---|
| G1 | Import av pp-testprosjekt | Stopper i `Files` |
| G2 | Oppsett med Enkel prosjektmal og EnkelVenstremeny | Stopper i `Navigation` med rekkefølgefeilen |
| G3 | Oppsett med Standardmal | Fullført |

### Fase 1 – Hub-import i malpakkekatalogen

| ID | Scenario | Ventet med 1.6.0 |
|---|---|---|
| K1 | Importer (modus A) malpakkene anlegg, bygg, enkel, leverandørsamhandling, smidig og vei | Fullført uten feil; termsett og innholdstyper med malens id-er |
| K2 | Importer hver av dem en gang til | Ingen nye feil; ingen skriving av innholdstyper eller termsett (bare lesende `ProcessQuery`) |
| K3 | Importer pp-testprosjekt, og så en gang til | Fullført med advarsler: én `PropertyBagEntries`-feil som navngir årsaken. Filen ligger på huben, byte for byte. Andre import laster ikke opp filen igjen |
| K4 | Importer tilleggene dokumentbibliotek-flat, fasesider og forside-hurtiglenke, og innholdspakken risikobibliotek | Radene i Prosjekttillegg og Listeinnhold |
| K5 | Gjør Forskningsprosjekt tilgjengelig som skymal (modus B) | Hubavhengighetene (SiteFields, ContentTypes, Lists, Taxonomy) på plass |
| K6 | Slett en kolonne på huben som en pakke refererer til, og importer pakken på nytt | Kompatibilitetsrapporten viser konflikten. Importen gir en Error-linje som navngir kolonnen, og resten importeres |

### Fase 2 – Prosjektoppsett med realistiske prosjekter

Alle prosjektene får eier, prosjektleder, fase (spredt over fasene), tjenesteområde, prosjekttype,
start- og sluttdato og budsjett i Fase 5.

| ID | Prosjekt | Mal | Tillegg | Listeinnhold | Hva det stresser |
|---|---|---|---|---|---|
| P1 | Nordbyen skole – ny barneskole og flerbrukshall | Standardmal | Fasesider, Forside med hurtiglenker | Fasesjekkliste, Planneroppgaver | Alle 15 innholdstyper, to tillegg med sider, alt listeinnhold |
| P2 | Nytt sak- og arkivsystem | Standardmal | – | Fasesjekkliste | Referanse: det minste oppsettet |
| P3 | Rehabilitering av Elvebakken svømmehall | Standardmal | Dokumentbibliotek – flat visning | – | Tillegg som endrer et bibliotek malen har laget |
| P4 | Program for velferdsteknologi 2026–2029 | Programmal | – | Planneroppgaver | Programmalens innholdstyper og Programleveranser |
| P5 | Digitalt tilsyn i hjemmetjenesten | Smidig | – | – | Katalogmal med egne innholdstyper; knyttes til P4 |
| P6 | Medisindispensere – utrulling fase 2 | Enkel prosjektmal | EnkeltProsjekt | – | Sider og WebSettings fra tillegg; knyttes til P4 |
| P7 | Fv. 714 Sjøvegen – gang- og sykkelveg Holmen–Vika | Veiprosjekt | Veimal | Risikobibliotek | Underordnet innholdstype (`Prosjekt (Vei)`), termsett, innhold fra innholdspakke |
| P8 | Klimatilpasning og flomsikring av Sandelva | Anleggsprosjekt | – | Risikobibliotek | Taksonomikolonner fra pakken |
| P9 | Ny brannstasjon Østbyen | Byggprosjekt | Fasesider | – | Katalogmal sammen med et tillegg |
| P10 | Rammeavtale renhold 2027 – leverandøroppfølging | Leverandørsamhandling | – | – | Mal med SiteFields og ContentTypes |
| P11 | Mikroplast i fjordsedimenter | Forskningsprosjekt (skymal) | Forskningsmal | – | Skymal (`CloudTemplatePackage`), `Navigation`-rettingen |
| P12 | Oppgradering av møterom i rådhuset | Enkel prosjektmal | EnkelVenstremeny | – | `Navigation`-rettingen: node etter Områdeinnhold |
| P13 | Teknisk testområde – filer og egenskapspose | Testprosjekt | TestForside, TestVenstremeny | – | `Files` og `PropertyBagEntries` i et prosjektoppsett, `Navigation` |
| P14 | Byutvikling Fjordbyen | Standardmal | – | – | Gjøres om til overordnet prosjekt i Fase 3 |

### Fase 3 – Ny kjøring og overordnet prosjekt

Før R1–R4 legges verdier i listene og en egen lenke i menyen, så vi ser at de overlever.

| ID | Scenario | Ventet |
|---|---|---|
| R1 | «Kjør oppsettveiviser» på P1 med samme mal og tillegg | Ingen Error; ingen innholdstype skrevet; verdiene beholdt; eiernes menylenker tilbake |
| R2 | «Kjør oppsettveiviser» på P7 med et tillegg til | Bare det nye tillegget skriver noe |
| R3 | «Kjør oppsettveiviser» på P12 og P13 | `Navigation` gjentatt uten stopp; menyen i malens rekkefølge |
| R4 | «Gjør om til overordnet prosjekt» på P14, og knytt P8 og P9 under | Overordnet-malen; resten av menyen tilbake; underordnede vises |
| R5 | Knytt P5 og P6 til programmet P4 i programadministrasjonen | Programoversikten viser dem |

### Fase 4 – Stress og kanttilfeller

| ID | Scenario | Ventet |
|---|---|---|
| S1 | Kjør veiviseren for P7–P10 samtidig i fire faner | Alle fullfører; struping (429/503) noteres, også om den tas igjen; fire rader i hubens Prosjekter |
| S2 | Lukk fanen midt i `ApplyTemplate` for et nytt område, åpne området igjen og kjør veiviseren | Veiviseren starter igjen og fullfører fra delvis tilstand |
| S3 | Importer samme pakke i to faner samtidig | Begge fullfører, eller den ene får en forståelig feil; ingen doble innholdstyper |
| S4 | Oppsett med en bruker som bare har lesetilgang til huben (#1794) | Fullfører; hubraden mangler som før. Krever en annen konto |
| S5 | Område opprettet på engelsk (1033) på den norske huben | Veiviseren nekter med en forståelig melding |
| S6 | Hub-import med en konto uten rettigheter i termlageret | Stopp med grunn før noe annet er laget. Bare hvis vi har en slik konto |

### Fase 5 – Visuell utfylling

Utfyllingen skjer i brukergrensesnittet, som en prosjektleder ville gjort det, og tester dermed
redigeringspanelet og statusrapporten samtidig.

- Prosjektinformasjon på alle prosjektene, med varierte faser, tjenesteområder og typer.
- Områdelogo per prosjekt (genererte bilder i ulike farger), så prosjektkortene skiller seg.
- Publisert statusrapport for 6–8 prosjekter med grønn, gul og rød status og kommentarer.
- Usikkerheter og leveranser i 4–5 prosjekter, og elementer på tidslinjen.
- Kontroll: porteføljeoversikten, prosjektkortene, tidslinjen og programoversikten. Søket kan
  bruke timer på denne tenanten.

## Gjennomgang av feil

For hver rad i feilloggen:

1. **Reproduser utenfor nettleseren** med lokalkjøreren i sp-js-provisioning, på et kladdeweb:
   `npm run provision -- --package ../prosjektportalen-hosting/packages/<pakke> --mode project|cloud --twice --strict --verify`
   (`--mode project` kjører prosjektmalen og tilleggene slik `ApplyTemplate` gjør). Feiler den
   også der, ligger feilen i motoren; ellers i PP365 eller i tenanten.
2. **Klassifiser:**
   - A: ny i 1.6.0 (regresjon)
   - B: motoren, fantes før 1.6.0
   - C: PP365-kode (veiviseren, importen)
   - D: malinnhold (prosjektportalen-hosting)
   - E: tenant eller SharePoint (struping, søk, hub-tilknytning)
   - F: ventet etter design (for eksempel egenskapspose nektet på moderne område)
3. **Alvor:** Blokkerer (oppsett eller import stopper), Feil (noe mangler eller er galt), Støy
   (melding uten konsekvens, eller en melding en administrator ikke forstår).
4. **Tiltak:** issue eller rettelse i riktig repo (sp-js-provisioning → 1.6.1, prosjektportalen365,
   prosjektportalen-hosting). Alt som skrives til GitHub, vises først og venter på ja.
5. Feilloggen gjennomgås sammen etter hver fase.

## Oppfølginger å avgjøre underveis

- `CompatibilityService.stripConflicts` fjerner feltrefs til kolonner huben mangler, fordi de
  stoppet importen. Med 1.6.0 er det trolig unødvendig (K6 viser det).
- `PackageInstaller` sjekker termlageret med REST (`hasTermStorePermission`) før importen. Med
  CSOM-taksonomi kan den sjekken stoppe en import som ville lyktes.
- README-en til pp-testprosjekt og guiden beskriver hva importen stopper på. En hosting-pakke kan
  bruke `Files` og `PropertyBagEntries` på en hub bare med `minPPVersion` lik PP365-versjonen som
  har 1.6.0.
- Verifikasjonsplanen i `docs/specs/jsom-exit.md` (et prosjektoppsett, import av pp-testprosjekt
  to ganger) krysses av når P1 og K3 er grønne.

## Ferdig når

- Alle scenarioene er kjørt, og hver rad i feilloggen er klassifisert og har et tiltak.
- Ingen åpne A-feil med alvor Blokkerer eller Feil.
- Verifikasjonsplanen i jsom-exit-spesifikasjonen er avkrysset for PP365.
- Porteføljen på den ferske huben ser ut som en ekte kundes.

## Feillogg

| # | Scenario | Tid | Steg / handler | Melding (ordrett) | Kilde | Repro i Node | Klasse | Alvor | Tiltak / status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Miljø: fersk hub (`[fresh-install]`, `1699d4e18`) | 2026-11-15 17:08 | `Install.ps1` før Portfolio-malen: `Get-LastInstalledVersion` (`Get-PnPList -Identity … -ErrorAction Stop`) | «[ERROR] Failed to apply PnP templates to https://puzzlepart.sharepoint.com/sites/pp365_1699d4e: Listen Installasjonslogg finnes ikke på området med URL-adressen https://puzzlepart.sharepoint.com/sites/pp365_1699d4e.» | CI, jobben Install i CI (releases/*) 43734174745 | Ikke motoren; offline mot en stand-in for `Get-PnPList` | C | Blokkerer: enhver fersk installasjon siden `dc1d20acf` (13.11), også releasepakken fra `c719766fd`. `Initialize-UsageStatisticsSetting` hadde samme oppslag for `Globale innstillinger` | Rettet: `Find-SiteList` i `SharedFunctions.ps1` leser områdets lister, så en manglende liste gir ingenting og andre feil stopper fortsatt; 6 nye tester i `.tasks/usage-statistics-level.test.js`. Ny `[fresh-install]` |

## Testdata

| Område | URL | Mal og tillegg | Opprettet | Merknad |
|---|---|---|---|---|
