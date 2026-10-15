# Løsningsforslag: Nyttestyringsmodul (ny gevinstmodul)

> **Status:** Utkast til diskusjon, oppdatert 15.10.2026. Bakgrunn: ønske fra Asker kommune. Målet er at
> modulen blir ny standard i Prosjektportalen 365 (PP365).
> **Prototype:** se [`nyttestyringsmodul/prototype.md`](nyttestyringsmodul/prototype.md).
>
> **Endret 14.10:** Modellen er utvidet etter innspill fra kunden om styring etter endringsteori. Innspillene
> bygger på MSP, Theory of Change og bidragsanalyse etter John Mayne. Kjeden har nå et konfigurerbart antall
> ledd. Pilene i kjeden er egne objekter med evidensstyrke. Forutsetninger og risikoer ligger på pilene.
> Indikatorer har en rolle og en måletype. Nyttevirkninger får bidragsvurderinger. Leveransen dekker hele
> modellen, ikke bare en MVP.
>
> **Endret 15.10:** Modellen er lagt tett opp til DFØs veileder om nyttestyring. Standardmodellen heter nå
> **DFØ** og følger DFØs nyttekart: tiltak → hvem blir berørt → nytte- og kostnadsvirkninger → effektmål →
> samfunnsmål. Kostnadsvirkninger registreres sammen med nyttevirkningene. Effektmål er et eget nivå som
> eies av prosjektet eller programmet. Appen lager nytterealiseringsplanen, nytteoversikten og en
> sjekkliste per nyttestyringsfase fra dataene. Vurderingene skiller mellom løpende vurdering,
> underveisevaluering og etterevaluering.

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
| **Hub (virksomhet)** | Oversikt og styringsrapport for hele porteføljen. Samfunnsmål og strategiske mål. Katalog med gjenbrukbare nyttevirkninger og indikatorer. Innstillinger for kjedemodellen. |
| **Program** | Programmets egen kjede, effektmål og nytterealiseringsplan, og prosjektenes bidrag inn i den. Styringsrapport. Tildeling til prosjektene. |
| **Prosjekt** | Prosjektets virkninger, effektmål og nytterealiseringsplan, koblet inn i programmets eller virksomhetens kjede. Fase og sjekkliste etter DFØ. Målinger og vurderinger. Ny seksjon i prosjektstatus. Alt lagres på huben. |

Kjernen i modellen er en **kjede** fra tiltaket til virksomhetens mål. Standarden følger DFØs veileder
om nyttestyring. Virksomheter som styrer etter en endringsteori, kan slå på flere ledd:

| Kjedemodell | Ledd | Passer for |
|---|---|---|
| **DFØ** (standard) | Tiltak → Hvem blir berørt → Nytte- og kostnadsvirkninger → Effektmål → Samfunnsmål | De fleste prosjekter. Samme nyttekart som i DFØs veileder. Nødvendige aktiviteter (dagens Endringsanalyse) registreres og vises i nytterealiseringsplanen. |
| **Utvidet** | Leveranse → Evne / endret praksis → Effekt → Nytte- og kostnadsvirkninger → Effektmål → Samfunnsmål | Programmer som styrer etter en endringsteori (MSP, Theory of Change, DFØs resultatkjede). |

Navnene kan endres. En virksomhet som sier «gevinst» om nyttevirkning, eller «resultat» om effekt, kan
bruke sine egne ord.

DFØ beskriver tre dokumenter: **nytteoversikten**, **nyttekartet** og **nytterealiseringsplanen**. Appen
lager alle tre fra de samme listene. Planen er dermed alltid oppdatert, og den kan ikke «puttes i en
skuff», som DFØ advarer mot. En **sjekkliste per nyttestyringsfase** viser hva som mangler og tar
brukeren rett dit det registreres.

Pilene mellom leddene er like viktige som leddene. På pilene ligger **forutsetninger og risikoer**:
antakelser, risikoer, utilsiktede virkninger og andre påvirkningsfaktorer. Hver pil har en
**evidensstyrke**. Indikatorene kan måle hvilket som helst ledd, og også teste en antakelse. Hver
virkning får jevnlige **vurderinger og evalueringer**: har tiltaket gitt de forventede virkningene, og bør
det videreføres, justeres eller avsluttes?

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
3. **En kjede virksomheten selv kan forme.** DFØ som standard, utvidet når et program trenger det,
   uten at dataene må bygges om.
4. **Pilene skal kunne testes.** Forutsetninger, risikoer og evidens ligger der de hører hjemme. Når en
   gevinst uteblir, skal det synes hvor kjeden brister.
5. Indikatorer som viser mer enn sluttgevinsten: leveranse, effekt, antakelser, bivirkninger og
   kontekst.
6. Gjenbruk av nyttevirkninger og indikatorer gjennom en katalog.
7. Nytteansvaret skal kunne leve videre i linjen etter at prosjektet er avsluttet.
8. **Følge DFØs veileder.** Nytte- og kostnadsvirkninger sammen, effektmål og samfunnsmål, hvem som blir
   berørt, nullpunktsmåling, underveis- og etterevaluering, og en nytterealiseringsplan med DFØs åtte
   punkter.

