# Løsningsforslag: Nyttestyringsmodul (ny gevinstmodul)

> **Status:** Utkast til diskusjon, oppdatert 14.10.2026. Bakgrunn: ønske fra Asker kommune. Målet er at
> modulen blir ny standard i Prosjektportalen 365 (PP365).
> **Prototype:** se [`nyttestyringsmodul/prototype.md`](nyttestyringsmodul/prototype.md).
>
> **Endret 14.10:** Modellen er utvidet etter innspill fra kunden om styring etter endringsteori. Innspillene
> bygger på MSP, Theory of Change og bidragsanalyse etter John Mayne. Kjeden har nå et konfigurerbart antall
> ledd. Pilene i kjeden er egne objekter med evidensstyrke. Forutsetninger og risikoer ligger på pilene.
> Indikatorer har en rolle og en måletype. Nyttevirkninger får bidragsvurderinger. Leveransen dekker hele
> modellen, ikke bare en MVP.

## 1. Sammendrag

Dagens nyttefunksjonalitet (tidligere gevinst) består av fire lister **på hvert prosjektområde**.
Oversiktene bygges ved å søke på tvers av områdene. Det gir flere svakheter:

- Dataene er spredt over hundrevis av områder.
- Oversiktene henger etter til søkeindeksen er oppdatert.
- Virksomheten kan ikke eie nyttevirkninger som flere prosjekter bidrar til.
- Kjeden er låst til ett mønster: endring → gevinst.
- Det finnes ingen måte å si *hvorfor* vi tror kjeden holder, eller hvor den brister.

Forslaget samler dataene i **lister på huben** og innfører én app, **Nyttestyring**. Appen tilpasser
seg nivået den kjører på:

| Nivå | Hva appen gjør |
|---|---|
| **Hub (virksomhet)** | Nytteoversikt og styringsrapport for hele porteføljen. Strategiske mål. Katalog med gjenbrukbare nyttevirkninger og indikatorer. Innstillinger for kjedemodellen. |
| **Program** | Programmets egen kjede og prosjektenes bidrag inn i den. Styringsrapport. Tildeling til prosjektene. |
| **Prosjekt** | Prosjektets leveranser, endringer og nyttevirkninger, koblet inn i programmets eller virksomhetens kjede. Målinger og vurderinger. Ny seksjon i prosjektstatus. Alt lagres på huben. |

Kjernen i modellen er en **resultatkjede** fra leveranse til strategisk mål. Hver virksomhet bestemmer
selv hvor mange ledd kjeden har og hva leddene heter:

| Kjedemodell | Ledd | Passer for |
|---|---|---|
| **Enkel** (standard) | Endring → Nyttevirkning → Strategisk mål | De fleste prosjekter. Tilsvarer dagens nytteanalyse og Prosjektveiviseren. |
| **Utvidet** | Leveranse → Evne / endret praksis → Effekt → Nyttevirkning → Strategisk mål | Programmer som styrer etter en endringsteori (MSP, Theory of Change, DFØs resultatkjede). |

Navnene kan endres. En virksomhet som sier «gevinst» om nyttevirkning, eller «resultat» om effekt, kan
bruke sine egne ord.

Pilene mellom leddene er like viktige som leddene. På pilene ligger **forutsetninger og risikoer**:
antakelser, risikoer, utilsiktede virkninger og andre påvirkningsfaktorer. Hver pil har en
**evidensstyrke**. Indikatorene kan måle hvilket som helst ledd, og også teste en antakelse. Hver
nyttevirkning får en jevnlig **bidragsvurdering**: har tiltakene bidratt, og hvor sikre er vi?

Migreringen gjøres med et frivillig PowerShell-skript som kjøres én gang. De gamle prosjektlistene
fases ut.

## 2. Dagens løsning

Kartlagt i kodebasen på `releases/1.15`.

