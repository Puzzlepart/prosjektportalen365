# Plan: «Vibe-prototype» av Nyttestyring (HTML)

> **Status 8.10.2026:** Bygget. Fila er [`prototype/nyttestyring.html`](prototype/nyttestyring.html).
> Åpne den rett i nettleseren, den virker uten nett. Alle skjermene i kapittel 4 er med, også
> «kan med»-skjermene (kopier som CSV og lesemodus).
>
> Hører til [løsningsforslaget](../nyttestyringsmodul.md). Formålet er å vise flatene på hub-,
> program- og prosjektnivå for Asker og andre interessenter med fiktive data, før det skrives
> SPFx-kode. Prototypen er en illustrasjon. Den skal aldri bli produksjonskode.

## 1. Mål for prototypen

- Gjøre det tydelig at det er **samme app på tre nivåer**, med ulike flater og dataomfang.
- Vise hele kjeden: mål, nyttevirkning, indikator, måling og kurve mot målbanen.
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
- **SharePoint-lignende ramme:** områdetittel («Fjordvik kommune – Prosjektportalen», «Program
  Digital innbyggerservice», «Ny innbyggerportal») og en enkel venstremeny.
- **Appens navigasjonsskuff** (som IdeaModule):
  - Oversikt
  - Nyttekart
  - Registrering
  - Oppfølging
  - Katalog
  - Strategiske mål
  - Tildel (bare på program)
  - Statusrapport-forhåndsvisning (bare på prosjekt)

## 4. Skjermbilder

Prioritet: **M** må med, **B** bør med, **K** kan med.

| # | Skjerm | Pri | Innhold og interaksjon |
|---|---|---|---|
| 1 | **Oversikt** (alle nivå) | M | 4 nøkkeltallkort (nyttevirkninger, andel i rute, målinger som forfaller, antagelser som ikke er vurdert). Stolpediagram over oppnåelse per prosjekt (hub og program) eller per nyttevirkning (prosjekt). Tabell med avvik og kritiske indikatorer. På program: bryteren «Programmet / Alle prosjekter». |
| 2 | **Indikatordetalj** | M | Linjediagram med målbanen fra start til mål (stiplet), delmål (punkter), faktiske målinger (heltrukket), målverdi (horisontal linje) og «i dag»-markør. Statusmerke. Tabell over målinger. Antagelsene som gjelder. Knappen «Registrer måling». |
| 3 | **Oppfølging** | M | Arbeidsliste sortert på forfall («Forfalt», «Denne måneden», «Senere»). Rask registrering i en skuff. Kurven og statusen oppdateres med en gang. |
| 4 | **Registrering** | M | Faner for Mål, Endringer, Nyttevirkninger, Indikatorer og Antagelser. Hver fane har en tabell og et skjema i skuff. Eierprosjekt er en nedtrekksliste på huben og et låst felt på prosjektet, med teksten «Lagres i Prosjektportalen (hub)». |
| 5 | **Statusseksjon** (prosjekt) | M | Mockup av prosjektstatus der seksjonen «Nytteoppnåelse» erstattes: vurdering (grønn/gul/rød) med kommentar, og kompakte indikatorrader med minikurve. Merket «Øyeblikksbilde per 30.09.2026». |
| 6 | **Katalog** | B | Kort for gjenbrukbare nyttevirkninger og indikatorer. Brukstall («brukt i 5 prosjekter»). «Ta i bruk i prosjekt…» lager en kopi og viser referansen. |
| 7 | **Nyttekart** | B | Tre kolonner i SVG: Endringer → Nyttevirkninger → Strategiske mål, med kurvede lenker. Antagelser som små merker på lenkene (farge etter status). Hover framhever kjeden. Klikk åpner detaljer. |
| 8 | **Strategiske mål** | B | Måltre med samlet oppnåelse per mål og antall bidragende prosjekter |
| 9 | **Tildel** (program) | B | Programmets nyttevirkning til venstre, prosjektene til høyre. Velg prosjekter og sett bidrag (for eksempel 40/30/30 % av målverdien). Bidragene vises i Oversikt under «Alle prosjekter». |
| 10 | Eksport til Excel (CSV) | K | Viser at dataene er lette å rapportere fra |
| 11 | Lesemodus | K | Bryteren «Simuler bruker uten skrivetilgang» skjuler redigering og viser en forklaring |

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

