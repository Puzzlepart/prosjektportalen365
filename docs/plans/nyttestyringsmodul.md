# Løsningsforslag: Nyttestyringsmodul (ny gevinstmodul)

> **Status:** Utkast til diskusjon, 8.10.2026. Bakgrunn: ønske fra Asker kommune. Målet er at modulen
> blir ny standard i Prosjektportalen 365 (PP365).
> **Prototype:** se [`nyttestyringsmodul/prototype.md`](nyttestyringsmodul/prototype.md).

## 1. Sammendrag

Dagens nyttefunksjonalitet (tidligere gevinst) består av fire lister **på hvert prosjektområde**.
Oversiktene bygges ved å søke på tvers av områdene. Det gir tre kjente svakheter:

- data spres over hundrevis av områder,
- oversiktene ligger etter så lenge søkeindeksen ikke er oppdatert,
- virksomheten kan ikke eie nyttevirkninger og måleindikatorer som flere prosjekter deler.

Forslaget samler dataene i **lister på huben** og innfører én app, **Nyttestyring**. Appen tilpasser
seg nivået den kjører på:

| Nivå | Hva appen gjør |
|---|---|
| **Hub (virksomhet)** | Nytteoversikt for alle prosjekter. Strategiske mål. Katalog med gjenbrukbare nyttevirkninger og måleindikatorer. Registrering mot hvilket som helst prosjekt. |
| **Program** | Nytte fra programmet selv eller fra alle prosjektene i programmet. Tildeler nyttevirkninger til prosjektene. |
| **Prosjekt** | Viser og redigerer nytte koblet til prosjektet. Registrerer målinger. Lagrer alltid på huben. Erstatter dagens seksjon «Nytteoppnåelse» i prosjektstatus. |

Modellen bygger på Prosjektveiviseren v6 (nyttevirkning, nytteeier, nytteansvarlig, plan for
nyttestyring). Den henter i tillegg inn to elementer fra Theory of Change og DFØs veileder i
nyttestyring: **antagelser**, og **kobling til virksomhetens mål**. Migreringen gjøres med et
frivillig PowerShell-skript som kjøres én gang. De gamle prosjektlistene fases ut.

## 2. Dagens løsning

Kartlagt i kodebasen på `releases/1.15`.

| Liste (prosjekt- og programområde) | Innholdstype | Viktige felt | Kobling |
|---|---|---|---|
| Endringsanalyse | Change `0x01001AF9…` | `GtProcess`, `GtChallengeDescription` | – |
| Nytteanalyse og plan for nyttestyring | Nyttevirkning `0x01004F46…` | `GtGainsType`, `GtPrereqProfitAchievement`, `GtGainsTurnover`, `GtGainsResponsible` (Nytteeier), `GtGainsOwner` (Nytteansvarlig), `GtRealizationTime`, `GtShowInPortfolio` | `GtChangeLookup` (flere) → Endringsanalyse |
| Måleindikatorer | Måleindikator `0x01007304…` | `GtStartValue`, `GtDesiredValue`, `GtMeasurementUnit` | `GtGainLookup` → Nyttevirkning |
| Nytteoppfølging | Nytteoppfølging `0x010039EA…` | `GtMeasurementDate`, `GtMeasurementValue`, `GtMeasurementComment` | `GtMeasureIndicatorLookup` → Måleindikator |

Slik vises dataene i dag:

- **Visning:** De generiske aggregeringswebdelene leser dataene via søk. Det er
  `PortfolioAggregation` på hub og prosjekt, og `ProgramAggregation` på program og overordnet
  prosjekt. Datakildene ligger i kategorien «Gevinstoversikt» i listen Datakilder.
  `DataAdapter.fetchBenefitItemsWithSource()` setter sammen nyttevirkning, indikator og måling
  i klienten.
- **Beregning av oppnåelse:** `(verdi − start) / (ønsket − start) × 100`, se
  `BenefitMeasurement`.
- **Prosjektstatus:** Seksjonen «Nytteoppnåelse» er en ren statusseksjon
  (`GtStatusGainAchievement` med kommentar). Den viser ingen nyttedata.
- **Begrensninger:**
  - Søket henger etter.
  - Hub og program kan ikke registrere noe.
  - Virksomheten har ingen mål å koble nytten til.
  - Elementer kan ikke gjenbrukes.
  - Det finnes ingen kurve mot målverdien over tid.
  - Overordnet prosjekt har ingen nyttelister.

