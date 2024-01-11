# 1. Komponent oversikt

| Navn                          | Løsning/Pakke       | Beskrivelse                                                 | Id                                   |
| ----------------------------- | ------------------- | ----------------------------------------------------------- | ------------------------------------ |
| Footer                        | PortfolioExtensions | Footer utvidelse (legger seg i bunnen)                      | 84f27cec-ffde-4e00-a4cf-25c69f691054 |
| IdeaProcessing                | PortfolioExtensions | Liste utvidelse for Idébehandling                           | b28cba0d-922c-44e0-a035-e4ea57d80e6d |
| IdeaProjectData               | PortfolioExtensions | Liste utvidelse for Idé - Prosjektdata                      | 69a7f6eb-e7ce-40eb-81e1-6f172a802619 |
| IdeaRegistration              | PortfolioExtensions | Liste utvidelse for Idéregistrering                         | 5d26712e-bdad-4ebf-b33f-9c759042bef6 |
| LatestProjectsWebPart         | PortfolioWebParts   | Siste prosjekter                                            | 941fd73c-b957-41c3-8d4f-082268407f10 |
| PortfolioAggregationWebPart   | PortfolioWebParts   | Portefølje aggregeringsoversikt (eksempel: Gevinstoversikt) | 6c0e484d-f6da-40d4-81fc-ec1389ef29a8 |
| PortfolioInsightsWebPart      | PortfolioWebParts   | Porteføljeinnsyn                                            | 875ca87a-e331-4ffb-bc69-0272fdf80e41 |
| PortfolioOverviewWebPart      | PortfolioWebParts   | Porteføljeoversikt                                          | e58e3d32-057a-4418-97ce-172b92482ba2 |
| ProjectListWebPart            | PortfolioWebParts   | Prosjektutlisting (porteføljeforside)                       | 54fbeb7d-e463-4dcc-8873-50a3ab2f0f68 |
| PortfolioTimelineWebPart      | PortfolioWebParts   | Prosjekttidslinje (Porteføljenivå)                          | 7284c568-f66c-4218-bb2c-3734a3cfa581 |
| ResourceAllocationWebPart     | PortfolioWebParts   | Ressursallokering (tidslinje)                               | 2ef269b2-6370-4841-8b35-2185b7ccb22a |
| ProgramAdministrationWebpart  | ProgramWebParts     | Program administrasjon                                      | 9570e369-21a6-4bf5-8198-13506499de52 |
| ProgramAggregationWebPart     | ProgramWebParts     | Program aggregeringsoversikt                                | 37c7e990-483d-4f70-b9b9-def1790817e7 |
| ProgramProjectOverviewWebPart | ProgramWebParts     | Programoversikt                                             | 01417142-67c8-498b-a6da-6e78003023dd |
| ProgramTimelineWebPart        | ProgramWebParts     | Prosjekttidslinje (Programnivå)                             | f97a38ab-78c2-400e-899f-b0d4cda76166 |
| ProjectSetup                  | ProjectExtensions   | Oppsett av prosjekt dialog                                  | ce34553d-ab47-4107-8dd1-e980d953996d |
| ProjectUpgrade                | ProjectExtensions   | Oppgradering av prosjekt dialog                             | 453a6c1e-e1d0-4b12-a3fc-690a36da1f0c |
| TemplateSelectorCommand       | ProjectExtensions   | Dokumentmalvelger dialog (Malbibliotek)                     | c9080212-e63e-47cc-8278-00ad38c3f5a5 |
| RiskActionPlanner             | ProjectExtensions   | Planner tiltak                                              | 2511e707-1b8a-4dc3-88d1-b7002eb3ce54 |
| OpportunityMatrixWebPart      | ProjectWebParts     | Mulighetsmatrise                                            | aff0baa2-9ab4-4c13-a062-d5fa5028121c |
| ProjectInformationWebPart     | ProjectWebParts     | Prosjektinformasjon                                         | b8bec0be-2354-443d-a3ca-24b36e8ea7dc |
| ProjectPhasesWebPart          | ProjectWebParts     | Fasevelger                                                  | 4449d3dc-fa58-4982-b87c-5a893114e7b7 |
| ProjectStatusWebPart          | ProjectWebParts     | Prosjektstatus                                              | 681ad0dc-ddb5-4dba-a5d6-a42f6d1c90a6 |
| ProjectTimelineWebPart        | ProjectWebParts     | Prosjekttidslinje (Prosjektnivå)                            | d156652b-9121-47af-89ae-1fe8427c53da |
| RiskMatrixWebPart             | ProjectWebParts     | Risikomatrise                                               | e536ae15-0748-4d96-b160-3abb30f1b71e |
| SharedLibrary                 | SharedLibrary       | Pakke med delte komponenter                                 | 0f65a874-dc9d-491d-b979-6ce1d943dd00 |

# 2. SPFx løsningene

_På grunn av antallet komponenter, besluttet vi å dele komponentene inn i 5 forskjellige løsninger._

## [shared-library](./shared-library/README.md)

Delt kode for SharePoint-rammeverksløsninger i Prosjektportalen 365.

