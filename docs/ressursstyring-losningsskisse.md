# Ressursstyring i Prosjektportalen – løsningsskisse

*Utarbeidet for Lørenskog kommune*

## Bakgrunn

Lørenskog kommune har samlet ressursstyringen på tvers av flere avdelinger og trenger bedre oversikt over ressurssituasjonen i prosjektporteføljen. Behovet er ett verktøy som viser hvilke ressurser som er i bruk, hvem som er fullt belagt, hvilken kompetanse ressursene har, og som gjør det mulig å planlegge kommende perioder i de faste samlingsmøtene annenhver uke. Ressurskontoret skal kunne motta behov fra prosjektene, godkjenne dem og tildele personer, og prosjektene skal se sin egen ressurssituasjon i prosjektet. Det skal også være mulig å ta vare på et øyeblikksbilde av planen for senere sammenligning.

Prosjektportalen har i dag en ressursallokeringsmodul med en tidslinje på porteføljenivå. Den dekker ikke behovet for prosjektvisning, forespørsel og godkjenning, kobling mot prosjektets faser, kompetanse eller historikk. Vi foreslår derfor en ny ressursstyringsmodul som erstatter dagens modul.

## Løsningen i korte trekk

### Ett sentralt ressursregister

Alle ressursallokeringer i porteføljen samles i ett register i porteføljeområdet. Prosjektene melder inn behov, ressurskontoret behandler dem, og både portefølje og prosjekt leser fra samme kilde. Det gir øyeblikkelig oppdatering uten forsinkelse, ingen begrensning på antall allokeringer, og én plass å styre fra.

### Ukesoversikt per ressurs

Hovedvisningen er et rutenett med én rad per ressurs og én kolonne per uke, etter samme prinsipp som Dynamics 365 Project Operations. Hver celle viser ressursens samlede belastning i uken og antall allokeringer, for eksempel «83 % (2)». Fargen forteller situasjonen med et blikk:

- **Grønn** – ressursen er fullt belagt (100 %)
- **Gul** – ressursen har ledig kapasitet
- **Rød** – ressursen er overbelastet
- **Grå** – ressursen er utilgjengelig (fravær, permisjon)

Hver rad kan utvides til å vise de enkelte allokeringene som stolper over ukene, med prosjektnavn, rolle og belastning. Prosjektallokeringer og linjeoppgaver har ulik farge og mønster, og forespørsler som ikke er godkjent vises med stiplet ramme. En loddrett linje markerer dagens dato.

Visningen støtter både uke- og månedsoppløsning, navigering frem og tilbake i tid, «gå til i dag», søk etter ressurs og filtrering på rolle, avdeling, prosjekt, status og type. Som standard vises kun personer med aktive allokeringer i den valgte perioden, slik at listen holdes kort. Filteret kan slås av for å se hele ressurspoolen og finne ledige ressurser.

### Samme visning i prosjektet

Hvert prosjektområde får en egen side med samme rutenett, begrenset til prosjektets egne ressurser. Her kan prosjektleder melde inn nye behov og følge status på forespørslene.

### Behov, godkjenning og tildeling

Et prosjekt melder inn behov med rolle eller kompetanse, ønsket belastning i prosent, periode og eventuelt ønsket person. Behovet kan meldes fra prosjektet eller sentralt fra porteføljen. Ressurskontoret ser alle innmeldte behov samlet, godkjenner eller avviser dem med begrunnelse, og tildeler en konkret person. Ved tildeling får ressurskontoret opp aktuelle personer fra ressurspoolen sortert etter kompetansetreff og gjeldende belastning i perioden, slik at det er lett å se hvem som faktisk har kapasitet. Hvem som meldte behovet, hvem som godkjente og når, lagres på hver allokering.

### Kompetanse og ressurspool

En ressurspool i porteføljen holder oversikt over hvem som er tilgjengelig for prosjektarbeid, hvilke roller og kompetanser de har, hvilken avdeling de tilhører og hvilken kapasitet de har (for eksempel 100 % eller 50 %). Kompetanse vises på ressursraden i oversikten. Poolen kan vedlikeholdes manuelt eller hentes fra medlemmene i porteføljen eller en valgt gruppe.

### Kobling til prosjektets faser og tidslinje

En allokering knyttes først til et prosjekt. Deretter kan den knyttes til et element i prosjektets tidslinje, for eksempel en fase eller en milepæl. Man velger selv om allokeringen skal følge elementets datoer automatisk, slik at den flytter seg når fasen endres, eller om den skal ha egne datoer.

### Øyeblikksbilder

Oversikten kan når som helst eksporteres som bilde (PNG) eller Excel-fil. Excel-filen inneholder ett ark med belastning per ressurs per uke og ett ark med alle allokeringene. Dette gir et enkelt grunnlag for å sammenligne planlagt og faktisk allokering over tid, og for å dokumentere situasjonen ved hvert samlingsmøte.

## Roller

| Rolle | Kan |
|---|---|
| Alle med tilgang til porteføljen | Se ressursoversikten i portefølje og prosjekt |
| Prosjektleder / prosjekteier | Melde inn og endre egne behov, se prosjektets ressurssituasjon |
| Ressurskontoret | Godkjenne, avvise og tildele, redigere alle allokeringer, vedlikeholde ressurspoolen |

## Faseplan

**Fase 1 – Ny ressursstyringsmodul.** Sentralt register, ukesoversikt i portefølje og prosjekt, behov–godkjenning–tildeling, ressurspool med kompetanse, kobling til tidslinje, farger for linje og prosjekt, eksport til bilde og Excel. Overgang fra dagens modul med automatisk overføring av eksisterende allokeringer.

**Fase 2 – Historikk og kapasitet.** Lagring av øyeblikksbilder i porteføljen med sammenligning av planlagt og faktisk over tid, kapasitetsvisning per rolle og avdeling, og forvaltning av ressurspoolen direkte i verktøyet.

**Fase 3 – Assistent.** Ny porteføljeoperasjon i Prosjektportalens assistent som analyserer ressurssituasjonen: flaskehalser, roller med udekket behov, forespørsler som venter, og trender per fase.

## Innføring

1. Prosjektportalen oppgraderes til versjonen med ny ressursstyringsmodul.
2. Eksisterende ressursallokeringer i prosjektene overføres til det sentrale registeret. Ingen data slettes.
3. Ressurskontoret settes opp med riktige tilganger, og ressurspoolen fylles med roller og kompetanse.
4. Portefølje- og prosjektvisning konfigureres, og løsningen gjennomgås sammen i et arbeidsmøte med ressurskontoret og utvalgte prosjektledere.
5. Oppfølging etter de første samlingsmøtene med justeringer.

## Estimat

| Aktivitet | Timer |
|---|---|
| Oppgradering av Prosjektportalen | 8 |
| Overføring av eksisterende ressursallokeringer | 4 |
| Oppsett av ressurskontor, ressurspool og kompetanse | 6 |
| Konfigurasjon av portefølje- og prosjektvisning | 8 |
| Arbeidsmøte og opplæring | 6 |
| Oppfølging og justering etter oppstart | 8 |
| **Sum** | **40** |

Estimert 40 timer à NOK 1 753. **Tilbys til fastpris NOK 70 000 eks. mva., inkludert oppgradering av Prosjektportalen.**