**Utenfor omfang:**

- samfunnsøkonomisk analyse og beregning av netto nåverdi. Prissatte virkninger kan få en anslått verdi,
  og lønnsomhet og usikkerhet beskrives som tekst i planen,
- statistiske effektmålinger mot et nullalternativ,
- automatisk innhenting av måleverdier fra fagsystemer (API eller Power Automate kan komme senere),
- egne Power BI-rapporter (vi leverer datagrunnlaget).

Bidragsvurderingen er en strukturert, faglig vurdering. Den er ikke en beregning av hvor stor andel av en
gevinst et tiltak har skapt.

## 4. Begreper

Fasiten er DFØs veileder om nyttestyring av statlige tiltak, sammen med Prosjektveiviseren v6 (se
`docs/prosjektveiviseren-v6/mapping-terminologi.csv`). MSP, Theory of Change og bidragsanalyse (Mayne)
brukes i den utvidede modellen. Begrepene er kontrollert mot DFØs veileder.

**Leddene i kjeden**

| Begrep (standardnavn) | Betydning | Kilde |
|---|---|---|
| **Tiltak** | Prosjektet eller programmet som gjennomføres. | DFØ |
| **Hvem blir berørt?** | Målgruppen og andre som merker virkningen: innbyggere, brukere, ansatte, egen virksomhet, næringslivet, samfunnet. | DFØ (nyttekart og nytteoversikt) |
| **Nødvendig aktivitet** (DFØ) / **Evne / endret praksis** (Utvidet) | Det som må gjøres eller kunnes annerledes for at nytten skal oppstå: opplæring, nye rutiner, informasjon til målgruppen. | DFØ: aktiviteter som gjør det mulig å realisere nytten. MSP: capability. Dagens Endringsanalyse. |
| **Leveranse** (Utvidet) | Det prosjektet faktisk leverer: en løsning, et tilbud eller en tjeneste. | DFØs resultatkjede: produkter og tjenester. MSP: output. |
| **Effekt** (Utvidet) | Den første endringen hos innbyggere eller tjenester, før gevinsten kan måles. | DFØs resultatkjede: effekter for brukerne. MSP og ToC: outcome. |
| **Nyttevirkning** | En positiv virkning av tiltaket. Har en nytteeier i linjen. | DFØ. v6 (TERM-001). MSP: benefit. |
| **Kostnadsvirkning** | En kostnad tiltaket påfører, for eksempel investering, drift eller omstilling. | DFØ |
| **Prissatt / ikke prissatt** | Om virkningen er verdsatt i kroner. | DFØ |
| **Effektmål** | Ønsket situasjon for målgruppen når tiltaket er gjennomført. Eies av prosjektet eller programmet. | DFØ, Prosjektveiviseren |
| **Samfunnsmål** og andre strategiske mål | Det virksomheten vil oppnå på lang sikt. Nivåer: samfunnsmål, hovedmål, virksomhetsmål. | DFØ. ToC: impact. |

**Det som sitter på pilene**

| Begrep | Betydning |
|---|---|
| **Antakelse** | Det som må være sant for at pilen skal holde. DFØ: forutsetning. |
| **Risiko** | Det som kan bryte kjeden. DFØ: usikkerhet. |
| **Utilsiktet virkning** | En bivirkning. Kan være positiv eller negativ. DFØ ber om at de tas med i planen når de fanges opp. |
| **Påvirkningsfaktor** | Noe utenfor tiltaket som også kan forklare resultatet, for eksempel en alternativ forklaring. |
| **Evidensstyrke** | Hvor godt det er vist at pilen holder: Sterk, Moderat, Svak eller Ikke vurdert. |

**Roller**

| Rolle | Betydning | Kilde i PP365 |
|---|---|---|
| **Tiltakseier** (prosjekteier, programeier) | Eier tiltaket og virkningene, og sikrer forankring. | `GtProjectOwner` i Prosjekter |
| **Tiltakets leder** (prosjektleder, programleder) | Har ansvar for planene og følger med på nytten, ikke bare tid, kostnad og kvalitet. | `GtProjectManager` i Prosjekter |
| **Nytteansvarlig** | Operativt ansvar for nyttestyringen. Ofte en leder i linjen. | Per virkning (`GtGainsOwner`) |
| **Nytteeier** | Leder i linjen som overtar virkningen når prosjektet avsluttes. Begrepet kommer fra Prosjektveiviseren; DFØ legger dette ansvaret på tiltakseier og nytteansvarlig. | Per virkning (`GtGainsResponsible`) |
| **Ansvarlig for målinger og evalueringer** | Henter inn data og gjennomfører evalueringene. DFØ: bør ikke være de som har gjennomført tiltaket. | Nytterealiseringsplanen |

**Måling, vurdering og dokumenter**

