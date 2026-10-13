## Testoversikt

Hvilke automatiske tester som dekker hver komponent, lag for lag, med noen ord om hva de sjekker. Hvordan testene skrives og kjøres, og hva vi gjør når en feiler, står i [Testregime](testing.md). Tallene er telt 2026-10-13. Legger du til eller fjerner en testfil, oppdaterer du raden for komponenten.

### Lagene

| Lag | Hvor | Kjører | Fanger |
|---|---|---|---|
| Jest (enhet og komponent) | `SharePointFramework/<løsning>/src/**/*.test.ts(x)` | I hvert bygg (`heft test`) | Logikk, reducere og komponenter i jsdom, med SharePoint byttet ut |
| Kjøretidskontrakt | `shared-library/test/runtime/*.test.mjs` | I bibliotekets bygg | Koblingen til ekte PnPjs, med falsk transport |
| Integrasjon | `integration/tests/*.test.ts` | I CI etter hver utrulling til testkanalen, ved siden av E2E; lokalt | Datalaget mot testtenanten: hva SharePoint lagrer og returnerer |
| E2E (Playwright) | `e2e/tests/smoke`, `e2e/tests/flows` (`e2e/tests/local` bare lokalt) | I CI etter hver utrulling til testkanalen | Sider og webdeler i nettleseren, brukerreiser |
| Manuell smoke-test | Issue-maler, se [Smoke test-prosessen](../utgivelse/smoketest.md) | Før utgivelse | Det som ikke er automatisert |

| Lag | Filer | Tester |
|---|---|---|
| Jest | 175 | 1 144: PortfolioExtensions 101, PortfolioWebParts 199, ProgramWebParts 59, ProjectExtensions 118, ProjectWebParts 215, shared-library 452 |
| Kjøretidskontrakt | 1 | 4 |
| Integrasjon | 10 | 41: 12 uten tenant, 29 mot testtenanten |
| E2E | 22 spesifikasjoner | 52: smoke 19, flows 26 (de to i CI), local 7 |

I kolonnene under betyr «skriver» at testen skriver til testtenanten og rydder etter seg. «Indirekte» betyr at komponenten står på en side en E2E-test åpner. Testen sjekker da ikke komponenten selv, men `openPage` feiler fortsatt på feilgrensen «Noe gikk galt», på en webdel fra en annen kanal og på bunter som ikke lastes.

### Porteføljen (PortfolioWebParts)

| Komponent | Jest | E2E | Integrasjon | Ikke dekket / manuelt |
|---|---|---|---|---|
| Porteføljeoversikt | 7 filer, 54: reducer, filtrering, Excel-eksport, kolonnemeny, kolonneskjema | Smoke: listen, søk, filter, Excel-eksport. Flows: kolonnemeny på høyreklikk, dra kolonner, panelets topp, tittelknappen, typografi, navigasjon, ny kolonne (skriver) | Prosjektkolonner; ny kolonne i en visning, også med skjulte kolonner (skriver); kolonnekonfigurasjon; standardvisningen og fargene for `Status muligheter` etter oppgradering | — |
| Delt liste (`List`, `ListGrid`, `Vis eller skjul kolonner`) | 6 filer, 41 | Gjennom flytene for porteføljeoversikten | — | — |
| Portefølje aggregeringsoversikt | 9 filer, 75: reducer (51), datahenting, Excel-eksport, verktøylinje, gruppering | Smoke: aggregeringssidene og Nytteoversikt med filter. Flows: typografi | — | Hubens dataadapter |
| Prosjektutlisting | 4 filer, 16 | Flows: kortets panel viser prosjektnavnet | — | — |
| Prosjekttidslinje (porteføljenivå) | Via bibliotekets `ProjectTimeline` (22) | Smoke: prøveklikk på en prosjektlenke, filter | — | Ingen test av webdelen selv |
| Siste prosjekter | 5: nyeste områder, vis flere/færre, tom, feil | Indirekte (hubens forside) | — | — |
| Ressursallokering | 2 | — | — | Bare Jest |
| Idémodul | 2 filer, 4 | — | — | Bare Jest; idéflyten er manuell |
| Prosjektkort | 2 | — | — | Bare Jest |