| Liste (prosjekt- og programområde) | Innholdstype | Viktige felt | Kobling |
|---|---|---|---|
| Endringsanalyse | Change `0x01001AF9…` | `GtProcess`, `GtChallengeDescription` | – |
| Nytteanalyse og plan for nyttestyring | Nyttevirkning `0x01004F46…` | `GtGainsType`, `GtPrereqProfitAchievement`, `GtGainsTurnover`, `GtGainsResponsible` (Nytteeier), `GtGainsOwner` (Nytteansvarlig), `GtRealizationTime`, `GtShowInPortfolio` | `GtChangeLookup` (flere) → Endringsanalyse |
| Måleindikatorer | Måleindikator `0x01007304…` | `GtStartValue`, `GtDesiredValue`, `GtMeasurementUnit` | `GtGainLookup` → Nyttevirkning |
| Nytteoppfølging | Nytteoppfølging `0x010039EA…` | `GtMeasurementDate`, `GtMeasurementValue`, `GtMeasurementComment` | `GtMeasureIndicatorLookup` → Måleindikator |

Slik fungerer det i dag:

- **Visning:** Oversiktene bruker de generiske aggregeringswebdelene, som leser dataene via søk:
  `PortfolioAggregation` på hub og prosjekt, og `ProgramAggregation` på program og overordnet prosjekt.
  `DataAdapter.fetchBenefitItemsWithSource()` setter sammen nyttevirkning, indikator og måling i
  klienten.
- **Beregning av oppnåelse:** `(verdi − start) / (ønsket − start) × 100`, se `BenefitMeasurement`.
- **Prosjektstatus:** Seksjonen «Nytteoppnåelse» er en ren statusseksjon
  (`GtStatusGainAchievement` med kommentar). Den viser ingen nyttedata.

## 3. Mål og avgrensning

**Mål**

1. Ett sted for nyttedata i virksomheten (huben). Dataene skal være lette å rapportere fra, også
   i Power BI og Excel.
2. Samme app og samme brukeropplevelse på hub-, program- og prosjektnivå.
3. **En kjede virksomheten selv kan forme.** Enkel som standard, utvidet når et program trenger det,
   uten at dataene må bygges om.
4. **Pilene skal kunne testes.** Forutsetninger, risikoer og evidens ligger der de hører hjemme. Når en
   gevinst uteblir, skal det synes hvor kjeden brister.
5. Indikatorer som viser mer enn sluttgevinsten: leveranse, effekt, antakelser, bivirkninger og
   kontekst.
6. Gjenbruk av nyttevirkninger og indikatorer gjennom en katalog.
7. Nytteansvaret skal kunne leve videre i linjen etter at prosjektet er avsluttet.

**Utenfor omfang:**

- samfunnsøkonomisk analyse og beregning av netto gevinst,
- statistiske effektmålinger mot et nullalternativ,
- automatisk innhenting av måleverdier fra fagsystemer (API eller Power Automate kan komme senere),
- egne Power BI-rapporter (vi leverer datagrunnlaget).

Bidragsvurderingen er en strukturert, faglig vurdering. Den er ikke en beregning av hvor stor andel av en
gevinst et tiltak har skapt.

## 4. Begreper

Fasiten er Prosjektveiviseren v6, se `docs/prosjektveiviseren-v6/mapping-terminologi.csv`. MSP, Theory of
Change, DFØs resultatkjede og bidragsanalyse (Mayne) brukes som tillegg. Begrepene markert med ⚠ må
kontrolleres mot DFØs veileder før de låses.

**Leddene i kjeden**

| Begrep (standardnavn) | Betydning | Tilsvarer |
|---|---|---|
| **Leveranse** | Det prosjektet faktisk leverer: en løsning, et tilbud eller en tjeneste. | DFØ: leveranse. MSP: output. |
| **Evne / endret praksis** (Enkel: **Endring**) | Det organisasjonen må kunne eller gjøre annerledes for at nytten skal oppstå. | MSP: capability. Dagens Endringsanalyse. |
| **Effekt** | Den første endringen hos innbyggere eller tjenester, før gevinsten kan måles. | MSP og ToC: outcome. |
| **Nyttevirkning** | Gevinsten: den positive effekten som bidrar til et mål. Har en nytteeier i linjen. | v6 (TERM-001). MSP: benefit. |
| **Strategisk mål** | Det virksomheten vil oppnå på lang sikt. Nivåer: samfunnsmål, hovedmål, virksomhetsmål. | DFØ: samfunnsvirkning ⚠. ToC: impact. |

**Det som sitter på pilene**

