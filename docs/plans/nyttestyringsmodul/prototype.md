# Plan: «Vibe-prototype» av Nyttestyring (HTML)

> **Status 15.10.2026:** Bygget, utvidet med den konfigurerbare resultatkjeden og lagt tett opp til DFØs
> veileder om nyttestyring: DFØ-nyttekart som standard, kostnadsvirkninger, effektmål, hvem som blir
> berørt, nytterealiseringsplan, nytteoversikt og sjekkliste per fase (se løsningsforslaget).
> Fila er [`prototype/nyttestyring.html`](prototype/nyttestyring.html). Åpne den rett i nettleseren, den
> virker uten nett. Prototypen ligger i en statisk ramme med SharePoint og Prosjektportalen rundt.
>
> Hører til [løsningsforslaget](../nyttestyringsmodul.md). Formålet er å vise flatene på hub-,
> program- og prosjektnivå for Asker og andre interessenter med fiktive data, før det skrives
> SPFx-kode. Prototypen er en illustrasjon. Den skal aldri bli produksjonskode.

## 1. Mål for prototypen

- Gjøre det tydelig at det er **samme app på tre nivåer**, med ulike flater og dataomfang.
- Vise hele kjeden: tiltak, hvem som blir berørt, nytte- og kostnadsvirkninger, effektmål og samfunnsmål,
  med indikatorer og målinger. I den utvidede modellen også leveranse, evne og effekt.
- Vise at **kjedemodellen kan konfigureres** (DFØ eller Utvidet) uten at dataene endres.
- Vise at **nytterealiseringsplanen, nytteoversikten og sjekklisten** lages fra dataene og alltid er
  oppdatert.
- Vise **pilene** som egne objekter: evidensstyrke, og forutsetninger og risikoer på pilene.
- Vise **vurderinger og evalueringer** og en **styringsrapport** som ender i «videreføre, justere eller
  avslutte».
- Gi en **følelse av registrering**: skjemaene fungerer, og nye målinger flytter kurven med en gang.
- Være et utgangspunkt for workshopen: beslutningene i løsningsforslaget skal kunne diskuteres med
  prototypen på skjermen.

**Ikke med:** pålogging, SharePoint, ekte tilgangsstyring, migrering og responsiv finpuss utover
at det fungerer på en bærbar.

## 2. Teknisk ramme

| Valg | Begrunnelse |
|---|---|
| **Én selvstendig `.html`-fil** | Kan sendes på e-post, legges i Teams eller publiseres som privat artifact. Ingen bygging. |
| **Ingen avhengigheter.** Ren JS og CSS, grafer i inline SVG. | Virker uten nett og fra fil, og ingen CDN-versjon kan endre seg underveis |
| **Utseende som Fluent v9**: Segoe UI, tokens for farger, avstand og radius, kort, faner og skuff | Skal ligne PP365 etter migreringen til Fluent v9. Ikke en piksel-kopi. |
| **Tilstand i minnet, speilet til `localStorage`** (med try/catch) | Registreringer overlever en sideoppdatering under demo. Knappen «Tilbakestill demodata» sletter dem. |
| **Ruting via `#hash`** (`#hub-oversikt`, `#p2-indikator-I4`) | Lenker kan deles, og det speiler `setUrlHash` i ekte kode |
| **Lys og mørk modus** via `prefers-color-scheme` | Billig å få med |

Anslått størrelse er 1 500–2 500 linjer. Bygges i én økt med Claude, så finpusses det i et par
runder etter tilbakemelding.

## 3. Rammen rundt appen

- **Nivåvelger øverst** (demolinje som ikke er en del av appen): «Vis som: Hub / Program / Prosjekt»,
  med en nedtrekksliste for hvilket program eller prosjekt. Den simulerer hvor webdelen står. Ved siden av
  står en bryter for kjedemodell (DFØ eller Utvidet), så modellene kan sammenlignes i demoen.