### Program (ProgramWebParts)

| Komponent | Jest | E2E | Integrasjon | Ikke dekket / manuelt |
|---|---|---|---|---|
| Programadministrasjon | 7 filer, 45: liste, reducer, kommandoer, fjerning av underområder | Flows: utvalg, grupper, kolonner, søk, høyreklikk, fjerne og legge til et underområde igjen (skriver), faste kolonneoverskrifter | Programmet og prosjektene knyttet begge veier | Programmets egen adapter (legge til og fjerne) |
| Program aggregeringsoversikt | 7, i tillegg til testene for aggregeringsoversikten | — | Søket over programmets prosjekter (`searchAggregatedItems`) | Ingen E2E |
| Programoversikt | 5, i tillegg til testene for porteføljeoversikten | Smoke: underområdene listes med teller | Programmets prosjekter | — |
| Prosjekttidslinje (programnivå) | 2, i tillegg til bibliotekets tidslinje | Smoke: siden lastes | — | Innholdet sjekkes ikke i E2E |

### Prosjekt (ProjectWebParts)

| Komponent | Jest | E2E | Integrasjon | Ikke dekket / manuelt |
|---|---|---|---|---|
| Prosjektinformasjon | 5 filer, 31, og bibliotekets `CustomEditPanel` (39) | Smoke: monteres, «Vis all prosjektinformasjon». Flows: personvelgeren og panelene (lukker uten å lagre), lenken tilbake til huben | Egenskaper tur-retur: datoer i fem tidssoner, tekst, valg, person, termer (skriver); hubraden og synkroniseringen til den, også gjennom ProjectWebParts' adapter (skriver) | Lagring gjøres ikke i E2E |
| Fasevelger | 4 filer, 30: reducer, fasedialogen | Smoke: fasene vises, prøveklikk på hver | Fasene fra termlageret, etikettene og tekstene; `getPhases`; kjøretidskontrakten for termlageret | Å endre fase er ikke automatisert |
| Prosjektstatus | 15 filer, 73: reducer, seksjoner, verktøylinje, faner, delprosjekter | Smoke: siden monteres. Flows: kladd opprettet og slettet (skriver), fanene og seksjonene | Kladd i en egen rapportserie, fylt ut, lest med personen og slettet (skriver) | Publisering er manuell |
| Risikomatrise og Mulighetsmatrise | 4 og 2, og 15 delte: begge webdelene, prosjekt- og programmodus | — (står på ingen malside) | Søket med matrisens datakilde, også gjennom ProjectWebParts' adapter på programmet; datakildene finnes etter oppgradering | Ingen E2E |
| Prosjekttidslinje (prosjektnivå) | 4 filer, 17 | Smoke: listen får plass i 1280 og 1920 px. Flows: typografi | — | Tidslinjens stolper |
| Prosjektnyheter | 2 filer, 7 | Indirekte (prosjektets forside) | — | Å opprette en nyhetsside |
| Dynamisk liste | 6 filer, 33 | Flows: typografi (hoppes over når siden mangler) | — | Skriving og egne handlinger |

### Utvidelser (PortfolioExtensions og ProjectExtensions)

| Komponent | Jest | E2E | Integrasjon | Ikke dekket / manuelt |
|---|---|---|---|---|
| Footer | 2 filer, 40: montering, assistenttilgang, hjelp, versjoner | Smoke: versjonen vises | — | Lenker, hjelp og assistent bare i Jest |
| Idébehandling, Idéregistrering, Idé – Prosjektdata | 13, 13 og 11, og delte dialoger (12) | — | — | Idéflyten er manuell |
| Malpakkekatalog | 2 filer, 10 | — | — | Bare Jest |
| Oppsett av prosjekt | 11 filer, 65: utvidelsen, dialogen, reducer, progresjon og feil | — | Bevisst utelatt: kjernen går gjennom JSOM (`syncList`), og hubraden krever et nytt område per kjøring | «Opprett nytt prosjekt» i den manuelle smoke-testen |
| Oppgradering av prosjekt | 1 | — | Installasjonsloggen etter oppgraderingen (installasjonsskriptet, ikke utvidelsen) | — |
| Dokumentmalvelger | 5 filer, 35 | Smoke: listene får plass, målmappe velges bort igjen (oppretter en mappe ved behov). Flows: kopi av en mal (skriver) | — | — |
| Planner-tiltak | 3 filer, 14 | — | — | Bare Jest |