| Begrep | Betydning |
|---|---|
| **Antakelse** | Det som må være sant for at pilen skal holde. |
| **Risiko** | Det som kan bryte kjeden. |
| **Utilsiktet virkning** | En bivirkning. Kan være positiv eller negativ. |
| **Påvirkningsfaktor** | Noe utenfor tiltaket som også kan forklare resultatet, for eksempel en alternativ forklaring. |
| **Evidensstyrke** | Hvor godt det er vist at pilen holder: Sterk, Moderat, Svak eller Ikke vurdert. |

**Måling og vurdering**

| Begrep | Betydning |
|---|---|
| **Måleindikator** | Det vi måler. Har en **rolle** (hva den tester) og en **måletype** (målbane, terskel eller følg med). |
| **Måling** | Én registrert verdi på én dato. |
| **Forventet bidrag** | En kort formulering per nyttevirkning: «Vi skal styrke X, slik at Y blir mer sannsynlig, forutsatt Z.» |
| **Bidragsvurdering** | En periodisk vurdering av om tiltakene har bidratt. Gradert: Sterk, Moderat, Svak eller Motstridende, med begrunnelse og beslutning. |
| **Nyttekart / matrise** | To visninger av samme kjede: som graf, og som tabell med én rad per nyttevirkning. |

## 5. Datamodell (alle lister på huben)

Alle listene har feltet `GtSiteIdLookup` → Prosjekter (eierprosjektet). Det er det samme mønsteret som
Tidslinjeinnhold bruker i dag. Er feltet tomt, eies elementet av virksomheten. Nye felt får prefikset
`GtBm…`.

```
                                    Kjedenivåer (innstillinger)
                                              │ styrer nivå og navn
Kjedeelementer ──┐                            ▼
(leveranse,      │        ┌───────── Lenker (pilene) ──────────┐
 evne/endring,   ├──fra──►│ Fra, Til, Evidensstyrke, Begrunnelse│◄──til── Nyttevirkninger ──til──► Strategiske mål
 effekt)         │        └──────────────┬─────────────────────┘
Nyttevirkninger ─┘                       │ ligger på
                            Forutsetninger og risikoer
Måleindikatorer ── måler ──► kjedeelement | nyttevirkning | forutsetning | mål
Målinger ──► Måleindikatorer          Bidragsvurderinger ──► Nyttevirkninger
Alle ── GtSiteIdLookup ──► Prosjekter
```

### 5.1 Kjedenivåer (ny, konfigurasjon)

Én rad per nivå under nyttevirkningen: Leveranse, Evne / endret praksis og Effekt.

| Felt | Type | Merknad |
|---|---|---|
| `GtBmLevelKey` | Tekst (låst) | `lev`, `chg`, `eff`. Brukes i koden, endres aldri. |
| Title / `GtBmLevelPlural` | Tekst | Visningsnavn i entall og flertall |
| `GtBmLevelActive` | Ja/nei | Om nivået er i bruk |
| `GtBmLevelOrder` | Tall | Rekkefølge |
| `GtBmLevelHelp` | Notat | Hjelpetekst i skjemaene |

Appen leverer to forhåndsdefinerte oppsett, **Enkel** og **Utvidet**. Toleransen for status settes i
Globale innstillinger.

Data i et nivå som skrus av, slettes ikke. Nyttekartet **slår sammen** pilene gjennom skjulte nivåer. Hvis
for eksempel effekt-nivået skrus av, vises Endring → Effekt → Nyttevirkning som én pil, og den får den
svakeste evidensen på veien.

### 5.2 Kjedeelementer (ny, erstatter Endringsanalyse)

Én liste med én innholdstype per nivå: Leveranse, Evne / endring og Effekt.

| Felt | Type | Merknad |
|---|---|---|
| Title / `GtBmDescription` | Tekst / notat | |
| `GtBmLevelKey` | Valg | `lev`, `chg` eller `eff` |
| `GtProcess`, `GtChallengeDescription` | Gjenbrukt | For endringer migrert fra Endringsanalyse |
| `GtBmChangeType` | Valg | Prosess, Organisasjon, Kompetanse, Teknologi, Kultur |
| `GtBmResponsible` | Person | |
| `GtBmStatus` | Valg | Planlagt, Pågår, Gjennomført |
| `GtSiteIdLookup` | Oppslag | Eier. Et prosjekt kan peke inn i programmets kjede. |