| Begrep | Betydning |
|---|---|
| **Måleindikator** | Det vi måler. Har en **rolle** (hva den tester) og en **måletype** (målbane, terskel eller følg med). |
| **Nullpunktsmåling** | Den første målingen som senere målinger sammenlignes med (startverdi og dato). |
| **Måling** | Én registrert verdi på én dato. |
| **Forventet bidrag** | En kort formulering per nyttevirkning: «Vi skal styrke X, slik at Y blir mer sannsynlig, forutsatt Z.» |
| **Vurdering** | **Løpende vurdering**, **underveisevaluering** eller **etterevaluering**. Svarer på DFØs spørsmål: har problemet endret seg, gir tiltaket forventede virkninger, og hvorfor er det eventuelt avvik? Bidragsstøtten graderes (Sterk, Moderat, Svak, Motstridende), og anbefalingen er **videreføre, justere eller avslutte**. |
| **Nytteoversikt** | DFØs tabell over nytte- og kostnadsvirkninger, med indikatorer, hvem som blir berørt og når virkningen oppstår. |
| **Nyttekart / matrise** | To visninger av samme kjede: som graf, og som tabell med én rad per virkning. |
| **Nytterealiseringsplan** | DFØs operative plan med åtte punkter. Lages fra dataene. |
| **Nyttestyringsfase** | DFØs fire faser: utrede, planlegge, gjennomføre og evaluere underveis, etterevaluere. Hentes fra prosjektfasen. |

## 5. Datamodell (alle lister på huben)

Alle listene har feltet `GtSiteIdLookup` → Prosjekter (eierprosjektet). Det er det samme mønsteret som
Tidslinjeinnhold bruker i dag. Er feltet tomt, eies elementet av virksomheten. Nye felt får prefikset
`GtBm…`.

```
                                    Kjedenivåer og Berørte grupper (innstillinger)
                                              │ styrer nivå, navn og valg
Kjedeelementer ──┐                            ▼
(aktivitet,      │        ┌───────── Lenker (pilene) ──────────┐
 leveranse,      ├──fra──►│ Fra, Til, Evidensstyrke, Begrunnelse│◄──til── Nyttevirkninger ──til──► Mål
 evne, effekt)   │        └──────────────┬─────────────────────┘        (nytte og kostnad)       (effektmål ──► samfunnsmål)
Nyttevirkninger ─┘                       │ ligger på
                            Forutsetninger og risikoer
Måleindikatorer ── måler ──► kjedeelement | virkning | effektmål | forutsetning | mål
Målinger ──► Måleindikatorer      Vurderinger og evalueringer ──► virkning eller hele tiltaket
Nytterealiseringsplaner (én per prosjekt og program)
Alle ── GtSiteIdLookup ──► Prosjekter (prosjekteier, prosjektleder, fase)
```

### 5.1 Kjedenivåer (ny, konfigurasjon)

Én rad per nivå før virkningen: Leveranse, Evne / endret praksis (eller Nødvendig aktivitet) og Effekt.

| Felt | Type | Merknad |
|---|---|---|
| `GtBmLevelKey` | Tekst (låst) | `lev`, `chg`, `eff`. Brukes i koden, endres aldri. |
| Title / `GtBmLevelPlural` | Tekst | Visningsnavn i entall og flertall |
| `GtBmLevelActive` | Ja/nei | Om nivået er i bruk |
| `GtBmLevelOrder` | Tall | Rekkefølge |
| `GtBmLevelHelp` | Notat | Hjelpetekst i skjemaene |

Appen leverer to forhåndsdefinerte oppsett:

- **DFØ:** Ingen nivåer er i bruk i kjeden. Nyttekartet starter da med tiltaket og hvem som blir berørt,
  slik DFØs nyttekart gjør. Nivået `chg` heter «Nødvendig aktivitet» og brukes til DFØs punkt 8,
  aktiviteter som gjør det mulig å realisere nytten. Det vises i lister og i nytterealiseringsplanen, men
  ikke som en kolonne i kartet.
- **Utvidet:** Alle tre nivåene er i bruk, med navnene Leveranse, Evne / endret praksis og Effekt.

Toleransen for status settes i Globale innstillinger.

Data i et nivå som skrus av, slettes ikke. Nyttekartet **slår sammen** pilene gjennom skjulte nivåer. Hvis
for eksempel effekt-nivået skrus av, vises Evne → Effekt → Nyttevirkning som én pil, og den får den
svakeste evidensen på veien. Forutsetninger og risikoer på sammenslåtte piler flyttes med.

**Berørte grupper** er en liten liste på huben (Title, rekkefølge, aktiv) med valgene til «Hvem blir
berørt?». Standard: Innbyggere, Brukere og pårørende, Ansatte, Egen virksomhet, Næringslivet, Samfunnet.

### 5.2 Kjedeelementer (ny, erstatter Endringsanalyse)

Én liste med én innholdstype per nivå: Leveranse, Evne / endring (Nødvendig aktivitet i DFØ-modellen) og
Effekt.

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

Listen inneholder både nytte- og kostnadsvirkninger, slik DFØ anbefaler. Den beholder navnet
Nyttevirkninger av hensyn til Prosjektveiviseren og migreringen. I appen heter menyen «Nytte- og
kostnadsvirkninger».