## 3. Mål og avgrensning

**Mål**

1. Ett sted for nyttedata i virksomheten (huben). Dataene skal være lette å rapportere fra, også
   i Power BI og Excel.
2. Samme app og samme brukeropplevelse på hub-, program- og prosjektnivå.
3. Se oppnåelsen tydelig: status per indikator og en kurve med faktiske målinger mot
   målbanen.
4. Gjenbruk: virksomheten definerer nyttevirkninger og indikatorer én gang, og prosjektene tar
   dem i bruk.
5. Sporbarhet fra endring til nyttevirkning til virksomhetsmål, med antagelser på veien.

**Utenfor omfang i første versjon:** samfunnsøkonomisk analyse og kost/nytte-beregning,
automatisk innhenting av måleverdier fra fagsystemer (API eller Power Automate kan komme
senere), og egne Power BI-rapporter (vi leverer datagrunnlaget).

## 4. Begreper

Fasiten er Prosjektveiviseren v6, se `docs/prosjektveiviseren-v6/mapping-terminologi.csv`. DFØ og
Theory of Change brukes som tillegg. Begrepene markert med ⚠ må kontrolleres mot DFØs veileder før
de låses. Kilden kunne ikke hentes fra utviklingsmiljøet.

| Begrep i appen | Betydning | Kilde |
|---|---|---|
| **Strategisk mål** | Virksomhetens mål, for eksempel fra kommuneplanens samfunnsdel. Kan ha et overordnet mål. | Ny ⚠ (DFØ: kobling til mål) |
| **Endring** | Det som må endres i virksomheten (prosess, organisering, kompetanse, teknologi) for at nytten skal oppstå. | Dagens Endringsanalyse |
| **Nyttevirkning** | Den positive effekten. Har type, nytteeier, nytteansvarlig og realiseringstidspunkt. | v6 (TERM-001) |
| **Måleindikator** | Hvordan nyttevirkningen måles: startverdi, målverdi, enhet, retning og måletidspunkt. | Dagens Måleindikatorer |
| **Måling (nytteoppfølging)** | Én registrert verdi på én dato, med kommentar og vurdering. | Dagens Nytteoppfølging |
| **Antagelse** | Det som må være sant for at én lenke i kjeden skal holde (endring → nytte, eller nytte → mål). Vurderes jevnlig. | Theory of Change ⚠ |
| **Nyttekart** | Visualisering av kjeden fra endring via nytte til mål. | v6 («nyttekart») |

Mulig utvidelse: **negative virkninger** som egen type nyttevirkning. ⚠ Sjekk om DFØ krever det.

## 5. Datamodell (alle lister på huben)

Alle listene får feltet `GtSiteIdLookup` → Prosjekter (eierprosjektet). Det er det samme mønsteret
som Tidslinjeinnhold bruker i dag. Er feltet tomt, eies elementet av virksomheten (huben).

Hvert felt nedenfor er merket ny, gjenbrukt eller endret:

- **Ny** – et nytt felt. Bruk prefikset `GtBm…` for å unngå kollisjon.
- **Gjenbrukt** – et eksisterende Gt-felt som brukes uendret.
- **Endret** – et eksisterende felt som får ny bruk.

```
Strategiske mål ◄──(flere)── Nyttevirkninger ──(flere)──► Endringer
      ▲                         │      ▲  ▲
      │ overordnet mål          │      │  └─ «Bidrar til» (overordnet nyttevirkning, f.eks. programmets)
      └─────────────            │      └──── «Basert på» (katalogelement)
                                ▼
                         Måleindikatorer ──► Målinger
Antagelser ── kobler (Endring → Nyttevirkning) eller (Nyttevirkning → Mål)
Alle ── GtSiteIdLookup ──► Prosjekter
```

### 5.1 Strategiske mål (ny)

| Felt | Type | Merknad |
|---|---|---|
| Title | Tekst | |
| `GtBmGoalDescription` | Notat | Ny |
| `GtBmGoalLevel` | Valg | Samfunnsmål / Virksomhetsmål / Effektmål ⚠ |
| `GtBmParentGoal` | Oppslag (seg selv) | Måltre |
| `GtBmGoalOwner` | Person | |
| `GtBmGoalPeriod` | Tekst eller to datoer | For eksempel «2024–2027» |
| `GtBmActive` | Ja/nei | Skjuler utgåtte mål |