- **Statisk SharePoint- og PP-ramme:** suitebar, appmeny, hubnavigasjon, områdeoverskrift,
  kommandolinje og PP-footeren. Fiktiv virksomhet, ingen ekte logoer.
- **Appens navigasjonsskuff** (som IdeaModule). Alle punktene er steder, navngitt som substantiver:

  | Hub | Program | Prosjekt |
  |---|---|---|
  | Oversikt | Oversikt (med fase og sjekkliste) | Oversikt (med fase og sjekkliste) |
  | Til oppfølging (tall) | Til oppfølging (tall) | Til oppfølging (tall) |
  | Nyttekart | Nyttekart | Nyttekart |
  | Mål | Mål | Mål |
  | | Nytterealiseringsplan | Nytterealiseringsplan |
  | Styringsrapport | Styringsrapport | |
  | | Prosjektenes bidrag | |
  | *Felles grunnlag:* Katalog | *Felles grunnlag:* Katalog | *Felles grunnlag:* Katalog |
  | Innstillinger | | |

- **Nyttekart** samler tre visninger av samme kjede i faner: **Kart · Matrise · Liste**. Liste har én
  underfane per type, og det er her man registrerer.
- **Til oppfølging** viser et tall for det som er forfalt.
- **Nytterealiseringsplan** har tre faner: **Nytterealiseringsplan · Nytteoversikt (DFØ) · Sjekkliste for
  fasen**.
- Virkning og Indikator er detaljsider. Statusseksjonen ligger på Prosjektstatus-siden i produktet.
  I prototypen åpnes den fra prosjektets oversikt («Slik vises dette i statusrapporten»).

## 4. Skjermbilder

Prioritet: **M** må med, **B** bør med, **K** kan med.

| # | Skjerm | Innhold og interaksjon |
|---|---|---|
| 1 | **Oversikt** | På program og prosjekt: nyttestyringsfasen etter DFØ og sjekklisten, med neste oppgave og «Fiks nå». Forklaringen «Slik henger det sammen» med de aktive leddene og et eksempel fra dataene. Nøkkeltall (nytte og kostnad hver for seg). Nytteoppnåelse per prosjekt eller virkning. Forutsetninger og risikoer som må følges opp. Indikatorer med «Følg med» eller «Avvik», med rolle. |
| 2 | **Nyttekart › Kart** | DFØ-modellen: kolonnene Tiltak, Hvem blir berørt?, Nytte- og kostnadsvirkninger, Effektmål og Samfunnsmål. Utvidet modell: én kolonne per aktivt nivå, deretter virkninger, effektmål og samfunnsmål. Kostnadsvirkninger har egen farge og stiplet kant. Strekene viser evidensstyrke. Bokstavmerker (A, R, U, P) for forutsetninger og risikoer, farget etter status. Hold over for å se kjeden. Klikk på en pil for å vurdere den, og på et tiltak for å åpne planen. |
| 3 | **Nyttekart › Matrise** | Én rad per virkning: strategisk mål, effektmål, virkning (nytte eller kostnad, verdi, eier), hvem som blir berørt, ledd før virkningen, forutsetninger og risikoer, indikatorer, svakeste pil og siste vurdering. Kopier som CSV. |
| 4 | **Virkning** | Type, prissatt eller ikke, og hvem som blir berørt. Fokuskart for kjeden, forventet bidrag, historikk for vurderinger og evalueringer med anbefaling og beslutning, «Ny vurdering», indikatorer etter rolle, forutsetninger og risikoer gruppert etter type, og pilene med evidens. |
| 5 | **Indikator** | Kurve for målbane (med delmål), terskel (med skravert område utenfor grensen) eller følg med. Viser nullpunktet, hva indikatoren måler, og hvilke virkninger, effektmål og mål den henger sammen med. |
| 6 | **Nyttekart › Liste** | Én fane per type: nødvendige aktiviteter (DFØ) eller aktive nivåer (Utvidet), Nytte- og kostnadsvirkninger, Indikatorer, og Forutsetninger og risikoer. «Fører til» og «Bidrar til mål» lager pilene. Prosjektet kan peke inn i programmets kjede. Virkningsskjemaet har nytte eller kostnad, prissatt, anslått verdi og hvem som blir berørt. |
| 7 | **Til oppfølging** | Målinger som forfaller, og vurderinger som skal gjøres: vurderinger og forutsetninger eldre enn seks måneder. |
| 8 | **Mål** | Effektmål for prosjektet eller programmet (kan legges til og redigeres der), og samfunnsmål og strategiske mål med kontekstindikatorer, virkningene som bidrar og indikatorene deres. |
| 9 | **Nytterealiseringsplan** | DFØs åtte punkter, satt sammen av dataene, med «Ikke avklart» og «Mangler» der noe mangler. «Rediger bakgrunn og roller», «Planlegg evaluering» og utskrift eller PDF. |
| 10 | **Nytteoversikt (DFØ)** | DFØs tabell: prissatte og ikke-prissatte nytte- og kostnadsvirkninger, indikatorer, hvem som blir berørt og når virkningen oppstår. Kopier som CSV. |
| 11 | **Sjekkliste for fasen** | DFØs sjekklister for fase 1–4, sjekket mot dataene. Etterslep fra tidligere faser er merket. «Fiks» åpner riktig skjema eller liste. |
| 12 | **Styringsrapport** | Mål → nytte- og kostnadsvirkninger → antakelser → risikoer og bivirkninger → videreføre, justere eller avslutte. |
| 13 | **Prosjektenes bidrag** | Prosjektenes leveranser i programmets kjede, og fordeling i prosent for tallfestede gevinster. |
| 14 | **Katalog** og **Statusseksjon** | Som før. Statusseksjonen viser rolle per indikator. |
| 15 | **Innstillinger** | Velg DFØ eller Utvidet, gi nivåene nye navn eller skru dem av, rediger listen over berørte grupper og sett toleranse. Alle flater oppdateres med en gang. |