### 5.3 Nyttevirkninger (erstatter Nytteanalyse og plan for nyttestyring)

Disse feltene gjenbrukes: `GtGainsType`, `GtPrereqProfitAchievement`, `GtGainsTurnover`,
`GtGainsResponsible` (Nytteeier), `GtGainsOwner` (Nytteansvarlig), `GtRealizationTime` og
`GtShowInPortfolio`. Nye felt:

| Felt | Type | Merknad |
|---|---|---|
| `GtSiteIdLookup` | Oppslag → Prosjekter | Eier (prosjekt eller program). Tom betyr virksomheten. |
| `GtBmOwnerUnit` | Tekst eller term (flere) | Eierenhet i linjen, for eksempel «Hjemmetjenesten + Tildelingskontoret» |
| `GtBmExpectedContribution` | Notat | Forventet bidrag |
| `GtBmEvaluationLevel` | Valg | Nivå for bidragsvurdering: Minimal, Direkte eller Indirekte innflytelse |
| `GtBmStatus` | Valg | Foreslått, Godkjent, Under realisering, Realisert, **Overført til linjen**, Avbrutt |
| `GtBmContributesTo` | Oppslag → Nyttevirkninger | Tallfestet bidrag til en programgevinst |
| `GtBmShare` | Tall | Andel (%) av programgevinsten |
| `GtBmBasedOn` | Oppslag → Nyttevirkninger | Katalogelementet den er kopiert fra |
| `GtBmIsCatalogItem` | Ja/nei | Gjenbrukbart katalogelement |
| `GtBmMigratedFrom` | Tekst (skjult) | `{områdeURL}|{liste}|{id}`, sikrer at migreringen kan kjøres flere ganger |

Koblingene til endringer og mål ligger ikke lenger i oppslagsfelt på nyttevirkningen. De er rader i
Lenker.

### 5.4 Lenker (ny: pilene i kjeden)

| Felt | Type | Merknad |
|---|---|---|
| `GtBmFrom` | Oppslag → Kjedeelementer eller Nyttevirkninger | To oppslagsfelt, der nøyaktig ett er satt |
| `GtBmToElement` / `GtBmToBenefit` / `GtBmToGoal` | Oppslag | Målet for pilen. Nøyaktig ett er satt. |
| `GtBmEvidence` | Valg | Sterk, Moderat, Svak, Ikke vurdert |
| `GtBmEvidenceNote` | Notat | Begrunnelse |
| `GtSiteIdLookup` | Oppslag | Eieren av pilens utgangspunkt |

Pilene opprettes fra skjemaene. Et element har feltet «Fører til», og en nyttevirkning har «Bidrar til
strategiske mål». Brukeren trenger aldri å redigere listen direkte.

### 5.5 Forutsetninger og risikoer (ny, erstatter Antagelser i forrige utkast)

| Felt | Type | Merknad |
|---|---|---|
| Title / `GtBmNote` | Tekst / notat | |
| `GtBmFactorKind` | Valg | Antakelse, Risiko, Utilsiktet virkning, Påvirkningsfaktor |
| `GtBmLink` | Oppslag → Lenker | Pilen den gjelder |
| `GtBmFactorStatus` | Valg | Avhenger av typen: Holder / Usikker / Holder ikke · Lav / Middels / Høy · Ikke observert / Observert · Må undersøkes / Vurdert |
| `GtBmPolarity` | Valg | Positiv eller negativ (utilsiktet virkning) |
| `GtBmLastReviewed` | Dato | Gir «ikke vurdert på 6 mnd.» |
| `GtSiteIdLookup` | Oppslag | |

Risikoer kan i en senere versjon speiles til prosjektets usikkerhetsliste. Det er ikke med i denne
leveransen.

### 5.6 Måleindikatorer

`GtStartValue`, `GtDesiredValue` og `GtMeasurementUnit` gjenbrukes. Nye felt:

| Felt | Type | Merknad |
|---|---|---|
| `GtBmMeasures…` | Oppslag | Hva indikatoren måler: nyttevirkning, kjedeelement, forutsetning eller mål. Nøyaktig ett er satt. |
| `GtBmRole` | Valg | Gevinst, Effekt, Leveranse, Antakelse, Risiko, Balanserende, Kontekst |
| `GtBmMeasureType` | Valg | **Målbane** (fra start til mål over tid), **Terskel** (skal holde seg over eller under en grense) eller **Følg med** (ingen målverdi) |
| `GtBmLimitDirection` | Valg | Under eller Over (terskel) |
| `GtBmStartDate` / `GtBmTargetDate` | Dato | Målbane |
| `GtBmFrequency` | Valg | Gir «neste måling forfaller» |
| `GtBmMethod` | Tekst | Datakilde og målemetode |
| `GtBmMilestones` | Notat (JSON) | Delmål som gir en målbane som ikke er rett |
| `GtSiteIdLookup` | Oppslag | |

### 5.7 Målinger (erstatter Nytteoppfølging)

`GtMeasurementDate`, `GtMeasurementValue` og `GtMeasurementComment` gjenbrukes. I tillegg kommer
`GtMeasureIndicatorLookup` → Måleindikatorer, `GtSiteIdLookup` (dublett for filtrering) og
`GtBmMigratedFrom`.

### 5.8 Bidragsvurderinger (ny)

| Felt | Type | Merknad |
|---|---|---|
| `GtBmBenefit` | Oppslag → Nyttevirkninger | |
| `GtBmAssessmentDate` | Dato | |
| `GtBmGrade` | Valg | Sterk, Moderat, Svak, Motstridende, Ikke vurdert |
| `GtBmRationale` | Notat | Begrunnelse |
| `GtBmDecision` | Notat | Beslutning eller læringspunkt. Vises i styringsrapporten. |
| `GtSiteIdLookup` | Oppslag | |

Listen gir historikk. Den siste vurderingen vises på nyttevirkningen.

### 5.9 Strategiske mål (ny)

Felt: Title, `GtBmGoalDescription`, `GtBmGoalLevel` (Samfunnsmål, Hovedmål, Virksomhetsmål ⚠),
`GtBmParentGoal` (måltre), `GtBmGoalOwner`, `GtBmGoalPeriod` og `GtBmActive`.

### 5.10 Prosjekter-listen

Hver kobling går via `GtSiteIdLookup` → Prosjekter. To valgfrie felt kopierer nøkkeltall inn på
prosjektraden, så porteføljeoversikten og Power BI kan vise dem som vanlige kolonner:

- `GtBmAchievement` – samlet nytteoppnåelse i %.
- `GtBmLastMeasurement` – dato for siste måling.

### 5.11 Volum og indeksering

Et anslag: 200 prosjekter × 10 indikatorer × 12 målinger i året gir omtrent 24 000 målinger i året.
Lenker og forutsetninger blir noen tusen rader.

- Indekser `GtSiteIdLookup` og alle oppslag som brukes i filtre **før** listene fylles.
- Alle spørringer filtreres på et indeksert felt og bruker `getAllItems` med `$top`.
- Kjedene bygges i klienten fra Lenker. Én spørring per liste og nivå (hub, program eller prosjekt), og
  deretter traversering i minnet.
- Historikken til en indikator hentes først når indikatoren åpnes.

## 6. Appen: Nyttestyring

### 6.1 Én kjerne, tynne webdeler

- **Kjerne i `pp365-shared-library`:**
  - `services/BenefitsService` for data via `PortalDataService`, med nye nøkler i
    `PortalDataServiceList`: `BM_LEVELS`, `BM_ELEMENTS`, `BM_BENEFITS`, `BM_LINKS`, `BM_FACTORS`,
    `BM_INDICATORS`, `BM_MEASUREMENTS`, `BM_CONTRIBUTIONS` og `BM_GOALS`.
  - `components/BenefitsManagement/` for brukergrensesnittet: barrel, en hook per visning, Fluent v9 og
    `NavDrawer` slik IdeaModule gjør.
  - **Rene funksjoner med enhetstester**, portert fra prototypen:
    - `plannedValueAt` og `achievement` (målbane med delmål),
    - `statusAt` for de tre måletypene,
    - `closure` og `chainOf` (oppstrøms og nedstrøms i grafen),
    - `effectiveEdges` (sammenslåing gjennom skjulte nivåer),
    - `weakestEvidence`,
    - `rollup`,
    - `nextDue`.