### 5.2 Endringer (erstatter Endringsanalyse)

Felt: Title, `GtProcess` (gjenbrukt), `GtChallengeDescription` (gjenbrukt), `GtBmChangeType`
(valg, ny), `GtBmChangeResponsible` (person), `GtSiteIdLookup`, `GtBmStatus`.

### 5.3 Nyttevirkninger (erstatter Nytteanalyse og plan for nyttestyring)

Disse feltene gjenbrukes: `GtGainsType`, `GtPrereqProfitAchievement`, `GtGainsTurnover`,
`GtGainsResponsible` (Nytteeier), `GtGainsOwner` (Nytteansvarlig), `GtRealizationTime` og
`GtShowInPortfolio`. Nye felt:

| Felt | Type | Merknad |
|---|---|---|
| `GtSiteIdLookup` | Oppslag → Prosjekter | Eier (prosjekt eller program). Tom betyr virksomheten. |
| `GtBmChanges` | Oppslag (flere) → Endringer | Erstatter `GtChangeLookup` |
| `GtBmGoals` | Oppslag (flere) → Strategiske mål | |
| `GtBmContributesTo` | Oppslag → Nyttevirkninger | Programmets nyttevirkning som prosjektet bidrar til |
| `GtBmBasedOn` | Oppslag → Nyttevirkninger | Katalogelementet den er kopiert fra |
| `GtBmIsCatalogItem` | Ja/nei | Gjenbrukbart katalogelement, eies av huben |
| `GtBmStatus` | Valg | Foreslått / Godkjent / Under realisering / Realisert / Avbrutt |
| `GtBmMigratedFrom` | Tekst (skjult) | `{områdeURL}|{liste}|{id}`. Sikrer at migreringen kan kjøres flere ganger uten duplikater. |

### 5.4 Måleindikatorer

Felt: `GtStartValue`, `GtDesiredValue` og `GtMeasurementUnit` (alle gjenbrukt). `GtGainLookup`
peker nå til hubens Nyttevirkninger, og `GtSiteIdLookup` legges inn som en dublett av eierprosjektet
for raskere filtrering. Nye felt:

- `GtBmStartDate` og `GtBmTargetDate` – startpunkt og sluttpunkt for målbanen.
- `GtBmDirection` – Økende eller Minkende. Styrer statusfargen.
- `GtBmFrequency` – Månedlig, Kvartalsvis, Halvårlig eller Årlig. Gir «neste måling forfaller».
- `GtBmMethod` – datakilde og målemetode.
- `GtBmMilestones` – valgfrie delmål som JSON `[{date, value}]`. Gir en målbane som ikke er lineær.
- `GtBmIsCatalogItem`, `GtBmBasedOn` og `GtBmMigratedFrom`.

### 5.5 Målinger (erstatter Nytteoppfølging)

Felt: `GtMeasurementDate`, `GtMeasurementValue` og `GtMeasurementComment` (alle gjenbrukt).
`GtMeasureIndicatorLookup` peker til hubens Måleindikatorer, og `GtSiteIdLookup` legges inn som
dublett. Nye felt:

- `GtBmAssessment` – vurdering: I rute, Følg med eller Avvik.
- `GtBmMigratedFrom`.

### 5.6 Antagelser (ny)

| Felt | Type | Merknad |
|---|---|---|
| Title / `GtBmAssumptionDescription` | Tekst / notat | «Innbyggerne tar i bruk selvbetjening når den finnes» |
| `GtBmFromChange` / `GtBmFromBenefit` | Oppslag | Lenkens utgangspunkt |
| `GtBmToBenefit` / `GtBmToGoal` | Oppslag | Lenkens mål |
| `GtBmAssumptionStatus` | Valg | Holder / Usikker / Holder ikke |
| `GtBmLastReviewed` | Dato | Gir «antagelser som ikke er vurdert på over 6 mnd.» |
| `GtSiteIdLookup` | Oppslag | |

Antagelser med status «Holder ikke» bør kunne foreslås som risiko i prosjektets
usikkerhetsliste. Det tas i en senere fase.

### 5.7 Prosjekter-listen

Hver kobling fra nyttedata til prosjekt går via `GtSiteIdLookup` → Prosjekter, som er kravet om at
«huben knytter nyttedata mot prosjektet i Prosjekter-listen». I tillegg foreslås to valgfrie felt
som kopierer nøkkeltall inn på prosjektraden:

- `GtBmAchievement` – samlet nytteoppnåelse i %.
- `GtBmLastMeasurement` – dato for siste måling.

Appen oppdaterer feltene når en måling lagres. Dermed kan porteføljeoversikten og Power BI vise
nytte som vanlige kolonner, uten å slå sammen data.

### 5.8 Volum og indeksering

Et anslag: 200 prosjekter × 10 indikatorer × 12 målinger i året gir omtrent 24 000 målinger i året.
Listen passerer altså 5 000 elementer i løpet av første år.

- Indekser `GtSiteIdLookup` og hovedoppslaget (`GtGainLookup` og `GtMeasureIndicatorLookup`)
  **før** listene fylles.
- Alle spørringer filtreres på et indeksert felt og bruker `getAllItems` med `$top`.
- Porteføljeoversikten leser indikatorer og siste måling per indikator, ikke hele historikken.
- Kurven henter historikken først når en indikator åpnes.

## 6. Appen: Nyttestyring

### 6.1 Én kjerne, tynne webdeler

- **Kjerne i `pp365-shared-library`:**
  - `services/BenefitsService` for data via `PortalDataService`, med nye nøkler i
    `PortalDataServiceList`: `BM_GOALS`, `BM_CHANGES`, `BM_BENEFITS`, `BM_INDICATORS`,
    `BM_MEASUREMENTS` og `BM_ASSUMPTIONS`.
  - `components/BenefitsManagement/` for brukergrensesnittet: barrel, hook-per-visning,
    Fluent v9, `NavDrawer` slik IdeaModule gjør.
  - Rene beregninger, med enhetstester:
    - oppnåelse,
    - målbane (lineær, eller med delmål),
    - status ut fra retning og toleranse,
    - neste måling som forfaller.
- **Webdeler:** `benefitsManagement` i PortfolioWebParts (hub), i ProgramWebParts (program) og i
  ProjectWebParts (prosjekt). Hver webdel bare setter opp konteksten. `context: 'auto'` finner nivået
  ut fra flaggene `GtIsProgram` og `GtIsParentProject` og fra hubtilknytningen. Det er samme mønster
  som `dataFetchMode` i usikkerhetsmatrisene.
- **Prosjektstatus:** en ny seksjonstype `BenefitsSection` med innholdstype `…82806` i
  `SectionModel` og `SectionMap`. Den viser kjernen i kompaktmodus.
- **Navigasjon:** valgt visning og element lagres i URL-hashen (`parseUrlHash`/`setUrlHash`), så
  lenker kan deles. Det er samme mønster som IdeaModule.

Alternativet er en egen SPFx-løsning, men det gir en ny pakke å installere og oppgradere. Det
anbefales ikke.

### 6.2 Flater

| Flate | Hub | Program | Prosjekt | Innhold |
|---|:-:|:-:|:-:|---|
| **Oversikt** | ✔ | ✔ | ✔ | Nøkkeltall (antall nyttevirkninger, andel i rute, målinger som forfaller), oppnåelse per prosjekt, mål og type, og liste over avvik. Programmet kan velge mellom «Programmet» og «Alle prosjekter». |
| **Nyttekart** | ✔ | ✔ | ✔ | Kjeden fra endring via nyttevirkning til mål, med antagelser på lenkene. Klikk åpner elementet. |
| **Registrering** | ✔ | ✔ | ✔ | Faner for Mål, Endringer, Nyttevirkninger, Indikatorer og Antagelser. Hver fane har en tabell og et skjema i skuff. På huben velges eierprosjektet i et felt. På prosjektet er det låst. |
| **Oppfølging** | ✔ | ✔ | ✔ | Arbeidsliste over indikatorer som skal måles. Rask registrering (verdi, dato, kommentar). Indikatorkort med kurve. |
| **Indikatordetalj** | ✔ | ✔ | ✔ | Kurve med faktiske målinger mot målbanen og målverdi, tabell over målinger og antagelsene som gjelder. |
| **Katalog** | ✔ (rediger) | les | les | Gjenbrukbare nyttevirkninger og indikatorer. «Ta i bruk» kopierer elementet til et prosjekt og setter `GtBmBasedOn`. |
| **Strategiske mål** | ✔ (rediger) | les | les | Måltre med samlet oppnåelse fra nyttevirkningene som er koblet til hvert mål. |
| **Tildel** | – | ✔ | – | Programmet bryter ned sin nyttevirkning i bidrag fra prosjektene (`GtBmContributesTo`), eventuelt med indikatorer. |
| **Statusseksjon** | – | – | ✔ | Kompakt: vurderingen (`GtStatusGainAchievement`) og indikatorene med minikurve, slik de var på rapportdatoen. |