### Det delte biblioteket (shared-library)

| Del | Jest | Integrasjon |
|---|---|---|
| `CustomEditPanel` | 5 filer, 39 | Datoer i fem tidssoner, person og termer |
| `PortalDataService` | 9 | Kolonner, visninger, konfigurasjon, innstillinger, statusrapporter, programrelasjoner |
| `ProjectDataService` | 11 | Egenskaper tur-retur, faser |
| `SPDataAdapterBase` og `EntityPortalService` | 43 | Hubraden og synkroniseringen |
| `searchAggregatedItems` | 4 | Egenskaper og formater, bla mellom sider, oppdeling, eget område |
| Termlageret (`taxonomy`) | 73, og kjøretidskontrakten (4) | Fasene og etikettene |
| `DataSourceService` | Ingen | Matrisenes datakilder slått opp på ID |
| `DataGridList`, `PeoplePicker`, `FilterPanel`, `Toolbar`, `ProjectTimeline`, `ExcelExportService` | 20, 8, 11, 10, 22, 24 | — (E2E dekker dem gjennom webdelene) |

### Integrasjonstestene

| Fil | Tester | Sjekker |
|---|---|---|
| `harness` | 12, uten tenant | Strengene, AMD-feil, at tjenestene lastes, SPFx-konteksten, språksjekken, sertifikatet, `appOnlyDenied` |
| `reachability` | 3 | Hubens web, søk og termlageret i innloggingsmodusen |
| `portal-data-service` | 2 | Prosjektkolonnene, og at prosjektet finner huben |
| `search` | 4 | Matrisens egenskaper og formater, sider, oppdeling, eget område |
| `term-store` | 3 | Etikettene og reservespråkene, fasetekstene, `getPhases` |
| `project-properties` | 4 (skriver) | Datoer lagret og vist i fem tidssoner, tekst/valg/person, termer |
| `hub` | 5 (2 skriver) | Hubraden, synkroniseringen, ny kolonne i en visning, kolonnekonfigurasjon og innstillinger, program og prosjekter |
| `status-reports` | 1 (skriver) | Kladd i en egen rapportserie, utfylt, lest med personen og slettet |
| `template` | 5 (4 etter full oppgradering) | Installasjonsloggen, fargene for `Status muligheter`, interessentfeltet, matrisenes datakilder, standardvisningen |
| `project-web-parts` | 2 (1 skriver) | ProjectWebParts' synkronisering til huben, og matrisens datakilde på programmet |

### Hull verdt å kjenne til

- **Bare Jest**, uten E2E og integrasjon: Ressursallokering, Idémodul, Prosjektkort, idéutvidelsene, Malpakkekatalog, Oppsett av prosjekt, Oppgradering av prosjekt og Planner-tiltak.
- **Integrasjon, men ingen E2E:** Risikomatrise, Mulighetsmatrise og Program aggregeringsoversikt.
- **Bare indirekte i E2E:** Siste prosjekter og Prosjektnyheter.
- **Manuelt:** prosjektoppsett, publisering av statusrapport, idéflyten og å endre fase.
- **Ingen test:** ikonhjelperne (`getFluentIcon`, `resolveFluentIcon`), `DataService.ts` og `ListLogger.ts`. Programmets tidslinjeside (`Tidslinje.aspx`) åpnes ikke av noen E2E-test.
- **Utenfor komponentene:** `.tasks/check-channel-ids.test.js` (5 tester, `npm run test:tasks`).