Disse feltene gjenbrukes: `GtGainsType`, `GtPrereqProfitAchievement`, `GtGainsTurnover`,
`GtGainsResponsible` (Nytteeier), `GtGainsOwner` (Nytteansvarlig), `GtRealizationTime` («Når oppstår
virkningen?») og `GtShowInPortfolio`. Nye felt:

| Felt | Type | Merknad |
|---|---|---|
| `GtBmEffectKind` | Valg | **Nytte** eller **Kostnad**. Standard er Nytte. |
| `GtBmPriced` | Valg | Prissatt eller Ikke prissatt |
| `GtBmEstimatedValue` | Tekst | Anslått verdi, for eksempel «3,2 mill. kr/år». Appen regner ikke med den. |
| `GtBmAffected` | Oppslag (flere) → Berørte grupper | Hvem blir berørt? |
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

Koblingene til aktiviteter og mål ligger ikke lenger i oppslagsfelt på virkningen. De er rader i Lenker.

### 5.4 Lenker (ny: pilene i kjeden)

| Felt | Type | Merknad |
|---|---|---|
| `GtBmFrom` | Oppslag → Kjedeelementer, Nyttevirkninger eller Mål | Tre oppslagsfelt, der nøyaktig ett er satt. Fra Mål brukes for effektmål → samfunnsmål. |
| `GtBmToElement` / `GtBmToBenefit` / `GtBmToGoal` | Oppslag | Målet for pilen. Nøyaktig ett er satt. |
| `GtBmEvidence` | Valg | Sterk, Moderat, Svak, Ikke vurdert |
| `GtBmEvidenceNote` | Notat | Begrunnelse |
| `GtSiteIdLookup` | Oppslag | Eieren av pilens utgangspunkt |

Pilene opprettes fra skjemaene. Et element har feltet «Fører til», en virkning har «Bidrar til mål», og
et effektmål har «Bidrar til samfunnsmål». Brukeren trenger aldri å redigere listen direkte.

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

`GtStartValue` (nullpunkt), `GtDesiredValue` og `GtMeasurementUnit` gjenbrukes. Nye felt:

| Felt | Type | Merknad |
|---|---|---|
| `GtBmMeasures…` | Oppslag | Hva indikatoren måler: virkning, kjedeelement, effektmål, forutsetning eller mål. Nøyaktig ett er satt. |
| `GtBmRole` | Valg | Gevinst, Kostnad, Effekt, Leveranse, Antakelse, Risiko, Balanserende, Kontekst |
| `GtBmMeasureType` | Valg | **Målbane** (fra start til mål over tid), **Terskel** (skal holde seg over eller under en grense) eller **Følg med** (ingen målverdi) |
| `GtBmLimitDirection` | Valg | Under eller Over (terskel) |
| `GtBmStartDate` / `GtBmTargetDate` | Dato | Dato for nullpunktsmåling og måldato (målbane) |
| `GtBmFrequency` | Valg | Gir «neste måling forfaller» |
| `GtBmMethod` | Tekst | Datakilde og målemetode. DFØ: vurder om dataene er «sikre nok». |
| `GtBmMilestones` | Notat (JSON) | Delmål som gir en målbane som ikke er rett |
| `GtSiteIdLookup` | Oppslag | |

### 5.7 Målinger (erstatter Nytteoppfølging)

`GtMeasurementDate`, `GtMeasurementValue` og `GtMeasurementComment` gjenbrukes. I tillegg kommer
`GtMeasureIndicatorLookup` → Måleindikatorer, `GtSiteIdLookup` (dublett for filtrering) og
`GtBmMigratedFrom`.

### 5.8 Vurderinger og evalueringer (ny)

| Felt | Type | Merknad |
|---|---|---|
| `GtBmBenefit` | Oppslag → Nyttevirkninger | Tom betyr at raden gjelder hele tiltaket |
| `GtBmAssessmentKind` | Valg | Løpende vurdering, Underveisevaluering, Etterevaluering |
| `GtBmAssessmentStatus` | Valg | Planlagt eller Gjennomført. Planlagte evalueringer er en del av nytterealiseringsplanen. |
| `GtBmAssessmentDate` | Dato | Planlagt eller gjennomført dato |
| `GtBmAssessedBy` | Tekst | Hvem som vurderer. DFØ: bør ikke være de som har gjennomført tiltaket. |
| `GtBmMethod` | Tekst | Data og metode |
| `GtBmProblemChanged` | Notat | Har problemet tiltaket skulle løse, endret seg? |
| `GtBmGrade` | Valg | Bidragsstøtte: Sterk, Moderat, Svak, Motstridende, Ikke vurdert |
| `GtBmRationale` | Notat | Begrunnelse |
| `GtBmDeviationCauses` | Notat | Årsaker til avvik mellom forventede og faktiske virkninger |
| `GtBmRecommendation` | Valg | Videreføre, Justere, Avslutte |
| `GtBmDecision` | Notat | Beslutning eller læringspunkt. Vises i styringsrapporten. |
| `GtSiteIdLookup` | Oppslag | |