- Omtrent 12 nyttevirkninger, 16 indikatorer og 6–14 målinger per indikator, fra 2025 til i dag.
- Spredningen er valgt med vilje:

  | Status | Antall indikatorer |
  |---|---|
  | I rute | 8 |
  | Avvik | 4 |
  | Kritisk | 2 |
  | Ingen målinger ennå | 2 |

- Eksempler på indikatorer:

  | Indikator | Fra | Mål |
  |---|---|---|
  | Andel byggesøknader levert digitalt | 35 % | 90 % |
  | Gjennomsnittlig saksbehandlingstid byggesak | 54 dager | 21 dager (minkende) |
  | Antall telefonhenvendelser til servicetorget per måned | 6 200 | 3 500 |
  | CO₂-utslipp fra bilparken | 410 tonn i året | 120 tonn |
  | Spart reisetid hjemmetjenesten | 0 timer | 4 000 timer i året |
  | Andel brukere som oppgir økt trygghet | kvalitativ, prosent fra spørreundersøkelse | |

- **Antagelser (8):**
  - Status: 5 «Holder», 2 «Usikker» og 1 «Holder ikke». Den siste er «Innbyggerne over 75 tar i
    bruk innbyggerportalen», med lenke fra Ny innbyggerportal til S1.1.
  - 2 antagelser er ikke vurdert på over 6 måneder.
- **Katalog:** 3 nyttevirkninger med indikatorer som er gjenbrukt i flere prosjekter, for eksempel
  «Redusert manuell saksbehandling (timer/år)».
- **Tildeling:** én programnyttevirkning («Færre telefonhenvendelser til servicetorget») som er
  fordelt på to av de tre prosjektene i Digital innbyggerservice (40 % og 30 %). Digital byggesak
  står igjen, så tildelingen kan vises live i demoen.

Dataene ligger i ett `const SEED = {...}`-objekt øverst i filen, med samme feltnavn som i
løsningsforslaget (`GtStartValue`, `GtBmDirection` og så videre). Prototypen dokumenterer da
datamodellen samtidig.

## 6. Beregninger (samme som i produktet)

Lag dem som rene funksjoner. De kan portes nesten direkte til `shared-library`.

| Funksjon | Hva den gjør |
|---|---|
| `achievement(indicator, value)` | `(value − start) / (target − start)`, avgrenset til 0–100 % for visning (rå verdi i tooltip) |
| `plannedValueAt(indicator, date)` | Lineær målbane mellom start og mål, eller stykkevis lineær via `GtBmMilestones` |
| `status(indicator, measurement)` | Avviket mellom faktisk verdi og målbanen på samme dato, mot toleransen i innstillinger (standard 10 %) |
| `nextDue(indicator)` | Siste måling pluss frekvensen |
| `rollup(...)` | Oppnåelse per nyttevirkning, prosjekt og mål, som snitt av indikatorene, vektet likt i prototypen |

## 7. Demomanus (5–7 minutter)

1. **Hub, Oversikt:** «Slik ser porteføljen ut». To prosjekter er røde. Klikk på
   «Digital byggesak».
2. **Indikatordetalj** for saksbehandlingstid: Kurven ligger over målbanen. Vis antagelsen
   «Saksbehandlerne får opplæring før go-live» med status «Usikker».
3. **Bytt til Prosjekt** (Digital byggesak), **Oppfølging**: Registrer måling for september.
   Kurven og statusen flytter seg med en gang. Pek på teksten «lagres på huben».
4. **Statusseksjon:** «Dette er det styringsgruppa ser i statusrapporten».
5. **Bytt til Program** (Digital innbyggerservice): Bryteren «Programmet / Alle prosjekter».
   **Tildel**: Tildel de siste 30 % av «Færre telefonhenvendelser» til Digital byggesak.
6. **Hub, Katalog:** «Ta i bruk» i Chatbot-prosjektet.
7. **Nyttekart og Strategiske mål:** Antagelsen som ikke holder lyser rødt i kjeden fram til S1.1.
   Avslutt med spørsmålene til workshopen.

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
- Antagelser: nyttig eller for mye i V1?