- **Webdeler:** `benefitsManagement` i PortfolioWebParts (hub), ProgramWebParts (program) og
  ProjectWebParts (prosjekt). Webdelen setter bare opp konteksten. `context: 'auto'` finner nivået ut fra
  `GtIsProgram`, `GtIsParentProject` og hubtilknytningen.
- **Prosjektstatus:** ny seksjonstype `BenefitsSection` (innholdstype `…82806`) i `SectionModel` og
  `SectionMap`. Den viser kjernen i kompaktmodus.
- **Navigasjon:** valgt visning og element lagres i URL-hashen (`parseUrlHash`/`setUrlHash`).

### 6.2 Flater

| Flate | Hub | Program | Prosjekt | Innhold |
|---|:-:|:-:|:-:|---|
| **Oversikt** | ✔ | ✔ | ✔ | Forklaring av kjeden med et eksempel fra dataene, nøkkeltall, nytteoppnåelse, forutsetninger og risikoer som må følges opp, og indikatorer med avvik |
| **Nyttekart** | ✔ | ✔ | ✔ | Grafen med én kolonne per aktivt nivå. Strekene viser evidensstyrke, og merkene på pilene viser forutsetninger og risikoer. Hold over for å se kjeden. Klikk på en pil for å vurdere den. |
| **Matrise** | ✔ | ✔ | ✔ | Én rad per nyttevirkning: mål, nyttevirkning, effekter, evner, leveranser, forutsetninger og risikoer, indikatorer, svakeste pil og bidragsvurdering. Kan kopieres til Excel. |
| **Nyttevirkning** | ✔ | ✔ | ✔ | Kjeden fram til nyttevirkningen, forventet bidrag, historikk for bidragsvurderinger, indikatorer etter rolle, forutsetninger og risikoer, og pilene med evidens |
| **Indikator** | ✔ | ✔ | ✔ | Kurve mot målbane eller terskel, eller bare utvikling. Hva indikatoren måler, og hvilke nyttevirkninger og mål den henger sammen med. |
| **Registrering** | ✔ | ✔ | ✔ | Én fane per aktivt nivå, pluss Nyttevirkninger, Indikatorer, Forutsetninger og risikoer, og Mål |
| **Oppfølging** | ✔ | ✔ | ✔ | Målinger som forfaller, bidragsvurderinger som mangler og forutsetninger som ikke er vurdert på seks måneder |
| **Styringsrapport** | ✔ | ✔ | – | Følger kjeden ovenfra: mål → nyttevirkninger og bidrag → antakelser → risikoer og bivirkninger → hva må justeres |
| **Katalog** | ✔ (rediger) | les | les | Gjenbrukbare nyttevirkninger og indikatorer. «Ta i bruk» lager en kopi. |
| **Strategiske mål** | ✔ (rediger) | les | les | Måltre med kontekstindikatorer, nyttevirkningene som bidrar og hvordan de måles |
| **Tildel** | – | ✔ | – | Prosjektenes leveranser i programmets kjede, og fordeling av tallfestede gevinster i prosent |
| **Statusseksjon** | – | – | ✔ | Vurderingen og prosjektets indikatorer slik de var på rapportdatoen |
| **Innstillinger** | ✔ | – | – | Kjedemodell, navn på nivåene og toleranse |

### 6.3 Viktige designvalg

1. **Kjeden er en graf, ikke faste oppslag.** Alle piler er rader i Lenker. Da kan antall nivåer endres
   uten migrering, et prosjekt kan peke inn i programmets kjede, og evidens og forutsetninger har et
   naturlig sted å bo.
2. **Skjulte nivåer slås sammen.** Data går aldri tapt når en virksomhet går fra Utvidet til Enkel.
3. **Prosjektene leverer, programmet eier gevinsten.** I den utvidede modellen kobler prosjektet sine
   leveranser og evner inn i programmets kjede. Tallfestet fordeling med «bidrar til» og andel i prosent
   er fortsatt tilgjengelig for gevinster som kan deles opp, for eksempel antall telefonhenvendelser.