Listen gir historikk. Den siste vurderingen vises på virkningen.

### 5.9 Mål (ny, erstatter Strategiske mål i forrige utkast)

Felt: Title, `GtBmGoalDescription`, `GtBmGoalLevel` (Samfunnsmål, Hovedmål, Virksomhetsmål,
**Effektmål**), `GtBmParentGoal` (måltre for virksomhetens mål), `GtBmGoalOwner`, `GtBmGoalPeriod`,
`GtBmActive` og `GtSiteIdLookup`.

- Samfunnsmål, hovedmål og virksomhetsmål eies av virksomheten (`GtSiteIdLookup` er tom) og redigeres på
  huben.
- Effektmål eies av prosjektet eller programmet og redigeres der. Et prosjekt kan bruke programmets
  effektmål. Effektmålet peker opp til samfunnsmålene gjennom Lenker. Det tallfestes med en indikator når
  tiltaket er besluttet, slik DFØ anbefaler.

### 5.10 Nytterealiseringsplaner (ny)

Én rad per prosjekt og program, med det i planen som ikke kan hentes fra de andre listene:

| Felt | Type | DFØ-punkt |
|---|---|---|
| `GtBmProblem` | Notat | 1. Problemet tiltaket skal løse |
| `GtBmMeasureDescription` | Notat | 1. Tiltaket |
| `GtBmProfitability` | Notat | 1. Samfunnsøkonomisk lønnsomhet og usikkerhet, med henvisning til utredningen |
| `GtBmResources` | Notat | 1. Ressurser til gjennomføring og oppfølging |
| `GtBmInvolvement` | Notat | 3. Slik involveres målgruppen og interessentene |
| `GtBmMeasurementResponsible` | Tekst eller person | 2 og 5. Ansvarlig for løpende målinger |
| `GtBmEvaluationResponsible` | Tekst eller person | 2 og 6. Ansvarlig for evalueringer |
| `GtSiteIdLookup` | Oppslag | |

Tiltakseier, tiltakets leder og fase hentes fra Prosjekter (`GtProjectOwner`, `GtProjectManager`,
`GtProjectPhase`). Resten av planen settes sammen av de andre listene, se 6.2.

### 5.11 Prosjekter-listen

Hver kobling går via `GtSiteIdLookup` → Prosjekter. Tre valgfrie felt kopierer nøkkeltall inn på
prosjektraden, så porteføljeoversikten og Power BI kan vise dem som vanlige kolonner:

- `GtBmAchievement` – samlet nytteoppnåelse i %.
- `GtBmLastMeasurement` – dato for siste måling.
- `GtBmChecklist` – andel av sjekklisten for fasen som er på plass, i %.

### 5.12 Volum og indeksering

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
    `PortalDataServiceList`: `BM_LEVELS`, `BM_GROUPS`, `BM_ELEMENTS`, `BM_BENEFITS`, `BM_LINKS`,
    `BM_FACTORS`, `BM_INDICATORS`, `BM_MEASUREMENTS`, `BM_ASSESSMENTS`, `BM_GOALS` og `BM_PLANS`.
  - `components/BenefitsManagement/` for brukergrensesnittet: barrel, en hook per visning, Fluent v9 og
    `NavDrawer` slik IdeaModule gjør.
  - **Rene funksjoner med enhetstester**, portert fra prototypen:
    - `plannedValueAt` og `achievement` (målbane med delmål),
    - `statusAt` for de tre måletypene,
    - `closure` og `chainOf` (oppstrøms og nedstrøms i grafen),
    - `effectiveEdges` (sammenslåing gjennom skjulte nivåer),
    - `weakestEvidence`,
    - `rollup`,
    - `nextDue`,
    - `dfoPhase` (fra prosjektfase til nyttestyringsfase) og `checklist` (sjekklisten per fase, med hva
      som mangler og hvor det rettes).
- **Webdeler:** `benefitsManagement` i PortfolioWebParts (hub), ProgramWebParts (program) og
  ProjectWebParts (prosjekt). Webdelen setter bare opp konteksten. `context: 'auto'` finner nivået ut fra
  `GtIsProgram`, `GtIsParentProject` og hubtilknytningen.
- **Prosjektstatus:** ny seksjonstype `BenefitsSection` (innholdstype `…82806`) i `SectionModel` og
  `SectionMap`. Den viser kjernen i kompaktmodus.
- **Navigasjon:** valgt visning og element lagres i URL-hashen (`parseUrlHash`/`setUrlHash`).

### 6.2 Flater

Menyen har få punkter, og alle er steder navngitt som substantiver. «Felles grunnlag» skiller det
virksomheten eier fra det prosjektet jobber med.

