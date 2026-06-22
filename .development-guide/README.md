<!-- ⚠️ This README has been generated from the file(s) ".development-guide/.README" ⚠️--><p align="center">
  <img src="../assets/pp365_logo.png" alt="Logo" width="119" height="119" />
</p> <p align="center">
  <b>Prosjektportalen et prosjektstyringsverktøy for Microsoft 365 basert på Prosjektveiviseren.</b></br>
  <sub>Utviklerguide<sub>
</p>

<br />


<details>
<summary>📖 Innholdsfortegnelse</summary>
<br />

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#table-of-contents)

## ➤ Table of Contents

* [➤ Branching-strategi og arbeidsflyt](#-branching-strategi-og-arbeidsflyt)
	* [Branching-strategi](#branching-strategi)
	* [Arbeidsflyt for GitHub Issues](#arbeidsflyt-for-github-issues)
* [➤ Commit-praksis](#-commit-praksis)
	* [Semantiske commit-meldinger](#semantiske-commit-meldinger)
	* [GitHub Actions og commit-triggere](#github-actions-og-commit-triggere)
* [➤ Komponentoversikt](#-komponentoversikt)
* [➤ SPFx-løsningene](#-spfx-lsningene)
	* [shared-library](#shared-library)
	* [PortfolioExtensions](#portfolioextensions)
	* [PortfolioWebParts](#portfoliowebparts)
	* [ProgramWebParts](#programwebparts)
	* [ProjectExtensions](#projectextensions)
	* [ProjectWebParts](#projectwebparts)
* [➤ Rush og bygging](#-rush-og-bygging)
	* [Rush](#rush)
	* [Bygging for utvikling](#bygging-for-utvikling)
	* [Legge til en ny npm-pakke med Rush](#legge-til-en-ny-npm-pakke-med-rush)
	* [Oppdateringer til delt-bibliotek (shared-library)](#oppdateringer-til-delt-bibliotek-shared-library)
	* [Full tilbakestilling av Rush-tilstand](#full-tilbakestilling-av-rush-tilstand)
	* [Overvåk konfigurasjon og kanaler](#overvk-konfigurasjon-og-kanaler)
	* [Bygg bare spesifikke komponenter](#bygg-bare-spesifikke-komponenter)
	* [Oppgaver](#oppgaver)
* [➤ npm-skript](#-npm-skript)
	* [Skript i roten (`package.json`)](#skript-i-roten-packagejson)
	* [Skript i SPFx-løsningene](#skript-i-spfx-lsningene)
	* [Skript i `SharePointFramework/shared-library`](#skript-i-sharepointframeworkshared-library)
	* [Skript i `SharePointFramework/.tasks`](#skript-i-sharepointframeworktasks)
	* [Skript i `Templates`](#skript-i-templates)
	* [Vanlige arbeidsflyter](#vanlige-arbeidsflyter)
* [➤ Konfigurasjon av utviklingsmiljø](#-konfigurasjon-av-utviklingsmilj)
	* [Oppsett av miljøsystemet](#oppsett-av-miljsystemet)
		* [1. `.env.template` og `.env`](#1-envtemplate-og-env)
		* [2. Overvåkingsskript i `package.json`](#2-overvkingsskript-i-packagejson)
	* [Hvordan det fungerer i praksis](#hvordan-det-fungerer-i-praksis)
	* [Fordeler med denne tilnærmingen](#fordeler-med-denne-tilnrmingen)
		* [3. `environments.json`](#3-environmentsjson)
* [➤ Site Design / Site Scripts](#-site-design--site-scripts)
* [➤ JS-provisjoneringsmal](#-js-provisjoneringsmal)
* [➤ Maler](#-maler)
	* [JSON-provisjoneringsmal](#json-provisjoneringsmal)
		* [Bygging av JSON-maler](#bygging-av-json-maler)
	* [PnP-maler](#pnp-maler)
		* [Portefølje](#porteflje)
		* [Innholdsmaler](#innholdsmaler)
* [➤ Installasjonskanaler](#-installasjonskanaler)
	* [Generere en ny kanalkonfigurasjon](#generere-en-ny-kanalkonfigurasjon)
	* [Bygge en ny versjon for en kanal](#bygge-en-ny-versjon-for-en-kanal)
	* [Hvordan kanalbygget fungerer (`.current-channel-config.json`)](#hvordan-kanalbygget-fungerer-current-channel-configjson)
	* [Skjemavalidering](#skjemavalidering)
	* [Viktig: avbrutt bygg](#viktig-avbrutt-bygg)
* [➤ Versjonering](#-versjonering)
* [➤ Smoke test-prosessen](#-smoke-test-prosessen)
	* [Hva er en smoke test?](#hva-er-en-smoke-test)
	* [Issue-maler for smoke test](#issue-maler-for-smoke-test)
	* [Slik gjennomføres smoke test](#slik-gjennomfres-smoke-test)
	* [Vedlikehold av malene](#vedlikehold-av-malene)
	* [Tips](#tips)
* [➤ Opprettelse av en ny versjon](#-opprettelse-av-en-ny-versjon)
	* [Patch-utgivelse](#patch-utgivelse)
	* [Minor-utgivelse](#minor-utgivelse)
* [➤ Bygge en ny utgivelse](#-bygge-en-ny-utgivelse)
* [➤ NPM](#-npm)
* [➤ Kontinuerlig integrasjon](#-kontinuerlig-integrasjon)
	* [CI (releases/*)](#ci-releases)
	* [Bygg og installer (dev)](#bygg-og-installer-dev)
	* [CI (channels/test)](#ci-channelstest)
	* [Bygg utgivelse (main)](#bygg-utgivelse-main)
	* [Aktive arbeidsflyter](#aktive-arbeidsflyter)
* [➤ README-generering](#-readme-generering)
* [➤ SBOM-generering](#-sbom-generering)
	* [Hva er SBOM?](#hva-er-sbom)
	* [Automatisk generering](#automatisk-generering)
	* [Manuell generering](#manuell-generering)
	* [Innhold i SBOM](#innhold-i-sbom)
	* [Filplassering](#filplassering)
	* [GitHub-arbeidsflyt](#github-arbeidsflyt)
	* [Skriptdetaljer](#skriptdetaljer)
	* [Oppdatering av avhengigheter](#oppdatering-av-avhengigheter)
	* [Sikkerhetshensyn](#sikkerhetshensyn)
</details>


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#branching-strategi-og-arbeidsflyt)

## ➤ Branching-strategi og arbeidsflyt

### Branching-strategi

Prosjektportalen bruker en utgivelsesbasert branching-strategi hvor vi har dedikerte branches for hver utgivelse:

Eksempel:

- `releases/1.12` - Gjeldende utviklings-branch
- `releases/1.11` - Forrige utgivelse
- `releases/1.10` - Tidligere utgivelse
- osv...

Alle nye funksjoner og feilrettinger skal utvikles mot den aktuelle release-branchen. Formatet på versjonene følger [Semantic Versioning](http://semver.org/spec/v2.0.0.html). `Minor`-utgivelse får egen branch. `Patch`-utgivelse inngår i den relevante branchen.

### Arbeidsflyt for GitHub Issues

Når du jobber med et spesifikt GitHub issue, opprett en branch fra gjeldende release-branch med følgende navnekonvensjon:

```text
issues/<issue-nummer>
```

**Eksempler:**

```bash
git checkout releases/1.12
git checkout -b issues/1628
```

Når arbeidet er ferdig, opprett en pull request tilbake til release-branchen. Husk å referere til issue-nummeret i PR-beskrivelsen.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#commit-praksis)

## ➤ Commit-praksis

### Semantiske commit-meldinger

Vi bruker semantiske commit-meldinger for å gjøre historikken mer lesbar og for å automatisere versjonering og changelog-generering.

**OBS: Alle commit-meldinger skal skrives på engelsk.**

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
- `docs`: endringer i dokumentasjon og/eller markdown-filer (changelog, readme...)
- `style`: formatering, manglende semikolon osv.; ingen endring i produksjonskode
- `refactor`: refaktorering av produksjonskode, f.eks. omdøping av en variabel
- `chore`: oppdatering av grunt-oppgaver osv.; ingen endring i produksjonskode
- `ci`: endringer i kontinuerlig integrasjon-konfigurasjon og skript (f.eks. GitHub Actions)
- `install`: endringer i installasjonsskript

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

Prosjektportalen bruker GitHub Actions for kontinuerlig integrasjon og utrulling. Forskjellige commit-meldinger kan påvirke hvilke actions som kjøres:

**Actions som hopper over CI:**

- `[skip-ci]` - Hopper over alle CI-prosesser
- `[skip-main-ci]` - Hopper over hovedbygging (build-release.yml)
- `[skip-test-ci]` - Hopper over test-kanal bygging
- `[apps-only]` - Bygger kun pakker (appkatalog), hopper over utrulling av maler. Brukes dersom du ikke har gjort noen endringer på .xml-filene i Templates.

**Eksempler på bruk:**

```text
docs: update README [skip-ci]
chore: update package.json [skip-main-ci]
fix(portfoliowebparts): minor styling fix [skip-test-ci]
feat(shared): add new utility function [apps-only]
```

**Aktive arbeidsflyter:**

- **ci-releases.yml** - Kjører på `main`-branch for utgivelsesbygging
- **build-release.yml** - Kjører på siste releases-branch og `main` for full bygging
- **pr-package-spfx-dev.yml** - Kjører på pull requests mot release-branches
- **automatic_chores.yml** - Kjører automatiske vedlikeholdsoppgaver (linting m.m.)
- **ci-channel-test.yml** - Kanalspesifikt bygg for testing

**Tips:** Bruk skip-flaggene når du gjør endringer som ikke påvirker funksjonaliteten (som dokumentasjonsoppdateringer) for å spare CI-ressurser. Eller dersom det ikke er nødvendig å få med endringene dine når du skal gjøre flere relaterte endringer i samme branch.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#komponentoversikt)

## ➤ Komponentoversikt

| Navn                          | Løsning/Pakke       | Beskrivelse                                            | Id                                   |
| ----------------------------- | ------------------- | ------------------------------------------------------ | ------------------------------------ |
| Footer                        | PortfolioExtensions | Footer-utvidelse (legger seg i bunnen)                 | 84f27cec-ffde-4e00-a4cf-25c69f691054 |
| IdeaProcessing                | PortfolioExtensions | Listeutvidelse for Idébehandling                       | b28cba0d-922c-44e0-a035-e4ea57d80e6d |
| IdeaProjectData               | PortfolioExtensions | Listeutvidelse for Idé - Prosjektdata                  | 69a7f6eb-e7ce-40eb-81e1-6f172a802619 |
| IdeaRegistration              | PortfolioExtensions | Listeutvidelse for Idéregistrering                     | 5d26712e-bdad-4ebf-b33f-9c759042bef6 |
| LatestProjectsWebPart         | PortfolioWebParts   | Siste prosjekter                                       | 941fd73c-b957-41c3-8d4f-082268407f10 |
| PortfolioAggregationWebPart   | PortfolioWebParts   | Portefølje aggregeringsoversikt (eks: Gevinstoversikt) | 6c0e484d-f6da-40d4-81fc-ec1389ef29a8 |
| PortfolioOverviewWebPart      | PortfolioWebParts   | Porteføljeoversikt                                     | e58e3d32-057a-4418-97ce-172b92482ba2 |
| ProjectListWebPart            | PortfolioWebParts   | Prosjektutlisting (porteføljeforside)                  | 54fbeb7d-e463-4dcc-8873-50a3ab2f0f68 |
| PortfolioTimelineWebPart      | PortfolioWebParts   | Prosjekttidslinje (Porteføljenivå)                     | 7284c568-f66c-4218-bb2c-3734a3cfa581 |
| ResourceAllocationWebPart     | PortfolioWebParts   | Ressursallokering (tidslinje)                          | 2ef269b2-6370-4841-8b35-2185b7ccb22a |
| IdeaModuleWebPart             | PortfolioWebParts   | Idémodul-side for håndtering av idéer                  | 20f151a9-6891-4408-a6d6-77e749b9e3e7 |
| ProjectCardWebPart            | PortfolioWebParts   | Prosjektkort                                           | 92d23158-485a-4103-96bb-d3036b347412 |
| ProgramAdministrationWebpart  | ProgramWebParts     | Programadministrasjon                                  | 9570e369-21a6-4bf5-8198-13506499de52 |
| ProgramAggregationWebPart     | ProgramWebParts     | Program aggregeringsoversikt                           | 37c7e990-483d-4f70-b9b9-def1790817e7 |
| ProgramProjectOverviewWebPart | ProgramWebParts     | Programoversikt                                        | 01417142-67c8-498b-a6da-6e78003023dd |
| ProgramTimelineWebPart        | ProgramWebParts     | Prosjekttidslinje (Programnivå)                        | f97a38ab-78c2-400e-899f-b0d4cda76166 |
| ProjectSetup                  | ProjectExtensions   | Oppsett av prosjekt-dialog                             | ce34553d-ab47-4107-8dd1-e980d953996d |
| ProjectUpgrade                | ProjectExtensions   | Oppgradering av prosjekt-dialog                        | 453a6c1e-e1d0-4b12-a3fc-690a36da1f0c |
| TemplateSelectorCommand       | ProjectExtensions   | Dokumentmalvelger-dialog (Malbibliotek)                | c9080212-e63e-47cc-8278-00ad38c3f5a5 |
| RiskActionPlanner             | ProjectExtensions   | Planner-tiltak                                         | 1dd9fdb3-df0f-4248-a869-ca6f512e3d0f |
| OpportunityMatrixWebPart      | ProjectWebParts     | Mulighetsmatrise                                       | aff0baa2-9ab4-4c13-a062-d5fa5028121c |
| ProjectInformationWebPart     | ProjectWebParts     | Prosjektinformasjon                                    | b8bec0be-2354-443d-a3ca-24b36e8ea7dc |
| ProjectPhasesWebPart          | ProjectWebParts     | Fasevelger                                             | 4449d3dc-fa58-4982-b87c-5a893114e7b7 |
| ProjectStatusWebPart          | ProjectWebParts     | Prosjektstatus                                         | 681ad0dc-ddb5-4dba-a5d6-a42f6d1c90a6 |
| ProjectTimelineWebPart        | ProjectWebParts     | Prosjekttidslinje (Prosjektnivå)                       | d156652b-9121-47af-89ae-1fe8427c53da |
| RiskMatrixWebPart             | ProjectWebParts     | Risikomatrise                                          | e536ae15-0748-4d96-b160-3abb30f1b71e |
| ProjectNewsWebPart            | ProjectWebParts     | Prosjektnyheter                                        | a9097537-6860-4e05-99f3-4ee21782687f |
| DynamicListWebPart            | ProjectWebParts     | Dynamisk liste                                         | 2f66a372-7d6f-4d36-90b4-22b26465aa3c |
| SharedLibrary                 | SharedLibrary       | Pakke med delte komponenter                            | 0f65a874-dc9d-491d-b979-6ce1d943dd00 |



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#spfx-lsningene)

## ➤ SPFx-løsningene

_På grunn av antallet komponenter, besluttet vi å dele komponentene inn i 6 forskjellige løsninger._

### shared-library

Delt kode for SharePoint-rammeverksløsninger i Prosjektportalen 365.

_Publisert til **npm** som `pp365-shared-library`_

Se [shared-library README](../../SharePointFramework/shared-library/README.md) for mer informasjon.

### PortfolioExtensions

| Løsningsnavn             | ID                                               |
| ------------------------ | ------------------------------------------------ |
| `pp-portfolio-extensons` | a3bf3315-0710-41f9-8836-2b61396d032fc16e2f72fb5b |

Utvidelser for portalens `portefølje-nivå`.

Overvåk endringer med npm-skriptet `watch`.

_Publisert til **npm** som `pp365-portfolioextensions`_

### PortfolioWebParts

| Løsningsnavn             | ID                                   |
| ------------------------ | ------------------------------------ |
| `pp-portfolio-web-parts` | 00483367-68e2-4977-9cc3-6cf0de623daa |

Webdeler for portalens `portefølje-nivå`.

Overvåk endringer med npm-skriptet `watch`.

_Publisert til **npm** som `pp365-portfoliowebparts`_

### ProgramWebParts

| Løsningsnavn           | ID                                   |
| ---------------------- | ------------------------------------ |
| `pp-program-web-parts` | 8a9a0f4a-2e2f-4f13-aceb-867f82bd77eb |

Webdeler for portalens `program-nivå`.

Overvåk endringer med npm-skriptet `watch`.

_Publisert til **npm** som `pp365-programwebparts`_

### ProjectExtensions

| Løsningsnavn           | ID                                   |
| ---------------------- | ------------------------------------ |
| `pp-project-extensons` | fe723971-d5c2-4698-91e3-c16e2f72fb5b |

Utvidelser for portalens `prosjekt-nivå`.

Overvåk endringer med npm-skriptet `watch`.

_Publisert til **npm** som `pp365-projectextensions`_

### ProjectWebParts

| Løsningsnavn           | ID                                   |
| ---------------------- | ------------------------------------ |
| `pp-project-web-parts` | b69cb2f2-762d-425d-8e0b-d59c08918831 |

Webdeler for portalens `prosjekt-nivå`.

Overvåk endringer med npm-skriptet `watch`.

_Publisert til **npm** som `pp365-projectwebparts`_



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#rush-og-bygging)

## ➤ Rush og bygging

### Rush

Rush er et byggverktøy som brukes i Prosjektportalen for å administrere løsningene. Dette er spesielt nyttig da vi har et monorepo-oppsett hvor alle løsningene lagres i samme repo, og det lar oss administrere avhengigheter, byggprosesser og versjonering på tvers av alle løsninger på en konsistent måte.

I Prosjektportalen er Rush konfigurert via [`rush.json`](../../rush.json)-filen. Denne filen spesifiserer Rush-versjonen som skal brukes, løsningene inkludert i monorepoet, og ulike innstillinger relatert til versjonering og publisering.

Her er noen vanlige Rush-kommandoer vi ofte bruker når vi jobber med Prosjektportalen:

- `rush add -p [pakkenavn]`: Legger til en ny pakke i monorepoet. Den vil automatisk oppdatere `rush.json` og `package.json` for å inkludere den nye pakken.

- `rush update`: Installerer pakkens avhengigheter og sørger for at riktige versjoner brukes på tvers av alle løsninger. Du bør kjøre denne kommandoen hver gang du kloner repoet eller endrer noen pakkers avhengigheter.

- `rush build`: Bygger alle løsningene i Prosjektportalen. Den ordner byggprosessen intelligent basert på løsningsavhengigheter, slik at avhengige løsninger bygges i riktig rekkefølge.

- `rush rebuild`: Ligner på `rush build`, men tvinger en ren bygging av alle løsninger og ignorerer eventuell mellomlagret byggetilstand.

For mer detaljert informasjon om hvordan du bruker Rush, se den offisielle [Rush-dokumentasjonen](https://rushjs.io/).

### Bygging for utvikling

For å jobbe med de ulike løsningene, må du gjøre følgende:

1. Forsikre deg om at `npm` er installert.
2. Hvis du har `rush` installert, kjør `rush update && rush build` (eller bruk npm-skriptet `rush:init` i roten av prosjektet).

_For å installere `rush` globalt, kjør `npm i @microsoft/rush -g` i terminalen._

### Legge til en ny npm-pakke med Rush

Ikke bruk lenger `npm i [pakkenavn] -S`. Med Rush skal vi bruke `rush add -p [pakkenavn]`.

For å installere pakken for alle løsningene, legg til `--all` og legg til `-m` hvis du vil gjøre versjonen konsistent i alle løsningene.

Les mer om kommandoen `rush add` [her](https://rushjs.io/pages/commands/rush_add/).

### Oppdateringer til delt-bibliotek (shared-library)

Hvis du har utført endringer i `shared-library` som du vil skal ha effekt i en løsning som er avhengig av det, kan du bruke `rush rebuild`.

Kjør følgende for å bare bygge `pp365-shared-library` på nytt:

```pwsh
rush rebuild -o pp365-shared-library
```

_Det bør ikke ta mer enn 30 sekunder._

### Full tilbakestilling av Rush-tilstand

Når du støter på rare bygg- eller installasjonsfeil som ikke lar seg løse med `rush update` alene — typisk etter en branch-bytte som endrer mange `package.json`-filer, merge-konflikter i lockfilen, eller når `pp365-shared-library`-symlinker virker utdaterte — kan du gjøre en full tilbakestilling:

```pwsh
rush unlink && rush purge && rush update && rush rebuild
```

Hva de fire kommandoene gjør:

- `rush unlink`: Fjerner de lokale symlinkene Rush oppretter i hver løsnings `node_modules` mot andre prosjekter i monorepoet (f.eks. `pp365-shared-library`). Nyttig når symlinker har blitt utdaterte eller ødelagte.
- `rush purge`: Sletter Rush sin midlertidige tilstand under `common/temp` og alle `node_modules`-mapper i hver løsning. Den tyngste opprydningen.
- `rush update`: Reinstallerer alle avhengigheter på nytt fra lockfilen og kobler prosjektene sammen igjen.
- `rush rebuild`: Tvinger en ren bygging av alle løsningene og ignorerer mellomlagret byggetilstand.

Når dette er nyttig:

- Etter å ha byttet til en branch som endrer mange `package.json`-filer eller lockfilen
- Etter at en merge-konflikt i lockfilen er løst
- Når du ser «module not found», versjonskonflikter, eller at endringer i `shared-library` ikke slår igjennom selv etter `rush rebuild -o pp365-shared-library`
- Når du mistenker at mellomlagret tilstand i `common/temp` eller `node_modules` er problemet
- Etter en større dependency-oppgradering

Merk at hele sekvensen tar flere minutter — bruk den som «nullstilling» når mindre tiltak ikke holder, ikke som førstevalg.

### Overvåk konfigurasjon og kanaler

Hvis du vil overvåke endringer for en spesifikk kanal, kan du sette `SERVE_CHANNEL` i `.env`-filen til løsningen din.

Deretter kjører du `npm run watch` som vanlig.

### Bygg bare spesifikke komponenter

Hvis du vil gjøre overvåking/serving raskere, kan du sette `SERVE_BUNDLE_REGEX` for å filtrere komponentene du vil bygge.

**Eksempel:**

```text
SERVE_CHANNEL=test
SERVE_BUNDLE_REGEX=latest-projects-web-part
```

Bare komponenten `LatestProject` vil bli bygget. `config.json` vil automatisk bli tilbakestilt når du avbryter overvåkingsskriptet.

### Oppgaver

Se [Oppgaver](../../SharePointFramework/.tasks/README.md) for en oversikt over tilgjengelige oppgaveskript.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#npm-skript)

## ➤ npm-skript

Prosjektportalen 365 er et monorepo med flere `package.json`-filer. Hver fil eksponerer et sett med npm-skript som brukes i daglig utvikling, bygging, versjonering, lokalisering, generering og utgivelse. Denne oversikten samler alle skriptene på ett sted, gruppert etter pakke.

### Skript i roten (`package.json`)

Skriptene i roten styrer monorepoet som helhet: Rush-operasjoner, generering av maler, kanaler, README og SBOM, samt versjonssynkronisering og bygg av utgivelse.

| Skript                         | Kommando                                                                                                  | Hva det gjør / hvorfor                                                                                                                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sync-version`                 | `node ./.tasks/automatic-versioning.js`                                                                   | Synkroniserer versjonsnumrene på tvers av alle `package.json`-filer i monorepoet, slik at alle løsninger følger samme versjon. Kjøres også automatisk etter `npm version patch/minor`.          |
| `generate-readme`              | `npx @appnest/readme generate && npx @appnest/readme generate --config .development-guide/blueprint.json` | Regenererer hoved-`README.md` og utviklerguiden fra kildefilene i `.README` og `.development-guide/.README`. Se [README-generering](../ci/readme-generering.md).                                 |
| `generate-channel-config`      | `node ./.tasks/generate-channel-config.js`                                                                | Oppretter en ny installasjonskanal (f.eks. `test`, `i18n`). Bruk flagget `/update` for å oppdatere eksisterende. Se [Installasjonskanaler](../maler/kanaler.md).                                 |
| `generate-channel-replace-map` | `node ./.tasks/generate-channel-config.js --replace-map`                                                  | Genererer et _replace map_ for kanaler. Brukes av byggeprosessen til å bytte ut verdier (URL-er, feltnavn, m.m.) når en bestemt kanal bygges.                                                    |
| `generate-pnp-templates`       | `node ./.tasks/generate-pnp-templates.js`                                                                 | Bygger PnP-provisjoneringsmaler (porteføljemaler og taksonomi) fra kildefilene i `Templates/`-mappen. Se [Maler](../maler/maler.md).                                                             |
| `generate-site-scripts`        | `node ./.tasks/generate-site-scripts.js --silent`                                                         | Genererer site scripts fra kildefilene i `SiteScripts/src`-mappen til klar-til-bruk JSON. Se [Site Design / Site Scripts](../maler/site-design-og-site-scripts.md).                              |
| `generate-sbom`                | `node ./.tasks/generate-sbom.js`                                                                          | Genererer `SBOM.md` med komplett oversikt over avhengigheter i alle pakker. Se [SBOM-generering](../ci/sbom.md).                                                                                |
| `postversion`                  | `npm run generate-readme && npm run sync-version && npm run generate-sbom`                                | Kjøres automatisk av npm etter `npm version patch/minor`. Regenererer README, synkroniserer versjoner og oppdaterer SBOM i ett steg.                                                             |
| `rush:init`                    | `npm run rush:update && npm run rush:build`                                                               | Førstegangsoppsett av repoet. Kjører `rush:update` etterfulgt av `rush:build` slik at avhengigheter installeres og alle løsningene bygges i riktig rekkefølge. Se [Rush og bygging](./rush.md).  |
| `rush:update`                  | `node common/scripts/install-run-rush.js update`                                                          | Kjører `rush update` uten at Rush er installert globalt. Installerer avhengigheter og sikrer konsistente versjoner på tvers av løsningene.                                                       |
| `rush:build`                   | `node common/scripts/install-run-rush.js rebuild --verbose`                                               | Kjører `rush rebuild` med detaljerte logger. Bygger alle løsningene i monorepoet i riktig avhengighetsrekkefølge.                                                                                |
| `rush:lint`                    | `node common/scripts/install-run-rush.js lint`                                                            | Kjører `lint`-skriptet i alle SPFx-løsningene via Rush. Brukes også i `automatic_chores.yml` for å rette formateringsfeil automatisk.                                                            |
| `build-release`                | `pwsh -File ./Install/build-release.ps1`                                                                  | Bygger en komplett utgivelsespakke ved å kjøre PowerShell-skriptet `Install/build-release.ps1`. Se [Bygge en ny utgivelse](../utgivelse/bygge-utgivelse.md).                                     |

### Skript i SPFx-løsningene

Hver SPFx-løsning under `SharePointFramework/` (`PortfolioExtensions`, `PortfolioWebParts`, `ProgramWebParts`, `ProjectExtensions`, `ProjectWebParts`) har samme sett med skript. Disse styrer daglig utvikling, bygging, linting og lokaliseringsvalidering for løsningen.

| Skript          | Kommando                                                                                                                         | Hva det gjør / hvorfor                                                                                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `watch`         | `concurrently "npm run serve" "livereload './dist/*.js' -e 'js' -w 250"`                                                         | Starter utviklingsserveren og live-reload parallelt. Dette er hovedkommandoen for lokal utvikling. Nettleseren oppdateres automatisk ved endringer i `dist/`.                                                       |
| `prewatch`      | `node ../.tasks/pre-watch.js`                                                                                                    | Kjøres automatisk før `watch`. Oppretter `.env`, `serve.json` og `.vscode/launch.json` fra maler, filtrerer bundler basert på `SERVE_BUNDLE_REGEX` og håndterer kanalbytte. Se [Utviklingsmiljø](./utviklingsmiljo.md). |
| `postwatch`     | `node ../.tasks/post-watch.js`                                                                                                   | Kjøres automatisk etter `watch` avsluttes. Rydder opp i midlertidige filer og tilbakestiller `config.json` til opprinnelig tilstand.                                                                              |
| `serve`         | `concurrently "gulp serve-deprecated --nobrowser NODE --max-old-space-size=8192"`                                                | Starter `gulp serve` med økt minnegrense. `PortfolioWebParts` bruker `12288` MB i stedet for `8192`, og `ProgramWebParts` bruker `--locale=nb-no` som standardspråk.                                                |
| `build`         | `gulp bundle --ship && gulp package-solution --ship`                                                                             | Bygger og pakker løsningen som en `.sppkg`-fil klar for distribusjon. `--ship` gir optimalisert produksjonsbygg.                                                                                                   |
| `build:test`    | `node ../.tasks/build.js --channel test`                                                                                         | Bygger en kanalspesifikk `.sppkg` for `test`-kanalen i ett steg. Bytter inn IDer fra `channels/test.json`, kjører `gulp bundle && package-solution`, og tilbakestiller manifestene etterpå.                       |
| `build:i18n`    | `node ../.tasks/build.js --channel i18n`                                                                                         | Som `build:test`, men for `i18n`-kanalen.                                                                                                                                                                          |
| `build:kurs`    | `node ../.tasks/build.js --channel kurs`                                                                                         | Som `build:test`, men for `kurs`-kanalen.                                                                                                                                                                          |
| `postversion`   | `tsc && npm publish`                                                                                                             | Kjøres automatisk etter `npm version`. Kompilerer TypeScript og publiserer pakken til npm (brukes for pakker som publiseres uavhengig).                                                                            |
| `lint`          | `eslint --ext .ts,.tsx ./src --color --fix --config ../.eslintrc.yaml && npm run prettier`                                       | Kjører ESLint med automatisk feilretting (`--fix`), etterfulgt av Prettier. Felles konfigurasjon ligger i `SharePointFramework/.eslintrc.yaml`.                                                                    |
| `prettier`      | `prettier '**/*.ts*' --write --loglevel silent --config ../.prettierrc.yaml`                                                     | Formaterer alle `.ts`/`.tsx`-filer i henhold til felles Prettier-konfigurasjon. Kalt automatisk av `lint`.                                                                                                         |
| `validate-loc`  | `node ../.tasks/validateLoc.js --path ./src/loc --interface I{Pakkenavn}Strings --dts mystrings.d.ts --output ./localization-report.md --summary` | Validerer lokaliseringsfiler (`.js`-ressurser) i `src/loc` mot typeinterfacet og genererer en rapport. Sikrer at alle språk har samme nøkler.                                                                     |

### Skript i `SharePointFramework/shared-library`

`shared-library` er biblioteket som de andre SPFx-løsningene deler kode med. Det bygges og publiseres uavhengig, og har derfor ikke `watch`/`serve`-skript.

| Skript         | Kommando                                                                                                                                  | Hva det gjør / hvorfor                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `build`        | `gulp bundle --ship && gulp package-solution --ship`                                                                                      | Bygger biblioteket. Kalles typisk via `rush rebuild -o pp365-shared-library` for å oppdatere biblioteket som andre løsninger avhenger av. |
| `build:test`   | `node ../.tasks/build.js --channel test`                                                                                                  | Bygger en kanalspesifikk `.sppkg` for `test`-kanalen. Tilsvarende finnes for `build:i18n` og `build:kurs`.                                |
| `postversion`  | `tsc && npm publish`                                                                                                                      | Kompilerer TypeScript og publiserer biblioteket til npm som [`pp365-shared-library`](https://www.npmjs.com/package/pp365-shared-library). |
| `lint`         | `eslint --ext .ts,.tsx ./src --color --fix --config ../.eslintrc.yaml && npm run prettier`                                                | Kjører ESLint med automatisk feilretting og Prettier.                                                                                      |
| `prettier`     | `prettier '**/*.ts*' --write --loglevel silent --config ../.prettierrc.yaml`                                                              | Formaterer alle `.ts`/`.tsx`-filer etter felles Prettier-regler.                                                                           |
| `validate-loc` | `node ../.tasks/validateLoc.js --path ./src/loc --interface ISharedLibraryStrings --dts mystrings.d.ts --output ./localization-report.md --summary` | Validerer lokaliseringsfiler i biblioteket mot `ISharedLibraryStrings`-interfacet.                                                         |

### Skript i `SharePointFramework/.tasks`

`.tasks`-pakken inneholder delte byggeoppgaver for alle SPFx-løsningene (pre-watch, post-watch, validate-loc m.m.). Den har bare et minimalt sett med egne skript.

| Skript         | Kommando                                                                                                                | Hva det gjør / hvorfor                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build`        | `node ./build.js`                                                                                                       | Kjører bygget for `.tasks`-pakken (valideringer, klargjøring av hjelpeskript).                                                                             |
| `lint`         | `echo "No linting configured"`                                                                                          | Plassholder for linting – eksplisitt deaktivert for denne pakken. Finnes for at `rush lint` skal gå gjennom uten feil.                                     |
| `validate-loc` | `node ./validateLoc.js --path ./src/loc --interface IStrings --dts mystrings.d.ts --output ./localization-report.md --summary` | Validerer lokaliseringsfilene i selve `.tasks`-pakken.                                                                                                     |

Se [Oppgaver](../../SharePointFramework/.tasks/README.md) for en full oversikt over oppgaveskriptene som ligger i denne mappen.

### Skript i `Templates`

`Templates`-pakken genererer JSON-provisjoneringsmaler og `.resx`-basert lokalisering for malene.

| Skript                       | Kommando                                                                                                                                                                                   | Hva det gjør / hvorfor                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build`                      | `npm run generate-project-templates && npm run generate-resx-json`                                                                                                                         | Hovedkommandoen for å bygge alle prosjektmaler og regenerere ressursfiler. Kjøres som del av full utgivelsesbygging.                                                                                                   |
| `lint`                       | `echo "No linting configured"`                                                                                                                                                             | Plassholder – ingen linting i denne pakken. Finnes for at `rush lint` skal gå gjennom uten feil.                                                                                                                       |
| `generate-resx-json`         | `node ./.tasks/generate-resx-json.js`                                                                                                                                                      | Leser `.resx`-filene i `Templates/Portfolio` og genererer JSON-representasjon som brukes av `{{token}}`-substitusjon i JSON-malene.                                                                                    |
| `generate-resx-ts`           | `node ./.tasks/generate-resx-ts.js`                                                                                                                                                        | Genererer TypeScript-typer fra `.resx`-filene slik at oppslag på ressursnøkler typekontrolleres.                                                                                                                       |
| `generate-project-templates` | `npm run generate-resx-json && npm run generate-resx-ts && node ./.tasks/generate-project-templates.js`                                                                                    | Genererer JSON-prosjektmaler per språkkode (f.eks. `no-NB`, `en-US`) fra kildemalen `_JsonTemplate.json` med `.resx`-ressurser brukt som tokens. Se [JSON-provisjoneringsmal](../maler/js-provisjoneringsmal.md).       |
| `validate-project-template`  | `node ./.tasks/validate-project-template.js`                                                                                                                                               | Validerer at genererte prosjektmaler er gyldige og at alle refererte felter/tokens finnes.                                                                                                                              |
| `validate-loc`               | `node ../SharePointFramework/.tasks/validateLoc.js --path ../SharePointFramework/PortfolioWebParts/src/loc/shared --interface ISharedResources --dts shared.d.ts --output ./resx-ts-report.json && npm run validate-project-template` | Validerer at lokaliseringsfilene i `PortfolioWebParts/src/loc/shared` matcher `ISharedResources`-interfacet, og kjører deretter `validate-project-template`. Sørger for at delte ressurser brukt i malene er konsistente. |

### Vanlige arbeidsflyter

Oversikt over hvilke skript som brukes i typiske arbeidsflyter:

| Arbeidsflyt                                 | Skript                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| Første gangs oppsett av repoet              | `npm run rush:init` i rot                                                       |
| Oppdater `shared-library` og bygg på nytt   | `rush rebuild -o pp365-shared-library`                                          |
| Daglig utvikling på en webdel/utvidelse     | `npm run watch` i den aktuelle SPFx-pakken                                      |
| Rett opp formatering og linting             | `npm run rush:lint` i rot, eller `npm run lint` i én pakke                      |
| Generer ny kanal                            | `npm run generate-channel-config <kanalnavn>` i rot                             |
| Regenerer README-er                         | `npm run generate-readme` i rot                                                 |
| Ny patch-/minor-versjon                     | `npm version patch` / `npm version minor` i rot (utløser `postversion`-hooken) |
| Bygg utgivelsespakke lokalt                 | `npm run build-release` i rot                                                   |
| Oppdater SBOM manuelt                       | `npm run generate-sbom` i rot                                                   |



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#konfigurasjon-av-utviklingsmilj)

## ➤ Konfigurasjon av utviklingsmiljø

### Oppsett av miljøsystemet

Prosjektportalen 365 bruker et tilpasset miljøoppsett for å gjøre det enkelt å utvikle mot forskjellige SharePoint-miljøer. Systemet består av flere komponenter som samarbeider:

#### 1. `.env.template` og `.env`

En delt `.env.template`-fil finnes i `.tasks/`-mappen og definerer standardverdier for alle SPFx-pakker. Når du kjører `npm run watch` for første gang, oppretter `prewatch`-skriptet automatisk en `.env`-fil i pakken.

**Automatisk oppretting av `.env`:** Skriptet `.tasks/createEnvironmentFile.js` kjøres som en del av `prewatch`. Dersom `.env` ikke finnes, leses malen fra `.tasks/.env.template` og tilgjengelige bundlenavn hentes automatisk fra pakkens `config/config.json`. Resultatet skrives til `.env` med bundlenavnene som kommentarer.

`.env`-filen inneholder konfigurasjonsvariabler for utviklingsmiljøet ditt:

| Variabel | Beskrivelse | Standard |
|---|---|---|
| `SERVE_CHANNEL` | Hvilken kanal som brukes for `environments.json`-oppslag. Tilgjengelige kanaler: `main`, `test`, `i18n`. | `main` |
| `SERVE_BUNDLE_REGEX` | Regulært uttrykk for å filtrere hvilke bundler som bygges under `watch`. Sett til et bundlenavn for raskere bygging. | _(tom – alle bundler bygges)_ |
| `SERVE_ENVIRONMENT` | Navn på miljøet fra `environments.json` som skal brukes. | _(ikke satt)_ |

Eksempel `.env`:

```text
SERVE_CHANNEL=main
SERVE_BUNDLE_REGEX=portfolio-overview-web-part
SERVE_ENVIRONMENT=Porteføljeoversikt
```

> **Tips:** Sett `SERVE_BUNDLE_REGEX` til den spesifikke webdelen eller utvidelsen du jobber med for å redusere byggetiden betydelig. Se kommentarene i pakkens `.env.template` for tilgjengelige bundlenavn.

> **Merk:** `.env`-filen er gitignorert og skal ikke committes. Kun `.env.template` committes til repoet.

#### 2. Overvåkingsskript i `package.json`

Overvåkingsskriptene knytter alt sammen:

```json
"watch": "concurrently \"npm run serve\" \"livereload './dist/*.js' -e 'js' -w 250\"",
"prewatch": "node ../.tasks/pre-watch.js",
"postwatch": "node ../.tasks/post-watch.js",
```

- **prewatch**: Kjøres før hovedovervåkingsskriptet via skript i `.tasks/`-mappen:
  - Oppretter `.env` fra mal (med bundlenavn fra `config/config.json`)
  - Oppretter `serve.json` fra `serve.sample.json`
  - Oppretter `.vscode/launch.json` fra konfigurasjon
  - Filtrerer bundler i `config/config.json` basert på `SERVE_BUNDLE_REGEX`
  - Håndterer kanalbytte for ikke-main-kanaler via `modifySolutionFiles`

- **watch**: Kjører utviklingsserveren med miljøkonfigurasjonen

- **postwatch**: Rydder opp i midlertidige filer og konfigurasjoner

### Hvordan det fungerer i praksis

1. Opprett eller rediger `.env` for å sette `SERVE_ENVIRONMENT` til ønsket miljø
2. Kjør `npm run watch`
3. Prewatch-skriptet konfigurerer alt basert på miljøet du valgte
4. SPFx kobler seg til det angitte SharePoint-nettstedet og siden
5. Din webdelpakke lastes inn på den siden for utvikling og testing
6. Når du gjør endringer, oppdateres nettleseren automatisk

### Fordeler med denne tilnærmingen

- Definer flere utviklingsmiljøer på ett sted
- Bytt enkelt mellom miljøer ved å endre én variabel
- Konsistent konfigurasjon på tvers av utviklingsteamet
- Ingen behov for å manuelt redigere SPFx-konfigurasjonsfiler

Hvis du trenger å legge til et nytt miljø for utvikling, legg ganske enkelt til en ny oppføring i `environments.json`-filen.

#### 3. `environments.json`

Denne filen definerer flere SharePoint-miljøer du kan utvikle mot. En delt mal finnes i `.tasks/environments.sample.json`. Kopier den til rotmappen til SPFx-pakken du jobber med:

```bash
cp ../.tasks/environments.sample.json ./environments.json
```

Hvert miljø angir:

- `name`: Et beskrivende navn for miljøet (f.eks. «Porteføljeoversikt», «Forside»)
- `siteUrl`: SharePoint-nettadressen der webdelen din skal kjøres
- `page`: Den spesifikke siden på nettstedet som laster webdelen
- `bundle`: Hvilken SPFx-webdelpakke som brukes under utvikling

Eksempel:

```json
{
    "name": "Porteføljeoversikt",
    "siteUrl": "https://puzzlepart.sharepoint.com",
    "page": "SitePages/TestStdAln3.aspx",
    "bundle": "portfolio-overview-web-part"
}
```



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#site-design--site-scripts)

## ➤ Site Design / Site Scripts

Alt som er relatert til `site design` og tilhørende `site scripts` befinner seg i mappen **SiteScripts**.

Kildefilene finnes i mappen **src**.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#js-provisjoneringsmal)

## ➤ JS-provisjoneringsmal

For å sette opp prosjektområdene bruker vi Prosjektområde `site design` som laster inn en extension for prosjektsetup som bruker [sp-js-provisioning](https://github.com/Puzzlepart/sp-js-provisioning).

Med våre PnP-innholdsmaler (se **Maler**-seksjonen) setter vi opp en standardmal. Standardmalene for våre støttede språk er bygget fra kildefilen [_JsonTemplate.json](../../Templates/_JsonTemplate.json).

Vennligst merk **Parameters**-objektet.

```json
{
  "Parameters": {
    "ProvisionSiteFields": "Kolonner for Prosjektportalen (Prosjekt)",
    "ProjectContentTypeId": "0x0100805E9E4FEAAB4F0EABAB2600D30DB70C",
    "ProjectStatusContentTypeId": "0x010022252E35737A413FB56A1BA53862F6D5"
  }
}
```

| Parameter                  | Beskrivelse                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| ProvisionSiteFields        | Feltene på nettstedet i denne gruppen vil bli kopiert til prosjektnettstedet under oppsett. |
| ProjectContentTypeId       | Innholdstype-ID for egenskapsinnholdstypen for prosjektet                                   |
| ProjectStatusContentTypeId | Innholdstype-ID for innholdstypen for prosjektstatus                                        |

I tillegg til parameterne som er spesifisert i [Standardmal.txt](../../Templates/Portfolio/Prosjektmaler/Standardmal.txt), er det også følgende parametere:

| Parameter  | Beskrivelse                                                                               |
| ---------- | ----------------------------------------------------------------------------------------- |
| TermSetIds | Et kart over termsettfelt og termsett-ID. Brukes til å overstyre standard termsett-ID-er. |

Si at du vil bruke termsettet med ID-en **54da9f47-c64e-4a26-80f3-4d3c3fa1b7b2** for prosjektfase. Det interne feltnavnet for prosjektfasen er **GtProjectPhase**. Med standardmalen ville **Parameters**-objektet se slik ut:

```json
{
  "Parameters": {
    "ProvisionSiteFields": "Kolonner for Prosjektportalen (Prosjekt)",
    "ProjectContentTypeId": "0x0100805E9E4FEAAB4F0EABAB2600D30DB70C",
    "ProjectStatusContentTypeId": "0x010022252E35737A413FB56A1BA53862F6D5",
    "TermSetIds": {
      "GtProjectPhase": "54da9f47-c64e-4a26-80f3-4d3c3fa1b7b2"
    }
  }
}
```



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#maler)

## ➤ Maler

### JSON-provisjoneringsmal

På rotnivået i mappen **Templates** finner du følgende filer:

| Fil/Mappe                       | Beskrivelse                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `Clean-Resx.ps1`                | Skript for å fjerne ubrukte **.resx**-ressurser                                              |
| `Find-FieldUsage.ps1`           | Skript for å finne bruk av felt                                                              |
| `Get-ComponentProperties.ps1`   | Skript for å hente komponentegenskaper fra `<pnp:ClientSidePage>`-instanser                  |
| `Encode-JSON.ps1`               | Skript for å ta innholdet av en JSON-fil, kode og minimere det, og lagre det i en `.txt`-fil |
| `Search-Resx.ps1`               | Skript for å søke etter ubrukte **.resx**-ressurser                                          |
| `tasks/generateResxJson.js`     | Node-skript for å generere en JSON-representasjon av **.resx**-filene                        |
| `tasks/generateJsonTemplate.js` | Node-skript for å generere JSON-maler for hvert språk                                        |
| `_JsonTemplate.json`            | JSON-prosjektmal                                                                             |

#### Bygging av JSON-maler

Ved endringer i JSON-malen kan npm-oppgaven `watch` brukes. Den overvåker `_JsonTemplate.json` og bygger lokalversjon av dette til den tilsvarende innholdsmalen.

Ressurser fra **.resx**-filene i mappen «Portfolio» kan brukes i malen ved å bruke `{{tokens}}`.

**Eksempel:**

```json
{
    "ID": "0x0100A87AE71CBF2643A6BC9D0948BD2EE897",
    "Name": "{{ContentTypes_Uncertainty_Name}}",
    "Description": "",
    "Group": "{{ContentTypes_Group}}"
}
```

### PnP-maler

I tillegg har vi to PnP-provisjoneringsmaler.

| Mal                                    | Beskrivelse         |
| -------------------------------------- | ------------------- |
| [Portfolio](../../Templates/Portfolio) | Porteføljeelementer |
| [Taxonomy](../../Templates/Taxonomy)   | Taksonomi           |

#### Portefølje

| Fil/Mappe          | Beskrivelse                                                      |
| ------------------ | ---------------------------------------------------------------- |
| Objects            | PnP-elementer. Se https://github.com/pnp/PnP-Provisioning-Schema |
| SiteAssets         | Filer som skal lastes opp til SiteAssets                         |
| Portfolio.xml      | Hovedmalfil                                                      |
| `Resources.*.resx` | Ressursfiler                                                     |

#### Innholdsmaler

Innholdsmaler finnes i mappen **Content**. Navnet på malen følger dette mønsteret:

`Portfolio_content.{language_code}.xml`
`Portfolio_content_BA.{language_code}.xml`

`language_code` kan for eksempel være **no-NB** eller **en-US**.

Malene inneholder JSON-mal(er), oppgaver for planleggeren og elementer for sjekkliste for faser.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#installasjonskanaler)

## ➤ Installasjonskanaler

For å støtte installasjon av flere forekomster av _Prosjektportalen 365_ i en leietaker, støtter vi **installasjonskanaler**.

### Generere en ny kanalkonfigurasjon

For å generere en ny kanalkonfigurasjon, bruk `npm`-skriptet `generate-channel-config`.

For å generere en ny kanalkonfigurasjon for `test`:

```javascript
npm run-script generate-channel-config test
```

For å oppdatere en eksisterende kanalkonfigurasjon, legg til flagget `/update`:

```javascript
npm run-script generate-channel-config test /update
```

### Bygge en ny versjon for en kanal

For å bygge en ny versjon for en kanal, legg til flagget `-Channel` når du kjører utgivelsesskriptet.

**Eksempel (bygger for testkanal):**

```powershell
Install/Build-Release.ps1 -Channel test
```

### Hvordan kanalbygget fungerer (`.current-channel-config.json`)

Flere forekomster av _Prosjektportalen 365_ kan leve side om side i samme leietaker bare fordi hver kanal har **egne, unike GUID-er** for hver SPFx-løsning og hver komponent (webdeler og utvidelser). Uten dette ville løsningene kollidere i leietakerens appkatalog. De kanalspesifikke GUID-ene ligger i `channels/<navn>.json`.

For at hele byggeverktøykjeden (både PowerShell og en rekke Node-skript) skal vite _hvilken_ kanal som bygges, kopierer byggeprosessen den valgte kanalfilen til en fast, kjent sti i rota av repoet: `.current-channel-config.json`. Alle verktøyene leser fra denne ene filen i stedet for at kanalnavnet må sendes inn til hvert enkelt skript. Filen er en _midlertidig_ pekefil som finnes kun under bygget, og er git-ignorert.

Livssyklusen til filen under et kanalbygg (f.eks. `-Channel test`):

| Steg | Hva skjer |
| --- | --- |
| **Skrives** | `Build-Release.ps1` laster `channels/test.json`, validerer den (se under) og skriver en kopi til `.current-channel-config.json`. |
| **Leses av generatorene** | `generate-pnp-templates`, `generate-site-scripts` og `generate-project-templates` leser filen og bytter ut GUID-ene i kildeartefaktene. Hovedmønsteret er at hver **main**-GUID byttes ut med den tilsvarende **kanal**-GUID-en, slik at malene peker på kanalens faktisk utrullede komponenter. |
| **Kopieres til utgivelsen** | Filen legges i utgivelsesmappen, slik at installasjonspakken vet hvilken kanal den tilhører. |
| **Leses ved oppgradering** | `UpgradeAllSitesToLatest.ps1` leser filen for å vite hvilken kanal sitene skal oppgraderes mot. |
| **Slettes** | Ved et rent fullført bygg fjerner `Build-Release.ps1` filen igjen. |

> [!NOTE]
> Selve SPFx-pakkingen (`.sppkg`) leser ikke `.current-channel-config.json` direkte. PowerShell-løkka skriver i stedet ut en `config/.generated-solution-config.json` per løsning, og `modifySolutionFiles.js` skriver midlertidig om `package-solution.json` (id/navn/zippedPackage) og hver `manifest.json` (komponent-id, `hiddenFromToolbox`) før bygg, og tilbakestiller etterpå.

### Skjemavalidering

Kanalkonfigurasjonen valideres mot JSON-skjemaet i `channels/$schema.json` før bygget fortsetter. Hvis konfigurasjonen ikke samsvarer med skjemaet, skriver bygget ut en advarsel, men **fortsetter likevel**:

```text
Channel configuration might not be valid (the JSON does not match the schema). Manually check schema, build continues...
```

### Viktig: avbrutt bygg

Fordi filen opprettes ved start og først slettes ved et _rent_ fullført bygg, blir den **liggende igjen hvis bygget avbrytes eller feiler**. To av generatorene (`generate-pnp-templates` og `generate-site-scripts`) leser filen uten reserveløsning – et senere bygg som du tror er et vanlig `main`-bygg vil da i stillhet produsere artefakter for den gamle kanalen.

> [!IMPORTANT]
> Hvis et kanalbygg avbrytes, slett `.current-channel-config.json` manuelt før du bygger på nytt:
>
> ```powershell
> Remove-Item .current-channel-config.json
> ```



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#versjonering)

## ➤ Versjonering

Oppdater aldri versjonen av løsningene uavhengig. Versjonen holdes automatisk synkronisert med de andre pakkene.

Etter oppdatering av versjonen ved bruk av `npm version patch` eller `npm version minor`, kjøres oppgaven `.tasks/automatic-versioning.js`. Dette synkroniserer versjonene på tvers av løsningen.

Denne oppgaven, `automatic-versioning.js`, kan også kjøres som et **npm-skript** utenfor hendelsen `postversion`:

```powershell
npm run sync-version
```

Sjekk at versjonene av pakkene som brukes som avhengigheter i `package.json` er oppdatert til den nye versjonen.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#smoke-test-prosessen)

## ➤ Smoke test-prosessen

Denne siden forklarer hvordan smoke test gjennomføres for Prosjektportalen før hver release. Smoke test sikrer at alle hovedfunksjoner virker etter oppgradering eller ny installasjon.

### Hva er en smoke test?
En smoke test er en overfladisk, men bred test av alle sentrale funksjoner. Målet er å avdekke kritiske feil raskt, slik at man kan stoppe en release før den går videre til produksjon hvis noe vesentlig er ødelagt.

### Issue-maler for smoke test
Det finnes 8 maler for smoke test:

| Malnavn | Dekker |
|---|---|
| smoketest.md | Oppsummeringsissue for hele testen |
| smoketest-portfolioextensions.yml | PortfolioExtensions (footer, idémodul) |
| smoketest-portfoliowebparts.yml | PortfolioWebParts (porteføljeoversikt, prosjektliste, idémodul m.m.) |
| smoketest-programwebparts.yml | ProgramWebParts (programadministrasjon, aggregering, prosjektoversikt, tidslinje, status) |
| smoketest-projectextensions.yml | ProjectExtensions (oppsettveiviser, dokumentmalvelger, usikkerhetstiltak) |
| smoketest-projectwebparts.yml | ProjectWebParts (prosjektinformasjon, faser, status, tidslinje, matriser, gevinstoversikt, dynamisk liste, nyheter) |
| smoketest-sharepoint-sider.yml | SharePoint-sider (porteføljehjem, konfigurasjon, navigasjon, konfigurasjonslister) |
| smoketest-dokumentasjon.yml | Dokumentasjon og hjelpeinnhold |

### Slik gjennomføres smoke test

1. **Opprett oppsummeringsissue**
   - Bruk `smoketest.md`-malen for å opprette et hoved-issue for releasen.
   - Fyll inn versjon, miljø, tenant-URL og dato.
2. **Opprett per-pakke issues**
   - Opprett ett issue for hver av de 7 pakkene fra de respektive YAML-malene.
   - Lenke til disse fra oppsummerings-issue.
3. **Tilordne testere**
   - Fyll ut tabellen for tester-tilordning i oppsummerings-issue.
4. **Gjennomfør testing**
   - Hver tester går gjennom sjekkpunktene i sitt tildelte issue.
   - Kryss av for hvert punkt som er bestått.
   - Ved feil: legg igjen kommentar med beskrivelse og skjermbilde.
5. **Oppdater status**
   - Oppsummerings-issue oppdateres med statusikoner for hver pakke etter hvert som testing fullføres.

### Vedlikehold av malene

- Smoke test-maler må holdes oppdatert når det skjer endringer i kodebasen (f.eks. nye webdeler, endrede felter, fjernede funksjoner).
- Malene ligger i `.github/ISSUE_TEMPLATE/` og bør revideres ved større endringer i funksjonalitet.
- Se også kommentarer i YAML-filene for detaljer om hvert testpunkt.

### Tips
- Smoke test bør alltid kjøres på både ny installasjon og oppgradering.
- Dokumentasjon og hjelpeinnhold testes separat i `smoketest-dokumentasjon.yml`.
- Oppsummerings-issue gir oversikt over fremdrift og ansvar.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#opprettelse-av-en-ny-versjon)

## ➤ Opprettelse av en ny versjon

For å opprette en ny versjon har vi to alternativer: `Minor` og `Patch`. En ny minor-versjon bør opprettes når det er ny funksjonalitet av interesse for brukerne, mens patch-versjoner kan opprettes ofte med feilrettinger, justeringer og minimale funksjonelle forbedringer.

Økningen av versjonsnummeret gjøres ved hjelp av npm-skript. Dette gjøres på `releases/*`-branchen når funksjonaliteten som for øyeblikket er under utvikling, anses som klar for utgivelse.

### Patch-utgivelse

```powershell
npm version patch
git push --tags
```

### Minor-utgivelse

```powershell
npm version minor
git push --tags
```

Opprett deretter en PR for å merge `releases/*` inn i `main`. Resultatet fra GitHub Actions vil inkludere en utgivelsespakke som kan deles som en utgivelse på GitHub. Ingen manuell bygging er nødvendig.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#bygge-en-ny-utgivelse)

## ➤ Bygge en ny utgivelse

For å lage en ny Prosjektportalen-utgivelse, forsikre deg om at du er på `main`-branchen og synkronisert med **origin**.

Kjør PowerShell-skriptet `Build-Release.ps1` som ligger i `Install`-mappen:

```powershell
./Install/Build-Release.ps1
```

Installasjonspakken skal finnes i utgivelsesmappen.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#npm)

## ➤ NPM

SharePoint Framework-løsninger publiseres uavhengig til `npm`.

- [PortfolioWebParts](https://www.npmjs.com/package/pp365-portfoliowebparts)
- [PortfolioExtensions](https://www.npmjs.com/package/pp365-portfolioextensions)
- [ProgramWebParts](https://www.npmjs.com/package/pp365-programwebparts)
- [ProjectWebParts](https://www.npmjs.com/package/pp365-projectwebparts)
- [ProjectExtensions](https://www.npmjs.com/package/pp365-projectextensions)
- [shared-library](https://www.npmjs.com/package/pp365-shared-library)



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#kontinuerlig-integrasjon)

## ➤ Kontinuerlig integrasjon

Vi har satt opp kontinuerlig integrasjon (CI) ved hjelp av GitHub Actions.

### CI (releases/*)

[![CI (releases)](https://github.com/Puzzlepart/prosjektportalen365/actions/workflows/ci-releases.yml/badge.svg)](https://github.com/Puzzlepart/prosjektportalen365/actions/workflows/ci-releases.yml)

Nøkkelord kan brukes i commit-meldingen for å unngå (eller tvinge) at CI kjører noen av jobbene.

- `[skip-ci]` for å unngå at alle CI-prosesser starter.
- `[skip-upgrade]` for å unngå at jobben «Oppgrader» starter. Dette vil også hoppe over jobben «Installer» da den er avhengig av «Oppgrader».
- `[skip-install]` for å unngå at jobben «Installer» starter.
- `[skip-main-ci]` for å hoppe over hovedbygging (build-release.yml).
- `[skip-test-ci]` for å hoppe over test-kanal bygging.
- `[apps-only]` for å bygge kun pakker (appkatalog), hopper over utrulling av maler. Brukes dersom du ikke har gjort noen endringer på .xml-filene i Templates.
- `[upgrade-all-sites-to-latest]` for å kjøre skriptet `UpgradeAllSitesToLatest.ps1` i CI-modus.

### Bygg og installer (dev)

[ci-releases](../../.github/workflows/ci-releases.yml) bygger en ny utgivelse ved _push_ til **releases/***.

Den kjører [Build-Release.ps1](../../Install/Build-Release.ps1) med parameteren `-CI`, deretter kjører den [Install.ps1](../../Install/Install.ps1) (også med `-CI`-parameter, denne gangen med en kryptert streng som består av brukernavnet og passordet, lagret i en GitHub-hemmelighet). URL-en å installere til er lagret i GitHub-hemmeligheten `CI_DEV_TARGET_URL`.

Med gjeldende tilnærming, uten hurtigbuffer (da den kjører `npm ci`), tar en full kjøring omtrent 25-35 minutter.

![image](./development-guide/assets/ci.png)

### CI (channels/test)

[ci-channel-test](../../.github/workflows/ci-channel-test.yml) bygger en pakke for kanalen [test](../../channels/test.json) og distribuerer den til URL-en som er spesifisert i `SP_URL_TEST`.

### Bygg utgivelse (main)

[build-release](../../.github/workflows/build-release.yml) bygger en ny utgivelsespakke ved **push** til **main**.

### Aktive arbeidsflyter

| Arbeidsflytfil            | Beskrivelse                                      | Utløser                                           |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| `ci-releases.yml`         | Bygg, oppgrader og installer til utviklingsmiljø | Push til `main` (stier: SPFx, Install, Templates) |
| `build-release.yml`       | Bygg utgivelsespakke + test/kurs-kanalpakker     | Push til `main`                                   |
| `ci-channel-test.yml`     | Bygg og distribuer testkanal                     | Push til releases-branch                          |
| `ci-channel-i18n.yml`     | Bygg og distribuer i18n (engelsk) kanal          | Push til `main` (krever `i18n:` i commit)         |
| `pr-package-spfx-dev.yml` | Rush install, lint og rebuild ved pull requests  | PR mot release-branches                           |
| `automatic_chores.yml`    | Automatisk linting og commit av rettelser        | Push til releases-branch                          |
| `generate-sbom.yml`       | Generer og commit SBOM.md                        | Tag-push `v*` eller manuell utløsning             |



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#readme-generering)

## ➤ README-generering

README er automatisk generert ved hjelp av [@appnest/readme](https://github.com/andreasbm/readme). Hoved-README er generert fra [.README](../../.README), mens denne utviklerguiden er generert fra [.README](../.README). Generering konfigureres med `blueprint.json`-filene.

For hoved-[.README](../../.README)-generering er de forskjellige delene inkludert fra [readme](../../readme)-mappen på rotnivå.

For å kjøre generering manuelt:

```powershell
npm run generate-readme
```

Generering kjøres også automatisk som del av `postversion`-hooken.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#sbom-generering)

## ➤ SBOM-generering

### Hva er SBOM?

SBOM (Software Bill of Materials) er en omfattende liste over alle programvarekomponenter, biblioteker og avhengigheter som brukes i Prosjektportalen 365. Den gir innsyn i hvilke åpen kildekode- og tredjepartskomponenter som er inkludert i prosjektet, noe som er viktig for:

- **Sikkerhet**: Identifisering av sårbare avhengigheter
- **Etterlevelse**: Oppfyllelse av regulatoriske krav
- **Lisenshåndtering**: Forståelse av lisensforpliktelser
- **Åpenhet**: Gi interessenter innsikt i prosjektets komponenter

### Automatisk generering

SBOM-en genereres automatisk når:

1. **Versjonsoppdateringer**: Når du kjører `npm version patch` eller `npm version minor`, regenererer `postversion`-hooken automatisk SBOM-en
2. **GitHub-utgivelser**: Når en versjons-tag (f.eks. `v1.12.0`) pushes til GitHub, genererer og committar arbeidsflyten automatisk den oppdaterte SBOM-en
3. **Manuell utløsning**: GitHub-arbeidsflyten kan utløses manuelt fra fanen «Actions»

### Manuell generering

For å generere SBOM-en manuelt:

```bash
npm run generate-sbom
```

Dette vil:
- Skanne alle `package.json`-filer i monorepoet
- Samle alle avhengigheter (både produksjons- og utviklingsavhengigheter)
- Generere en omfattende SBOM.md-fil i roten av repoet
- Inkludere metadata som versjoner og hvilke prosjekter som bruker hver avhengighet

### Innhold i SBOM

Den genererte SBOM-en inkluderer:

- **Prosjektoversikt**: Totalt antall avhengigheter og prosjekter
- **Prosjekter i monorepoet**: Liste over alle pakker med antall avhengigheter
- **Alle avhengigheter**: Konsolidert liste over alle unike avhengigheter
  - Produksjonsavhengigheter
  - Utviklingsavhengigheter
  - Versjonsinformasjon
  - Bruksinformasjon (hvilke prosjekter som bruker hver avhengighet)
- **Detaljert oversikt**: Prosjektspesifikke avhengighetslister
- **Dokumentasjon**: Hvordan oppdatere SBOM-en og etterlevelsesformasjon

### Filplassering

SBOM-en genereres som `SBOM.md` i roten av repoet og committes til versjonskontroll.

### GitHub-arbeidsflyt

Arbeidsflyten for SBOM-generering (`.github/workflows/generate-sbom.yml`) kjøres automatisk når versjons-tagger pushes. Den kan også utløses manuelt via GitHub Actions.

Arbeidsflyten:
1. Installerer avhengigheter
2. Genererer SBOM-en
3. Committer den oppdaterte SBOM-en hvis den har endret seg
4. Laster opp SBOM-en som et byggartefakt

### Skriptdetaljer

Skriptet for SBOM-generering ligger i `.tasks/generate-sbom.js` og følger disse beste praksisene:

- **CycloneDX-inspirert format**: Basert på industristandarder
- **Fullstendig dekning**: Inkluderer alle prosjekter i Rush-monorepoet
- **Lesbart format**: Generert som Markdown for enkel visning
- **Rik på metadata**: Inkluderer versjonsnumre og avhengighetsrelasjoner
- **Automatisert**: Integreres med eksisterende bygge- og versjoneringsprosesser

### Oppdatering av avhengigheter

Når du oppdaterer avhengigheter:

1. Oppdater de relevante `package.json`-filene
2. Kjør `npm install` eller `rush update`
3. Kjør `npm run generate-sbom` for å oppdatere SBOM-en
4. Commit både endringene i package.json og den oppdaterte SBOM.md

Merk: SBOM-en vil bli automatisk regenerert under versjonsoppdateringer, men det er god praksis å oppdatere den når du gjør betydelige avhengighetsendringer.

### Sikkerhetshensyn

SBOM-en kan brukes med sikkerhetsanalyseverktøy for å:
- Identifisere kjente sårbarheter i avhengigheter
- Sjekke for utdaterte pakker
- Verifisere lisensoverensstemmelse
- Overvåke sikkerhetsadvarsler

Anbefalte verktøy:
- `npm audit` - Innebygd npm-sikkerhetsskanner
- GitHub Dependabot - Automatiske sikkerhetsoppdateringer
- Snyk - Kontinuerlig sikkerhetsovervåking
- OWASP Dependency-Check - Sårbarhetsdeteksjon