4. **Tre måletyper gir riktig status.**

   | Måletype | I rute | Følg med | Avvik |
   |---|---|---|---|
   | Målbane | Inntil toleransen bak banen | Inntil 2 × toleransen bak banen | Mer enn 2 × toleransen bak banen |
   | Terskel | Innenfor grensen | Inntil toleransen utenfor grensen | Mer enn toleransen utenfor grensen |
   | Følg med | Vurderes ikke. Vises som «Følges». | | |

   Bare indikatorer med målbane inngår i oppnåelse i prosent.
5. **Bidragsvurdering er en vurdering, ikke en beregning.** Skjemaet viser forventet bidrag og den
   svakeste pilen i kjeden som støtte. Skalaen er gradert: Sterk, Moderat, Svak eller Motstridende. Nivået
   for bidragsvurdering (minimal, direkte eller indirekte innflytelse) styrer hvor grundig det bør
   gjøres.
6. **Nytteansvar etter prosjektslutt.** Status «Overført til linjen» og eierenhet gjør at oppfølgingen
   fortsetter når prosjektområdet er avsluttet. Dataene ligger på huben.
7. **Katalog: kopi med referanse.** Hvert prosjekt får sin egen instans med `GtBmBasedOn` tilbake til
   katalogelementet.
8. **Statusrapporten viser et øyeblikksbilde.** Seksjonsdataene lagres ved publisering, slik andre
   seksjoner gjør i dag (`persistSectionDataAttachmentFileName`).
9. **Direkte listelesing, ikke søk.** Endringer vises med en gang.

### 6.4 Tilgang

Huben er i dag bare lesbar for prosjektmedlemmer. Unntaket er lister som allerede tar imot data fra
prosjektene, som Prosjektstatus og Tidslinjeinnhold.

- **Forslag:** Nyttelistene får samme tilgangsmodell som Prosjektstatus. Appen begrenser hva brukeren
  ser og redigerer til eget prosjekt og program. Versjonering slås på. Uten skrivetilgang vises appen i
  lesemodus med en forklaring.
- Kjedenivåer, katalog og strategiske mål redigeres bare på huben.
- **Beslutning:** Holder dette, eller trengs skriving via en tjenestekonto (Power Automate eller Azure
  Function)? En tjenestekonto gir sterkere kontroll, men må driftes.

## 7. Overgang og migrering

### 7.1 Strategi: velg selv, og frivillig migrering

- Ved installasjon eller oppgradering opprettes hublistene alltid, med kjedemodellen **Enkel**.
- En bryter i **Globale innstillinger**, «Nyttestyringsmodul aktiv», bestemmer:
  - om prosjektmalen lager de gamle listene, eller lenker til appen,
  - om statusseksjonen bruker den nye seksjonstypen.
- De gamle søkebaserte datakildene i Nytteoversikt fungerer videre for prosjekter som ikke er migrert.

### 7.2 Migreringsskript (kjøres én gang)

`Install/Scripts/Migrate-BenefitsToHub.ps1` følger mønsteret fra `UpgradeAllSitesToLatest` og
`EnsureV6BenefitTerminology.ps1`. Det er frivillig, beskyttet mot feil og kan kjøres flere ganger.

1. Henter alle prosjekter fra Prosjekter, eventuelt avgrenset med `-SiteUrl` eller `-Filter`.
2. Finner de fire listene per område **etter URL**. Både gamle Gevinst-navn og nye Nytte-navn
   gjenkjennes.
3. Kopierer i denne rekkefølgen:
   1. Endringsanalyse → Kjedeelementer på nivå `chg`.
   2. Nyttevirkninger.
   3. **Lenker** fra `GtChangeLookup`. Pilene får evidens «Ikke vurdert».
   4. Indikatorer, med rolle «Gevinst» og måletype «Målbane».
   5. Målinger.

   Skriptet bygger en tabell fra gammel til ny ID per område, slik at oppslagene kobles riktig.
4. Beholder Opprettet, Endret, Opprettet av og Endret av (`UpdateOverwriteVersion`). Verken
   versjonshistorikk eller vedlegg kopieres.
5. Har `-WhatIf` (tørrkjøring) og lager en CSV-rapport med antall per område og avvik.
6. Hopper over elementer som allerede finnes, ut fra `GtBmMigratedFrom`.
7. Med `-DeprecateSourceLists`: tar de gamle listene ut av navigasjonen, lenker «Nytteoversikt» til appen
   og gjør listene skrivebeskyttet. Listene blir **ikke** slettet.