| Menypunkt | Hub | Program | Prosjekt | Innhold |
|---|:-:|:-:|:-:|---|
| **Oversikt** | ✔ | ✔ | ✔ | På program og prosjekt øverst: nyttestyringsfasen etter DFØ og sjekklisten («11 av 17 på plass», neste oppgave og en knapp rett dit). Deretter en forklaring av kjeden med et eksempel fra dataene, nøkkeltall, nytteoppnåelse, forutsetninger og risikoer som må følges opp, og indikatorer med avvik. |
| **Til oppfølging** (med tall) | ✔ | ✔ | ✔ | Målinger som forfaller, vurderinger som mangler og forutsetninger som ikke er vurdert på seks måneder |
| **Nyttekart** | ✔ | ✔ | ✔ | Tre faner med samme kjede. **Kart** er grafen. I DFØ-modellen har den kolonnene Tiltak, Hvem blir berørt?, Nytte- og kostnadsvirkninger, Effektmål og Samfunnsmål, som DFØs nyttekart. **Matrise** har én rad per virkning og kan kopieres til Excel. **Liste** har én underfane per type, og der registrerer man. |
| **Mål** | rediger | ✔ | ✔ | Effektmålene til prosjektet eller programmet, og virksomhetens samfunnsmål og strategiske mål. Under hvert mål vises virkningene som bidrar og hvordan de måles. Effektmål redigeres der de eies. |
| **Nytterealiseringsplan** | – | ✔ | ✔ | Tre faner: **Nytterealiseringsplan** med DFØs åtte punkter, **Nytteoversikt** i DFØs tabellform, og **Sjekkliste for fasen**. Alt lages fra dataene, og planen kan skrives ut eller lagres som PDF. |
| **Styringsrapport** | ✔ | ✔ | – | Mål → virkninger og bidrag → antakelser → risikoer og bivirkninger → videreføre, justere eller avslutte |
| **Prosjektenes bidrag** | – | ✔ | – | Prosjektenes leveranser i programmets kjede, og fordeling i prosent for tallfestede gevinster |
| *Felles grunnlag:* **Katalog** | rediger | les | les | Gjenbrukbare nyttevirkninger og indikatorer. «Ta i bruk» lager en kopi. |
| **Innstillinger** | ✔ | – | – | Kjedemodell (DFØ eller Utvidet), navn på nivåene, berørte grupper og toleranse |

**Nytterealiseringsplanen** settes sammen slik:

| DFØ-punkt | Innhold i appen | Kilde |
|---|---|---|
| 1. Bakgrunnsinformasjon og ressursbehov | Problem, tiltak, effektmål og samfunnsmål, antall nytte- og kostnadsvirkninger, utilsiktede virkninger som er fanget opp, lønnsomhet og usikkerhet, ressurser | Nytterealiseringsplaner, Mål, Nyttevirkninger, Forutsetninger |
| 2. Roller, ansvar og myndighet | Tiltakseier, tiltakets leder, nytteansvarlige, nytteeiere, ansvarlig for målinger og evalueringer. «Ikke avklart» der rollen mangler. | Prosjekter, Nyttevirkninger, Nytterealiseringsplaner |
| 3. Involvere målgruppen og interessentene | Hvem som blir berørt av hvilke virkninger, og hvordan de involveres. Interessentanalysen ligger i prosjektets interessentregister. | Nyttevirkninger, Nytterealiseringsplaner |
| 4. Indikatorer for mål og virkninger | Per effektmål og virkning: indikatorer med nullpunkt, mål eller terskel og status. «Mangler indikator» der det trengs. | Måleindikatorer |
| 5. Løpende målinger | Datakilde og metode, frekvens, nullpunktsmåling og neste måling | Måleindikatorer, Målinger |
| 6. Evaluere tiltaket | Planlagte og gjennomførte underveis- og etterevalueringer, med hvem og metode | Vurderinger og evalueringer |
| 7. Håndtere usikkerhet (risiko) | Risikoer, antakelser og påvirkningsfaktorer med status og vurdering | Forutsetninger og risikoer |
| 8. Aktiviteter som gjør det mulig å realisere nytten | Nødvendige aktiviteter (eller leveranser og evner i den utvidede modellen), hva de gjør mulig, ansvarlig og status | Kjedeelementer, Lenker |

**Sjekklisten** følger DFØs sjekklister per fase og sjekkes mot dataene. Eksempler: «Både nytte- og
kostnadsvirkninger er beskrevet», «Alle indikatorer har nullpunktsmåling», «Evalueringene er planlagt»,
«Underveisevaluering er gjennomført». Oppgaver fra tidligere faser som ikke er gjort, merkes som etterslep.
Hver oppgave som mangler, har en knapp som åpner riktig skjema eller liste. Fasen hentes fra
prosjektfasen:

| Prosjektveiviseren (`GtProjectPhase`) | Nyttestyringsfase (DFØ) |
|---|---|
| Idé, Konsept | 1. Utrede |
| Planlegge | 2. Planlegge gjennomføring og oppfølging |
| Gjennomføre, Avslutte | 3. Gjennomføre og evaluere underveis |
| Realisere | 4. Etterevaluere |

Detaljsider som åpnes fra listene:

- **Virkning:** type (nytte eller kostnad, prissatt eller ikke), hvem som blir berørt, kjeden fram til
  virkningen og målene den bidrar til, forventet bidrag, historikk for vurderinger og evalueringer,
  indikatorer etter rolle, forutsetninger og risikoer, og pilene med evidens.