### 6.3 Viktige designvalg

1. **Katalog: kopi med referanse, ikke deling.** Prosjektene har egne startverdier, målverdier og
   ansvarlige. Derfor får hvert prosjekt sin egen instans, med `GtBmBasedOn` tilbake til
   katalogelementet. Huben kan likevel summere alle instanser av samme katalogelement. Ett delt
   element ville gjort målingene tvetydige.
2. **Programmets tildeling bruker «bidrar til».** Programmet eier den overordnede nyttevirkningen.
   Prosjektene eier hvert sitt bidrag. Visningen «Programmet» viser egne elementer. «Alle
   prosjekter» viser i tillegg bidragene og rullerer dem opp.
3. **Statusrapporten viser et øyeblikksbilde.** Seksjonen viser målinger fram til rapportdatoen. Ved
   publisering lagres seksjonsdataene på samme måte som andre seksjoner gjør i dag (vedlegg via
   `persistSectionDataAttachmentFileName`). Da endrer ikke en gammel rapport seg når nye målinger
   registreres.
4. **Direkte listelesing, ikke søk.** Endringer vises med en gang, og vi slipper å vente på
   gjennomsøking og administrerte egenskaper. Søk brukes ikke i modulen.
5. **Oppnåelse og status.** Beregningen gjenbruker dagens formel med retning. Statusen sammenligner
   siste måling med målbanen på samme dato:

   | Status | Regel |
   |---|---|
   | I rute | Inntil toleransen bak målbanen |
   | Følg med | Inntil 2 × toleransen bak målbanen |
   | Avvik | Mer enn 2 × toleransen bak målbanen |

   Toleransen settes i Globale innstillinger. Standard er 10 %.

### 6.4 Tilgang

Huben er i dag bare lesbar for prosjektmedlemmer. Unntaket er lister som allerede tar imot data fra
prosjektene, som Prosjektstatus og Tidslinjeinnhold. Forslaget er:

- **V1:** Nyttelistene arver samme tilgangsmodell som Prosjektstatus. Appen begrenser hva brukeren
  ser og redigerer til eget prosjekt. Versjonering slås på. Uten skrivetilgang til huben vises appen
  i lesemodus med en forklaring, i tråd med «gitt at brukeren har tilgang».
- **Beslutning:** Holder det for Asker? Alternativene er unike tillatelser per element (skalerer
  dårlig) eller skriving via en tjenestekonto (Power Automate eller Azure Function). Det andre gir
  sterkere kontroll, men må driftes.

## 7. Overgang og migrering

### 7.1 Strategi: velg selv, og frivillig migrering

- Ved installasjon eller oppgradering opprettes de nye hublistene alltid. Det koster lite, og
  det er samme mønster som Idémodulen.
- En bryter i **Globale innstillinger**, «Nyttestyringsmodul aktiv», bestemmer:
  - om prosjektmalen lager de gamle listene og den gamle navigasjonen, eller lenker til appen,
  - om statusseksjonen «Nytteoppnåelse» bruker den nye seksjonstypen.
- De gamle søkebaserte datakildene i Nytteoversikt fungerer videre for prosjekter som ikke er
  migrert. Når migreringen er gjort, settes de til «utgått». Datakildene merkes som avviklet i
  dokumentasjonen, men fjernes ikke i 1.x.

### 7.2 Migreringsskript (kjøres én gang)

Skriptet heter `Install/Scripts/Migrate-BenefitsToHub.ps1`. Det følger mønsteret fra
`UpgradeAllSitesToLatest` og `EnsureV6BenefitTerminology.ps1`: det er beskyttet mot feil, kan
kjøres flere ganger og er frivillig.

1. Henter alle prosjekter fra Prosjekter, eventuelt avgrenset med `-SiteUrl` eller `-Filter`.
2. Per område finner det de fire listene **etter URL**. Både gamle Gevinst-navn og nye Nytte-navn
   gjenkjennes.
