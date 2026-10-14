# Plan: «Vibe-prototype» av Nyttestyring (HTML)

> **Status 14.10.2026:** Bygget og utvidet med den konfigurerbare resultatkjeden (se løsningsforslaget).
> Fila er [`prototype/nyttestyring.html`](prototype/nyttestyring.html). Åpne den rett i nettleseren, den
> virker uten nett. Prototypen ligger i en statisk ramme med SharePoint og Prosjektportalen rundt.
>
> Hører til [løsningsforslaget](../nyttestyringsmodul.md). Formålet er å vise flatene på hub-,
> program- og prosjektnivå for Asker og andre interessenter med fiktive data, før det skrives
> SPFx-kode. Prototypen er en illustrasjon. Den skal aldri bli produksjonskode.

## 1. Mål for prototypen

- Gjøre det tydelig at det er **samme app på tre nivåer**, med ulike flater og dataomfang.
- Vise hele kjeden: leveranse, evne, effekt, nyttevirkning og mål, med indikatorer og målinger.
- Vise at **kjedemodellen kan konfigureres** (Enkel eller Utvidet) uten at dataene endres.
- Vise **pilene** som egne objekter: evidensstyrke, og forutsetninger og risikoer på pilene.
- Vise **bidragsvurdering** og en **styringsrapport** som ender i «hva må justeres».
- Gi en **følelse av registrering**: skjemaene fungerer, og nye målinger flytter kurven med en gang.
- Være et utgangspunkt for workshopen: alle ⚠-spørsmålene i løsningsforslaget skal kunne
  diskuteres med prototypen på skjermen.

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
  med en nedtrekksliste for hvilket program eller prosjekt. Den simulerer hvor webdelen står.
- **Statisk SharePoint- og PP-ramme:** suitebar, appmeny, hubnavigasjon, områdeoverskrift,
  kommandolinje og PP-footeren. Fiktiv virksomhet, ingen ekte logoer.
- **Appens navigasjonsskuff** (som IdeaModule):
  - Oversikt, Nyttekart, Matrise, Registrering og Oppfølging (alle nivå)
  - Katalog og Strategiske mål (alle nivå)
  - Styringsrapport (hub og program)
  - Tildel til prosjekter (program)
  - I statusrapporten (prosjekt)
  - Innstillinger (hub)
- Nyttevirkning og Indikator er detaljsider som åpnes fra listene.

## 4. Skjermbilder

Prioritet: **M** må med, **B** bør med, **K** kan med.

| # | Skjerm | Innhold og interaksjon |
|---|---|---|
| 1 | **Oversikt** | Forklaringen «Slik henger det sammen» med de aktive leddene og et eksempel fra dataene. Nøkkeltall. Nytteoppnåelse per prosjekt eller nyttevirkning. Forutsetninger og risikoer som må følges opp. Indikatorer med «Følg med» eller «Avvik», med rolle. |
| 2 | **Nyttekart** | Én kolonne per aktivt nivå. Strekene viser evidensstyrke: tykk for sterk, tynn for moderat, stiplet for svak og prikket for ikke vurdert. Bokstavmerker (A, R, U, P) for forutsetninger og risikoer, farget etter status. Hold over for å se kjeden. Klikk på en pil for å vurdere den. |
| 3 | **Matrise** | Én rad per nyttevirkning: mål, nyttevirkning med eier, effekter, evner, leveranser, forutsetninger og risikoer, indikatorer, svakeste pil og siste bidragsvurdering. Kopier som CSV. |
| 4 | **Nyttevirkning** | Fokuskart for kjeden, forventet bidrag, historikk for bidragsvurderinger med beslutninger, «Ny bidragsvurdering», indikatorer etter rolle, forutsetninger og risikoer gruppert etter type, og pilene med evidens. |
| 5 | **Indikator** | Kurve for målbane (med delmål), terskel (med skravert område utenfor grensen) eller følg med. Viser hva indikatoren måler, og hvilke nyttevirkninger og mål den henger sammen med. |
| 6 | **Registrering** | Én fane per aktivt nivå, pluss Nyttevirkninger, Indikatorer, Forutsetninger og risikoer, og Mål. «Fører til» lager pilene. Prosjektet kan peke inn i programmets kjede. Indikatorskjemaet har rolle og måletype. Skjemaet for forutsetninger tilpasser status etter type. |
| 7 | **Oppfølging** | Målinger som forfaller, og vurderinger som skal gjøres: bidragsvurderinger og forutsetninger eldre enn seks måneder. |
| 8 | **Styringsrapport** | Mål → nyttevirkninger og bidrag → antakelser → risikoer og bivirkninger → hva må justeres. |
| 9 | **Strategiske mål** | Måltre med kontekstindikatorer, nyttevirkningene som bidrar og indikatorene deres. |
| 10 | **Tildel** | Prosjektenes leveranser i programmets kjede, og fordeling i prosent for tallfestede gevinster. |
| 11 | **Katalog** og **Statusseksjon** | Som før. Statusseksjonen viser rolle per indikator. |
| 12 | **Innstillinger** | Velg Enkel eller Utvidet, gi nivåene nye navn eller skru dem av, og sett toleranse. Alle flater oppdateres med en gang. |