- **Indikator:** kurve mot målbane eller terskel, eller bare utvikling, og hva indikatoren henger
  sammen med, fra samfunnsmål og effektmål ned til målingene.

**Statusseksjonen** er ikke en del av appens meny. Den ligger på Prosjektstatus-siden og viser vurderingen
og prosjektets indikatorer slik de var på rapportdatoen.

### 6.3 Viktige designvalg

1. **Kjeden er en graf, ikke faste oppslag.** Alle piler er rader i Lenker. Da kan antall nivåer endres
   uten migrering, et prosjekt kan peke inn i programmets kjede, og evidens og forutsetninger har et
   naturlig sted å bo.
2. **Skjulte nivåer slås sammen.** Data går aldri tapt når en virksomhet går fra Utvidet til DFØ.
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
5. **Vurdering er en vurdering, ikke en beregning.** Skjemaet stiller DFØs spørsmål og viser forventet
   bidrag og den svakeste pilen i kjeden som støtte. Bidragsstøtten graderes: Sterk, Moderat, Svak eller
   Motstridende. Anbefalingen er videreføre, justere eller avslutte. Nivået for bidragsvurdering
   (minimal, direkte eller indirekte innflytelse) styrer hvor grundig det bør gjøres.
6. **Nytteansvar etter prosjektslutt.** Status «Overført til linjen» og eierenhet gjør at oppfølgingen
   fortsetter når prosjektområdet er avsluttet. Dataene ligger på huben.
7. **Katalog: kopi med referanse.** Hvert prosjekt får sin egen instans med `GtBmBasedOn` tilbake til
   katalogelementet.
8. **Statusrapporten viser et øyeblikksbilde.** Seksjonsdataene lagres ved publisering, slik andre
   seksjoner gjør i dag (`persistSectionDataAttachmentFileName`).
9. **Direkte listelesing, ikke søk.** Endringer vises med en gang.
10. **DFØ er standard.** Kommunene er ikke bundet av DFØs veileder, men den er den nasjonale referansen og
    passer godt sammen med Prosjektveiviseren. Den utvidede modellen er et tillegg, ikke et alternativ.
11. **Dokumentene lages fra dataene.** Nytteoversikten, nyttekartet og nytterealiseringsplanen er
    visninger av listene. Det finnes ingen egen plan å vedlikeholde, og ingen kopi som kan bli utdatert.
12. **Sjekklisten er inngangen til registreringen.** Brukeren starter med det som mangler, ikke med et
    tomt skjema. Det gjør registreringen kortere og tydeligere for prosjekter som er nye i nyttestyring.
13. **Nytte og kostnad i samme liste.** Kostnadsvirkninger har egen farge og egen rolle på indikatorene
    (Kostnad), men ellers samme skjema, kjede og oppfølging.

### 6.4 Tilgang

Huben er i dag bare lesbar for prosjektmedlemmer. Unntaket er lister som allerede tar imot data fra
prosjektene, som Prosjektstatus og Tidslinjeinnhold.

- **Forslag:** Nyttelistene får samme tilgangsmodell som Prosjektstatus. Appen begrenser hva brukeren
  ser og redigerer til eget prosjekt og program. Versjonering slås på. Uten skrivetilgang vises appen i
  lesemodus med en forklaring.
- Kjedenivåer, berørte grupper, katalog og virksomhetens mål redigeres bare på huben. Effektmål og
  nytterealiseringsplanen redigeres på prosjektet eller programmet som eier dem.
- **Beslutning:** Holder dette, eller trengs skriving via en tjenestekonto (Power Automate eller Azure
  Function)? En tjenestekonto gir sterkere kontroll, men må driftes.

## 7. Overgang og migrering

### 7.1 Strategi: velg selv, og frivillig migrering

- Ved installasjon eller oppgradering opprettes hublistene alltid, med kjedemodellen **DFØ**.
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
   1. Endringsanalyse → Kjedeelementer på nivå `chg` (Nødvendige aktiviteter i DFØ-modellen).
   2. Nyttevirkninger, med type «Nytte».
   3. **Lenker** fra `GtChangeLookup`. Pilene får evidens «Ikke vurdert».
   4. Indikatorer, med rolle «Gevinst» og måletype «Målbane». `GtStartValue` blir nullpunktet.
   5. Målinger.

   Skriptet bygger en tabell fra gammel til ny ID per område, slik at oppslagene kobles riktig.
4. Beholder Opprettet, Endret, Opprettet av og Endret av (`UpdateOverwriteVersion`). Verken
   versjonshistorikk eller vedlegg kopieres.
5. Har `-WhatIf` (tørrkjøring) og lager en CSV-rapport med antall per område og avvik.
6. Hopper over elementer som allerede finnes, ut fra `GtBmMigratedFrom`.
7. Med `-DeprecateSourceLists`: tar de gamle listene ut av navigasjonen, lenker «Nytteoversikt» til appen
   og gjør listene skrivebeskyttet. Listene blir **ikke** slettet.