## 5. Fiktive data

Virksomheten er **Fjordvik kommune**. Den er oppdiktet. Navn på personer er fiktive.

**Samfunnsmål og strategiske mål (5, i to nivåer)**

- S1 «Enkel og tilgjengelig innbyggerservice»
  - S1.1 «80 % av henvendelsene løses digitalt innen 2028»
- S2 «Klimanøytral kommunal drift innen 2030»
- S3 «Effektiv ressursbruk og bærekraftig økonomi»
- S4 «Trygge og selvstendige innbyggere i eget hjem»

**Effektmål (6)**, eid av programmer og prosjekter, for eksempel «Rask og forutsigbar
byggesaksbehandling» (Digital byggesak) og «Eldre mestrer hverdagen hjemme lenger» (Helse og omsorg 2030).
Hvert effektmål peker opp til ett eller to samfunnsmål.

**Programmer og prosjekter (2 programmer, 6 prosjekter)**

| Program | Prosjekter |
|---|---|
| Digital innbyggerservice | Ny innbyggerportal · Digital byggesak · Chatbot for innbyggerdialog |
| Helse og omsorg 2030 | Velferdsteknologi i hjemmetjenesten · Digitalt tilsyn natt |
| Uten program | Elektrifisering av kommunal bilpark |

**Omfang og innhold:**

- 13 nyttevirkninger og 4 kostnadsvirkninger, og 25 indikatorer med 6–21 målinger hver, fra 2024 til i
  dag. Indikatorene har ulike roller (gevinst, kostnad, effekt, leveranse, antakelse, balanserende,
  kontekst) og alle tre måletypene. Hver virkning sier hvem som blir berørt, om den er prissatt og
  eventuelt en anslått verdi.
