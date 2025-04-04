# Endringslogg

Sjekk ut [release notes](./releasenotes/1.11.0.md) for høydepunkter og mer detaljert endringslogg for siste hovedversjon.

## 1.11.0 - 26.03.2025

### Ny funksjonalitet

- Lagt til instrumentvisning for 'Siste måling' på Gevinstoversikt [#1572](https://github.com/Puzzlepart/prosjektportalen365/issues/1572)
- Ny webdel `Idémodul` for visning av idéer (registrering/behandling) samt feltkonfigurasjon slik at relevant data fra idéregistreringen kan videreføres til behandling [#1573](https://github.com/Puzzlepart/prosjektportalen365/issues/1573)
- Lagt til mulighet for egendefinerte farger på fasene i fasevelgeren [#1613](https://github.com/Puzzlepart/prosjektportalen365/issues/1613)
- Prosjektportalen assistent, forberendende funksjonalitet for kunstig intelligens.

### Forbedringer

- Forbedret feilhåndtering for redigeringspanel for statusrapport [#1578](https://github.com/Puzzlepart/prosjektportalen365/issues/1578)
- Forbedret feilhåndtering for provisjonering av Planner-oppgaver [#1593](https://github.com/Puzzlepart/prosjektportalen365/issues/1593)
- Støtte for frikoblet Porteføljeoversikt [#1599](https://github.com/Puzzlepart/prosjektportalen365/issues/1599)
- Støtte for å inkludere/eksludere tidskomponentene fra datofelter i aggregerte oversikter [#1575](https://github.com/Puzzlepart/prosjektportalen365/issues/1575)
- Footer tar nå mindre plass, samt støtte for minimering og skjuling av footer på globalt nivå [#1586](https://github.com/Puzzlepart/prosjektportalen365/issues/1586)
- Støtte for 24 og 36 mnd for tidsramme i Prosjekttidslinjen [#1448](https://github.com/Puzzlepart/prosjektportalen365/issues/1448)
- Viser nå antall prosjekter i Porteføljeoversikten [#1483](https://github.com/Puzzlepart/prosjektportalen365/issues/1483)
- Ny fasetype `Ferdigstillelsesfase` og mulighet for å gjøre sjekkpunkter obligatoriske [#1590](https://github.com/Puzzlepart/prosjektportalen365/issues/1590)
- Støtte for å definere en initiell (skjult) fase før prosjektet går inn i `Konsept`-fasen for å gjennomgå sjekkpunkter når fase angis for prosjektet [#1616](https://github.com/Puzzlepart/prosjektportalen365/issues/1616)
- Mulighetsmatrise har fått samme tilpasningsmuligheter som Risikomatrise, inkluderer overstyring av farger og konfigurasjon
- Forbedret prosjektstatus siden slik at det er tydeligere hva som er publisert og når. Samt bedre indikasjon på kladd. I tillegg er det gjort en rekke forbedringer på opprettelse, publisering og redigering av prosjektstatus, slik at man unngår å måtte laste inn side på nytt for å se endringer alle elementer på siden. [#1574](https://github.com/Puzzlepart/prosjektportalen365/issues/1574)
- Mulighet for to-veis synkronisering av felter i prosjektinformasjonen. Nye felter som legges til på portefølje synkroniseres opp til prosjektene. NB! Krever synkronisering av prosjektinformasjon for at nye felter kommer med.

### Feilrettinger

- Boolean felttyper vises nå riktig, og filtreres korrekt [#1579](https://github.com/Puzzlepart/prosjektportalen365/issues/1579)
- Prosentkolonner sorteres nå riktig i aggregerte oversikter [#1581](https://github.com/Puzzlepart/prosjektportalen365/issues/1581)
- Fikset et problem hvor skjuling/synliggjøring av visningvelger ikke ble lagret korrekt [#1560](https://github.com/Puzzlepart/prosjektportalen365/issues/1560)
- Rettet et problem dersom brukeren gikk for raskt gjennom fasesjekkpunktene så ble det ikke registrert [#1609](https://github.com/Puzzlepart/prosjektportalen365/issues/1609)
- Rettet et problem hvor menyer i porteføljeoversikt og aggregerte oversikter havnet utenfor skjermen [#1540](https://github.com/Puzzlepart/prosjektportalen365/issues/1540)
- Dersom det var flere enn 16 sjekkpunkter så havnet disse utenfor "Endre til fase..."-dialogen. [#1607](https://github.com/Puzzlepart/prosjektportalen365/issues/1607)
- Rettet et problem hvor programvisninger forble aktive selvom visningsvelgeren ble skrudd av [#1566](https://github.com/Puzzlepart/prosjektportalen365/issues/1566)

## 1.10.0 - 23.09.2024

NB: Som en del av denne versjonen kreves det godkjenning av en ny app-registrering ved installasjon eller oppgradering av Prosjektportalen 365. Dette skyldes at den tidligere PnP Management Shell-appen ikke lenger er tilgjengelig. Appen må godkjennes av en Global Administrator eller Application Administrator. Godkjenningsprosessen vil automatisk starte ved installasjon. Merk at oppdateringer og installasjoner nå må gjøres med PowerShell 7 eller nyere. [Les mer om dette her](https://github.com/Puzzlepart/prosjektportalen365/blob/main/releasenotes/1.10.0.md#overgang-til-nyeste-pnp-powershell)

### Ny funksjonalitet

- Overgang til PnP PowerShell 2.12.0 og endringer på autentisering mot Microsoft 365 [#1226](https://github.com/Puzzlepart/prosjektportalen365/issues/1226)
- Lagt til muligheten for et summeringsfelt i prosjektstatusseksjoner, denne kan summere eller finne gjennomsnitt av verdier basert på en kolonne i en liste- eller usikkerhetsseksjon [#1485](https://github.com/Puzzlepart/prosjektportalen365/issues/1485)
- Lagt til mulighet for å legge til eller endre valg og verdier for idémodul, dette kan konfigureres med JSON i `Idékonfigurasjon` listen [#1488](https://github.com/Puzzlepart/prosjektportalen365/issues/1488)
- Lagt til en aggregert oversikt for `Ressursallokering` i program og overordnet område mal [#1490](https://github.com/Puzzlepart/prosjektportalen365/issues/1490)

### Forbedringer

- En ny visning i Porteføljeoversikt vil være personlig som standard [#1539](https://github.com/Puzzlepart/prosjektportalen365/issues/1539)

### Feilrettinger

- Rettet et problem hvor planneroppgaver ikke ble provisjonert i riktig rekkefølge [#1530](https://github.com/Puzzlepart/prosjektportalen365/issues/1530)
- Rettet et problem med eksport til Excel for aggregerte oversikter [#1519](https://github.com/Puzzlepart/prosjektportalen365/issues/1519)
- Rettet et problem med visningskolonner i aggregerte oversikter [#1447](https://github.com/Puzzlepart/prosjektportalen365/issues/1447)
- Rettet et problem hvor tillatelseskonfigurasjon feilet dersom man ikke er eier på hub [#1549](https://github.com/Puzzlepart/prosjektportalen365/issues/1549)
- Rettet et problem hvor provisjonering av dokumentbibliotek bare hentet 100 elementer [#1547](https://github.com/Puzzlepart/prosjektportalen365/issues/1547)
- Rettet et problem hvor opprettelse av statusrapporter feilet dersom URL-felt var i bruk [#1546](https://github.com/Puzzlepart/prosjektportalen365/issues/1546)
- Rettet et problem hvor eiere av personlige visninger ikke kunne redigere kolonner [#1553](https://github.com/Puzzlepart/prosjektportalen365/issues/1553)
- Rettet et problem hvor Prosjektkolonnekonfigurasjon verdier som inneholder punktum ikke ble korrekt vist på Porteføljeoversikten [#1557](https://github.com/Puzzlepart/prosjektportalen365/issues/1557)

---

## 1.9.1 - 07.05.2024

### Forbedringer

- Standard forhåndsvisning for migrerte tiltak (Tiltakshåndtering) er nå satt til 'Ingen forhåndsvisning' [#1480](https://github.com/Puzzlepart/prosjektportalen365/issues/1480)
- Mulighet for å skru på/av informasjonsmelding for dynamisk hjemmeside, standard av [#1484](https://github.com/Puzzlepart/prosjektportalen365/issues/1484)
- Tidslinjeliste baserer seg nå på område-id for å hente tidslinjeelementer, dette for å sikre at elementene hentes og vises riktig [#1477](https://github.com/Puzzlepart/prosjektportalen365/issues/1477)
- Støtte for tallfelt i redigeringspaneler for prosjektstatus, prosjektinformasjon og tidslinje-liste [#1496](https://github.com/Puzzlepart/prosjektportalen365/issues/1496)
- Forbedret ytelsen betraktelig og innlasting av store mengder prosjekter i prosjektutlisting webdel på forsiden av porteføljen [#1493](https://github.com/Puzzlepart/prosjektportalen365/pull/1493)
- Forbedret skript for å oppgradere eksisterende prosjektområder [#1475](https://github.com/Puzzlepart/prosjektportalen365/issues/1475), [#1487](https://github.com/Puzzlepart/prosjektportalen365/issues/1487)
- Forbedret filtreringsmuligheter for prosjekttidslinje på Porteføljenivå og Program/overordnet for underområder. Det er nå mulig å filtrere på prosjekter og prosjektinformasjon som er presisert i listen `Prosjektkolonner` [#1489](https://github.com/Puzzlepart/prosjektportalen365/issues/1489)
- Oppdatert `Fasesider` prosjekttillegg til å støtte den nye vertikale inndeling [#1521](https://github.com/Puzzlepart/prosjektportalen365/issues/1521)
- Dersom det er angitt et nytt navn til et prosjekt etter opprettelse blir dette nå synkronisert ned til porteføljen [#1518](https://github.com/Puzzlepart/prosjektportalen365/issues/1518)

### Feilrettinger

- Rettet et problem hvor listedata tilhørende tidligere prosjektstatusrapporter ikke ble hentet inn [#1472](https://github.com/Puzzlepart/prosjektportalen365/issues/1472)
- Rettet et problem hvor 'Hooks' ikke ble kjørt riktig på grunn av manglende 'body' i `POST` forespørsel [#1479](https://github.com/Puzzlepart/prosjektportalen365/issues/1479)
- Rettet et problem hvor dynamisk endring av prosjektforside via fasevelger ikke fungerte [#1481](https://github.com/Puzzlepart/prosjektportalen365/issues/1481)
- Rettet et problem hvor noen underområder ikke var klikkbare i administrasjon av underområder webdel [#1468](https://github.com/Puzzlepart/prosjektportalen365/issues/1468)
- Rettet et problem hvor URL til KUR-side ble feil ved godkjenning av en idé [#1393](https://github.com/Puzzlepart/prosjektportalen365/issues/1393)
- Rettet et problem hvor `Gjør om til overordnet prosjekt` knapp ble igjen etter omgjøringen og at `Administrer underområder` knapp ikke lengre var synlig [#1412](https://github.com/Puzzlepart/prosjektportalen365/issues/1412)
- Rettet et problem hvor `Vis alle målinger` ikke var synlig i `Gevinster for underområder` (Program/overordnet område) [#1461](https://github.com/Puzzlepart/prosjektportalen365/issues/1461)
- Rettet et problem hvor 'Tittel' fra `Prosjektkolonner` listen ikke ble angitt som visningsnavn for felter i Prosjektinformasjon [#1458](https://github.com/Puzzlepart/prosjektportalen365/issues/1458)
- Rettet et problem hvor kolonner var synlige i `Vis eller skjul kolonner` panelet på porteføljeoversikten selv om de skulle vært skjult [#1442](https://github.com/Puzzlepart/prosjektportalen365/issues/1442)
- Rettet et problem hvor sorteringsindikatorene for kolonner i aggregerte oversikter ikke var riktig sjekket av [#1429](https://github.com/Puzzlepart/prosjektportalen365/issues/1429)
- Rettet et problem hvor mapper ikke ble provisjonert dersom det eksisterte mapper med samme navn i prosjektet [#1497](https://github.com/Puzzlepart/prosjektportalen365/issues/1497)
- Rettet et problem hvor tekstfeltet knyttet til `Fase` ikke ble riktig synkronisert til portefølje [#1492](https://github.com/Puzzlepart/prosjektportalen365/issues/1492)
- Rettet et problem med visning av tallverdier i aggregerte oversikter hvor det ble lagt på en stor mengde desimaler [#1498](https://github.com/Puzzlepart/prosjektportalen365/issues/1498)
- Rettet et problem hvor publiseringsikon ikke ble vist i historikk nedtrekksmeny for `Statusrapporter` [#1350](https://github.com/Puzzlepart/prosjektportalen365/issues/1350)
- Rettet et problem hvor noen Idémodul listekommandoer ikke ble vist dersom andre Idé-lister var definert i `Idékonfigurasjon` [#1430](https://github.com/Puzzlepart/prosjektportalen365/issues/1430)
- Rettet et problem hvor avviklede termer ble vist i nedtrekksmenyer for taksonomi felter [#1499](https://github.com/Puzzlepart/prosjektportalen365/issues/1499)
- Rettet et problem hvor antall linjer angitt for et 'multi-linje' felt ikke ble reflektert i det nye redigeringspanelet [#1500](https://github.com/Puzzlepart/prosjektportalen365/issues/1500)
- Rettet et problem hvor valuta ikke ble riktig sortert på porteføljeoversikt og andre aggregerte oversikter [#1369](https://github.com/Puzzlepart/prosjektportalen365/issues/1369)
- Rettet et problem hvor eksportering av visninger som inneholdt felttypene 'valuta' og 'nummer' ble vist med masse desimaler [#1395](https://github.com/Puzzlepart/prosjektportalen365/issues/1395)
- Rettet et problem med visning av 'valuta' felt-verdier i redigeringspaneler for prosjektstatus og prosjektinformasjon [#1503](https://github.com/Puzzlepart/prosjektportalen365/issues/1503)
- Rettet et problem hvor visnings-id ikke la seg i URL feltet ved innlastning eller bytting av visninger i Porteføljeoversikt [#1355](https://github.com/Puzzlepart/prosjektportalen365/issues/1355)
- Rettet et problem hvor visnings-id ikke la seg i URL feltet ved opprettelse av nye visninger, samt oppdatering av visningen (Porteføljeoversikter og andre aggregerte oversikter) [#1441](https://github.com/Puzzlepart/prosjektportalen365/issues/1441)
- Rettet et problem hvor `Standardmal` ble satt som standard selvom andre maler var angitt som standard [#1471](https://github.com/Puzzlepart/prosjektportalen365/issues/1471)
- Rettet et problem hvor taksonomifelt i redigeringspanel ikke støttet nivåer av termer [#1504](https://github.com/Puzzlepart/prosjektportalen365/issues/1504)
- Rettet et problem hvor "Ansvarlig"-feltet i administrering av tiltak ikke viste personen som er valgt i feltet [#1506](https://github.com/Puzzlepart/prosjektportalen365/issues/1506)
- Rettet et problem hvor det ikke var mulig å lagre tom verdi i valuta/tall felt fra redigeringspanel [#1510](https://github.com/Puzzlepart/prosjektportalen365/issues/1510)
- Rettet et problem hvor lenke til prosjektets tidslinje ikke lenket riktig for program [#1511](https://github.com/Puzzlepart/prosjektportalen365/issues/1511)
- Rettet et problem hvor Ja/Nei kolonner ble vist som 1/0 i filterpanel [#1522](https://github.com/Puzzlepart/prosjektportalen365/issues/1522)
- Rettet et problem hvor migrering av tiltak feilet og frøs [#1524](https://github.com/Puzzlepart/prosjektportalen365/issues/1524)

---

## 1.9.0 - 08.02.2024

I denne versjonen er det gjort flere endringer på det visuelle uttrykket til Prosjektportalen, flere av komponentene er blitt helrenovert og fått nytt utseende og tilpasningsmuligheter. Sjekk ut [release notes](./releasenotes/1.9.0.md) for oversikt. Noen av de mest omfattende er:

- **Prosjektutlisting (forsiden av Prosjektportalen)**
  - Ny og interaktiv kortvisning med dynamiske farger og ny kommandolinje som er fullstendig tilpasningsvennlig [#1231](https://github.com/Puzzlepart/prosjektportalen365/pull/1231)
  - Ny listevisning med bedre sortering og metadata visning [#1236](https://github.com/Puzzlepart/prosjektportalen365/pull/1236)
  - Tilpasningsvennlig hurtigmeny for å komme fortere til sider eller lister på prosjektet [#1236](https://github.com/Puzzlepart/prosjektportalen365/pull/1236), [#1253](https://github.com/Puzzlepart/prosjektportalen365/pull/1253)
- **Porteføljeoversikt og aggregerte oversikter**
  - Porteføljeoversikt og aggregerte oversikt webdeler har fått oppdatert utseende med mer interaktivitet [#1255](https://github.com/Puzzlepart/prosjektportalen365/pull/1255)
  - Nye og forbedrete paneler for opprettelse og redigeringer av visninger og kolonner direkte i Porteføljeoversikten og aggregerte oversikter [#1202](https://github.com/Puzzlepart/prosjektportalen365/issues/1202), [#1203](https://github.com/Puzzlepart/prosjektportalen365/issues/1203), [#1210](https://github.com/Puzzlepart/prosjektportalen365/issues/1210), [#1199](https://github.com/Puzzlepart/prosjektportalen365/pull/1199), [#1272](https://github.com/Puzzlepart/prosjektportalen365/pull/1272)
  - Ny kolonneredigering for visninger i porteføljeoversikt og aggregerte oversikter ved bruk av `drag and drop` for å endre rekkefølge på kolonnene, samt skjul/vis [#1206](https://github.com/Puzzlepart/prosjektportalen365/issues/1206), [#1280](https://github.com/Puzzlepart/prosjektportalen365/pull/1280)
- **Fasevelger**
  - Ny, responsiv og mer interaktiv fasevelger [#1270](https://github.com/Puzzlepart/prosjektportalen365/pull/1270)
  - Ny og mer oversiktlig visning av fasesjekkpunkter og oppsummering ved endring av fase [#1289](https://github.com/Puzzlepart/prosjektportalen365/pull/1289)
  - Betraktelig forbedring rundt synkroniseringstid av faseendring [#1232](https://github.com/Puzzlepart/prosjektportalen365/pull/1232)
- **Prosjektstatus**
  - Nytt og forbedret utseende for prosjektstatusrapporter med seksjonsnavigator i toppen, seksjoner og matriser er fornyet [#1286](https://github.com/Puzzlepart/prosjektportalen365/pull/1286)
  - Nytt og forbedret panel for redigering og opprettelse av prosjektstatusrapporter [#1282](https://github.com/Puzzlepart/prosjektportalen365/pull/1282)
- **Prosjektinformasjon**
  - Prosjektinformasjon har fått oppdatert utseende med mer interaktivitet [#1262](https://github.com/Puzzlepart/prosjektportalen365/pull/1262)
  - Nytt og forbedret panel for redigering av prosjektinformasjon [#1227](https://github.com/Puzzlepart/prosjektportalen365/issues/1227)
  - Betraktelig forbedring rundt synkroniseringstid av prosjektinformasjon [#1232](https://github.com/Puzzlepart/prosjektportalen365/pull/1232)

### Ny funksjonalitet

- Støtte for å installere ulike kanaler for å kunne separere installasjoner i samme tenant [#1068](https://github.com/Puzzlepart/prosjektportalen365/issues/1068)
- Rask tilgang til nyttig informasjon med Footer for Prosjektportalen [#1290](https://github.com/Puzzlepart/prosjektportalen365/pull/1290)
- Idémodul er nå en del av standard + prosjektscoring og konfigurasjon [#1082](https://github.com/Puzzlepart/prosjektportalen365/issues/1082)
- Tving oppsett av prosjektmal dersom mal er låst og "Konfigurer automatisk" er satt til "Ja" i Maloppsett listen [#1115](https://github.com/Puzzlepart/prosjektportalen365/issues/1115)
- Mulighet for å angi etiketter på planneroppgaver [#1083](https://github.com/Puzzlepart/prosjektportalen365/issues/1083)
- Mulighet for å angi sortering på planneroppgaver [#1056](https://github.com/Puzzlepart/prosjektportalen365/issues/1056)
- Støtte for å håndtere tiltak for usikkerheter i Planner [#1273](https://github.com/Puzzlepart/prosjektportalen365/issues/1273)
- Støtte for tooltip-kolonne i porteføljeoversikten [#1079](https://github.com/Puzzlepart/prosjektportalen365/issues/1079)
- Visninger for programmer i Porteføljeoversikt [#933](https://github.com/Puzzlepart/prosjektportalen365/issues/933)
- Støtte for egendefinerte rekkefølger for kolonner i porteføljeoversikten [#1114](https://github.com/Puzzlepart/prosjektportalen365/issues/1114)
- Nye og forbedrete paneler for opprettelse og redigeringer av visninger og kolonner direkte i Porteføljeoversikten og aggregerte oversikter [#1202](https://github.com/Puzzlepart/prosjektportalen365/issues/1202), [#1203](https://github.com/Puzzlepart/prosjektportalen365/issues/1203), [#1210](https://github.com/Puzzlepart/prosjektportalen365/issues/1210), [#1199](https://github.com/Puzzlepart/prosjektportalen365/pull/1199)
- Ny kolonneredigering for visninger i porteføljeoversikt og aggregerte oversikter ved bruk av `drag and drop` for å endre rekkefølge på kolonnene, samt skjul/vis [#1206](https://github.com/Puzzlepart/prosjektportalen365/issues/1206)
- Ny oversikt: Kommunikasjonsplaner under Programminnhold [#965](https://github.com/Puzzlepart/prosjektportalen365/issues/965)
- Informasjon om valgte elementer for programadministrasjon og prosjektoppsett-dialog [#1189](https://github.com/Puzzlepart/prosjektportalen365/pull/1189)
- Nytt panel for redigering av prosjektinformasjon [#1227](https://github.com/Puzzlepart/prosjektportalen365/issues/1227)
- Nytt panel for redigering og opprettelse av prosjektstatusrapporter [#1282](https://github.com/Puzzlepart/prosjektportalen365/pull/1282)
- Nytt panel for redigering og opprettelse av tidslinjeelementer [#1288](https://github.com/Puzzlepart/prosjektportalen365/pull/1288)
- Ny og interaktiv kortvisning med dynamiske farger og ny kommandolinje som er fullstendig tilpasningsvennlig [#1231](https://github.com/Puzzlepart/prosjektportalen365/pull/1231)
- Ny listevisning av prosjekter med bedre sortering og metadata visning [#1236](https://github.com/Puzzlepart/prosjektportalen365/pull/1236)
- Tilpasningsvennlig hurtigmeny for å komme fortere til sider eller lister på prosjektet [#1236](https://github.com/Puzzlepart/prosjektportalen365/pull/1236)

### Forbedringer

- Store forbedringer på rammeverk, oppgradering til siste @pnp/sp v3 som vil øke ytelsen og brukeropplevelsen [#1219](https://github.com/Puzzlepart/prosjektportalen365/pull/1219)
- Kolonner i aggregerte oversikter kan nå gjøres grupperbare [#1020](https://github.com/Puzzlepart/prosjektportalen365/issues/1020)
- Malbibliotek-sti kan nå konfigureres i maloppsett-lista [#1179](https://github.com/Puzzlepart/prosjektportalen365/issues/1179)
- Prosjektinformasjon og prosjektnyheter vises nå i en vertikal seksjon på forsiden for å utnytte plassen bedre [#731](https://github.com/Puzzlepart/prosjektportalen365/issues/731)
- Støtte for egne visningsnavn og beskrivelser for prosjektinformasjon-felter for f.eks. Program [#1225](https://github.com/Puzzlepart/prosjektportalen365/pull/1314)
- Støtte for mer enn 500 restultater på oversikter i program [#1343](https://github.com/Puzzlepart/prosjektportalen365/issues/1343)
- Søket på porteføljeforsiden inkluderer nå prosjekteiere, prosjektledere, prosjekttype og tjenesteområder [#1281](https://github.com/Puzzlepart/prosjektportalen365/issues/1281)
- Forbedringer rundt rapportering og logging av feil/begrensninger under provisjonering av planneroppgaver [#1158](https://github.com/Puzzlepart/prosjektportalen365/pull/1158)
- Betraktelig forbedring rundt synkronisering av prosjektinformasjon [#1232](https://github.com/Puzzlepart/prosjektportalen365/pull/1232)
- Siste prosjekter webdel har fått nytt utseende og mer interaktiv [#1243](https://github.com/Puzzlepart/prosjektportalen365/pull/1243)
- Porteføljeoversikt og aggregerte oversikt webdeler har fått oppdatert utseende med mer interaktivitet [#1255](https://github.com/Puzzlepart/prosjektportalen365/pull/1255)
- Forbedret prosjekttidslinje for lettere navigasjon til prosjekters tidslinjer (fra venstre marg) [#1265](https://github.com/Puzzlepart/prosjektportalen365/pull/1265)
- Forbedret tidslinjeliste for å lettere opprette, redigere og slette elementer [#1265](https://github.com/Puzzlepart/prosjektportalen365/pull/1265)
- Visuelle forbedringer på kolonner og datatyper i porteføljeoversikt og aggregerte oversikter [#1268](https://github.com/Puzzlepart/prosjektportalen365/pull/1268)
- Programadministrasjon webdel har fått nytt utseende og mer interaktiv [#1298](https://github.com/Puzzlepart/prosjektportalen365/pull/1298)
- Alle filterpanel har fått et fornyet utseende med mer interaktivitet [#1299](https://github.com/Puzzlepart/prosjektportalen365/pull/1299)
- Hjelpeinnhold er flyttet til footer og fått nytt visuelt utseende [#1295](https://github.com/Puzzlepart/prosjektportalen365/pull/1295)
- Hjelpeinnhold har fått inført nivå, for å lettere skille om hjelpeinnholdet gjelder porteføljenivå eller prosjektnivå for eksempel [#1309](https://github.com/Puzzlepart/prosjektportalen365/pull/1309)

### Feilrettinger

- Fikset et problem hvor 'Alle prosjekter' ikke kunne settes som standard vertikal [#1163](https://github.com/Puzzlepart/prosjektportalen365/issues/1163)
- Fikset et problem med datatype filnavn for aggregerte oversikter [#1201](https://github.com/Puzzlepart/prosjektportalen365/pull/1201)
- Fikset et problem hvor prosjektforsiden ikke blir riktig vist etter Microsoft sin ny områdeoppretter [#1344](https://github.com/Puzzlepart/prosjektportalen365/issues/1344)

---

## 1.8.4 - 25.08.23

### Feilrettinger

- Rettet et problem hvor noen gjestebrukere ikke fikk opp prosjektadministrasjonsmuligheter [#1245](https://github.com/Puzzlepart/prosjektportalen365/issues/1245)
- Rettet et problkem hvor visningspanelet for prosjekter viser feil informasjon på porteføljeoversikten [#1247](https://github.com/Puzzlepart/prosjektportalen365/issues/1247)

---

## 1.8.3 - TBA

### Forbedringer

- Søk i aggregerte oversikter søker nå også på prosjektnavn [#1123](https://github.com/Puzzlepart/prosjektportalen365/issues/1123)
- Støtte for manuelle konfigurasjoner (JSON-format) i risikomatrise [#1120](https://github.com/Puzzlepart/prosjektportalen365/issues/1120)
- Porteføljeoversikten støtter nå visning av URL-kolonner [#1130](https://github.com/Puzzlepart/prosjektportalen365/pull/1130)
- Fiks for synkronisering dersom prosjekt mangler i den sentrale prosjekter-listen [#1121](https://github.com/Puzzlepart/prosjektportalen365/issues/1121)

### Feilrettinger

- Rettet et problem hvor låst mal hindret mulighet for å gjøre et prosjekt om til overordnet prosjekt [#1134](https://github.com/Puzzlepart/prosjektportalen365/issues/1134)
- Fikset et problem hvor 'Hooks' ikke ble kjørt på slutten av provisjoneringen av et prosjekt [#1127](https://github.com/Puzzlepart/prosjektportalen365/issues/1127)
- Fikset et problem hvor prosjekttidslinje på prosjektnivå ikke returnerte tidslinje-elementer for prosjektet [#1172](https://github.com/Puzzlepart/prosjektportalen365/pull/1172)
- Rettet en feil hvor Excel eksporten gir feilmelding når datofelt mangler data. [#1180](https://github.com/Puzzlepart/prosjektportalen365/issues/1180)
- Fikset et program hvor prosjekter ble vist selvom det ikke var tilknyttet prosjekter til et program [#1150](https://github.com/Puzzlepart/prosjektportalen365/pull/1150)

---

## 1.8.2 - 08.06.23

### Forbedringer

- Lagt inn nye knapper på 'Konfigurasjon' siden for Prosjektportalen (Prosjekter, Prosjektstatus og Tidslinjeinnhold), samt skjult 'Maloppsett' og 'Tidslinjeinnhold' fra områderinnhold [#1072](https://github.com/Puzzlepart/prosjektportalen365/issues/1072)
- Porteføljeoversikt: vis personlige visninger som egen "seksjon" [#1045](https://github.com/Puzzlepart/prosjektportalen365/issues/1045)
- Endret feltet GtSearchQuery til Note for å støtte lange spørringer. NB: Vil ikke endres gjennom oppgradering. Endre manuelt felttype til "Flere linjer med tekst" ved behov. [#970](https://github.com/Puzzlepart/prosjektportalen365/issues/970)
- Endret standardsortering av dokumentbiblioteker til å sortere på filnavn (var "Ingen" før)
- Standard visningsmodus er nå lagt til som egenskap for prosjektliste-webdelen [#1053](https://github.com/Puzzlepart/prosjektportalen365/issues/1053)

### Feilrettinger

- Fiks for uthenting av prosjektinformasjon for brukere uten tilgang til hubområdet [#1080](https://github.com/Puzzlepart/prosjektportalen365/issues/1080)
- Håndterer deaktiverte/stengte kontoer i kopiering av tillatelseskonfigurasjon [#1085](https://github.com/Puzzlepart/prosjektportalen365/issues/1085)
- Fiks for feil som noen ganger kunne oppstå i Prosjektinformasjon-webdelen [#1086](https://github.com/Puzzlepart/prosjektportalen365/issues/1086)
- Fiks for Gevinstoversikt på prosjektnivå [#1095](https://github.com/Puzzlepart/prosjektportalen365/issues/1095)
- Aggregerte oversikter henter nå ut alle elementer - tidligere ble det kun hentet maksimalt 500 [#1099](https://github.com/Puzzlepart/prosjektportalen365/issues/1099)
- Fikset problem dersom det ble oppgitt for mange vedlegg eller sjekkpunkter i planneroppgaver og innhold manglet [#1039](https://github.com/Puzzlepart/prosjektportalen365/issues/1039)
  - Det loggføres i `Logg` listen dersom begrensninger er nådd.
- Fiks for #1049 (feil ved publisering av statusrapporter) [#1049](https://github.com/Puzzlepart/prosjektportalen365/issues/1049)
- Oppgraderingsoperasjonene som kjører før oppgradering varsler nå om feil, og det ble rettet feil som gjorde at oppgradering i 1.8.0 og 1.8.1 ikke fungerte fullstendig [#1094](https://github.com/Puzzlepart/prosjektportalen365/issues/1094)
- Fikset et problem hvor "Vis i statusseksjonen" verdien ikke ble overholdt i visning av statusseksjoner

---

## 1.8.1 - 31.03.2023

### Forbedringer

- Dersom bruker har "Full kontroll" tilgangsnivå på området får bruker fulle rettigheter på området [#1054](https://github.com/Puzzlepart/prosjektportalen365/issues/1054)
- Tilgang for å opprette porteføljeoversikt-visninger er nå basert på tilgang til listen [#932](https://github.com/Puzzlepart/prosjektportalen365/issues/932)
- Alfabetisk sortering av filterverdier for ressursallokering [#1059](https://github.com/Puzzlepart/prosjektportalen365/issues/1059)
- Håndterer ugyldig låst mal (i property bag) i prosjektoppsettet [#1057](https://github.com/Puzzlepart/prosjektportalen365/issues/1057)
- Fjerning av unødvendig ekstra scrollbar på hjelpeinnholdsvinduet [#997](https://github.com/Puzzlepart/prosjektportalen365/issues/997)

### Feilrettinger

- Rettet feil i oppgraderingsskriptet der noen tenants ikke kunne hente alle hub children [#1041](https://github.com/Puzzlepart/prosjektportalen365/pull/1041)
- Rettet feil hvor kommandolinjen ikke ble vist som standard [#1042](https://github.com/Puzzlepart/prosjektportalen365/issues/1042)
- Rettet feil ved provisjonering av Bygg- og anleggsprosjekter dersom Fasesjekkliste var valgt [#1052](https://github.com/Puzzlepart/prosjektportalen365/issues/1052)
- Rettet feil hvor det ikke var mulig å synkronisere data fra 'Prosjektdata'-listen  (Idébehandling) [#1048](https://github.com/Puzzlepart/prosjektportalen365/pull/1048)
- Rettet feil hvor termset for `FNs bærekraftsmål` manglet [#1058](https://github.com/Puzzlepart/prosjektportalen365/issues/1058)

---

## 1.8.0 - 28.02.2023

### Ny funksjonalitet

- 'Auto-complete' søk for maler i prosjektoppsett dialog [#837](https://github.com/Puzzlepart/prosjektportalen365/issues/837)
- Sok etter prosjekttillegg og standardinnhold i prosjektoppsett dialog [#839](https://github.com/Puzzlepart/prosjektportalen365/issues/839)
- Nytt felt: `FNs bærekraftsmål`, i prosjektinformasjon [#454](https://github.com/Puzzlepart/prosjektportalen365/issues/454)
- Mulighet for å se alle prosjekter man har tilgang til på forsiden [#724](https://github.com/Puzzlepart/prosjektportalen365/issues/724)
- Konfigurasjon av tekstfarge på prosjekttidslinje [#767](https://github.com/Puzzlepart/prosjektportalen365/issues/767)
- Statusrapport sammendrag i prosjektinformasjon [#368](https://github.com/Puzzlepart/prosjektportalen365/issues/368)
- Integrasjon av bygg- og anleggsmodulen (prosjektportalen365-bygganlegg) i Prosjektportalen 365 [#910](https://github.com/Puzzlepart/prosjektportalen365/issues/910)
  - For brukere som har skal oppgradere og ønsker bygg- og anllegsinnhold, må følgende parameter legges til: `-IncludeBAContent`. ⚠️
- Støtte for flere Planner planer per prosjekt [#906](https://github.com/Puzzlepart/prosjektportalen365/issues/906)
- Støtte for etikett på prosjektleveranser - tidslinje [#917](https://github.com/Puzzlepart/prosjektportalen365/issues/917)
- Dynamisk risiko- og mulighetsmatrise: Konfigurasjon av størrelse, farger osv... [#433](https://github.com/Puzzlepart/prosjektportalen365/issues/433)
- Lagt til nye felter for muligheter (status og kommentar), til prosjektstatus listen med tilhørende statusrapport seksjon 'Muligheter' [#499](https://github.com/Puzzlepart/prosjektportalen365/issues/#499)
- Søtte for å gjøre spesifikke maloppsett obligatoriske [#839](https://github.com/Puzzlepart/prosjektportalen365/issues/839)
- Nytt standard prosjekttillegg for fasesider [#784](https://github.com/Puzzlepart/prosjektportalen365/issues/784)
- Ny liste `Lists/Logg` [#842](https://github.com/Puzzlepart/prosjektportalen365/issues/842)
  - Det er opprettet en ny liste hvor systemet lagrer hendelser eller feil som oppstår (eksempel: ved prosjektopprettelse, endring av faser, osv...)

### Forbedringer

- Standard gruppering av tidslinje er satt til 'Type' [#768](https://github.com/Puzzlepart/prosjektportalen365/issues/768)
- Diverse UI/UX forbedringer for program komponentene [#693](https://github.com/Puzzlepart/prosjektportalen365/issues/693)
- Omdøpt 'Risikooversikt' til 'Usikkerhetsoversikt', dette inkluderer også statusrapport seksjonene. [#499](https://github.com/Puzzlepart/prosjektportalen365/issues/#499)
- Omarbeidet søkeopplevelse i hele Prosjektportalen [#884](https://github.com/Puzzlepart/prosjektportalen365/issues/884)
- Ekskludering av private/delte kanal områder når man søker etter områder (Program administrasjon) [#915](https://github.com/Puzzlepart/prosjektportalen365/issues/915)
- Aggregert innhold: Støtte for dokumentnavnkolonne med filtypeikon [#962](https://github.com/Puzzlepart/prosjektportalen365/issues/962)
- 'Oversikt' program webdel vil nå vise alle prosjekter, i samme stil som 'Porteføljeoversikt', med `øye` ikon som vises ved prosjekter brukeren ikke har tilgang til. [#961](https://github.com/Puzzlepart/prosjektportalen365/issues/961)
- Vis alle prosjekter i 'Administrasjon webdel' for program ruavhengig av tilganger, et `øye` ikon vises ved prosjekter brukeren ikke har tilgang til. [#972](https://github.com/Puzzlepart/prosjektportalen365/issues/972)
- Tittelkolonnen for aggregerte webdeler er nå gjengitt som en klikkbar lenke til listeelementet [#947](https://github.com/Puzzlepart/prosjektportalen365/issues/947)
- Vedvarende valg ved søk i Program Admin [#849](https://github.com/Puzzlepart/prosjektportalen365/issues/849)
- Persister søkeboksinnhold når du bytter fane i prosjektutlistingswebdelen [#989](https://github.com/Puzzlepart/prosjektportalen365/issues/989)
- Tidslinjen for et programs prosjekter viser nå en annen informasjonsmelding [#995](https://github.com/Puzzlepart/prosjektportalen365/issues/995)

### Feilrettinger

- Rettet et feil hvor ressursallokeringswebdelen ikke lastet på grunn av elementer som ikke var tildelt bruker eller rolle [#904](https://github.com/Puzzlepart/prosjektportalen365/issues/904)
- Rettet et problem hvor hubsite ikke ble funnet, noe som førte til inkonsekvenser og feil [#640](https://github.com/Puzzlepart/prosjektportalen365/issues/849)
- Rettet et feil hvor noen ganger rollen ble vist som eier av en ressursallokeringsoppføring [#916](https://github.com/Puzzlepart/prosjektportalen365/issues/916)
- Rettet et feil hvor '? Hjelp tilgjengelig'-knappen ikke ble vist ordentlig [#902](https://github.com/Puzzlepart/prosjektportalen365/issues/902), [#974](https://github.com/Puzzlepart/prosjektportalen365/issues/974)
- Rettet et feil hvor besøkende til et prosjekt ikke så fasevelger-webdelen [#948](https://github.com/Puzzlepart/prosjektportalen365/issues/948)
- Rettet et feil hvor det ikke var mulig å kollapse grupper i aggregerte webdeler [#945](https://github.com/Puzzlepart/prosjektportalen365/issues/945)
- Rettet et feil hvor '? Hjelp tilgjengelig'-knappen ikke kom med på eksisterende prosjekter [#844](https://github.com/Puzzlepart/prosjektportalen365/issues/844)
- Rettet et feil hvor webdeler ikke ble lastet ordentlig fordi brukeren ikke hadde en e-postkonto [#844](https://github.com/Puzzlepart/prosjektportalen365/issues/844)
- Rettet feil hvor brukere ikke kunne oppgradere fra 1.5.4-versjoner eller tidligere [#901](https://github.com/Puzzlepart/prosjektportalen365/issues/901)
- Rettet en feil hvor deler av 'Fasevelger' webdelen ikke ble vist ordentlig [#920](https://github.com/Puzzlepart/prosjektportalen365/issues/920)
- Rettet en feil hvor planneroppgaver uten 'plannavn' i 'Listeinnhold' mislyktes under prosjektoppsett [#976](https://github.com/Puzzlepart/prosjektportalen365/issues/976)
- Rettet en feil hvor lagring av øyeblikksbilde ikke fungerte i prosjektstatus [#955](https://github.com/Puzzlepart/prosjektportalen365/issues/955)
- Rettet feil med prosjektutlistingswebdelen, hvor gjester kunne se fanen "Alle prosjekter" [#996](https://github.com/Puzzlepart/prosjektportalen365/issues/996)
- Rettet standard overskriftsetiketter for usikkerhetsmatrisene [#999](https://github.com/Puzzlepart/prosjektportalen365/issues/999)
- Håndtering av ugyldige spesialtegn ved generering av et øyeblikksbilde for prosjektstatus [#1033](https://github.com/Puzzlepart/prosjektportalen365/issues/1033)

---

## 1.7.2 - 26.10.2022

### Ny funksjonalitet

- Added support to run hooks when changing phases [#747](https://github.com/Puzzlepart/prosjektportalen365/issues/747)
  - Example: Trigger API's, Flows, Logic Apps, Azure Functions, etc...
- Added check if projecttemplate is attempted to be applied to portfolio level [#748](https://github.com/Puzzlepart/prosjektportalen365/issues/748)
- Added better error handling for ProjectTimelines (Portfolio and project level) [#755](https://github.com/Puzzlepart/prosjektportalen365/issues/755)
- Custom Risk matrix cells (colors, headers, text, etc...) [#624](https://github.com/Puzzlepart/prosjektportalen365/issues/624)
- Script to fix planner issues, see 'Ensure-PlannerPlans' script [#752](https://github.com/Puzzlepart/prosjektportalen365/issues/752)
- Added 'Description' and 'Tag' as two new default fields to ProjectTimelineContent list [#764](https://github.com/Puzzlepart/prosjektportalen365/issues/764)
- Added better error handling for Resource allocation [#776](https://github.com/Puzzlepart/prosjektportalen365/issues/776)
- Added support for description/notes on planner tasks [#704](https://github.com/Puzzlepart/prosjektportalen365/issues/704)
- Added support for preview type on planner tasks [#718](https://github.com/Puzzlepart/prosjektportalen365/issues/718)
- Fix for problems where aggregated webpart pages didn't work properly [#754](https://github.com/Puzzlepart/prosjektportalen365/issues/754)
  - Top navigation bar elements ('Erfaringslogg', 'Gevinst-', 'Risiko-' and 'Leveranseoversikt') needs to be checked and fixed manually after upgrade to 1.7.2 ⚠️
- Integrated IdeaProcessing (from prosjektportalen365-addons) directly in Prosjektportalen 365 with improvements and new additions [#777](https://github.com/Puzzlepart/prosjektportalen365/issues/777)
  - This also adds sync functionality to synchronize ProjectData to newly created projects based off of ideas
  - Remove old IdeaProcessing webparts if you have used idea processing prior to 1.7.2 ⚠️
- Displaying parent projects in Project Information webpart [#760](https://github.com/Puzzlepart/prosjektportalen365/issues/760)
- Added ability to hide certain parts of the Project Information webpart [#670](https://github.com/Puzzlepart/prosjektportalen365/issues/670)
- Added inline help content function to sitepages and lists [#788](https://github.com/Puzzlepart/prosjektportalen365/issues/788)
- Added pre populated elements to help content list [#799](https://github.com/Puzzlepart/prosjektportalen365/issues/799)
- Added ability to group ProjectTimeline by projects, category and type (Project level) [#766](https://github.com/Puzzlepart/prosjektportalen365/issues/766)
  - Users can now also filter by category, found in the filter panel
- Project Admin Roles: Possiblity to select what roles and groups have permissions to which webparts and webpart components [#765](https://github.com/Puzzlepart/prosjektportalen365/issues/765)
- Added a script to ensure planner plans. This fixes an issue where the planner webpart stops working. [#752](https://github.com/Puzzlepart/prosjektportalen365/issues/752)
- Added a new section in ProjectInformation webpart to show parent/child projects. [#760](https://github.com/Puzzlepart/prosjektportalen365/issues/760)

### Forbedringer

- Changed phase callout from hover to clickable [#734](https://github.com/Puzzlepart/prosjektportalen365/issues/734)
- Installation now uses the new PnP.PowerShell module [#417](https://github.com/Puzzlepart/prosjektportalen365/issues/417)
  - Use -Interactive instead of -UseWebLogin when upgrading/installing ⚠️
- Information messages now uses a newer and stable version to render HTML [#762](https://github.com/Puzzlepart/prosjektportalen365/issues/762)
- Reduced amount of calls when loading ProjectTimeline, this improves the speed by alot! [#743](https://github.com/Puzzlepart/prosjektportalen365/issues/743)
- Filterpanel for Timeline: Project is now collapsed by default in the panel [#776](https://github.com/Puzzlepart/prosjektportalen365/issues/776)
- Restructured configuration page using 3 columns [#712](https://github.com/Puzzlepart/prosjektportalen365/issues/712)
- Multi taxonomy terms (ex: 'Tjenesteområde') are now shown as labels instead of just text [#827](https://github.com/Puzzlepart/prosjektportalen365/issues/827)
- Changed to use panel for showing ProjectInformation instead of dialog. [#725](https://github.com/Puzzlepart/prosjektportalen365/issues/725)
- Default grouping for timeline has been set to Type [#776](https://github.com/Puzzlepart/prosjektportalen365/issues/776)

### Feilrettinger

- Fixed slow loading of project logos [#648](https://github.com/Puzzlepart/prosjektportalen365/issues/648)
- Fixed a bug where default column values were wiped when importing documents through TemplateSelector dialog [#761](https://github.com/Puzzlepart/prosjektportalen365/issues/761)
- Fixed a bug where users could't see the callout dialog for ProjectTimeline at the bottom of the page [#771](https://github.com/Puzzlepart/prosjektportalen365/issues/771)
- Fixed a bug with ProgramAdministration where ProjectTable did not keep selected items while searching [#759](https://github.com/Puzzlepart/prosjektportalen365/issues/759)
- Fixed a bug where adding projects as children did not sync properly [#800](https://github.com/Puzzlepart/prosjektportalen365/pull/800)

---

## 1.6.1 - 01.07.2022

### Ny funksjonalitet

- Added ViewId for views in aggregated web parts which is set in the url

---

## 1.6.0 - 16.06.2022

### Ny funksjonalitet

- Added timeline configuration list (Customize how timeline elements are displayed, their colors, sorting and more) [#678](https://github.com/Puzzlepart/prosjektportalen365/issues/678)
  - This applies to Portfolio, Project and Program timelines
- Added possibility to include project deliveries on timeline (beta) [#679](https://github.com/Puzzlepart/prosjektportalen365/issues/679)
  - This applies to Portfolio, Project and Program timelines
- Added ability to run hooks in the txt provisioning template [#700](https://github.com/Puzzlepart/prosjektportalen365/issues/700)
  - Example: Trigger API's, Flows, Logic Apps, Azure Functions, etc...
- Added 'Prosjektinnholdskolonner' list to define columns which are used for the aggregated web parts [#706](https://github.com/Puzzlepart/prosjektportalen365/issues/706)
  - 'Datakilder' has been expanded with 'Prosjekt odata spørring' column to filter the projects in the datasource query

### Forbedringer

- Expanded aggregated webparts with similar functionality as PortfolioOverview [#706](https://github.com/Puzzlepart/prosjektportalen365/issues/706)
  - Views, Filters, Grouping has been added to make them more dynamic
  - The aggregated webparts are: 'Erfaringslogg', 'Leveranseoversikt' and 'Risikooversikt'
  - 'Gevinstoversikt'has been reworked as an aggregated webpart and will work the same
  - 'Datakilder' list has been expanded with three new columns connected to 'Prosjektinnholdskolonner' list
- Improvements to styling, sorting and information messages for the Document Template Selector [#711](https://github.com/Puzzlepart/prosjektportalen365/issues/711)

### Feilrettinger

- Fixed issue with syncing of project properties not always triggering [#736](https://github.com/Puzzlepart/prosjektportalen365/issues/736)
- Fixed issue with resource allocation percentage not showing [#610](https://github.com/Puzzlepart/prosjektportalen365/issues/610). NB: The script UpgradeAllSitesToLatest.ps1 needs to be run to fix the issue for old sites!
- Fixed issue with setup dialog, where having more than 6 default items didn't render well [#702](https://github.com/Puzzlepart/prosjektportalen365/issues/702)

---

## 1.5.0 - 01.04.2022

### Ny funksjonalitet

- Added functionality for dynamic welcomepages based on project phases [#643](https://github.com/Puzzlepart/prosjektportalen365/issues/643)
- Added 'Vis alle egenskaper' button with panel to ProjectInformation webpart [#650](https://github.com/Puzzlepart/prosjektportalen365/issues/650)
- Added support for {site} token in Planner-tasks [#646](https://github.com/Puzzlepart/prosjektportalen365/issues/646)
- Add possibility to lock'project template configurations [#645](https://github.com/Puzzlepart/prosjektportalen365/issues/645)
- Changed header in projectstatus report to show date when published instead of when created [#654](https://github.com/Puzzlepart/prosjektportalen365/issues/654)
- Supporting permission groups for specific project template [#651](https://github.com/Puzzlepart/prosjektportalen365/issues/651)
- Added Program and parent functionality (Can add projects as children of another to give the following overviews):
  - General Overview and status (Portfolio overview)
  - Gains overview
  - Timeline
  - Deliveries
  - Risks and benefits

### Forbedringer

- If there are no items in the list "Fasesjekkeliste". "Gå til fasesjekklisten" button won't show and the empty dialog when changing phase is skipped [#660](https://github.com/Puzzlepart/prosjektportalen365/issues/660)

### Feilrettinger

- Fixed bug where ProjectTimeline would not load properly [#661](https://github.com/Puzzlepart/prosjektportalen365/issues/661)
- Fixed bug where Risks, Deliveries and Exp.Log would sometimes not load [#668](https://github.com/Puzzlepart/prosjektportalen365/issues/668)

---

## 1.4.0 - 08.02.2022

### Ny funksjonalitet

- Added new template configuration list "Maloppsett" used for project setup [#617](https://github.com/Puzzlepart/prosjektportalen365/issues/617) [#594](https://github.com/Puzzlepart/prosjektportalen365/issues/594)
- Added GtProjectLifecycleStatus in "Prosjektegenskaper" and as a filter in "Porteføljeoversikt" [#587](https://github.com/Puzzlepart/prosjektportalen365/issues/587)

### Forbedringer

- No longer resetting portfolio navigation on upgrade [#567](https://github.com/Puzzlepart/prosjektportalen365/issues/567)

### Feilrettinger

- Fixed persistant filter checkbox on view change [#545](https://github.com/Puzzlepart/prosjektportalen365/issues/545)
- Fixed installation error with hidden fieldrefs [#622](https://github.com/Puzzlepart/prosjektportalen365/issues/622)
- Fixed issue where changing phase via phase selector web part was not synced to the portfolio site [#628](https://github.com/Puzzlepart/prosjektportalen365/issues/628)
- Fixed small alignment issue with project template selector [#638](https://github.com/Puzzlepart/prosjektportalen365/issues/638)
- Reformulated GtShowInPorfolio description to encompass more than uncertainties [#615](https://github.com/Puzzlepart/prosjektportalen365/issues/615)
- Added support for syncing number and currency fields in project properties [#612](https://github.com/Puzzlepart/prosjektportalen365/issues/612)
- Changed behavior when deleting a status report [#597](https://github.com/Puzzlepart/prosjektportalen365/issues/597)
- Changed behavior when deleting timeline item [#569](https://github.com/Puzzlepart/prosjektportalen365/issues/569)

---

## 1.3.1 - 20.12.2021

### Ny funksjonalitet

- Added upgrade script for existing projects to add 1.3.0 functionality (project timeline page) [#591](https://github.com/Puzzlepart/prosjektportalen365/issues/591)

---

## 1.3.0 - 22.10.2021

### Ny funksjonalitet 

- Added a new project webpart 'Prosjekttidslinje' for showcasing projects and items for the current project on a timeline [#497](https://github.com/Puzzlepart/prosjektportalen365/issues/497)
- Added read-only project cards to project list on the frontpage [#498](https://github.com/Puzzlepart/prosjektportalen365/issues/498)
- Added new multi-user field _Prosjektstøtte_ [#526](https://github.com/Puzzlepart/prosjektportalen365/issues/526)
- Added "Avventer" as a new choice for "Prosjektstatus" [#537](https://github.com/Puzzlepart/prosjektportalen365/issues/537)

### Forbedringer

- Removed "Home" from Portfolio menu bar [#527](https://github.com/Puzzlepart/prosjektportalen365/issues/527)
- Removed list views and risk matrix from previous status reports [#374](https://github.com/Puzzlepart/prosjektportalen365/issues/374)
- Improved rendering of user fields in "Prosjektinformasjon" [#576](https://github.com/Puzzlepart/prosjektportalen365/issues/576)
- Added visual indicator in the portfolio overview for projects where you don't have access [#563](https://github.com/Puzzlepart/prosjektportalen365/issues/563) [#578](https://github.com/Puzzlepart/prosjektportalen365/issues/578)

### Feilrettinger

- Fixed UI bug by downgrading the `office-ui-fabric-react` package version to `6.214.0` [#535](https://github.com/Puzzlepart/prosjektportalen365/issues/535)
- Fixed redirect after creating a new project status [#530](https://github.com/Puzzlepart/prosjektportalen365/issues/530)
- Fixed project wizard bug when project is attached to another hub [#532](https://github.com/Puzzlepart/prosjektportalen365/issues/532)
- Fixed wrong phases being displayed when switching between projects with different phases [#520](https://github.com/Puzzlepart/prosjektportalen365/issues/520)
- Fixed issue with upgrading where deprecated pages/webparts were not removed [#588](https://github.com/Puzzlepart/prosjektportalen365/issues/588)

---

## 1.2.9 - 08.09.2021

### Ny funksjonalitet

- Added multiline text-wrapping in project status [#493](https://github.com/Puzzlepart/prosjektportalen365/issues/493)
- Added description for site template [#500](https://github.com/Puzzlepart/prosjektportalen365/issues/500)

### Feilrettinger

- Fixed issue where the site design had to be applied post project creation [#492](https://github.com/Puzzlepart/prosjektportalen365/issues/492)
- Fixed date not being recognized when exporting Portfolio overview to Excel. [#495](https://github.com/Puzzlepart/prosjektportalen365/issues/495)
- Fixed issue where changing project phase did not always update the portfolio page [#518](https://github.com/Puzzlepart/prosjektportalen365/issues/518)

---

## 1.2.8 - 17.06.2021

### Ny funksjonalitet

- Added rich text and lineshift support to field in project information [#502](https://github.com/Puzzlepart/prosjektportalen365/issues/502)

### Feilrettinger

- Fixed issue with checklist status field missing options [#485](https://github.com/Puzzlepart/prosjektportalen365/issues/485)

---

## 1.2.7 - 20.05.2021

### Ny funksjonalitet

- Added a new portfolio webpart, 'Prosjekttidslinje' for showcasing projects on a timeline [#435](https://github.com/Puzzlepart/prosjektportalen365/issues/435)
- Added list 'Tidslinjeinnhold' to portfolio level [#437](https://github.com/Puzzlepart/prosjektportalen365/issues/437)
- Added 'Description' to document templates [#379](https://github.com/Puzzlepart/prosjektportalen365/issues/379)
- Supporting pre-defined template setting [#461](https://github.com/Puzzlepart/prosjektportalen365/issues/461)
- Added "Last Report Date" to Portfolio status overview [#393](https://github.com/Puzzlepart/prosjektportalen365/issues/393)
- Added report created date next to Project Status title [#456](https://github.com/Puzzlepart/prosjektportalen365/issues/456)

### Feilrettinger

- Avoiding overwrite of portfolio views, columns, column configuration and insights graphs on update [#440](https://github.com/Puzzlepart/prosjektportalen365/issues/440)
- Overwriting configuration page to support new configuration links on update [#425](https://github.com/Puzzlepart/prosjektportalen365/issues/425)
- Fixed portfolio overview crashing when default view was selected [#428](https://github.com/Puzzlepart/prosjektportalen365/issues/428)
- Fixed inconsistent version history settings of lists [#465](https://github.com/Puzzlepart/prosjektportalen365/issues/465)
- Fixed Excel export issues at portfolio level [#480](https://github.com/Puzzlepart/prosjektportalen365/issues/480)

### Forbedringer

- Changed Portfolio status view columns from "comments" to "status" [#451](https://github.com/Puzzlepart/prosjektportalen365/issues/451)
- Improved project properties sync and fetching [#444](https://github.com/Puzzlepart/prosjektportalen365/issues/444) [#449](https://github.com/Puzzlepart/prosjektportalen365/issues/449)
- Overviews using PortfolioAggregation (Benefit overview, Experience log, Delivery overview, Risk overview) now initially sort on project and grouping now automatically sorts group from A-Z by project. Also removes groups when sorting to avoid the issue found in [#459](https://github.com/Puzzlepart/prosjektportalen365/issues/459)
- Updated description for most of the SiteFields throughout 'Prosjektportalen' [#467](https://github.com/Puzzlepart/prosjektportalen365/issues/467)
- Deactivated Export to Excel button on portfolio overview as well as aggregated portfolio pages (Gevinstoversikt, Erfaringslogg, Leveranseoversikt, Risikooversikt) [#475](https://github.com/Puzzlepart/prosjektportalen365/issues/475)

---

## 1.2.6 - 03.03.2021

### Ny funksjonalitet

- Added project template name to project properties [#380](https://github.com/Puzzlepart/prosjektportalen365/issues/380)
- Added support for phase sub text in phase selector [#381](https://github.com/Puzzlepart/prosjektportalen365/issues/381)
- Added support for navigation folders in document template picker [#382](https://github.com/Puzzlepart/prosjektportalen365/issues/382)
- Added support for permission configuration using a configuration list on the hubsite [#387](https://github.com/Puzzlepart/prosjektportalen365/issues/387)
- Added Description field to Usikkerhet [#410](https://github.com/Puzzlepart/prosjektportalen365/issues/410)
- Enabled version history on Prosjektmaler list [#359](https://github.com/Puzzlepart/prosjektportalen365/issues/359)

### Feilrettinger

- Fixes issues with single folder in "Hent dokumentmal" [#376](https://github.com/Puzzlepart/prosjektportalen365/issues/376)
- Issues with custom project fields [#378](https://github.com/Puzzlepart/prosjektportalen365/issues/378)
- Fix for visible check in project information web part [#385](https://github.com/Puzzlepart/prosjektportalen365/issues/385)
- Setting phase check list and planner task list as visible [#389](https://github.com/Puzzlepart/prosjektportalen365/issues/389)
- Flexible portfolio aggregation web part [#394](https://github.com/Puzzlepart/prosjektportalen365/issues/394)
- Copying for documents to new projects [#399](https://github.com/Puzzlepart/prosjektportalen365/issues/399)
- Fixes issues with more than one status report template [#400](https://github.com/Puzzlepart/prosjektportalen365/issues/400)
- Fixed issues with missing projects on the front page [#364](https://github.com/Puzzlepart/prosjektportalen365/issues/364)
- Fixed support for latest PnP PowerShell [#377](https://github.com/Puzzlepart/prosjektportalen365/issues/377)

---

## 1.2.4 - 30.11.2020

### Ny funksjonalitet

- Added "default" option for extensions, similar to list content [#328](https://github.com/Puzzlepart/prosjektportalen365/issues/328)
- Added info message if there are unpublished statusreports [#340](https://github.com/Puzzlepart/prosjektportalen365/issues/340)
- Added published/unpublished indicators for statusreports in dropdown and ribbon [#341](https://github.com/Puzzlepart/prosjektportalen365/issues/341)
- Added possiblity to delete unpublished statusreports [#343](https://github.com/Puzzlepart/prosjektportalen365/issues/343)
- Added PNG snapshot when publishing project status [#337](https://github.com/Puzzlepart/prosjektportalen365/issues/337)

### Feilrettinger

- Restricted access for members to certain lists [#356](https://github.com/Puzzlepart/prosjektportalen365/issues/356)
- Improved failure handling for PlannerConfiguration task in Project Setup [#329](https://github.com/Puzzlepart/prosjektportalen365/issues/329)
- Support adding AD groups to get porfolio insights from SP group [#332](https://github.com/Puzzlepart/prosjektportalen365/issues/332), [#352](https://github.com/Puzzlepart/prosjektportalen365/issues/352)
- Change to latest statusreport when creating a new statusreport [#343](https://github.com/Puzzlepart/prosjektportalen365/issues/343)
- Issue were user couldn't exit the portfolio filter pane [#353](https://github.com/Puzzlepart/prosjektportalen365/issues/353)

---

## 1.2.3 - 2020-10-07

### Ny funksjonalitet

- Descriptions on configuration page [#301](https://github.com/Puzzlepart/prosjektportalen365/issues/301)
- New group "Porteføljeinnsyn". Grants users in this group insight into all projects in the portfolio [#305](https://github.com/Puzzlepart/prosjektportalen365/issues/305)
- "Porteføljeinnsyn" button on configuration page for adding users to the group [#306](https://github.com/Puzzlepart/prosjektportalen365/issues/306)
- Risk matrix toggle: Before and after risk reduction measures [#293](https://github.com/Puzzlepart/prosjektportalen365/issues/293)
- Support for planner tasks references/attachments [#287](https://github.com/Puzzlepart/prosjektportalen365/issues/287)

### Feilrettinger

- View in portfolio overview was not changeable for non-admin users [#308](https://github.com/Puzzlepart/prosjektportalen365/issues/308)
- Projects set to Avsluttet are no longer visible on the front page [#307](https://github.com/Puzzlepart/prosjektportalen365/issues/307)

### Forbedringer

- Disabled "Ny statusrapport" when a report is unpublished. [#309](https://github.com/Puzzlepart/prosjektportalen365/issues/309)

---

## 1.2.2 - 2020-06-24

### Ny funksjonalitet

- Planner tasks copied to the project site during provisioning get label Metodikk [#276](https://github.com/Puzzlepart/prosjektportalen365/issues/276)

---

#### 1.2.1 - 2020-05-22

### Ny funksjonalitet

- Not using refiners from search anymore in `PortfolioOverview`, retrieving the values from the current collection instead [#244](https://github.com/Puzzlepart/prosjektportalen365/issues/244)
- Removed lists Information and Milestones [#266](https://github.com/Puzzlepart/prosjektportalen365/issues/266)

### Feilrettinger

- Removed "Add to portfolio" on Opportunities [#270](https://github.com/Puzzlepart/prosjektportalen365/issues/270)

---

## 1.2.0 - 2020-02-21

### Ny funksjonalitet

- Support for different phase term sets (to fully support different project templates/types) [#201](https://github.com/Puzzlepart/prosjektportalen365/issues/201)
- Support for different project metadata for different project types/templates
- Ability to connect template(s) to list content config
- Support for provisioning documents and folders to new project sites [#190](https://github.com/Puzzlepart/prosjektportalen365/issues/190)
- New column `Skjult` added to the list `Listeinnhold` [#227](https://github.com/Puzzlepart/prosjektportalen365/issues/227)
- Add the ability to set a template in Prosjektmaler as default [#233](https://github.com/Puzzlepart/prosjektportalen365/issues/233)
- Add the ability to set a icon for Prosjektmaler [#233](https://github.com/Puzzlepart/prosjektportalen365/issues/233)
- Improved layout for project template selector [#233](https://github.com/Puzzlepart/prosjektportalen365/issues/233)
- Support for role-only for resource allocation [#214](https://github.com/Puzzlepart/prosjektportalen365/issues/214)
- Misc allocation improvements [#139](https://github.com/Puzzlepart/prosjektportalen365/issues/139)
- Moving planner configuration to `Lists/Listeinnhold` (also support for cascade import [#228](https://github.com/Puzzlepart/prosjektportalen365/issues/228)
- Add `Gevinsteier` to `Gevinstanalyse og gevinstrealiseringsplan` [#162](https://github.com/Puzzlepart/prosjektportalen365/issues/162)
- Improved UI for summary view phase change modal [#235](https://github.com/Puzzlepart/prosjektportalen365/issues/235)
- Support for description for list content configurations ([#240](https://github.com/Puzzlepart/prosjektportalen365/issues/240))

### Feilrettinger

- Header columns mispositioned in portfolio overview [#207](https://github.com/Puzzlepart/prosjektportalen365/issues/207)
- Issue with mandatory project properties not synced to created projects [#215](https://github.com/Puzzlepart/prosjektportalen365/issues/215)
- Disabled template dropdown in project configurator if there's only 1 template selected

---

## 1.1.9 - 2020-01-20

### Feilrettinger

- Fixed rendering of status sections, some properties had no effect [#180](https://github.com/Puzzlepart/prosjektportalen365/issues/180)
- Sync project propertes after phase change [#196](https://github.com/Puzzlepart/prosjektportalen365/issues/196)
- Fixed an issue with installation script
- Fixed an overview with retrieving document template and library picker [#197](https://github.com/Puzzlepart/prosjektportalen365/issues/197)

### Ny funksjonalitet

- Installation writes to output which user it is connected with [#187](https://github.com/Puzzlepart/prosjektportalen365/issues/187)

---

## 1.1.8 - 2020-01-10

### Feilrettinger

- Stopped using PnP connections (which caused some issues) [#185](https://github.com/Puzzlepart/prosjektportalen365/issues/185)
- Removed library URL field from Listeinnhold list [#183](https://github.com/Puzzlepart/prosjektportalen365/issues/183)

---

## 1.1.7 - 2020-01-09

### Ny funksjonalitet

- RiskMatrix added as separate web part #97
- RiskMatrix added to project status [#172](https://github.com/Puzzlepart/prosjektportalen365/issues/172)
- Improved error messages when provisioning new projects [#170](https://github.com/Puzzlepart/prosjektportalen365/issues/170)
- Including previous budget numbers in new project status [#167](https://github.com/Puzzlepart/prosjektportalen365/issues/167)
- Better support for the Portfolio administrator role [#133](https://github.com/Puzzlepart/prosjektportalen365/issues/133)
- Made it possible to work with draft and published versions of project status reports [#119](https://github.com/Puzzlepart/prosjektportalen365/issues/119)
- Support for copying more than 100 items in CopyListData (up to 500)
- Support for installing to /teams/ [#177](https://github.com/Puzzlepart/prosjektportalen365/issues/177)

### Feilrettinger

- Fixed lookups in list 'Prosjektkolonnekonfigurasjon' [#142](https://github.com/Puzzlepart/prosjektportalen365/issues/142)
- Fixed colors and columns not matching content [#134](https://github.com/Puzzlepart/prosjektportalen365/issues/134)
- Fixed an issue with invalid web part properties on Oppgaver.aspx [#164](https://github.com/Puzzlepart/prosjektportalen365/issues/164)
- Added support for currency fields in Portfolio Insights [#155](https://github.com/Puzzlepart/prosjektportalen365/issues/155)
- Fields with \_ in field name doesn't sync to portfolio
- Persists selection for ListContentSection/ExtensionsSection [#182](https://github.com/Puzzlepart/prosjektportalen365/issues/182)

---

## 1.1.6 - 2019-11-14

### Feilrettinger

- Fixed a bug with current phase not being displayed in phase web part on project frontpage [#149](https://github.com/Puzzlepart/prosjektportalen365/issues/149)

---

## 1.1.5 - 2019-11-13

### Ny funksjonalitet

- Support for PSCredential in Install script [#145](https://github.com/Puzzlepart/prosjektportalen365/issues/145)
- Added missing resource for choice option (Choice_GtResourceAbsence_Linetasks) [#148](https://github.com/Puzzlepart/prosjektportalen365/issues/148)

### Feilrettinger

- Fixed project column configuration to make status colors work in portfolio overview [#142](https://github.com/Puzzlepart/prosjektportalen365/issues/142)

---

## 1.1.4 - 2019-10-30

### Ny funksjonalitet

- Added list 'Interessentregister' to portfolio level
- Using list fields instead of content type for 'Dokumenter' to keep the OOTB document type dropdown [#136](https://github.com/Puzzlepart/prosjektportalen365/issues/136)
- Updated Standardmal.txt to include Parameters
- Fixed colors and columns not matching content for resource allocation [#134](https://github.com/Puzzlepart/prosjektportalen365/issues/134)

---

## 1.1.3 - 2019-10-15

### Feilrettinger

- Fixed issue with document template selector on frontpage [#128](https://github.com/Puzzlepart/prosjektportalen365/issues/128)
- Include active/inactive projects field to filter projects from portfolio #99
- Fixed planner task creation. Still creating a plan even though setting `copyPlannerTasks` is set to `false` [#132](https://github.com/Puzzlepart/prosjektportalen365/issues/132)
- Fixed an issue with duplicate list items [#135](https://github.com/Puzzlepart/prosjektportalen365/issues/135)

---

## 1.1.2 - 2019-10-10

### Feilrettinger

- Added `-SkipTaxonomy` switch to Install script

---

## 1.1.1 - 2019-10-09

### Feilrettinger

- Fixed handling of user fields in project properties sync
- Fixed cache issue for ProjectInformation web part
- Economy fields also hidden from list instance due to issue with content type updates
- Added around in PortfolioOverview to fix issue with scroll [#116](https://github.com/Puzzlepart/prosjektportalen365/issues/116)

---

Formatet er basert på [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) og dette prosjektet følger [Semantic Versioning](http://semver.org/spec/v2.0.0.html).