Skriptet lager ikke mål, effektmål, kostnadsvirkninger, berørte grupper, forutsetninger, evidens,
vurderinger, nytterealiseringsplaner eller katalog, fordi de ikke finnes i dag. Det er arbeid
virksomheten gjør etter migreringen. Sjekklisten viser hva som mangler per prosjekt.

## 8. Leveranse

Leveransen dekker hele modellen. Rekkefølgen sikrer at det som er dyrt å endre senere, kommer først:
datamodellen og de rene funksjonene.

| Steg | Innhold | Resultat |
|---|---|---|
| **0. Prototype og avklaring** | HTML-prototype med fiktive data. Gjennomgang med kunden. Begrepene er kontrollert mot DFØs veileder. | Avklarte flater, begreper og datamodell |
| **1. Datamodell og kjerne** | Alle hublister, innholdstyper og felt. Kjedenivåer med DFØ og Utvidet. `BenefitsService` og de rene funksjonene med enhetstester. | Grunnmur som tåler begge modellene |
| **2. Registrering og oppfølging** | Registrering for alle nivåer, med «Fører til», mål og hvem som blir berørt. Effektmål. Indikator med tre måletyper og nullpunkt. Målinger, vurderinger og oppfølging. Sjekklisten med knapper til det som mangler. | Prosjekter og programmer kan bygge og følge opp kjeder |
| **3. Visninger** | Oversikt med fase og forklaring, nyttekart i DFØ-form og utvidet form, matrise, virkning med vurderinger, mål, nytterealiseringsplan, nytteoversikt og styringsrapport | Ledelsen ser hvor kjeden holder og hvor den brister, og prosjektene har en plan som alltid er oppdatert |
| **4. Nivåene** | Webdeler for hub, program og prosjekt. Tildel. Katalog. Statusseksjonen med øyeblikksbilde. Innstillinger. | Samme app overalt, og nytte i statusrapporten |
| **5. Migrering og overgang** | Migreringsskript, bryter i Globale innstillinger, endringer i prosjektmalen og dokumentasjon | Overgangen er gjennomført hos dem som ønsker det |

Det som ikke kommer med i første versjon, avtales underveis. HTML-prototypen er rask å endre, mens den
samme funksjonaliteten i SPFx mot ekte data, med tilgangsstyring, testing og oppgradering, koster mer.

## 9. Beslutninger

1. **Tilgangsmodell** (6.4): Samme modell som Prosjektstatus, eller tjenestekonto?
2. **Standardmodell ved installasjon:** DFØ for alle, med Utvidet som et valg på huben? Forslaget er ja.
3. **Navn på nivåene:** Holder standardnavnene, eller trengs det en egen terminologipakke per sektor
   (kommune, stat)?
4. **Strategiske mål i PP365 eller fra en eksisterende kilde?** Forslaget er en enkel liste med mulighet
   for import.
5. **Nivåer for mål** (samfunnsmål, hovedmål, virksomhetsmål, effektmål) og **typer nyttevirkning**
   (dagens `GtGainsType`): Holder dette, eller skal `GtGainsType` erstattes av DFØs inndeling (nytte eller
   kostnad, prissatt eller ikke)?
7. **Berørte grupper:** Holder én felles liste på huben, eller trenger programmene egne målgrupper, for
   eksempel «hjemmeboende eldre med digital oppfølging»?
8. **Utskrift av planen:** Holder utskrift og PDF fra nettleseren, eller trengs eksport til Word?
6. **Prosjekter i andre hubber** (`initializeHubWebs`): utenfor omfang i første versjon?

## 10. Risiko

| Risiko | Tiltak |
|---|---|
| Modellen oppleves som for tung for vanlige prosjekter | DFØ er standard. Utvidet slås på bare der det trengs, og skjulte nivåer slås sammen. Sjekklisten viser én ting om gangen. |
| Listene passerer 5 000 elementer | Indekser fra start, filtrer alltid, bruk `getAllItems` med `$top` |
| Grafen blir uoversiktlig i store porteføljer | Filtrering per program og prosjekt, matrise som alternativ visning, og fokuskart per nyttevirkning |
| Prosjektmedlemmer redigerer andres data på huben | Begrensning i appen, versjonering, eventuelt tjenestekonto |
| Bidragsvurderingen blir en pen programfortelling | Svakeste pil vises i skjemaet. «Motstridende» er et eget valg. Påvirkningsfaktorer og bivirkninger synes i styringsrapporten. |
| Det finnes to sannheter i overgangsperioden | Bryteren i Globale innstillinger, og gamle datakilder merket som utgått |
| Migreringen bryter oppslag | Tabell fra gammel til ny ID, tørrkjøring og CSV-rapport, kan kjøres på nytt |
| Begrepene avviker fra DFØ eller Prosjektveiviseren | Kontrollert mot DFØs veileder. Der Prosjektveiviseren og DFØ bruker ulike ord (nytteeier), vises begge i hjelpeteksten. |
| Nytterealiseringsplanen oppleves som en rapport, ikke en plan | Det som må skrives, redigeres rett fra planen. Sjekklisten tar brukeren til det som mangler. |