- **Nytterealiseringsplaner** for alle prosjekter og programmer, med problem, tiltak, lønnsomhet,
  ressurser, involvering, ansvar for målinger og evalueringer, og planlagte evalueringer. Digital byggesak
  mangler med vilje evalueringsplan og en indikator for kostnadsvirkningen, så sjekklisten har noe å vise.
- **En komplett utvidet kjede** i Helse og omsorg 2030, bygget på et generelt eksempel om digital
  hjemmeoppfølging:
  - Leveranser: digital hjemmeoppfølging, sensorbasert nattilsyn og innsatsteam.
  - Evner: responssenteret oppdager forverring tidlig, og mestringsorientert oppfølging.
  - Effekter: forverring håndteres tidligere, og flere opplever trygghet.
  - Nyttevirkning: «Flere eldre bor hjemme uten omfattende tjenester».
  - Mål: trygge innbyggere i eget hjem, og effektiv ressursbruk.

  Kjeden har svake piler, en risiko som er høy, en negativ bivirkning som fanges opp av en balanserende
  indikator, en påvirkningsfaktor (endret innleggelsespraksis) og to bidragsvurderinger.
- De andre prosjektene har enklere kjeder, slik de ville sett ut etter migrering, med noen leveranser og
  effekter lagt til.

- Eksempler på indikatorer:

  | Indikator | Fra | Mål |
  |---|---|---|
  | Andel byggesøknader levert digitalt | 35 % | 90 % |
  | Gjennomsnittlig saksbehandlingstid byggesak | 54 dager | 21 dager (minkende) |
  | Antall telefonhenvendelser til servicetorget per måned | 6 200 | 3 500 |
  | CO₂-utslipp fra bilparken | 410 tonn i året | 120 tonn |
  | Spart reisetid hjemmetjenesten | 0 timer | 4 000 timer i året |
  | Andel brukere som oppgir økt trygghet | kvalitativ, prosent fra spørreundersøkelse | |

- **Forutsetninger og risikoer (17):** 11 antakelser, 3 risikoer, 2 utilsiktede virkninger og 1
  påvirkningsfaktor. Flere er ikke vurdert på over seks måneder.
- **Katalog:** 3 nyttevirkninger med indikatorer som er gjenbrukt i flere prosjekter, for eksempel
  «Redusert manuell saksbehandling (timer/år)».
- **Tildeling:** én programnyttevirkning («Færre telefonhenvendelser til servicetorget») som er
  fordelt på to av de tre prosjektene i Digital innbyggerservice (40 % og 30 %). Digital byggesak
  står igjen, så tildelingen kan vises live i demoen.

Dataene bygges i `buildSeed()` øverst i skriptet, med samme struktur som datamodellen i
løsningsforslaget: `goals`, `elements`, `benefits`, `links`, `factors`, `indicators`, `measurements`,
`contributions`, `plans` og `settings`.

## 6. Beregninger (samme som i produktet)

Lag dem som rene funksjoner. De kan portes nesten direkte til `shared-library`.

| Funksjon | Hva den gjør |
|---|---|
| `achievement(indicator, value)` | `(value − start) / (target − start)`, avgrenset til 0–100 % for visning (rå verdi i tooltip) |
| `plannedValueAt(indicator, date)` | Lineær målbane mellom start og mål, eller stykkevis lineær via `GtBmMilestones` |
| `statusAt(indicator, measurement)` | Målbane: avviket fra banen på samme dato. Terskel: avstanden til grensen. Følg med: vurderes ikke. Toleransen settes i innstillinger (standard 10 %). |
| `closure`, `chainOf` | Alt oppstrøms og nedstrøms for et element i grafen |
| `effectiveEdges` | Slår sammen piler gjennom skjulte nivåer og gir dem den svakeste evidensen på veien |
| `weakestEvidence` | Svakeste pil i en kjede |
| `nextDue(indicator)` | Siste måling pluss frekvensen |
| `rollup(...)` | Oppnåelse per nyttevirkning, prosjekt og mål, som snitt av indikatorene, vektet likt i prototypen |
| `dfoPhase(fase)` | Fra prosjektfase (Prosjektveiviseren) til nyttestyringsfase (DFØ) |
| `checklist()` | DFØs sjekkliste per fase, med hva som mangler og hvor det rettes |