Skriptet lager ikke strategiske mål, forutsetninger, evidens, bidragsvurderinger eller katalog, fordi de
ikke finnes i dag. Det er arbeid virksomheten gjør etter migreringen.

## 8. Leveranse

Leveransen dekker hele modellen. Rekkefølgen sikrer at det som er dyrt å endre senere, kommer først:
datamodellen og de rene funksjonene.

| Steg | Innhold | Resultat |
|---|---|---|
| **0. Prototype og avklaring** | HTML-prototype med fiktive data. Gjennomgang med kunden. Kontroll av ⚠-begreper. | Avklarte flater, begreper og datamodell |
| **1. Datamodell og kjerne** | Alle hublister, innholdstyper og felt. Kjedenivåer med Enkel og Utvidet. `BenefitsService` og de rene funksjonene med enhetstester. | Grunnmur som tåler begge modellene |
| **2. Registrering og oppfølging** | Registrering for alle nivåer, med «Fører til» og mål. Indikator med tre måletyper. Målinger og oppfølging. | Prosjekter og programmer kan bygge og følge opp kjeder |
| **3. Visninger** | Oversikt med forklaring, nyttekart med evidens og forutsetninger, matrise, nyttevirkning med bidragsvurdering, strategiske mål og styringsrapport | Ledelsen ser hvor kjeden holder og hvor den brister |
| **4. Nivåene** | Webdeler for hub, program og prosjekt. Tildel. Katalog. Statusseksjonen med øyeblikksbilde. Innstillinger. | Samme app overalt, og nytte i statusrapporten |
| **5. Migrering og overgang** | Migreringsskript, bryter i Globale innstillinger, endringer i prosjektmalen og dokumentasjon | Overgangen er gjennomført hos dem som ønsker det |

Det som ikke kommer med i første versjon, avtales underveis. HTML-prototypen er rask å endre, mens den
samme funksjonaliteten i SPFx mot ekte data, med tilgangsstyring, testing og oppgradering, koster mer.

## 9. Beslutninger

1. **Tilgangsmodell** (6.4): Samme modell som Prosjektstatus, eller tjenestekonto?
2. **Standardmodell ved installasjon:** Enkel for alle, med Utvidet som et valg på huben? Forslaget er
   ja.
3. **Navn på nivåene:** Holder standardnavnene, eller trengs det en egen terminologipakke per sektor
   (kommune, stat)?
4. **Strategiske mål i PP365 eller fra en eksisterende kilde?** Forslaget er en enkel liste med mulighet
   for import.
5. **Nivåer for mål** (samfunnsmål, hovedmål, virksomhetsmål) og **typer nyttevirkning** (dagens
   `GtGainsType`): Juster etter DFØ?
6. **Prosjekter i andre hubber** (`initializeHubWebs`): utenfor omfang i første versjon?

## 10. Risiko

| Risiko | Tiltak |
|---|---|
| Modellen oppleves som for tung for vanlige prosjekter | Enkel er standard. Utvidet slås på bare der det trengs, og skjulte nivåer slås sammen. |
| Listene passerer 5 000 elementer | Indekser fra start, filtrer alltid, bruk `getAllItems` med `$top` |
| Grafen blir uoversiktlig i store porteføljer | Filtrering per program og prosjekt, matrise som alternativ visning, og fokuskart per nyttevirkning |
| Prosjektmedlemmer redigerer andres data på huben | Begrensning i appen, versjonering, eventuelt tjenestekonto |
| Bidragsvurderingen blir en pen programfortelling | Svakeste pil vises i skjemaet. «Motstridende» er et eget valg. Påvirkningsfaktorer og bivirkninger synes i styringsrapporten. |
| Det finnes to sannheter i overgangsperioden | Bryteren i Globale innstillinger, og gamle datakilder merket som utgått |
| Migreringen bryter oppslag | Tabell fra gammel til ny ID, tørrkjøring og CSV-rapport, kan kjøres på nytt |
| Begrepene avviker fra DFØ | ⚠-punktene kontrolleres mot DFØs veileder i steg 0 |