3. Kopierer i avhengighetsrekkefølge: Endringer, så Nyttevirkninger, så Indikatorer, så Målinger.
   Det bygger en tabell fra gammel til ny ID per område, slik at oppslagene kobles riktig. Setter
   `GtSiteIdLookup` og `GtBmMigratedFrom`.
4. Beholder Opprettet, Endret, Opprettet av og Endret av med `UpdateOverwriteVersion`. Hverken
   versjonshistorikk eller vedlegg kopieres. Dette dokumenteres.
5. Har `-WhatIf` (tørrkjøring) og lager en CSV-rapport med antall per område og avvik, for
   eksempel brutte oppslag eller manglende verdier i obligatoriske felt.
6. Hopper over elementer som allerede finnes, ut fra `GtBmMigratedFrom`. Skriptet kan derfor kjøres
   på nytt etter en feil.
7. Med `-DeprecateSourceLists`:
   - fjerner det de gamle listene fra prosjektnavigasjonen,
   - lenker «Nytteoversikt» til appen,
   - setter listene til skrivebeskyttet med en merknad i beskrivelsen.

   Listene blir **ikke** slettet.

Skriptet migrerer ikke strategiske mål eller antagelser, siden de ikke finnes i dag, og katalogen.
Det er arbeid virksomheten gjør etter migreringen.

## 8. Faser

| Fase | Innhold | Resultat |
|---|---|---|
| **0. Prototype** | HTML-prototype med fiktive data. Workshop med Asker. | Avklarte flater, begreper og datamodell |
| **1. Datamodell + hub** | Hublister, felt og innholdstyper. `BenefitsService` og beregninger med tester. Hub-app med Oversikt, Registrering, Oppfølging, Indikatordetalj og Katalog. | Virksomheten kan registrere og følge opp sentralt |
| **2. Prosjekt** | Prosjektwebdel. Statusseksjonen `BenefitsSection` med øyeblikksbilde. Endringer i prosjektmalen bak bryteren. | Prosjektene jobber i appen, og statusrapporten viser nytte |
| **3. Program** | Programwebdel, visningen «Programmet / alle prosjekter» og Tildel | Programmet bryter ned og rullerer opp |
| **4. Mål, antagelser og nyttekart** | Strategiske mål, Antagelser, Nyttekart og felt som kopieres til Prosjekter | Sporbarhet fra endring til mål |
| **5. Migrering og utfasing** | Migreringsskript, dokumentasjon og merking av gamle datakilder som avviklet | Overgangen er gjennomført hos dem som ønsker det |

Fase 4 kan flyttes fram hvis koblingen til strategiske mål er viktig for Asker.

## 9. Beslutninger før fase 1

1. **Tilgangsmodell** (6.4): Holder det med samme modell som Prosjektstatus i V1?
2. **Endring som egen liste eller felt?** Forslaget beholder en egen liste, fordi én endring ofte gir
   flere nyttevirkninger.
3. **Strategiske mål i PP365 eller fra eksisterende kilde?** Mange kommuner har målene i
   kommuneplanen eller i et styringssystem. Forslaget er en enkel liste i V1, med mulighet for
   import.
4. **Nivåer for mål** (samfunnsmål, effektmål og så videre) og **typer nyttevirkning**: Behold
   dagens `GtGainsType` (Direkte, Indirekte, Kvalitativ) eller juster etter DFØ?
5. **Navn**: «Nyttestyring» som appnavn og «Nytteoversikt» som oversiktsflate (TERM-006).
6. **Prosjekter uten hubtilgang** (andre hubber, `initializeHubWebs`): utenfor omfang i V1?

## 10. Risiko

| Risiko | Tiltak |
|---|---|
| Listene passerer 5 000 elementer | Indekser fra start, filtrer alltid, bruk `getAllItems` med `$top` |
| Prosjektmedlemmer redigerer andres data på huben | Begrensning i appen, versjonering, eventuelt tjenestekonto i senere fase |
| Det finnes to sannheter i overgangsperioden | Bryteren i Globale innstillinger og datakilder merket som utgått |
| Migreringen bryter oppslag | Tabell fra gammel til ny ID, tørrkjøring og CSV-rapport, kan kjøres på nytt |
| Begrepene avviker fra DFØ | ⚠-punktene kontrolleres mot DFØs veileder i fase 0 |