## 7. Demomanus (10–12 minutter)

1. **Hub, Nyttekart:** DFØs nyttekart med Fjordviks data: tiltak, hvem som blir berørt, nytte- og
   kostnadsvirkninger, effektmål og samfunnsmål. Pek på kostnadsvirkningene og bokstavmerkene på pilene.
2. **Bytt kjedemodell til Utvidet** i demolinjen. Kartet får leveranser, evner og effekter, og ingen data
   forsvinner. Bytt tilbake til **DFØ**.
3. **Prosjekt Digital byggesak, Oversikt:** Fase 3 av 4 og «11 av 17 på plass». Trykk «Fiks nå» og legg
   inn det som mangler. Telleren går opp.
4. **Nytterealiseringsplan:** De åtte punktene, laget fra dataene. Vis «Ikke avklart» under roller og
   «Planlegg evaluering». Skriv ut som PDF. Bytt til **Nytteoversikt (DFØ)**: samme tabell som i DFØs mal.
5. **Mål:** Prosjektets effektmål og samfunnsmålene de bidrar til. Legg til et effektmål.
6. **Program Helse og omsorg 2030, virkningen «Flere eldre bor hjemme …»:** Underveisevalueringen med
   anbefalingen «Justere». Indikatorene etter rolle: innleggelser (Avvik), responstid på varsler
   (antakelse, terskel) og ensomhet (balanserende). Registrer en ny vurdering.
7. **Styringsrapport** for programmet: fra mål til «videreføre, justere eller avslutte».
8. **Nyttekart › Matrise:** Samme data som tabell, «slik dere kjenner det fra gevinstmatrisen». Kopier
   til Excel.

## 8. Arbeidsplan

1. **Skall:** ramme, nivåvelger, skuff, hash-ruting, tokens, lys og mørk modus, demodata og
   beregninger.
2. **Kjernen:** skjerm 1, 2 og 3 med SVG-grafer for linjer, stolper og minikurver.
3. **Registrering og statusseksjon:** skjerm 4 og 5.
4. **B-skjermene:** skjerm 6–9.
5. **Gjennomgang:**
   - Følg demomanuset ende til ende.
   - Sjekk på 1280 og 1920 px.
   - Sjekk mørk modus.
   - Sjekk at tilbakestilling fungerer.
   - Sjekk at fila er selvstendig: ingen eksterne kall, og nettverksfanen er tom.
6. **Publisering:** Legg fila i `docs/plans/nyttestyringsmodul/prototype/nyttestyring.html` og
   publiser den som privat artifact. Lenken deles med Asker når vi selv bestemmer det.

## 9. Hva workshopen skal svare på

- Treffer nivåene og flatene hvordan Asker faktisk jobber? Hvem registrerer, og hvor?
- Er indikatordetaljen og statusseksjonen nok for styringsgruppa?
- Er DFØ-modellen riktig standard for kommunene, og er nytterealiseringsplanen nyttig slik den lages?
- Begreper og nivåer for mål og typer virkning: skal `GtGainsType` erstattes av DFØs inndeling?
- Berørte grupper: én felles liste, eller egne målgrupper per program?
- Sjekklisten: er oppgavene riktige, og gjør den registreringen enklere?
- Katalog og tildeling: er modellen med kopi og «bidrar til» intuitiv?
- Kjedemodell: holder DFØ og Utvidet, og er standardnavnene riktige?
- Vurderinger: riktig skala, riktige spørsmål og riktig takt (seks måneder)?
- Indikatorroller og måletyper: dekker de det dere måler i dag?