## 5. Fiktive data

Virksomheten er **Fjordvik kommune**. Den er oppdiktet. Navn på personer er fiktive.

**Strategiske mål (4, i to nivåer)**

- S1 «Enkel og tilgjengelig innbyggerservice»
  - S1.1 «80 % av henvendelsene løses digitalt innen 2028»
- S2 «Klimanøytral kommunal drift innen 2030»
- S3 «Effektiv ressursbruk og bærekraftig økonomi»
- S4 «Trygge og selvstendige innbyggere i eget hjem»

**Programmer og prosjekter (2 programmer, 6 prosjekter)**

| Program | Prosjekter |
|---|---|
| Digital innbyggerservice | Ny innbyggerportal · Digital byggesak · Chatbot for innbyggerdialog |
| Helse og omsorg 2030 | Velferdsteknologi i hjemmetjenesten · Digitalt tilsyn natt |
| Uten program | Elektrifisering av kommunal bilpark |

**Omfang og innhold:**

- 13 nyttevirkninger og 21 indikatorer med 6–21 målinger hver, fra 2024 til i dag. Indikatorene
  har ulike roller (gevinst, effekt, leveranse, antakelse, balanserende, kontekst) og alle tre
  måletypene.
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
løsningsforslaget: `elements`, `benefits`, `links`, `factors`, `indicators`, `measurements`,
`contributions` og `settings`.

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

## 7. Demomanus (8–10 minutter)

1. **Hub, Oversikt:** Gå gjennom «Slik henger det sammen»: fem ledd, og forutsetninger og risikoer på
   pilene.
2. **Innstillinger:** Bytt til **Enkel**. Kartet og registreringen får tre ledd, og ingen data
   forsvinner. Bytt tilbake til **Utvidet**.
3. **Nyttekart:** Hold over «Flere eldre bor hjemme …». Pek på den stiplede pilen fra effekt til
   gevinst, og merkene P og U på den.
4. **Nyttevirkning** («Flere eldre bor hjemme …»): Forventet bidrag. Bidragsvurderingen gikk fra svak til
   moderat. Indikatorene etter rolle:
   - innleggelser (Avvik),
   - responstid på varsler (antakelse, terskel),
   - ensomhet (balanserende).

   Registrer en ny bidragsvurdering.
5. **Matrise:** Samme data som tabell, «slik dere kjenner det fra gevinstmatrisen». Kopier til Excel.
6. **Program Helse og omsorg 2030, Styringsrapport:** Fra mål til «hva må justeres».
7. **Prosjekt Digital byggesak:** Oppfølging, så registrer en måling, og så statusseksjonen.
8. **Program Digital innbyggerservice, Tildel:** Tildel de siste 30 % til Digital byggesak.

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
- Begreper og nivåer for mål og typer nyttevirkning, se ⚠ i løsningsforslaget.
- Katalog og tildeling: er modellen med kopi og «bidrar til» intuitiv?
- Kjedemodell: holder Enkel og Utvidet, og er standardnavnene riktige?
- Bidragsvurdering: riktig skala og riktig takt (seks måneder)?
- Indikatorroller og måletyper: dekker de det dere måler i dag?
