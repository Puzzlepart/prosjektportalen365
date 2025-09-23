# Utvikling av Prosjektportalen 365

## Innholdsfortegnelse

- [Utvikling av Prosjektportalen 365](#utvikling-av-prosjektportalen-365)
  - [Innholdsfortegnelse](#innholdsfortegnelse)
  - [Git og commit-praksis](#git-og-commit-praksis)
    - [Branching-strategi](#branching-strategi)
    - [Semantic Commit Messages](#semantic-commit-messages)
    - [GitHub Actions og commit-triggere](#github-actions-og-commit-triggere)
  - [Komponent oversikt](#komponent-oversikt)
  - [SPFx løsningene](#spfx-løsningene)
    - [shared-library](#shared-library)
    - [PortfolioExtensions](#portfolioextensions)
    - [PortfolioWebParts](#portfoliowebparts)
    - [ProgramWebParts](#programwebparts)
    - [ProjectExtensions](#projectextensions)
    - [ProjectWebParts](#projectwebparts)
  - [Bygging, pakketering og distribuering](#bygging-pakketering-og-distribuering)
    - [Rush](#rush)
    - [Bygging for utvikling](#bygging-for-utvikling)
    - [Legge til en ny npm-pakke med rush](#legge-til-en-ny-npm-pakke-med-rush)
    - [Oppdateringer til delt-bibliotek (shared-library)](#oppdateringer-til-delt-bibliotek-shared-library)
    - [Overvåk konfigurasjon og kanaler](#overvåk-konfigurasjon-og-kanaler)
    - [Bygg bare spesifikke komponenter](#bygg-bare-spesifikke-komponenter)
  - [Versjonering](#versjonering)
  - [Oppgaver](#oppgaver)

## Git og commit-praksis

### Branching-strategi

Prosjektportalen bruker en release-basert branching-strategi hvor vi har dedikerte branches for hver release:

Eksempel:

- `releases/1.12` - Gjeldende utviklings-branch
- `releases/1.11` - Forrige utgivelse  
- `releases/1.10` - Tidligere utgivelse
- osv...

Alle nye funksjoner og feilrettinger skal utvikles mot den aktuelle release-branch. Formatet på versjonene følger [Semantic Versioning](http://semver.org/spec/v2.0.0.html). `Minor`-release får egen branch. `Patch`-release inngår i den relevante branchen.

### Semantic Commit Messages

Vi bruker semantiske commit-meldinger for å gjøre historikken mer lesbar og for å automatisere versjonering og changelog-generering.

**Format:** `<type>(<scope>): <subject>`

`<scope>` er valgfri

**Eksempel:**

```text
feat: add hat to cat
^--^  ^------------^
|     |
|     +-> Sammendrag i presens
|
+-------> Type: chore, docs, feat, fix, refactor, style, ci eller install
```

**Commit-typer:**

- `feat`: ny funksjonalitet for brukeren (ikke ny funksjonalitet for byggskript)
- `fix`: feilretting for brukeren (ikke retting av byggskript)
- `docs`: endringer i dokumentasjon og /eller markdown-filer (changelog, readme...)
- `style`: formatering, manglende semikolon osv.; ingen endring i produksjenskode
- `refactor`: refaktorering av produksjenskode, f.eks. omdøping av en variabel
- `chore`: oppdatering av grunt-oppgaver osv.; ingen endring i produksjenskode
- `ci`: endringer i kontinuerlig integrasjon-konfigurasjon og skript (f.eks. GitHub Actions)
- `install`: endringer i Installasjonsskript

**Flere eksempler:**

```text
feat(portfoliowebparts): add new risk matrix component
fix(projectwebparts): resolve timeline rendering issue
docs: update installation guide
style(shared): fix indentation in utils
refactor(projectextensions): simplify project setup logic
chore: update dependencies
ci: improve build process
install: update installation scripts
```

**Referanser:**

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Commit Messages](https://seesparkbox.com/foundry/semantic_commit_messages)
- [Karma Git Commit Msg](http://karma-runner.github.io/1.0/dev/git-commit-msg.html)

### GitHub Actions og commit-triggere

Prosjektportalen bruker GitHub Actions for kontinuerlig integrasjon og deployment. Forskjellige commit-meldinger kan påvirke hvilke actions som kjøres:

**Actions som hopper over CI:**

- `[skip-ci]` - Hopper over alle CI-prosesser
- `[skip-main-ci]` - Hopper over hovedbygging (build-release.yml)
- `[skip-test-ci]` - Hopper over test-kanal bygging
- `[packages-only]` - Bygger kun pakker (appkatalog), hopper over deployment av templates. Brukes dersom du ikke har gjort noen endringer på .xml-filene i Templates.

**Eksempler på bruk:**

```text
docs: update README [skip-ci]
chore: update package.json [skip-main-ci]
fix(portfoliowebparts): minor styling fix [skip-test-ci]
feat(shared): add new utility function [packages-only]
```

**Aktive workflows:**

- **ci-releases.yml** - Kjører på `main` branch for release-bygging
- **build-release.yml** - Kjører på `siste releases branch` og `main` for full bygging
- **pr-package-spfx-dev.yml** - Kjører på pull requests mot release-branches
- **automatic_chores.yml** - Kjører automatiske vedlikeholdsoppgaver (linting ++)
- **ci-channel-test.yml** - Kanalspefikt bygger for testing

**Tips:** Bruk skip-flaggene når du gjør endringer som ikke påvirker funksjonaliteten (som dokumentasjonsoppdateringer) for å spare CI-ressurser. Eller det ikke er nødvendig å få med endringene dine dersom du skal gjøre flere relaterte endringer i samme branch.

## Komponent oversikt

| Navn                          | Løsning/Pakke       | Beskrivelse                                            | Id                                   |
| ----------------------------- | ------------------- | ------------------------------------------------------ | ------------------------------------ |
| Footer                        | PortfolioExtensions | Footer utvidelse (legger seg i bunnen)                 | 84f27cec-ffde-4e00-a4cf-25c69f691054 |
| IdeaProcessing                | PortfolioExtensions | Liste utvidelse for Idébehandling                      | b28cba0d-922c-44e0-a035-e4ea57d80e6d |
| IdeaProjectData               | PortfolioExtensions | Liste utvidelse for Idé - Prosjektdata                 | 69a7f6eb-e7ce-40eb-81e1-6f172a802619 |
| IdeaRegistration              | PortfolioExtensions | Liste utvidelse for Idéregistrering                    | 5d26712e-bdad-4ebf-b33f-9c759042bef6 |
| LatestProjectsWebPart         | PortfolioWebParts   | Siste prosjekter                                       | 941fd73c-b957-41c3-8d4f-082268407f10 |
| PortfolioAggregationWebPart   | PortfolioWebParts   | Portefølje aggregeringsoversikt (eks: Gevinstoversikt) | 6c0e484d-f6da-40d4-81fc-ec1389ef29a8 |
| PortfolioInsightsWebPart      | PortfolioWebParts   | Porteføljeinnsikt                                       | 875ca87a-e331-4ffb-bc69-0272fdf80e41 |
| PortfolioOverviewWebPart      | PortfolioWebParts   | Porteføljeoversikt                                     | e58e3d32-057a-4418-97ce-172b92482ba2 |
| ProjectListWebPart            | PortfolioWebParts   | Prosjektutlisting (porteføljeforside)                  | 54fbeb7d-e463-4dcc-8873-50a3ab2f0f68 |
| PortfolioTimelineWebPart      | PortfolioWebParts   | Prosjekttidslinje (Porteføljenivå)                     | 7284c568-f66c-4218-bb2c-3734a3cfa581 |
| ResourceAllocationWebPart     | PortfolioWebParts   | Ressursallokering (tidslinje)                          | 2ef269b2-6370-4841-8b35-2185b7ccb22a |
| IdeaModuleWebPart             | PortfolioWebParts   | Idémodul side for håndtering av Idéer                  | 20f151a9-6891-4408-a6d6-77e749b9e3e7 |
| ProjectCardWebPart            | PortfolioWebParts   | Prosjektkort                                           | 92d23158-485a-4103-96bb-d3036b347412 |
| ProgramAdministrationWebpart  | ProgramWebParts     | Program administrasjon                                 | 9570e369-21a6-4bf5-8198-13506499de52 |
| ProgramAggregationWebPart     | ProgramWebParts     | Program aggregeringsoversikt                           | 37c7e990-483d-4f70-b9b9-def1790817e7 |
| ProgramProjectOverviewWebPart | ProgramWebParts     | Programoversikt                                        | 01417142-67c8-498b-a6da-6e78003023dd |
| ProgramTimelineWebPart        | ProgramWebParts     | Prosjekttidslinje (Programnivå)                        | f97a38ab-78c2-400e-899f-b0d4cda76166 |
| ProjectSetup                  | ProjectExtensions   | Oppsett av prosjekt dialog                             | ce34553d-ab47-4107-8dd1-e980d953996d |
| ProjectUpgrade                | ProjectExtensions   | Oppgradering av prosjekt dialog                        | 453a6c1e-e1d0-4b12-a3fc-690a36da1f0c |
| TemplateSelectorCommand       | ProjectExtensions   | Dokumentmalvelger dialog (Malbibliotek)                | c9080212-e63e-47cc-8278-00ad38c3f5a5 |
| RiskActionPlanner             | ProjectExtensions   | Planner tiltak                                         | 1dd9fdb3-df0f-4248-a869-ca6f512e3d0f |
| OpportunityMatrixWebPart      | ProjectWebParts     | Mulighetsmatrise                                       | aff0baa2-9ab4-4c13-a062-d5fa5028121c |
| ProjectInformationWebPart     | ProjectWebParts     | Prosjektinformasjon                                    | b8bec0be-2354-443d-a3ca-24b36e8ea7dc |
| ProjectPhasesWebPart          | ProjectWebParts     | Fasevelger                                             | 4449d3dc-fa58-4982-b87c-5a893114e7b7 |
| ProjectStatusWebPart          | ProjectWebParts     | Prosjektstatus                                         | 681ad0dc-ddb5-4dba-a5d6-a42f6d1c90a6 |
| ProjectTimelineWebPart        | ProjectWebParts     | Prosjekttidslinje (Prosjektnivå)                       | d156652b-9121-47af-89ae-1fe8427c53da |
| RiskMatrixWebPart             | ProjectWebParts     | Risikomatrise                                          | e536ae15-0748-4d96-b160-3abb30f1b71e |
| ProjectNewsWebPart            | ProjectWebParts     | Prosjektnyheter                                        | a9097537-6860-4e05-99f3-4ee21782687f |
| SharedLibrary                 | SharedLibrary       | Pakke med delte komponenter                            | 0f65a874-dc9d-491d-b979-6ce1d943dd00 |

## SPFx løsningene

_På grunn av antallet komponenter, besluttet vi å dele komponentene inn i 6 forskjellige løsninger._

### [shared-library](./shared-library/README.md)

Delt kode for SharePoint-rammeverksløsninger i Prosjektportalen 365.

_Publisert til **npm** som `pp365-shared-library`_

### [PortfolioExtensions](./PortfolioExtensions/README.md)

| Løsningsnavn             | ID                                               |
| ------------------------ | ------------------------------------------------ |
| `pp-portfolio-extensons` | a3bf3315-0710-41f9-8836-2b61396d032fc16e2f72fb5b |

Utvidelser for portalens `portefølje-nivå`.

Overvåk endringer med npm-skriptet `watch`.

For pakking og distribusjon direkte til SharePoint, se `3. Bygging, pakketering og distribuering`.

_Publisert til **npm** som `pp365-portfolioextensions`_

### [PortfolioWebParts](./PortfolioWebParts/README.md)

| Løsningsnavn             | ID                                   |
| ------------------------ | ------------------------------------ |
| `pp-portfolio-web-parts` | 00483367-68e2-4977-9cc3-6cf0de623daa |

Webdeler for portalens `portefølje-nivå`.

Overvåk endringer med npm-skriptet `watch`.

For pakking og distribusjon direkte til SharePoint, se `3. Bygging, pakketering og distribuering`.

_Publisert til **npm** som `pp365-projectwebparts`_

### [ProgramWebParts](./ProgramWebParts/README.md)

| Løsningsnavn           | ID                                   |
| ---------------------- | ------------------------------------ |
| `pp-program-web-parts` | 8a9a0f4a-2e2f-4f13-aceb-867f82bd77eb |

Webdeler for portalens `program-nivå`.

Overvåk endringer med npm-skriptet `watch`.

For pakking og distribusjon direkte til SharePoint, se `3. Bygging, pakketering og distribuering`.

_Publisert til **npm** som `pp365-programwebparts`_

### [ProjectExtensions](./ProjectExtensions/README.md)

| Løsningsnavn           | ID                                   |
| ---------------------- | ------------------------------------ |
| `pp-project-extensons` | fe723971-d5c2-4698-91e3-c16e2f72fb5b |

Utvidelser for portalens `prosjekt-nivå`.

Overvåk endringer med npm-skriptet `watch`.

For pakking og distribusjon direkte til SharePoint, se `3. Bygging, pakketering og distribuering`.

_Publisert til **npm** som `pp365-projectextensions`_

### [ProjectWebParts](./ProjectWebParts/README.md)

| Løsningsnavn           | ID                                   |
| ---------------------- | ------------------------------------ |
| `pp-project-web-parts` | b69cb2f2-762d-425d-8e0b-d59c08918831 |

Webdeler for portalens `prosjekt-nivå`.

Overvåk endringer med npm-skriptet `watch`.

For pakking og distribusjon direkte til SharePoint, se `3. Bygging, pakketering og distribuering`.

_Publisert til **npm** som `pp365-projectwebparts`_

## Bygging, pakketering og distribuering

### Rush

Rush er et byggverktøy som brukes i Prosjektportalen for å administrere løsningene. Dette er spesielt nyttig da vi har et monorepo-oppsett hvor alle løsningene lagres i samme repo, da det lar oss administrere avhengigheter, byggprosesser og versjonering på tvers av alle løsninger på en konsistent måte.

I Prosjektportalen er Rush konfigurert via [`rush.json`](command:_github.copilot.openRelativePath?%5B%22rush.json%22%5D "rush.json")-filen. Denne filen spesifiserer Rush-versjonen som skal brukes, løsningene inkludert i mono-repoet, og ulike innstillinger relatert til versjonering og publisering.

Her er noen vanlige Rush-kommandoer vi ofte bruker når vi jobber med Prosjektportalen:

- `rush add -p [pakkenavn]`: Denne kommandoen legger til en ny pakke i mono-repoet. Den vil automatisk oppdatere `rush.json` og `package.json` for å inkludere den nye pakken.

- `rush update`: Denne kommandoen installerer pakkens avhengigheter og sørger for at riktige versjoner brukes på tvers av alle løsninger. Du bør kjøre denne kommandoen hver gang du kloner repo eller endrer noen pakkens avhengigheter.

- `rush build`: Denne kommandoen bygger alle løsningene i Prosjektportalen. Den bestiller byggprosessen intelligent basert på løsningingsavhengigheter, slik at avhengige løsningenr bygges i riktig rekkefølge.

- `rush rebuild`: Denne kommandoen ligner på `rush build`, men den tvinger en ren bygging av alle løsninger, og ignorerer eventuell mellomlagret byggetilstand.

For mer detaljert informasjon om hvordan du bruker Rush, kan du referere til den offisielle [Rush-dokumentasjonen](https://rushjs.io/).

### Bygging for utvikling

For å jobbe med de ulike løsningene, må du gjøre følgende:

1. Forsikre deg om at `npm` er installert.
2. Hvis du har `rush` installert, kjør `rush update && rush build` (eller bruk npm-skriptet `rush:init` i roten av prosjektet).

_For å installere `rush` globalt, kjør `npm i @microsoft/rush -g` i terminalen._

### Legge til en ny npm-pakke med rush

Ikke bruk lenger `npm i [pakkenavn] -S`. Med rush skal vi bruke `rush add -p [pakkenavn]`.

For å installere pakken for alle løsningene, legg til `--all` og legg til `-m` hvis du vil gjøre versjonen konsistent i alle løsningene.

Les mer om kommandoen `rush add` [her](https://rushjs.io/pages/commands/rush_add/).

### Oppdateringer til delt-bibliotek (shared-library)

Hvis du har utført endringer i `shared-library` som du vil skal ha effekt i en løsning som er avhengig av det, kan du bruke `rush rebuild`.

Kjør følgende for å bare bygge på nytt `pp365-shared-library`:

```pwsh
rush rebuild -o pp365-shared-library
```

_Det bør ikke ta mer enn 30 sekunder._

### Overvåk konfigurasjon og kanaler

Hvis du vil overvåke/skjelne endringer for en spesifikk kanal, kan du sette `SERVE_CHANNEL` i `.env`-filen til løsningen din.

Deretter kjører du `npm run watch` som du vanligvis gjør.

### Bygg bare spesifikke komponenter

Hvis du vil gjøre overvåking/serving raskere, kan du sette `SERVE_BUNDLE_REGEX` for å filtrere komponentene du vil bygge.

**Eksempel:**

```text
SERVE_CHANNEL=test
SERVE_BUNDLE_REGEX=latest-projects-web-part
```

Bare komponenten `LatestProject` vil bli bygget. `config.json` vil automatisk bli tilbakestilt når du avbryter overvåkingsskriptet.

## Versjonering

Oppdater aldri versjonen av løsningene uavhengig. Versjonen holdes automatisk synkronisert med de andre pakkene.

## Oppgaver

Se [Oppgaver](.tasks/README.md).