_Publisert til **npm** som `pp365-shared-library`_

## [PortfolioExtensions](./PortfolioExtensions/README.md)

| Løsningsnavn             | ID                                               |
| ------------------------ | ------------------------------------------------ |
| `pp-portfolio-extensons` | a3bf3315-0710-41f9-8836-2b61396d032fc16e2f72fb5b |

Utvidelser for portalens `portefølje-nivå`.

Overvåk endringer med npm-skriptet `watch`.

For pakking og distribusjon direkte til SharePoint, se `3. Bygging, pakketering og distribuering`.

_Publisert til **npm** som `pp365-portfolioextensions`_

## [PortfolioWebParts](./PortfolioWebParts/README.md)

| Løsningsnavn             | ID                                   |
| ------------------------ | ------------------------------------ |
| `pp-portfolio-web-parts` | 00483367-68e2-4977-9cc3-6cf0de623daa |

Webdeler for portalens `portefølje-nivå`.

Overvåk endringer med npm-skriptet `watch`.

For pakking og distribusjon direkte til SharePoint, se `3. Bygging, pakketering og distribuering`.

_Publisert til **npm** som `pp365-projectwebparts`_

## [ProgramWebParts](./ProgramWebParts/README.md)

| Løsningsnavn           | ID                                   |
| ---------------------- | ------------------------------------ |
| `pp-program-web-parts` | 8a9a0f4a-2e2f-4f13-aceb-867f82bd77eb |

Webdeler for portalens `program-nivå`.

Overvåk endringer med npm-skriptet `watch`.

For pakking og distribusjon direkte til SharePoint, se `3. Bygging, pakketering og distribuering`.

_Publisert til **npm** som `pp365-programwebparts`_

## [ProjectExtensions](./ProjectExtensions/README.md)

| Løsningsnavn           | ID                                   |
| ---------------------- | ------------------------------------ |
| `pp-project-extensons` | fe723971-d5c2-4698-91e3-c16e2f72fb5b |

Utvidelser for portalens `prosjekt-nivå`.

Overvåk endringer med npm-skriptet `watch`.

For pakking og distribusjon direkte til SharePoint, se `3. Bygging, pakketering og distribuering`.

_Publisert til **npm** som `pp365-projectextensions`_

## [ProjectWebParts](./ProjectWebParts/README.md)

| Løsningsnavn           | ID                                   |
| ---------------------- | ------------------------------------ |
| `pp-project-web-parts` | b69cb2f2-762d-425d-8e0b-d59c08918831 |

Webdeler for portalens `prosjekt-nivå`.

Overvåk endringer med npm-skriptet `watch`.

For pakking og distribusjon direkte til SharePoint, se `3. Bygging, pakketering og distribuering`.

_Publisert til **npm** som `pp365-projectwebparts`_

# 3. Bygging, pakketering og distribuering

## Bygging for utvikling

For å jobbe med de ulike løsningene, må du gjøre følgende:

1. Forsikre deg om at `npm` er installert.
2. Hvis du har `rush` installert, kjør `rush update && rush build` (eller bruk npm-skriptet `rush:init` i roten av prosjektet).

_For å installere `rush` globalt, kjør `npm i @microsoft/rush -g` i terminalen._

## Legge til en ny npm-pakke med rush
Ikke bruk lenger `npm i [pakkenavn] -S`. Med rush skal vi bruke `rush add -p [pakkenavn]`.

For å installere pakken for alle løsningene, legg til `--all` og legg til `-m` hvis du vil gjøre versjonen konsistent i alle løsningene.

Les mer om kommandoen `rush add` [her](https://rushjs.io/pages/commands/rush_add/).

## Oppdateringer til delt-bibliotek (shared-library)
Hvis du har endringer i `shared-library` som du vil skal ha effekt i en løsning som er avhengig av det, kan du bruke `rush rebuild`.

Kjør følgende for å bare bygge på nytt `pp365-shared-library`:

```pwsh
rush rebuild -o pp365-shared-library
```

_Det bør ikke ta mer enn 30 sekunder._

## Overvåk konfigurasjon og kanaler
Hvis du vil overvåke/skjelne endringer for en spesifikk kanal, kan du sette `SERVE_CHANNEL` i `.env`-filen til løsningen din.

Deretter kjører du `npm run watch` som du vanligvis gjør.

## Bygg bare spesifikke komponenter
Hvis du vil gjøre overvåking/serving raskere, kan du sette `SERVE_BUNDLE_REGEX` for å filtrere komponentene du vil bygge.

**Eksempel:**

```
SERVE_CHANNEL=test
SERVE_BUNDLE_REGEX=latest-projects-web-part
```

Bare komponenten `LatestProject` vil bli bygget. `config.json` vil automatisk bli tilbakestilt når du avbryter overvåkingsskriptet.

# 4. Versjonering
Oppdater aldri versjonen av løsningene uavhengig. Versjonen holdes automatisk synkronisert med de andre pakkene.

# 5. Oppgaver
Se [Oppgaver](.tasks/README.md).