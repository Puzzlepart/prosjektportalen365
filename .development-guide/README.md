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

	* [➤ Kom i gang med Prosjektportalen 365](#-kom-i-gang-med-prosjektportalen-365)
		* [1. Hva du jobber med](#1-hva-du-jobber-med)
		* [2. Første dag: oppsett](#2-frste-dag-oppsett)
		* [3. Kjøre en webdel lokalt](#3-kjre-en-webdel-lokalt)
		* [4. Kodekonvensjoner i korte trekk](#4-kodekonvensjoner-i-korte-trekk)
		* [5. Tester](#5-tester)
		* [6. Fra endring til merge](#6-fra-endring-til-merge)
		* [7. Jobbe med en AI-assistent](#7-jobbe-med-en-ai-assistent)
		* [8. Første oppgave og hvor du spør](#8-frste-oppgave-og-hvor-du-spr)
	* [➤ Branching-strategi og arbeidsflyt](#-branching-strategi-og-arbeidsflyt)
		* [Branching-strategi](#branching-strategi)
		* [Din branch](#din-branch)
		* [Pull request og merge](#pull-request-og-merge)
	* [➤ Commit-praksis](#-commit-praksis)
		* [Semantiske commit-meldinger](#semantiske-commit-meldinger)
		* [GitHub Actions og commit-triggere](#github-actions-og-commit-triggere)
	* [➤ Komponentoversikt](#-komponentoversikt)
* [➤ Kodemønstre i SPFx-løsningene](#-kodemnstre-i-spfx-lsningene)
	* [➤ Innhold](#-innhold)
	* [➤ Komponentstruktur (Barrel-eksport)](#-komponentstruktur-barrel-eksport)
		* [Mappestruktur](#mappestruktur)
		* [Barrel-filen (`index.ts`)](#barrel-filen-indexts)
		* [Ekte eksempel: `TemplateSelector`](#ekte-eksempel-templateselector)
		* [Ekte eksempel: `ProjectSetupDialog` (større komponent)](#ekte-eksempel-projectsetupdialog-strre-komponent)
	* [➤ Hook-mønsteret (`useKomponent`)](#-hook-mnsteret-usekomponent)
		* [Hvorfor?](#hvorfor)
		* [Mønster](#mnster)
		* [Ekte eksempel: `useProjectSetupDialog`](#ekte-eksempel-useprojectsetupdialog)
	* [➤ Context-mønsteret](#-context-mnsteret)
		* [Mønster](#mnster-1)
		* [Bruk i hovedkomponenten (Provider)](#bruk-i-hovedkomponenten-provider)
		* [Bruk i underkomponent (Consumer)](#bruk-i-underkomponent-consumer)
		* [Ekte eksempel](#ekte-eksempel)
	* [➤ Reducer-mønsteret](#-reducer-mnsteret)
		* [Mønster](#mnster-2)
	* [➤ Lokalisering (loc)](#-lokalisering-loc)
		* [Legge til en ny tekststreng](#legge-til-en-ny-tekststreng)
		* [Formateringsstrenger](#formateringsstrenger)
	* [➤ SCSS-moduler](#-scss-moduler)
		* [Mønster](#mnster-3)
		* [Konsistens](#konsistens)
	* [➤ Fluent UI v9](#-fluent-ui-v9)
		* [Vanlige v9-importer](#vanlige-v9-importer)
		* [Ikoner](#ikoner)
			* [Legge til et ikon i katalogen](#legge-til-et-ikon-i-katalogen)
		* [PnP-kontroller](#pnp-kontroller)
		* [FluentProvider og IdPrefixProvider](#fluentprovider-og-idprefixprovider)
		* [Render-funksjoner for slots](#render-funksjoner-for-slots)
	* [➤ Montering av React](#-montering-av-react)
	* [➤ Kommentarer](#-kommentarer)
	* [➤ Oppsummering](#-oppsummering)
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
		* [Skript i `SharePointFramework/.eslint-config` og `SharePointFramework/.jest-config`](#skript-i-sharepointframeworkeslint-config-og-sharepointframeworkjest-config)
		* [Skript i `e2e`](#skript-i-e2e)
		* [Skript i `Templates`](#skript-i-templates)
		* [Vanlige arbeidsflyter](#vanlige-arbeidsflyter)
	* [➤ Konfigurasjon av utviklingsmiljø](#-konfigurasjon-av-utviklingsmilj)
		* [Oppsett av miljøsystemet](#oppsett-av-miljsystemet)
			* [1. `.env.template` og `.env`](#1-envtemplate-og-env)
			* [2. Overvåkingsskript i `package.json`](#2-overvkingsskript-i-packagejson)
		* [Feilsøking i VS Code](#feilsking-i-vs-code)
		* [Hvordan det fungerer i praksis](#hvordan-det-fungerer-i-praksis)
		* [Fordeler med denne tilnærmingen](#fordeler-med-denne-tilnrmingen)
			* [3. `environments.json`](#3-environmentsjson)
		* [Windows og macOS](#windows-og-macos)
	* [➤ Testregime](#-testregime)
		* [Lagene](#lagene)
		* [Hva skjer i et bygg](#hva-skjer-i-et-bygg)
		* [Delt oppsett: `pp365-jest-config`](#delt-oppsett-pp365-jest-config)
		* [Skrive enhetstester](#skrive-enhetstester)
		* [Skrive komponenttester](#skrive-komponenttester)
		* [Ende-til-ende med Playwright (`e2e/`)](#ende-til-ende-med-playwright-e2e)
			* [Finne og lese E2E-rapporten fra CI](#finne-og-lese-e2e-rapporten-fra-ci)
		* [Når en test feiler](#nr-en-test-feiler)
		* [Veikart](#veikart)
	* [➤ Maler](#-maler)
		* [Mappene](#mappene)
		* [Bygge og validere](#bygge-og-validere)
		* [Tekstene (`.resx`)](#tekstene-resx)
		* [Slik når innholdet huben](#slik-nr-innholdet-huben)
		* [Slik når innholdet prosjektområdene](#slik-nr-innholdet-prosjektomrdene)
		* [Oppgraderingssteg](#oppgraderingssteg)
	* [➤ Prosjektmaler (JSON)](#-prosjektmaler-json)
		* [Kildene og de genererte malene](#kildene-og-de-genererte-malene)
		* [Parameters](#parameters)
		* [TermSetIds](#termsetids)
		* [Hva veiviseren gjør](#hva-veiviseren-gjr)
		* [Prøve en mal lokalt](#prve-en-mal-lokalt)
	* [➤ Site design og site scripts](#-site-design-og-site-scripts)
		* [Slik installeres de](#slik-installeres-de)
		* [Endringer](#endringer)
	* [➤ Installasjonskanaler](#-installasjonskanaler)
		* [Hvor ID-ene byttes](#hvor-id-ene-byttes)
		* [Bygge for en kanal](#bygge-for-en-kanal)
		* [Ny komponent eller ny kanal](#ny-komponent-eller-ny-kanal)
	* [➤ Versjonering](#-versjonering)
	* [➤ Smoke test-prosessen](#-smoke-test-prosessen)
		* [Hva er en smoke test?](#hva-er-en-smoke-test)
		* [Issue-maler for smoke test](#issue-maler-for-smoke-test)
		* [Slik gjennomføres smoke test](#slik-gjennomfres-smoke-test)
		* [Vedlikehold av malene](#vedlikehold-av-malene)
		* [Tips](#tips)
	* [➤ Opprettelse av en ny versjon](#-opprettelse-av-en-ny-versjon)
		* [1. Før versjonsnummeret økes](#1-fr-versjonsnummeret-kes)
		* [2. Øke versjonsnummeret](#2-ke-versjonsnummeret)
		* [3. Release-PR og pakkene](#3-release-pr-og-pakkene)
		* [4. GitHub-utgivelsen](#4-github-utgivelsen)
		* [5. Neste versjon](#5-neste-versjon)
		* [Patch-versjoner](#patch-versjoner)
	* [➤ Bygge en ny utgivelse](#-bygge-en-ny-utgivelse)
	* [➤ NPM](#-npm)
	* [➤ Kontinuerlig integrasjon](#-kontinuerlig-integrasjon)
		* [CI (releases/*)](#ci-releases)
		* [Bygg og installer (dev)](#bygg-og-installer-dev)
		* [CI (channels/test)](#ci-channelstest)
		* [CI (build debug)](#ci-build-debug)
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


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#kom-i-gang-med-prosjektportalen-365)

## ➤ Kom i gang med Prosjektportalen 365

Denne siden er en vei gjennom den første uka for nye utviklere. Den gjentar ikke resten av [utviklingsguiden](../README.md), som er den autoritative dokumentasjonen: er denne siden og resten av guiden uenige, gjelder de andre kapitlene, og denne siden bør rettes. Les seksjonene i rekkefølge og følg lenkene når du trenger detaljene.

### 1. Hva du jobber med

Prosjektportalen 365 er et prosjektstyringsverktøy for Microsoft 365, bygget av Puzzlepart (nå Crayon Consulting) og distribuert som åpen kildekode (MIT). Installasjonen setter opp et porteføljeområde (hub) med oversikt over prosjektene, og hvert prosjekt får et eget område (en Microsoft 365-gruppe) med lister, sider og logikk etter Prosjektveiviseren, Digitaliseringsdirektoratets prosjektmodell. Det finnes også et programnivå over prosjektene. Brukerne har en egen [brukermanual](https://puzzlepart.github.io/prosjektportalen-manual/).

Repoet er et Rush-monorepo (pnpm, Heft, SPFx 1.24):

| Mappe | Innhold |
|---|---|
| `SharePointFramework/shared-library` | Delt kode (`pp365-shared-library`) som de fem andre løsningene bygger på |
| `SharePointFramework/PortfolioExtensions`, `PortfolioWebParts`, `ProgramWebParts`, `ProjectExtensions`, `ProjectWebParts` | Webdeler og utvidelser for portefølje-, program- og prosjektnivå; se [løsningene](spfx/losninger.md) og [komponentoversikten](spfx/komponentoversikt.md) |
| `SharePointFramework/.tasks`, `.jest-config`, `.eslint-config` | Delte byggeoppgaver (watch, `validate-loc`, kanalbygg), Jest-oppsettet og ESLint-oppsettet |
| `Templates/` | Provisjoneringsmalene og `.resx`-lokaliseringen deres; se [maler](maler/maler.md) |
| `SiteScripts/` | Site scripts; se [site design og site scripts](maler/site-design-og-site-scripts.md) |
| `Install/` | `Build-Release.ps1` (utgivelsesbygget), `Install.ps1` og oppgraderingsskriptene |
| `channels/` | Installasjonskanalene `main`, `test`, `i18n` og `kurs`; se [kanaler](maler/kanaler.md) |
| `e2e/` | Playwright-røyktester mot testtenanten (Rush-prosjektet `pp365-e2e`) |
| `.development-guide/` | Utviklingsguiden, delt i `spfx/`, `maler/`, `git/`, `ci/` og `utgivelse/` |
| `docs/plans/` | Planer for større løft, f.eks. [Heft-overgangen](../docs/plans/spfx-1.23-heft-toolchain.md) og [fase 5](../docs/plans/dependency-upgrades-phase-5.md) |

Alle fem løsningene avhenger av `shared-library`. `PortfolioWebParts` bruker i tillegg komponenter fra `ProjectWebParts`, og `ProgramWebParts` bruker komponenter fra `PortfolioWebParts` (og tekster fra `ProjectWebParts`). `.development-guide/README.md` er generert (`npm run generate-readme`), så les og rediger enkeltfilene i undermappene.

### 2. Første dag: oppsett

Du trenger:

- **Node 22**, versjonen i `.nvmrc` (22.22.2). `rush.json` godtar bare `>=22.14.0 <23.0.0`, så en annen hovedversjon stopper bygget. Med nvm: `nvm install && nvm use` i repo-roten. Med nvm-windows: `nvm install 22.22.2` og `nvm use 22.22.2`, siden den ikke nødvendigvis leser `.nvmrc`.
- **PowerShell 7** (`pwsh`) når du skal bygge en utgivelse (`npm run build-release`), og på Windows også som terminal. Mer om Windows i [Windows og macOS](spfx/utviklingsmiljo.md#windows-og-macos).
- **VS Code**, og **Chrome** for feilsøkingsoppsettet.
- Gjerne Rush globalt (`npm i -g @microsoft/rush`), så kommandoer som `rush rebuild -o pp365-shared-library` virker direkte. Uten: `node common/scripts/install-run-rush.js <kommando>`.

```bash
git clone https://github.com/Puzzlepart/prosjektportalen365.git
cd prosjektportalen365
npm run rush:init   # rush update og rebuild av alle prosjektene; tar en stund
```

- **Kjør aldri `npm install`, `npm i`, `pnpm install` eller `pnpm add` inne i en løsning.** Det ødelegger `node_modules` som Rush styrer, og ser bort fra den felles låsefila. Endre `package.json` og kjør `npm run rush:update` fra roten; se [Rush og bygging](spfx/rush.md).
- Dør bygget med «Reached heap limit», sett `NODE_OPTIONS=--max-old-space-size=8192` først, slik CI gjør: `export NODE_OPTIONS=…` i bash og zsh, `$env:NODE_OPTIONS='…'` i PowerShell, `set NODE_OPTIONS=…` i cmd.
- Rare feil etter et branchbytte: se «Full tilbakestilling av Rush-tilstand» i [rush.md](spfx/rush.md).

Be om tilgang til repoet på GitHub (for å pushe brancher) og til testtenanten: porteføljehuben på testkanalen og minst ett prosjektområde der. Det er der du kjører koden din, og der CI ruller ut og kjører Playwright-testene.

Tilgangene gir Remi (@remi749) eller Tarjei (@tarjeieo): send en melding på Teams eller e-post.

### 3. Kjøre en webdel lokalt

Koden kjøres på en ekte SharePoint-side; den SharePoint-hostede workbenchen pensjoneres 1. desember 2026. Alt står i [utviklingsmiljo.md](spfx/utviklingsmiljo.md).

1. **Bygg avhengighetene først.** `watch` bygger bare sin egen pakke og tar `shared-library` og `ProjectWebParts` fra `lib/` slik de ligger. Har du hentet endringer, kjør for eksempel `rush build -T pp365-portfoliowebparts` fra roten (alt PortfolioWebParts avhenger av, uten pakken selv). En gammel `lib/` gir «Module not found», eller gammel kode uten feilmelding.
2. **Start dev-serveren** i løsningen: `cd SharePointFramework/PortfolioWebParts && npm run watch`. Første gang lager `prewatch` en `.env` fra `SharePointFramework/.tasks/.env.template`.
3. **Juster `.env`** og start `npm run watch` på nytt:
   - `SERVE_CHANNEL` må være kanalen siden er installert på, ellers ber siden aldri om bundlene dine og kjører de utrullede. Testtenantens hub og programområder er på `test`.
   - `SERVE_BUNDLE_REGEX` til bundlen du jobber med (f.eks. `portfolio-overview-web-part`) gjør bygget mye raskere. Bundlenavnene står som kommentarer i `.env`.
   - `.env` lages bare når den mangler. Mangler en variabel, sammenlign med malen.
4. **Åpne siden med feilsøkingsparameterne** og godta «Load debug scripts»:
   `?debug=true&noredir=true&debugManifestsFile=https://localhost:4321/temp/build/manifests.js`
   Første gang må du stole på dev-sertifikatet: `npx heft trust-dev-cert` i en av løsningene.
5. **Feilsøk fra VS Code** med hele repoet åpnet: kopier `.vscode/launch.sample.json` til `.vscode/launch.json`, kjør `npm run watch`, start «Debug a page against npm run watch» (F5), velg løsningen og lim inn sidens URL uten spørrestreng. Stoppunkter i `shared-library` og `ProjectWebParts` treffer også.

Endrer du `shared-library` underveis, start `npm run watch` i `shared-library` før løsningens `watch`. Da laster siden seg selv når du lagrer i biblioteket. Tekster (`loc/*.js`) krever at du starter løsningens `watch` på nytt. Navngitte miljøer (`environments.json`, `SERVE_ENVIRONMENT`, `npm run watch -- --serve-config <navn>`) står i samme kapittel.

### 4. Kodekonvensjoner i korte trekk

Detaljer og ekte eksempler står i [kodemonster.md](spfx/kodemonster.md), og et sammendrag i [AGENTS.md](../AGENTS.md).

- **Komponentmappe med barrel:** `KomponentNavn/` med `index.ts` (bare re-eksport, aldri `.tsx`), `KomponentNavn.tsx`, `KomponentNavn.module.scss`, `useKomponentNavn.ts`, `types.ts` og ved behov `context.ts`/`reducer.ts`.
- **Logikk i hooks:** state, effekter, handlere og beregninger ligger i `useKomponentNavn`; `.tsx`-fila er bare JSX. Delt tilstand mellom underkomponenter går via Context, kompleks tilstand via en Redux Toolkit-reducer.
- **Funksjonsstil:** hooks og hjelpefunksjoner med `function`, komponenter som `const X: FC<Props> = …`.
- **Fluent UI v9** (`@fluentui/react-components`) med det delte biblioteket: `getFluentIcon`/`getFluentIconWithFallback` for ikoner, og `Fluent`-komponenten (eller `IdPrefixProvider` + `FluentProvider` med `customLightTheme`) rundt dialoger og skuffer. PnP-kontroller importeres fra hver sin inngang, aldri fra pakkens rot.
- **Engelske navn i koden, norsk tekst for brukeren**, alltid via loc-filene. Hver løsning har `src/loc/nb-no.js` (standard), `en-us.js` og typefila `mystrings.d.ts` (`myStrings.d.ts` i `PortfolioExtensions` og `ProjectExtensions`). En ny nøkkel legges i alle tre. `npm run validate-loc` i løsningen skriver nøklene som mangler, til `localization-report.md`, men stopper ingenting: les rapporten. En nøkkel som mangler i `en-us.js`, bygger fint og vises som `undefined` på engelsk. Doble komma (`,,`) i `.js`-filene krasjer modulen. Tekster med verdier bruker `format(strings.Nøkkel, …)`.
- **Kommentarer:** JSDoc (`/** */`) på eksporterte funksjoner, hooks, komponenter og grensesnitt; `//` bare for et ikke-opplagt *hvorfor*.
- **Ikke rediger genererte filer:** Sass-typingene i `temp/sass-ts/` og `src/loc/shared/*` (generert fra `Templates/Portfolio/Resources.*.resx`).
- **PnPjs 4:** bruk `getAllItems` og `getTermStore` fra `pp365-shared-library`, ikke v3-mønstrene; se punktet om PnPjs under «Before you edit» i [AGENTS.md](../AGENTS.md).
- **CI kjører på Linux:** stier skiller mellom store og små bokstaver, også der macOS og Windows ikke gjør det.
- **Lint:** `npm run lint` i en løsning (Prettier og ESLint), eller `npm run rush:lint` fra roten.

### 5. Tester

Les [testing.md](spfx/testing.md) før du skriver din første test.

- **Jest i bygget.** `src/**/*.test.ts(x)` kjører i `heft test`, altså i `npm test`, `npm run build`, `rush build`/`rebuild` og CI, og en test som feiler, stopper bygget. `npm run watch` og kanalbyggene (`npm run build:<kanal>`) kjører ingen tester. Testen ligger ved siden av koden.
- **Kjør** `npm test` i en løsning (bygger først). Én fil: `npx heft test --test-path-pattern Header` (et regulært uttrykk over stien til testfilen). `shared-library` må være bygget først.
- **Komponenttester** bruker React Testing Library og `jest.mock` av hooken eller dataadapteren, og `jest.mock(...)` må stå over importene. Importer aldri `@pnp/*` i en test; harnessen `pp365-jest-config` stubber den.
- **Dekningsgulv:** hver løsnings `config/jest.config.json` har `coverageThreshold`. Lokalt melder Jest bare et gulv som ikke nås, mens utgivelsesbygget i CI stopper på det: se på dekningen før du pusher. Gulvene skal bare opp: løft dem når du legger til tester, senk dem aldri.
- **Playwright (`e2e/`):** røyktester (`tests/smoke`) og brukerreiser (`tests/flows`; fire av dem skriver til testtenanten og rydder etter seg) mot testtenanten. De kjører i CI etter hver utrulling til testkanalen (`ci-channel-test.yml`), og rapporten lastes opp som artefaktet `playwright-report-test-channel`. Lokalt i `e2e/`: `cp .env.example .env`, fyll inn, `npx playwright install chromium` og `npm test`.
- Den som åpner en PR, retter tester som feiler på grunn av den. Slett aldri en påstand bare for å få grønt.

### 6. Fra endring til merge

Se [branching og arbeidsflyt](git/branching-og-arbeidsflyt.md), [commit-praksis](git/commit-praksis.md) og [kontinuerlig integrasjon](ci/kontinuerlig-integrasjon.md).

1. **Branch.** `main` er siste utgivelse. Utviklingen skjer på release-branchen for neste minor, `releases/x.y` (nå `releases/1.15`). Lag din branch derfra, med navn etter typen arbeid: `feat/<emne>`, `fix/<emne>`, `chore/<emne>` eller `docs/<emne>`, eller `issues/<nr>` for et enkelt issue.
2. **Commit** på engelsk, semantisk: `<type>(<scope>): <subject>`, f.eks. `fix(projectwebparts): resolve timeline rendering issue`. Typene er `feat`, `fix`, `docs`, `style`, `refactor`, `chore`, `ci` og `install`.
3. **CI-tagger i emnelinjen.** Bare første linje leses, også i en squash-merge:
   - `[skip-ci]`: ingen bygg eller utrulling, f.eks. for dokumentasjon.
   - `[apps-only]`: bare SPFx-pakkene, ikke malene; bruk det når `Templates/` er urørt.
   - `[apps-only:X]`: bare de oppgitte løsningene, f.eks. `[apps-only:ProjectWebParts,PortfolioWebParts]`. `shared-library` er bundlet inn i løsningene som bruker den, så en endring der når sidene bare gjennom løsningene du lister.
   - `[skip-e2e]`: hopper over Playwright-testene etter utrullingen.
   - `[build-debug]`: bygger testkanalens pakke uten utrulling, for å prøve endringer i selve bygget.
4. **Hva CI gjør.** En push til `releases/1.15` bygger og oppgraderer utviklingsmiljøet (`ci-releases.yml`) og bygger testkanalen, ruller den ut til testtenanten og kjører Playwright mot den (`ci-channel-test.yml`). En push dit oppgraderer altså testtenanten. Det kjører ingen bygg på pull requests i dag, så bygg og test lokalt før du ber om review.
5. **Changelog.** Legg til en linje på norsk i [CHANGELOG.md](../CHANGELOG.md) under neste versjon (`Ny funksjonalitet`, `Forbedringer` eller `Feilrettinger`), skrevet for brukeren og med issue-nummer når det finnes.
6. **PR** mot release-branchen med [PR-malen](../.github/PULL_REQUEST_TEMPLATE.md): beskrivelse, før/etter-skjermbilder ved visuelle endringer, teststeg som en bruker uten kodekunnskap kan følge, milepæl, labels og deg selv som ansvarlig.
7. **Review.** [CODEOWNERS](../.github/CODEOWNERS) gjør @tarjeieo og @remi749 til standard-reviewere. De sjekker testpunktene, om endringen hører hjemme i release notes og om [brukermanualen](https://puzzlepart.github.io/prosjektportalen-manual/) må oppdateres.

### 7. Jobbe med en AI-assistent

- [AGENTS.md](../AGENTS.md) er en kort, engelsk indeks for agenter: repokartet, fellene som knekker bygget, konvensjonene og kommandoene.
- Ferdighetene (skills) ligger i [`.claude/skills/`](../.claude/skills/), som både Claude Code og GitHub Copilot leser. De som begynner på `pp365-`, er skrevet for dette repoet; `spfx` og `playwright-cli` er generelle. Assistenten henter en ferdighet selv når oppgaven passer, eller du ber om den ved navn (i Claude Code f.eks. `/pp365-testing`).

| Ferdighet | Brukes til |
|---|---|
| `pp365-toolchain` | Rush, pnpm og Heft i dette repoet: avhengigheter, bygg, kanalbygg, watch, serve og feilsøking, og fellene fra SPFx 1.23-overgangen |
| `pp365-testing` | Jest-harnessen, å skrive og rette enhets- og komponenttester, og Playwright-testene |
| `pp365-ui` | Komponenter og grensesnitt: de delte innpakningene i `shared-library`, Fluent UI v9, ikoner, stiler, tekster og tilgjengelighet |
| `pp365-templates` | Innhold som når områdene: felt, innholdstyper, lister og sider i malene, `.resx`-tekstene, kanaler og oppgraderingsskript |
| `pp365-release` | Fra endring til utgivelse: commit-tagger, hva CI kjører, kanaler og versjonsstempling, changelog, release notes, PR og feilede kjøringer |
| `spfx` | Generell SPFx: nye prosjekter, oppgraderinger, React-design og PnPjs. Der den og `pp365-toolchain` er uenige, gjelder `pp365-toolchain` |
| `playwright-cli` | Styre en nettleser, og planlegge, generere og reparere Playwright-tester |

- Ferdighetene skal bare ligge i `.claude/skills`. `npm run check-skills`, som `skills.yml` kjører i CI, feiler på en kopi i `.github/skills` eller `.agents/skills`.
- **Guiden er sannhetskilden.** AGENTS.md og ferdighetene er sammendrag. Endrer du en konvensjon, oppdater guiden først og så det som gjentar den. Personlige preferanser (hvem som kjører git, editoroppsett) hører hjemme i din egen agenthukommelse, ikke i repoet.
- Les det assistenten lager som kode fra en kollega: norsk tekst i loc-filene, tester for ny logikk og en changelog-linje.

### 8. Første oppgave og hvor du spør

Forslag til første uke:

1. Få `npm run rush:init` grønt og `npm run watch` i gang mot en side i testtenanten. Gjør en liten synlig endring og se den på siden, uten å committe den.
2. Skriv en komponenttest for en komponent som mangler en, helst i `PortfolioExtensions` eller `ProgramWebParts`, som har de laveste gulvene (37 og 38 % statements), og løft gulvet i `config/jest.config.json`. Det berører ingen brukere, men tar deg gjennom konvensjonene, harnessen og hele PR-løpet.
3. Ta så et lite issue fra [issue-lista](https://github.com/Puzzlepart/prosjektportalen365/issues) etter avtale med en reviewer.

Spør i den interne kanalen på Teams, eller i issuet eller PR-en det gjelder. Fadderen din som ny utvikler er Remi (@remi749); de faste reviewerne er Remi og Tarjei (@tarjeieo).



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#branching-strategi-og-arbeidsflyt)

## ➤ Branching-strategi og arbeidsflyt

### Branching-strategi

`main` er siste utgivelse. Hver minor-versjon utvikles på sin egen release-branch, `releases/x.y`:

- `releases/1.15`: gjeldende utviklings-branch
- `releases/1.14`, `releases/1.13`, …: tidligere utgivelser

Nye funksjoner og feilrettinger går mot gjeldende release-branch. Versjonene følger [Semantic Versioning](https://semver.org/spec/v2.0.0.html). En minor får sin egen branch. Hvilken branch en patch lages fra, avtales i teamet; se [Opprettelse av en ny versjon](../utgivelse/opprette-ny-versjon.md).

En push til `releases/1.15` bygger og ruller ut til utviklingsmiljøet og testtenanten; se [Kontinuerlig integrasjon](../ci/kontinuerlig-integrasjon.md).

### Din branch

Lag branchen fra gjeldende release-branch, og gi den navn etter typen arbeid, som commit-typene: `feat/<emne>`, `fix/<emne>`, `chore/<emne>` eller `docs/<emne>`. For et enkelt issue går også `issues/<issue-nummer>`.

```bash
git checkout releases/1.15
git pull
git checkout -b fix/tidslinje-zoom
```

Lag ikke en branch fra en annen langvarig branch (som `feat/dependency-upgrades-phase-5`): da følger alle dens commits med i pull requesten. `git log --oneline origin/releases/1.15..HEAD` skal bare vise dine egne.

### Pull request og merge

- Opprett pull requesten mot release-branchen, med milepælen for versjonen (`1.15.0`), og fyll ut `.github/PULL_REQUEST_TEMPLATE.md`. Referer til issuet i beskrivelsen.
- Slå sammen med **Squash and merge**. CI leser emnelinjen i squash-commiten, så legg en CI-tag som `[apps-only]` på slutten av emnelinjen i merge-dialogen, ikke i PR-tittelen. En vanlig merge-commit har ingen tag og starter alltid hele løpet. Se [Commit-praksis](commit-praksis.md) og taggene i [Kontinuerlig integrasjon](../ci/kontinuerlig-integrasjon.md).
- Pull requester kjører ingen bygg, bare `skills.yml` når agentferdighetene er endret. Bygg og test lokalt før du ber om review.



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

Nøkkelordene leses bare fra emnelinjen (første linje) i commit-meldingen, unntatt på `main`, der `build-release.yml` leser hele meldingen. Den fullstendige listen og hva hver arbeidsflyt gjør, står i [Kontinuerlig integrasjon](../ci/kontinuerlig-integrasjon.md). De mest brukte:

- `[skip-ci]` – ingen bygging eller utrulling (unntatt `skills.yml`, som bare sjekker agentferdighetene)
- `[apps-only]` – bygger og ruller ut bare pakkene (appkatalogen), ikke malene. Brukes når ingenting i `Templates/` er endret.
- `[apps-only:<løsninger>]` – som `[apps-only]`, men pakker og ruller ut bare de oppgitte løsningene (alle seks bygges fortsatt)
- `[skip-e2e]` – hopper over Playwright-testene etter utrullingen til testkanalen
- `[build-debug]` – bygger pakken i feilsøkingsarbeidsflyten, uten utrulling

**Eksempler på bruk:**

```text
docs: update the development guide [skip-ci]
fix(PortfolioWebParts): long column names end in an ellipsis [apps-only:PortfolioWebParts,ProgramWebParts]
feat(shared-library): a new utility function [apps-only]
ci: try a change to the build [skip-ci] [build-debug]
```

**Tips:** Bruk `[skip-ci]` når endringen ikke påvirker det som bygges (for eksempel bare dokumentasjon), og `[apps-only]` når malene ikke er endret: en full kjøring oppgraderer testtenanten med maler og tar rundt 40 minutter.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#komponentoversikt)

## ➤ Komponentoversikt

| Navn                          | Løsning/Pakke       | Beskrivelse                                            | Id                                   |
| ----------------------------- | ------------------- | ------------------------------------------------------ | ------------------------------------ |
| Footer                        | PortfolioExtensions | Footer-utvidelse (legger seg i bunnen)                 | 84f27cec-ffde-4e00-a4cf-25c69f691054 |
| IdeaProcessing                | PortfolioExtensions | Listeutvidelse for Idébehandling                       | b28cba0d-922c-44e0-a035-e4ea57d80e6d |
| IdeaProjectData               | PortfolioExtensions | Listeutvidelse for Idé - Prosjektdata                  | 69a7f6eb-e7ce-40eb-81e1-6f172a802619 |
| IdeaRegistration              | PortfolioExtensions | Listeutvidelse for Idéregistrering                     | 5d26712e-bdad-4ebf-b33f-9c759042bef6 |
| LatestProjectsWebPart         | PortfolioWebParts   | Siste prosjekter                                       | 941fd73c-b957-41c3-8d4f-082268407f10 |
| PortfolioAggregationWebPart   | PortfolioWebParts   | Portefølje aggregeringsoversikt (eks: Nytteoversikt) | 6c0e484d-f6da-40d4-81fc-ec1389ef29a8 |
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



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#kodemnstre-i-spfx-lsningene)

# ➤ Kodemønstre i SPFx-løsningene

Denne guiden forklarer de viktigste kodemønstrene vi bruker i SharePoint Framework-løsningene. Følg disse mønstrene når du lager nye komponenter eller endrer eksisterende.


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#innhold)

## ➤ Innhold

- [Komponentstruktur (Barrel-eksport)](#komponentstruktur-barrel-eksport)
- [Hook-mønsteret (useKomponent)](#hook-mønsteret-usekomponent)
- [Context-mønsteret](#context-mønsteret)
- [Reducer-mønsteret](#reducer-mønsteret)
- [Lokalisering (loc)](#lokalisering-loc)
- [SCSS-moduler](#scss-moduler)
- [Fluent UI v9](#fluent-ui-v9)
- [Montering av React](#montering-av-react)
- [Kommentarer](#kommentarer)

---


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#komponentstruktur-barrel-eksport)

## ➤ Komponentstruktur (Barrel-eksport)

Alle komponenter følger et konsekvent mappestruktur-mønster. En komponentmappe inneholder alltid en **barrel-fil** (`index.ts`) som re-eksporterer, en **navngitt komponentfil** og støttefiler.

### Mappestruktur

```
KomponentNavn/
├── index.ts                        # Barrel-eksport (kun re-eksport)
├── KomponentNavn.tsx                # Selve React-komponenten
├── KomponentNavn.module.scss        # CSS-moduler (styles); typene genereres til temp/sass-ts/ av Heft
├── useKomponentNavn.ts              # Hook med logikk (state, handlers)
├── types.ts                         # Props, state og andre typer
├── context.ts                       # React Context (valgfritt)
├── reducer.ts                       # Redux Toolkit-reducer (valgfritt)
└── UnderKomponent/                  # Underkomponenter (følger samme mønster)
    ├── index.ts
    ├── UnderKomponent.tsx
    └── ...
```

### Barrel-filen (`index.ts`)

Barrel-filen er alltid en `.ts`-fil (ikke `.tsx`) og inneholder **kun re-eksporter**. Den skal aldri inneholde logikk eller JSX.

```ts
// index.ts
export * from './KomponentNavn'
export * from './types'
```

> **Hvorfor?** 
> - Ryddig importsti: `import { KomponentNavn } from './KomponentNavn'` i stedet for `import { KomponentNavn } from './KomponentNavn/KomponentNavn'`
> - Kontrollert API: Du bestemmer hva som eksponeres ut av mappen
> - Konsistent mønster: Alle komponenter fungerer likt

### Ekte eksempel: `TemplateSelector`

```
TemplateSelector/
├── index.ts                          # export * from './TemplateSelector'
├── TemplateSelector.tsx              # React-komponent
├── TemplateSelector.module.scss      # Styles
├── useTemplateSelector.tsx           # All logikk (state, filtrering, handlers)
└── types.ts                          # TemplateSelectorMode type
```

**index.ts:**
```ts
export * from './TemplateSelector'
export * from './types'
```

**TemplateSelector.tsx** (forenklet):
```tsx
import { useTemplateSelector } from './useTemplateSelector'
import styles from './TemplateSelector.module.scss'

export const TemplateSelector: FC = () => {
  const { mode, matchingTemplates, onTemplateSelect, ... } = useTemplateSelector()

  return (
    <div className={styles.root}>
      {/* JSX her — kun presentasjon */}
    </div>
  )
}
```

### Ekte eksempel: `ProjectSetupDialog` (større komponent)

```
ProjectSetupDialog/
├── index.ts                              # Barrel
├── ProjectSetupDialog.tsx                # Hovedkomponent
├── ProjectSetupDialog.module.scss        # Styles
├── useProjectSetupDialog.ts              # Hook med reducer, submit, validering
├── types.ts                              # IProjectSetupDialogProps, IProjectSetupDialogState
├── context.ts                            # ProjectSetupDialogContext
├── reducer.ts                            # Redux Toolkit reducer
├── TemplateSelector/                     # Underkomponent (eget barrel-mønster)
│   ├── index.ts
│   └── ...
├── ExtensionsSection/                    # Underkomponent
│   ├── index.ts
│   └── ...
└── ContentConfigSection/                 # Underkomponent
    ├── index.ts
    └── ...
```

---


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#hook-mnsteret-usekomponent)

## ➤ Hook-mønsteret (`useKomponent`)

All komponentlogikk (state, side effects, event handlers, beregninger) plasseres i en **custom hook** med prefiks `use`. Komponenten selv skal kun inneholde JSX/presentasjon.

### Hvorfor?

- **Separasjon**: Logikk og presentasjon er adskilt
- **Testbarhet**: Hooken kan testes uavhengig av rendering
- **Lesbarhet**: Komponenten blir kort og lett å forstå

### Mønster

```ts
// useKomponentNavn.ts
export function useKomponentNavn(props?: IKomponentNavnProps) {
  // State
  const [value, setValue] = useState('')

  // Side effects
  useEffect(() => { /* ... */ }, [])

  // Handlers
  const onSomethingChanged = () => { /* ... */ }

  // Beregnede verdier
  const filteredItems = useMemo(() => { /* ... */ }, [items])

  // Returner alt komponenten trenger
  return {
    value,
    filteredItems,
    onSomethingChanged
  }
}
```

```tsx
// KomponentNavn.tsx
export const KomponentNavn: FC<IKomponentNavnProps> = (props) => {
  const { value, filteredItems, onSomethingChanged } = useKomponentNavn(props)

  return <div>{/* Bruk verdiene fra hooken */}</div>
}
```

### Ekte eksempel: `useProjectSetupDialog`

```ts
export function useProjectSetupDialog(props: IProjectSetupDialogProps) {
  const [state, dispatch] = useReducer(createReducer(props.data), initialState)

  useEffect(() => {
    dispatch(INIT())
  }, [])

  const onSubmit = () => {
    props.onSubmit(state)
  }

  const isConfigDisabled = (type: 'extensions' | 'contentConfig'): boolean => {
    // ... valideringslogikk
  }

  return { state, dispatch, onSubmit, isConfigDisabled }
}
```

> **Tips:** Hooken kan bruke andre hooks som `useContext`, `useReducer`, `useMemo` osv. Komponenten destrukturerer bare returverdien.

---


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#context-mnsteret)

## ➤ Context-mønsteret

Når en komponent har underkomponenter som trenger tilgang til felles state, bruker vi React Context. Dette unngår "prop drilling" (å sende props gjennom mange nivåer).

### Mønster

```ts
// context.ts
import { UnknownAction } from '@reduxjs/toolkit'
import { createContext, useContext } from 'react'

export interface IKomponentContext {
  props: IKomponentProps
  state: IKomponentState
  dispatch: React.Dispatch<UnknownAction>
}

export const KomponentContext = createContext<IKomponentContext>(null)

export function useKomponentContext() {
  return useContext(KomponentContext)
}
```

### Bruk i hovedkomponenten (Provider)

```tsx
// KomponentNavn.tsx
export const KomponentNavn: FC<IKomponentProps> = (props) => {
  const { state, dispatch } = useKomponentHook(props)

  return (
    <KomponentContext.Provider value={{ props, state, dispatch }}>
      <UnderKomponent />    {/* Har nå tilgang til context */}
      <AnnenKomponent />    {/* Har også tilgang */}
    </KomponentContext.Provider>
  )
}
```

### Bruk i underkomponent (Consumer)

```ts
// useUnderKomponent.ts
export function useUnderKomponent() {
  const context = useKomponentContext()
  // Bruk context.props, context.state, context.dispatch
}
```

### Ekte eksempel

`ProjectSetupDialog` bruker context slik at `TemplateSelector`, `ExtensionsSection` og `ContentConfigSection` alle har tilgang til valgt mal, state og dispatch uten å sende props manuelt.

---


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#reducer-mnsteret)

## ➤ Reducer-mønsteret

For komponenter med kompleks state bruker vi **Redux Toolkit** sin `createAction` og en reducer-funksjon med `useReducer`.

### Mønster

```ts
// reducer.ts
import { createAction, createReducer } from '@reduxjs/toolkit'

export const SOME_ACTION = createAction<PayloadType>('SOME_ACTION')
export const ANOTHER_ACTION = createAction('ANOTHER_ACTION')

export const initialState: IKomponentState = {
  // ... startverdier
}

export default (data: IData) =>
  createReducer(initialState, (builder) =>
    builder
      .addCase(SOME_ACTION, (state, { payload }) => {
        state.someField = payload
      })
      .addCase(ANOTHER_ACTION, (state) => {
        // ... oppdater state
      })
  )
```

Bruk byggeren (`builder.addCase`), som gir handlingen riktig type ut fra `createAction`. Objektnotasjonen (`{ [SOME_ACTION.type]: … }`) finnes ikke lenger i Redux Toolkit 2.

Brukes i hooken:
```ts
const [state, dispatch] = useReducer(createReducer(props.data), initialState)
dispatch(SOME_ACTION(payload))
```

Hver handler i reduceren har en test i `reducer.test.ts` ved siden av den, som `ProgramWebParts/src/components/ProgramAdministration/reducer.test.ts`.

---


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#lokalisering-loc)

## ➤ Lokalisering (loc)

Alle brukersynlige tekster skal lokaliseres. SPFx bruker en `loc/`-mappe med følgende filer:

```
loc/
├── mystrings.d.ts    # TypeScript-deklarasjon (interface med alle nøkler); myStrings.d.ts i utvidelsene
├── nb-no.js          # Norsk bokmål (standard)
└── en-us.js          # Engelsk
```

### Legge til en ny tekststreng

**Steg 1:** Legg til i TypeScript-deklarasjonen (`mystrings.d.ts`, eller `myStrings.d.ts` i PortfolioExtensions og ProjectExtensions; Linux skiller på store og små bokstaver):
```ts
declare interface IProjectExtensionsStrings {
  // ... eksisterende strenger
  MinNyeTekst: string
}
```

**Steg 2:** Legg til norsk oversettelse (`nb-no.js`):
```js
define([], function () {
  return {
    // ... eksisterende strenger
    MinNyeTekst: 'Min nye tekst på norsk',
  }
})
```

**Steg 3:** Legg til engelsk oversettelse (`en-us.js`):
```js
define([], function () {
  return {
    // ... eksisterende strenger
    MinNyeTekst: 'My new text in English',
  }
})
```

**Steg 4:** Bruk i koden:
```tsx
import * as strings from 'ProjectExtensionsStrings'

<Text>{strings.MinNyeTekst}</Text>
```

> **Viktig:** Pass på at det ikke kommer doble kommaer (`,,`) i `.js`-filene — dette vil føre til at modulen ikke laster og hele appen krasjer.

### Formateringsstrenger

For tekster med dynamiske verdier, bruk `format` fra `pp365-shared-library` (inne i biblioteket selv: fra `util`):
```tsx
import { format } from 'pp365-shared-library'

// I loc-fil: ProgressStepCountText: 'Steg {0} av {1}'
format(strings.ProgressStepCountText, currentStep, totalSteps)
```

---


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#scss-moduler)

## ➤ SCSS-moduler

Vi bruker CSS-moduler (`.module.scss`) for scoped styling. Klassene blir automatisk unike per komponent.

### Mønster

```scss
// KomponentNavn.module.scss
.root {
  width: 850px !important;
  max-width: 850px !important;
}

.content {
  min-height: auto;
  overflow: hidden;
}

.subText {
  margin-bottom: 12px;
  color: var(--colorNeutralForeground3);
  font-size: var(--fontSizeBase300);
  font-weight: var(--fontWeightRegular);
}
```

Bruk i komponenten:
```tsx
import styles from './KomponentNavn.module.scss'

<div className={styles.root}>
  <p className={styles.subText}>{subText}</p>
</div>
```

### Konsistens

Dialoger (`ProjectSetupDialog`, `ProgressDialog`, `ErrorDialog`) bruker samme bredde og subText-styling:

```scss
.root {
  width: 850px !important;
  max-width: 850px !important;
}

.subText {
  margin-bottom: 12px;
  color: var(--colorNeutralForeground3);
  font-size: var(--fontSizeBase300);
  font-weight: var(--fontWeightRegular);
}
```

Dialogene i ProjectExtensions bygger på `@BaseDialog`, som tar `subText` som prop og viser den under tittelen. Farger, størrelser og vekter tas fra Fluents tokens (`var(--colorNeutralForeground3)` osv.), som finnes under en `FluentProvider`; ikke hardkod farger som `#605e5c`.

---


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#fluent-ui-v9)

## ➤ Fluent UI v9

Vi bruker **Fluent UI v9** (`@fluentui/react-components`) for UI-komponenter. Fluent UI v8 (`@fluentui/react`) er bare igjen i ikonfallbacken i `shared-library/src/icons/index.tsx` og inne i PnP-kontrollene; ikke ta det inn i ny kode.

### Vanlige v9-importer

```tsx
import {
  Button,
  Tab,
  TabList,
  Badge,
  Combobox,
  Option,
  Text,
  Tooltip,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  DataGrid,
  SearchBox,
  Radio,
  RadioGroup,
  Spinner,
  Divider,
  FluentProvider,
  IdPrefixProvider,
  useId
} from '@fluentui/react-components'
```

### Ikoner

```tsx
import { ChevronDownRegular, ChevronUpRegular } from '@fluentui/react-icons'

// Eller via shared-library helper:
import { getFluentIcon, getFluentIconWithFallback } from 'pp365-shared-library'
getFluentIcon('PuzzlePiece')
getFluentIconWithFallback(iconName, { color, size })
```

`getFluentIconWithFallback` tar et navn fra en liste (f.eks. `GtSecIcon`) og rendrer et bundlet Fluent-ikon (strek som fylles ved hover) dersom navnet finnes i ikonkatalogen, og et UI Fabric-fontikon (`<Icon iconName>`) ellers. Gamle UI Fabric-navn (`BarChart4`, `DateTime`, `CircleFill`, …) oversettes til Fluent-ikoner via `fabricIconAliases` i `shared-library/src/icons/fabricIconAliases.ts`. `resolveFluentIcon(name)` er det ene oppslaget (katalog → alias → `null`) som alle ikon-helpere bygger på — bruk den fremfor å slå opp i `iconCatalog` direkte. Trenger du en ikon*komponent* (f.eks. til `Tab` eller `MenuItem`) fremfor JSX, bruk `getIconComponentWithFallback(name)`.

#### Legge til et ikon i katalogen

Katalogen i `shared-library/src/icons/iconCatalog.ts` er bevisst kuratert: `pp365-shared-library` bundles inn i hvert eneste webdel-entrypoint, så `import * as Icons from '@fluentui/react-icons'` ville lagt ~3,6 MB på hver bundle (ESLint stopper dette). Slik legger du til et nytt ikon:

1. Verifiser at både Regular- og Filled-varianten finnes:

   ```sh
   grep -c "\bNavnRegular: " SharePointFramework/shared-library/node_modules/@fluentui/react-icons/lib/icons/chunk-*.d.ts
   grep -c "\bNavnFilled: " SharePointFramework/shared-library/node_modules/@fluentui/react-icons/lib/icons/chunk-*.d.ts
   ```

2. Legg til de to navngitte importene og en `Navn: { regular: NavnRegular, filled: NavnFilled }`-oppføring i `src/icons/iconCatalog.ts`. Aldri `import *`, og aldri fra `lib/sizedIcons`.
3. Erstatter ikonet et UI Fabric-navn som ligger som standardverdi i malene (`Statusseksjoner`, `Portefoljevisninger`, `Datakilder`)? Legg da til et alias i `fabricIconAliases.ts` (eksisterende tenanter beholder de gamle radverdiene for alltid) og oppdater de fire feltbeskrivelsene i `Templates/Portfolio/Resources.*.resx` (`SiteFields_GtSecIcon_Description`, `SiteFields_GtPortfolioFabricIcon_Description`, `SiteFields_GtIconName_Description`, `SiteFields_GtPortfolioColumnIconName_Description`).
4. Kostnad: ≈ 1,2 KB uminifisert per ikonpar per bundle-kopi — hold katalogen til ikoner som faktisk brukes.
5. Bygg shared-library på nytt før du bruker ikonet fra en løsning: `rush rebuild -o pp365-shared-library`.

### PnP-kontroller

Importer PnP-kontrollene fra hver sin inngang, aldri fra pakkens rot: `import { ModernTaxonomyPicker } from '@pnp/spfx-controls-react/lib/ModernTaxonomyPicker'` og `import { PropertyFieldMultiSelect } from '@pnp/spfx-property-controls/lib/PropertyFieldMultiSelect'`. Ingen av pakkene erklærer at de er fri for sideeffekter (`sideEffects`), så webpack kan ikke ta bort kontrollene en bundle ikke bruker: en import fra roten tar med alle kontrollene og Fluent v8-koden deres (liste, personvelger, callout) i bundelen. ESLint stopper rot-importene (`no-restricted-imports` i `SharePointFramework/.eslint-config/index.js`).

### FluentProvider og IdPrefixProvider

Alle dialoger wrappes i `FluentProvider` med prosjektets egne tema og `IdPrefixProvider` for å unngå ID-kollisjoner med SharePoint:

```tsx
import { customLightTheme } from 'pp365-shared-library'

<IdPrefixProvider value={fluentProviderId}>
  <FluentProvider theme={customLightTheme}>
    {/* ... */}
  </FluentProvider>
</IdPrefixProvider>
```

### Render-funksjoner for slots

En slot kan få en render-funksjon i stedet for innhold: `label={{ children: (Component, props) => ... }}`. Fluent kaller den med slotens elementtype og props, og i props ligger det Fluent har koblet sammen, som `id` og `for` som knytter en `Field`-etikett til kontrollen. En funksjon som overser argumentene, tegner bare sitt eget innhold, og koblingen forsvinner. `FieldContainer` gjorde det til fase 4: feltene med ikon hadde ingen etikett for skjermlesere. Send videre det slot-en trenger, slik `FieldContainer` nå gjør med etikettens `id` og `htmlFor`.

---


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#montering-av-react)

## ➤ Montering av React

Webdeler, utvidelser, dialoger og felt i egenskapsruten monterer React med `renderReact` og `unmountReact` fra `pp365-shared-library`, aldri med `render` fra `react-dom` direkte. Den ene filen, `shared-library/src/util/reactRoot.ts`, gir hver beholder en React 18-root (`createRoot`) ved første tegning og beholder den til avmonteringen. Tegningen skjer etter at kallet har returnert, så en test som monterer med `renderReact`, pakker kallet i `act`.

```ts
import { renderReact, unmountReact } from 'pp365-shared-library'

renderReact(createElement(Footer, footerProps), this._footerElement)
// …og når verten fjernes:
unmountReact(this._footerElement)
```

Det som tegner i sin egen beholder, fjerner komponenten når verten fjernes (basewebdelene gjør det i `onDispose`), og tegner på nytt i den samme beholderen i stedet for i en ny hver gang. Før 1.15 tegnet bunnteksten i en ny beholder ved hver navigering og la igjen en montert bunntekst for hver side.


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#kommentarer)

## ➤ Kommentarer

- **JSDoc (`/** */`)** på det som eksporteres og på hooks og komponenter: én kort linje om hva det er til, og `@param`/`@returns` bare når det ikke er åpenbart.
- **`//`-kommentarer** bare for det som ikke kan leses av koden: hvorfor noe er gjort slik (en begrensning, en felle, en omvei rundt et rammeverk), ikke hva neste linje gjør.
- Hold dem korte. En kommentar som gjentar koden, blir feil første gang koden endres.

```tsx
/**
 * Whether a click leaves the row's selection alone.
 */
function isOwnClick(event: MouseEvent<HTMLElement>) {
  // A dialog a cell opens is portalled outside the row, yet React passes its clicks up through it.
  if (!event.currentTarget.contains(event.target as Node)) return true
  ...
}
```

---


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#oppsummering)

## ➤ Oppsummering

| Mønster | Fil | Formål |
|---------|-----|--------|
| Barrel-eksport | `index.ts` | Ryddig re-eksport, kontrollert API |
| Navngitt komponent | `KomponentNavn.tsx` | Kun JSX/presentasjon |
| Custom hook | `useKomponentNavn.ts` | All logikk, state, handlers |
| Types | `types.ts` | Props, state, og andre interfaces |
| Context | `context.ts` | Delt state mellom under-komponenter |
| Reducer | `reducer.ts` | Kompleks state-håndtering |
| SCSS-modul | `KomponentNavn.module.scss` | Scoped styles |
| Lokalisering | `loc/nb-no.js`, `en-us.js`, `mystrings.d.ts` (`myStrings.d.ts` i utvidelsene) | Flerspråklige tekster |



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
| `check-skills`                 | `node ./.tasks/check-skills.js`                                                                           | Sjekker at agentferdighetene (skills) bare ligger i `.claude/skills`: Claude Code leser bare den mappen, og GitHub Copilot leser den også. Feiler hvis `.github/skills` eller `.agents/skills` finnes, eller hvis en `SKILL.md` mangler `name` lik mappenavnet eller en `description` på 1–1024 tegn. Kjøres i CI av `skills.yml`. |
| `check-channel-ids` | `node ./.tasks/check-channel-ids.js` | Sjekker at løsningene har main-kanalens løsnings- og komponent-ID-er i `config/package-solution.json` og manifestene, slik `channels/main.json` har dem. Feiler og lister avvikene ellers. `Install/Build-Release.ps1` kjører den før bygget. |
| `test:tasks` | `node --test ".tasks/*.test.js"` | Kjører testene for skriptene i `.tasks/` (i dag `check-channel-ids`). |
| `postversion`                  | `npm run generate-readme && npm run sync-version && npm run generate-sbom`                                | Kjøres automatisk av npm etter `npm version patch/minor`. Regenererer README, synkroniserer versjoner og oppdaterer SBOM i ett steg.                                                             |
| `rush:init`                    | `npm run rush:update && npm run rush:build`                                                               | Førstegangsoppsett av repoet. Kjører `rush:update` etterfulgt av `rush:build` slik at avhengigheter installeres og alle løsningene bygges i riktig rekkefølge. Se [Rush og bygging](./rush.md).  |
| `rush:update`                  | `node common/scripts/install-run-rush.js update`                                                          | Kjører `rush update` uten at Rush er installert globalt. Installerer avhengigheter og sikrer konsistente versjoner på tvers av løsningene.                                                       |
| `rush:build`                   | `node common/scripts/install-run-rush.js rebuild --verbose`                                               | Kjører `rush rebuild` med detaljerte logger. Bygger alle løsningene i monorepoet i riktig avhengighetsrekkefølge og kjører testene.                                                               |
| `rush:lint`                    | `node common/scripts/install-run-rush.js lint`                                                            | Kjører `lint`-skriptet i alle prosjektene via Rush. I SPFx-løsningene skriver det om filene (`prettier --write`, `eslint --fix`).                                                            |
| `build-release`                | `pwsh -File ./Install/Build-Release.ps1`                                                                  | Bygger en komplett utgivelsespakke ved å kjøre PowerShell-skriptet `Install/Build-Release.ps1`. Se [Bygge en ny utgivelse](../utgivelse/bygge-utgivelse.md).                                     |

### Skript i SPFx-løsningene

Hver SPFx-løsning under `SharePointFramework/` (`PortfolioExtensions`, `PortfolioWebParts`, `ProgramWebParts`, `ProjectExtensions`, `ProjectWebParts`) har samme sett med skript. Disse styrer daglig utvikling, bygging, linting og lokaliseringsvalidering for løsningen.

| Skript          | Kommando                                                                                                                         | Hva det gjør / hvorfor                                                                                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `watch`         | `heft start --nobrowser`                                                                                                         | Starter utviklingsserveren (webpack-dev-server) uten å åpne nettleseren. Hovedkommandoen for lokal utvikling; siden oppdateres automatisk ved endringer. Velg miljø med `npm run watch -- --serve-config <navn>`.   |
| `prewatch`      | `node ../.tasks/pre-watch.js`                                                                                                    | Kjøres automatisk før `watch`. Oppretter `.env`, `config/serve.json` (fra `environments.json` og `config/serve.sample.json`) og `.vscode/launch.json` fra maler, filtrerer bundler basert på `SERVE_BUNDLE_REGEX` og håndterer kanalbytte. Se [Utviklingsmiljø](./utviklingsmiljo.md). |
| `postwatch`     | `node ../.tasks/post-watch.js`                                                                                                   | Kjøres automatisk når `watch` avslutter uten feil. Tilbakestiller kanal-ID-ene i `config/package-solution.json` og manifestene, og bundle-filteret i `config/config.json`. Viser `git status` endrede `manifest.json` etter en `watch`, tilbakestill med `node ../.tasks/modifySolutionFiles.js --revert --force` og `node ../.tasks/setBundleConfig.js --revert`. Commit aldri kanal-ID-er. |
| `start`         | `heft start`                                                                                                                     | Som `watch`, men åpner nettleseren på `serveConfigurations.default` fra `config/serve.json`. Heft legger selv på `debug`, `noredir` og `debugManifestsFile`. Bruk `--locales nb-no` for å bygge kun ett språk.      |
| `build`         | `heft test --clean --production && heft package-solution --production`                                                          | Bygger løsningen, kjører Jest-testene og pakker den som en `.sppkg`-fil klar for distribusjon. `--production` gir optimalisert produksjonsbygg (tilsvarer det gamle `--ship`).                                                              |
| `clean`         | `heft clean`                                                                                                                     | Sletter byggeutdata (`lib`, `lib-commonjs`, `dist`, `temp`, `release`).                                                                                                                                            |
| `test`          | `heft test`                                                                                                                      | Bygger løsningen og kjører Jest-testene (`src/**/*.test.ts(x)`). Én fil: `npx heft test --test-path-pattern <navn>`. Se [Testing](testing.md). |
| `eject-webpack` | `heft eject-webpack`                                                                                                             | Skriver SPFx' webpack-oppsett ut i løsningen, og kan ikke angres. Ikke i bruk: tilpasninger går i `config/spfx-customize-webpack.js`. |
| `build:test`    | `node ../.tasks/build.js --channel test`                                                                                         | Bygger en kanalspesifikk `.sppkg` for `test`-kanalen i ett steg. Bytter inn ID-er fra `channels/test.json`, kjører `heft build --clean --production` og `heft package-solution --production` (uten Jest-testene), og tilbakestiller etterpå.                       |
| `build:i18n`    | `node ../.tasks/build.js --channel i18n`                                                                                         | Som `build:test`, men for `i18n`-kanalen.                                                                                                                                                                          |
| `build:kurs`    | `node ../.tasks/build.js --channel kurs`                                                                                         | Som `build:test`, men for `kurs`-kanalen.                                                                                                                                                                          |
| `postversion`   | `heft build --production && npm publish`                                                                                         | Rest fra da løsningene ble publisert til npm; publiseringen har stoppet. Kjør aldri `npm version` eller `npm publish` i en løsning; se [NPM](../utgivelse/npm.md). |
| `lint`          | `npm run prettier && eslint ./src --fix` | Formaterer med Prettier og kjører deretter ESLint 9 (flat config) med automatisk feilretting. Konfigurasjonen ligger i løsningens `eslint.config.js`, som videresender til Rush-prosjektet `SharePointFramework/.eslint-config` (pakken `pp365-eslint-config`). Merk at Heft også kjører ESLint som en del av `heft build` — der feiler bygget på errors, men ikke på warnings. |
| `prettier`      | `prettier "**/*.ts*" --write --log-level warn --config ../.prettierrc.yaml` | Formaterer alle `.ts`/`.tsx`-filer etter felles Prettier-konfigurasjon. Doble anførselstegn gjør at mønsteret også virker i Windows cmd/PowerShell. Kalles av `lint`. |
| `validate-loc`  | `node ../.tasks/validateLoc.js --path ./src/loc --interface I{Pakkenavn}Strings --dts mystrings.d.ts --output ./localization-report.md --summary` | Validerer lokaliseringsfiler (`.js`-ressurser) i `src/loc` mot typeinterfacet og genererer en rapport. Sikrer at alle språk har samme nøkler.                                                                     |

### Skript i `SharePointFramework/shared-library`

`shared-library` er biblioteket som de andre SPFx-løsningene deler kode med. Det bygges og publiseres uavhengig og har ingen dev-server, så det har ikke `start`-skript. `watch` holder bare `lib/` oppdatert mens en løsnings `watch` kjører.

| Skript         | Kommando                                                                                                                                  | Hva det gjør / hvorfor                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `build`        | `heft test --clean --production && npm run test:runtime && heft package-solution --production`                                                                   | Bygger biblioteket, kjører Jest-testene og kjøretidstestene (`test:runtime`) og pakker det. Kalles typisk via `rush rebuild -o pp365-shared-library` for å oppdatere biblioteket som andre løsninger avhenger av. |
| `watch`        | `heft build-watch --clean` | Bygger biblioteket på nytt hver gang du lagrer, uten tester og uten dev-server. En løsning som kjører `npm run watch` tar med endringen og laster siden på nytt. Start det før løsningens `watch`, og start løsningens `watch` på nytt etter endrede tekster. Se [Utviklingsmiljø](utviklingsmiljo.md). |
| `build:test`   | `node ../.tasks/build.js --channel test`                                                                                                  | Bygger en kanalspesifikk `.sppkg` for `test`-kanalen. Tilsvarende finnes for `build:i18n` og `build:kurs`.                                |
| `postversion`  | `heft build --production && npm publish`                                                                                                  | Rest fra da løsningene ble publisert til npm; publiseringen har stoppet. Kjør aldri `npm version` eller `npm publish` i en løsning; se [NPM](../utgivelse/npm.md). `pp365-shared-library` har aldri ligget på npm. |
| `lint`         | `npm run prettier && eslint ./src --fix` | Formaterer med Prettier og kjører deretter ESLint 9 (flat config) med automatisk feilretting. Konfigurasjonen ligger i løsningens `eslint.config.js`, som videresender til Rush-prosjektet `SharePointFramework/.eslint-config` (pakken `pp365-eslint-config`). Merk at Heft også kjører ESLint som en del av `heft build` — der feiler bygget på errors, men ikke på warnings. |
| `prettier`     | `prettier "**/*.ts*" --write --log-level warn --config ../.prettierrc.yaml` | Formaterer alle `.ts`/`.tsx`-filer etter felles Prettier-konfigurasjon. Doble anførselstegn gjør at mønsteret også virker i Windows cmd/PowerShell. Kalles av `lint`. |
| `validate-loc` | `node ../.tasks/validateLoc.js --path ./src/loc --interface ISharedLibraryStrings --dts mystrings.d.ts --output ./localization-report.md --summary` | Validerer lokaliseringsfiler i biblioteket mot `ISharedLibraryStrings`-interfacet.                                                         |
| `test`         | `heft test && npm run test:runtime` | Bygger biblioteket og kjører Jest-testene, deretter kjøretidstestene. |
| `test:runtime` | `node --test "test/runtime/*.test.mjs"` | Kjøretidstester mot ekte PnPjs 4 (ESM) med en falsk transport, for kode som setter sammen PnPjs-spørringer. Se [Testing](testing.md). |
| `clean`        | `heft clean` | Sletter byggeutdata. |

### Skript i `SharePointFramework/.tasks`

`.tasks`-pakken inneholder delte byggeoppgaver for alle SPFx-løsningene (pre-watch, post-watch, validate-loc m.m.). Den har bare et minimalt sett med egne skript.

| Skript         | Kommando                                                                                                                | Hva det gjør / hvorfor                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build`        | `echo "No build for pp365-spfx-tasks; …"`                                                                              | Ingen bygg: skriptene i mappen kjøres direkte, f.eks. `node ../.tasks/build.js --channel <navn>` fra en løsning. Skriptet finnes fordi `rush build` krever det. |
| `lint`         | `echo "No linting configured"` | Ingen linting er satt opp for denne pakken; skriptet finnes bare fordi `rush lint` krever at alle prosjekter har det. |
| `validate-loc` | `echo "No localization in pp365-spfx-tasks"` | `.tasks` har ingen egen `src/loc`; skriptet er en plassholder slik at `rush validate-loc` kan kjøre over alle prosjekter. |

Se [Oppgaver](../../SharePointFramework/.tasks/README.md) for en full oversikt over oppgaveskriptene som ligger i denne mappen.

### Skript i `SharePointFramework/.eslint-config` og `SharePointFramework/.jest-config`

`.eslint-config` (`pp365-eslint-config`) er den felles ESLint-konfigurasjonen, og `.jest-config` (`pp365-jest-config`) er den felles Jest-harnessen; se [Testing](testing.md). Ingen av dem har noe å bygge.

| Skript         | Kommando | Hva det gjør / hvorfor |
| -------------- | -------- | ---------------------- |
| `build`        | `echo "No build for pp365-eslint-config"` / `node -e "require('./lib/resolver.js'); require('./lib/amdTransform.js'); …"` | I `.jest-config` sjekker det at harnessens resolver og AMD-transform lar seg laste. |
| `lint`, `validate-loc` | `echo …` | Plassholdere, fordi `rush lint` og `rush validate-loc` krever skriptene i alle prosjekter. |

### Skript i `e2e`

`e2e` (`pp365-e2e`) har Playwright-testene mot testtenanten. De trenger `e2e/.env` (kopiert fra `.env.example`) og `npx playwright install chromium` én gang; se [Testing](testing.md).

| Skript         | Kommando | Hva det gjør / hvorfor |
| -------------- | -------- | ---------------------- |
| `build`        | `tsc --noEmit -p tsconfig.json` | Typesjekker testene. Kjøres av `rush build`. |
| `test`         | `playwright test` | Kjører testene mot testtenanten. |
| `test:ui`      | `playwright test --ui` | Åpner Playwrights grensesnitt for å kjøre og feilsøke testene. |
| `test:headed`  | `playwright test --headed` | Kjører testene med synlig nettleser. |
| `report`       | `playwright show-report` | Åpner HTML-rapporten fra siste kjøring. |
| `lint`, `validate-loc` | `echo …` | Plassholdere for `rush lint` og `rush validate-loc`. |

### Skript i `Templates`

`Templates`-pakken genererer JSON-provisjoneringsmaler og `.resx`-basert lokalisering for malene.

| Skript                       | Kommando                                                                                                                                                                                   | Hva det gjør / hvorfor                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build`                      | `npm run generate-project-templates && npm run generate-resx-json`                                                                                                                         | Hovedkommandoen for å bygge alle prosjektmaler og regenerere ressursfiler. Kjøres som del av full utgivelsesbygging.                                                                                                   |
| `lint`                       | `echo "No linting configured"` | Ingen linting er satt opp for denne pakken; skriptet finnes bare fordi `rush lint` krever at alle prosjekter har det. |
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
| Endre `shared-library` mens `watch` kjører  | `npm run watch` i `shared-library`, deretter i løsningen                        |
| Daglig utvikling på en webdel/utvidelse     | `npm run watch` i den aktuelle SPFx-pakken                                      |
| Rett opp formatering og linting             | `npm run rush:lint` i rot, eller `npm run lint` i én pakke                      |
| Kjør testene i én løsning                   | `npm test` i løsningen                                                          |
| Kjør Playwright-testene                     | `npm test` i `e2e`                                                              |
| Generer ny kanal                            | `npm run generate-channel-config <kanalnavn>` i rot                             |
| Regenerer README-er                         | `npm run generate-readme` i rot                                                 |
| Ny patch-/minor-versjon                     | `npm version minor --no-git-tag-version` (eller `patch`) i rot; se [Opprettelse av en ny versjon](../utgivelse/opprette-ny-versjon.md) |
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
| `SERVE_CHANNEL` | Hvilken kanal som brukes for `environments.json`-oppslag, og hvilke komponent-ID-er `watch` serverer. Siden du feilsøker på, må bruke samme kanal, ellers ber den aldri om bundlene dine og kjører de utrullede videre. Testmiljøets hub og programområder er på `test`. Tilgjengelige kanaler: `main`, `test`, `i18n`. | `main` |
| `SERVE_BUNDLE_REGEX` | Regulært uttrykk for å filtrere hvilke bundler som bygges under `watch`. Sett til et bundlenavn for raskere bygging. | _(tom – alle bundler bygges)_ |
| `SERVE_ENVIRONMENT` | Navn på miljøet fra `environments.json` som blir `default` i `config/serve.json`. Kan overstyres per kjøring med `npm run watch -- --serve-config <navn>`. | _(ikke satt)_ |
| `SPFX_SERVE_TENANT_DOMAIN` | Fyller ut `{tenantDomain}` i `config/serve.json` (f.eks. `contoso.sharepoint.com`). | _(ikke satt)_ |
| `LAUNCH_CONFIGURATIONS` | Sider å feilsøke på fra VS Code når pakkemappen er åpnet som arbeidsområde, som `<navn>,<side-URL>;<navn>,<side-URL>`. `prewatch` lager `.vscode/launch.json` av dem når den ikke finnes. Med repoet åpnet, se «Feilsøking i VS Code». | _(ikke satt)_ |

`createEnvironmentFile` lager `.env` bare når den mangler, så en eldre `.env` får ikke variabler som er lagt til malen senere. Sammenlign med `.tasks/.env.template` hvis en variabel mangler.

> **Bygg avhengighetene før `watch`.** `watch` bygger bare sin egen pakke og bundler `shared-library` og `ProjectWebParts` fra deres `lib/` slik den ligger. Har du hentet endringer i dem, bygg dem først, for eksempel fra repo-roten med `rush build -T pp365-portfoliowebparts` (alt PortfolioWebParts avhenger av, uten pakken selv), eller raskere uten tester med `npx heft build --clean` i hver av dem. En gammel `lib/` gir feil som `Module not found: Can't resolve '../Autocomplete'` eller, verre, gammel kode uten feilmelding.

> **Endre `shared-library` mens `watch` kjører.** Start `npm run watch` i `shared-library` først (`heft build-watch --clean`: ingen dev-server og ingen tester; første bygg tar et par minutter), deretter `npm run watch` i løsningen. Starter du biblioteket sist, tømmer `--clean` biblioteket sin `lib/`, og løsningen feiler til biblioteket er ferdig bygget. En lagret `.ts`/`.tsx` eller `.scss` i biblioteket er i `lib/` etter et sekund, løsningen bygger på nytt, og siden laster seg selv, rundt 20 sekunder etter at du lagret. Det virker fordi pnpm lenker `pp365-shared-library` til `SharePointFramework/shared-library`, og webpack overvåker den ekte stien. Unntaket er tekster: `watch` leser alle `loc/*.js` én gang når den starter, både løsningens egne og bibliotekets, så start løsningens `watch` på nytt når du har endret dem. Er `ProjectWebParts` en avhengighet (av `PortfolioWebParts` eller `ProgramWebParts`), kjør `npx heft build-watch` der, ikke `npm run watch`, som ville startet en dev-server til på samme port.

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
"watch": "heft start --nobrowser",
"start": "heft start",
"prewatch": "node ../.tasks/pre-watch.js",
"postwatch": "node ../.tasks/post-watch.js",
```

- **prewatch**: Kjøres før hovedovervåkingsskriptet via skript i `.tasks/`-mappen:
  - Oppretter `.env` fra mal (med bundlenavn fra `config/config.json`)
  - Genererer `config/serve.json` fra `environments.json` (én `serveConfigurations`-oppføring per miljø) med `config/serve.sample.json` som grunnlag
  - Oppretter `.vscode/launch.json` fra konfigurasjon
  - Filtrerer bundler i `config/config.json` basert på `SERVE_BUNDLE_REGEX`
  - Håndterer kanalbytte for ikke-main-kanaler via `modifySolutionFiles`

- **watch**: Kjører utviklingsserveren (webpack-dev-server via Heft) med miljøkonfigurasjonen. Heft legger selv på feilsøkingsparametrene `debug`, `noredir` og `debugManifestsFile=https://localhost:4321/temp/build/manifests.js`, samt `loadSPFX`/`customActions` for utvidelser. Live-reload er innebygd, så `concurrently` og `livereload` er ikke lenger i bruk: siden laster seg selv på nytt når en endring er bygget. Hot module replacement er slått av i `config/spfx-customize-webpack.js`, fordi hver webdel og utvidelse på en SharePoint-side har sin egen webpack-runtime, og oppdateringen feilet («[HMR] Update failed») uten at siden ble lastet på nytt; endringen kom først etter F5.

> **Merk:** Den SharePoint-hostede workbenchen (`_layouts/workbench.aspx`) pensjoneres 1. desember 2026. Derfor peker miljøene mot ekte sider.

- **postwatch**: Rydder opp i midlertidige filer og konfigurasjoner

### Feilsøking i VS Code

Med repoet åpnet i VS Code (ikke en enkelt pakkemappe):

1. Kopier `.vscode/launch.sample.json` til `.vscode/launch.json` (gitignorert).
2. Stol på utviklingssertifikatet én gang: `npx heft trust-dev-cert` i en av pakkene.
3. Kjør `npm run watch` i pakken du jobber med, og vent til webpack er ferdig.
4. Start «Debug a page against npm run watch» (F5), velg pakken og lim inn siden du vil feilsøke på, uten spørrestreng. Konfigurasjonen legger selv på `debugManifestsFile`, `debug` og `noredir`.
5. Chrome åpnes med en egen profil i `.vscode/chrome-debug-user-data`, så du logger inn bare første gang. Godta at siden laster feilsøkingsskript («Load debug scripts»), og tillat tilgang til lokalt nettverk hvis Chrome spør (siden laster skript fra `localhost`).

Stoppunkter i pakkens egen `src/` og i `shared-library` og `ProjectWebParts` sin `src/` treffer, fordi kildekartene peker dit: webpack 5 navngir pakkens egne kilder `webpack:///.././src/...` og søsterpakkenes `webpack:///../../<pakke>/src/...`, og `sourceMapPathOverrides` i konfigurasjonen oversetter begge. Feilsøking i nettleserens DevTools virker uansett, siden kildekartene har kildeteksten med.

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

### Windows og macOS

Alt i repoet skal virke likt på Windows og macOS, og i CI på Linux. Dette er verdt å vite på Windows:

- **Terminal:** bruk PowerShell 7 (`pwsh`) eller Git Bash. Windows PowerShell 5.1 kan ikke `&&`, som flere kommandoer i guiden bruker, og stopper `npm.ps1` med standard kjørepolicy (`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` løser det). I `cmd.exe` er enkle anførselstegn ikke anførselstegn: bruk doble rundt et argument med mellomrom eller spesialtegn.
- **Node:** nvm-windows leser ikke nødvendigvis `.nvmrc`. Installer og velg versjonen med navn: `nvm install 22.22.2` og `nvm use 22.22.2`.
- **Linjeskift:** `.gitattributes` sjekker ut all tekst med LF på alle maskiner, uansett `core.autocrlf`, så lint, tester og utgivelsespakken bygger fra de samme bytene som på macOS og i CI. Prettiers `endOfLine: auto` er et sikkerhetsnett for en fil en editor lagrer med CRLF. En klone fra før `.gitattributes` kom inn, sjekkes ut på nytt én gang, etter at endringene er committet eller lagt til side: `git rm -r --cached -q . && git reset --hard`.
- **Lange stier:** pnpm-lageret gir stier på over 250 tegn. Slå på lange stier i Windows (`LongPathsEnabled`) og i git (`git config --global core.longpaths true`), og klon til en kort sti, for eksempel `C:\src\pp365`.
- **Miljøvariabler:** `VAR=verdi kommando` virker bare i bash og zsh. I PowerShell: `$env:NODE_OPTIONS='--max-old-space-size=8192'`; i cmd: `set NODE_OPTIONS=--max-old-space-size=8192`. Der det finnes en `.env`-fil, er den veien som virker overalt (`SERVE_CHANNEL` i løsningens `.env`, `E2E_LOCAL_BUNDLE` i `e2e/.env`).
- **Kopiering:** `cp` virker i PowerShell, der den er et alias for `Copy-Item`, og i Git Bash, men ikke i `cmd.exe`.




[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#testregime)

## ➤ Testregime

Dette kapittelet beskriver hvordan Prosjektportalen testes automatisk, hva som kjører når, hvordan du skriver tester, og hva vi gjør når en test feiler. Målet er at den manuelle smoke-testen før hver utgivelse over tid erstattes av tester som kjører i hvert bygg og etter hver utrulling til testkanalen.

### Lagene

| Lag | Hva testes | Verktøy | Kjører når | Trenger tenant? |
|---|---|---|---|---|
| Enhetstester | Ren logikk: modeller, hjelpefunksjoner, datamappere, reducere, tjenesteoperasjoner | Jest via Heft (`heft test`) | I hvert bygg av løsningen, lokalt og i CI | Nei |
| Komponenttester | React-komponenter rendret i jsdom: hva vises, hva skjer ved klikk | Jest + React Testing Library | I hvert bygg av løsningen | Nei |
| Pakkebevis | At hvert bygg faktisk produserer sin `.sppkg` og at det delte biblioteket er pakket inn (ikke en kjøretidsavhengighet) | `Install/Build-Release.ps1` | I hvert utgivelsesbygg | Nei |
| Ende-til-ende (E2E) | Hub og prosjektområde i testtenanten: sidene laster, webdelene monteres, ingen ødelagte bundler | Playwright (`e2e/`) | Etter utrulling til testkanalen i `ci-channel-test.yml` | Ja |
| Manuell smoke-test | Skriveflyter som ennå ikke er automatisert (prosjektoppsett, publisering av statusrapport, idéflyt) | Issue-maler, se «Smoke test-prosessen» | Før utgivelse, til E2E dekker flytene | Ja |

| Kjøretidskontrakt | Kode som komponerer PnPjs-spørringer, kjørt mot det ekte PnPjs 4-biblioteket med falsk transport | `node --test` (`shared-library/test/runtime/*.test.mjs`, `npm run test:runtime`) | I byggeskriptet til shared-library, etter `heft test` | Nei |

Kjøretidskontraktene finnes fordi Jest ikke kan laste `@pnp/*` (ESM-only under CommonJS-kjøreren) og stand-ins ikke fanger feil i selve PnPjs-koblingen: `getTermStore` kastet i SPFx fordi `spfi().using(SPFx(context))` holder URL-er relative til forespørselen sendes, noe stand-ins aldri viste. Node kan importere ESM-PnPjs, så disse testene kjører pipelinen med både relative (SPFx-stil) og absolutte (`spfi(url)`) URL-er. Legg flere slike tester her når kode kobler seg direkte på PnPjs-kjøringen.

### Hva skjer i et bygg

`npm run build` i en løsning kjører `heft test --clean --production && heft package-solution --production`. Heft kompilerer `src/**/*.ts(x)` til `lib-commonjs/`, kjører alle `*.test.ts`/`*.test.tsx` der, og stopper bygget hvis en test feiler. Det samme skjer i `rush build`/`rush rebuild` og dermed i alle CI-arbeidsflytene. Resultatet ligger i `jest-output/JUnit.xml` og dekningsrapporten i `jest-output/coverage/` (begge er ignorert av git).

Hver løsning har dekningsgrenser i `config/jest.config.json` (`coverageThreshold.global`: setninger, grener, funksjoner, linjer), målt i fase 4. De heves når dekningen øker og senkes aldri. Jest melder en grense som ikke nås, men Heft-testfasen lykkes likevel, så lokalt går bygget gjennom; det er `Install/Build-Release.ps1` som stopper på det, og dermed CI. Sletter du tester eller legger til kode uten tester, kan altså bygget gå lokalt og feile i CI. Dekningen regnes bare over filene testene laster: en ny test som importerer en stor modul uten tester, tar hele modulen med og kan senke en grense (funksjonsdekningen i ProgramWebParts falt fra 63 til 44 prosent da en test lastet `SPDataAdapter.ts`). Test logikken i en egen modul der avhengighetene sendes inn (`ProgramWebParts/src/data/childProjectRemoval.ts`), eller dekk modulen helt. Les `jest-output/coverage/coverage-summary.json` etter en full kjøring av løsningens tester før du pusher.

### Delt oppsett: `pp365-jest-config`

Alle løsningene peker på det samme Jest-oppsettet gjennom `config/jest.config.json` (`"extends": "pp365-jest-config/jest-shared.config.json"`). Pakken ligger i `SharePointFramework/.jest-config` og er et vanlig Rush-prosjekt, på samme måte som `pp365-eslint-config`. Den bygger på SPFx-riggens Jest-konfigurasjon (jsdom, `lib-commonjs`, dekning, JUnit) og legger til:

| Fil | Gjør |
|---|---|
| `lib/setup.js` | Registrerer `@testing-library/jest-dom`-matchere og polyfiller det Fluent UI trenger som jsdom mangler (`matchMedia`, `ResizeObserver`, `IntersectionObserver`, `scrollTo`). |
| `lib/resolver.js` | Løser SPFx-strengmoduler (`SharedLibraryStrings`, `SharedResources`, `<Løsning>Strings`) slik SPFx gjør det: via `localizedResources` i `config/config.json`, til `nb-no`-bunten. Sett `PP365_TEST_LOCALE=en-us` for å teste engelsk. |
| `lib/amdTransform.js` | Gjør AMD-strengbuntene (`define([], function () { ... })`) om til CommonJS. En syntaksfeil i en `.js`-strengfil (for eksempel `,,`) feiler dermed testkjøringen i stedet for å krasje i nettleseren. |
| `lib/spfxStub.js`, `lib/reactMarkdownStub.js`, `lib/noopPluginStub.js` | Erstatter `@microsoft/sp-*` (krever Microsoft-interne moduler i Node), `react-markdown` og `rehype-*`/`remark-*` (ESM-only). `@microsoft/sp-lodash-subset` peker på ekte `lodash`. `window.__themeState__` får standardpaletten SharePoint ellers leverer. |
| `lib/pnpStub.js` | Erstatter alle `@pnp/*`-moduler. Import og kjeding (`spfi().using(...)`) går fint; et `await` på et PnP-kall feiler med en tydelig melding om at adapteren må mockes. De rene hjelpefunksjonene i `@pnp/core` (`stringIsNullOrEmpty`, `dateAdd`, `getHashCode`, `getGUID`, `combine`, `isArray`, `isUrlAbsolute`, `PnPClientStorage` i minnet) er ekte, så kode som bruker dem på egne data oppfører seg som i nettleseren. |
| `moduleNameMapper` | Peker `pp365-shared-library`, `pp365-projectwebparts` og `pp365-portfoliowebparts` til `lib-commonjs/` (ESM i `lib/` kan ikke lastes av Jest). |

Konsekvens: en løsnings tester krever at det delte biblioteket er bygget først (`rush rebuild -o pp365-shared-library`), akkurat som selve bygget.

### Skrive enhetstester

- Legg testen ved siden av koden: `src/util/foo.ts` får `src/util/foo.test.ts`.
- Ikke importer `@pnp/*` i en test og ikke test kode som kaller PnPjs direkte. Test logikken mot strukturelle stand-ins i stedet, som `shared-library/src/services/EntityPortalService/pnpShapes.ts` og `operations.test.ts` viser, eller mock adapteren med `jest.mock`.
- Gode eksempler: `shared-library/src/taxonomy/*.test.ts` (paging, stier, etiketter), `shared-library/src/data/getAllItems.test.ts` (asynkron iterasjon med en falsk `IItems`).

### Skrive komponenttester

Komponenttester rendrer komponenten med React Testing Library og sjekker det brukeren ser. Data kommer alltid fra en hook eller en adapter, og den erstattes med `jest.mock`:

```tsx
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { Header } from './Header'

jest.mock('./useHeader', () => ({
  useHeader: jest.fn(() => ({ title: 'Prosjektstatus', description: 'Publisert' }))
}))

it('viser tittel og beskrivelse fra hooken', () => {
  render(<Header />)
  expect(screen.getByText('Prosjektstatus')).toBeInTheDocument()
})
```

Regler og fakta som gjelder:

- **`jest.mock(...)` må stå før import-linjene.** Heft kjører Jest på TypeScripts CommonJS-utdata uten Babel, så mock-kall heises ikke automatisk over importene; TypeScript beholder rekkefølgen i filen, og det er den som gjør at mocken er registrert før komponenten lastes.
- `@microsoft/sp-*` er stubbet (`lib/spfxStub.js`): importer går, og `DisplayMode`, `Guid`, `Log`, `Text`, `Version` (med sammenligningene til SPFx), `UrlQueryParameterCollection`, `Dialog.alert`/`prompt`, feltfabrikkene `PropertyPaneTextField`, `PropertyPaneToggle` og `PropertyPaneDropdown` (de gir `{ type, targetProperty, properties }` som i SPFx) og noen få enums har ekte verdier. Trenger testen mer, legg det til i `KNOWN` der. `react-markdown` og `rehype-*`/`remark-*` er også stubbet (rendrer teksten som den er).
- Utvidelser og web-deler testes som klasser. Stubben har små, ekte grunnklasser (`BaseApplicationCustomizer`, `BaseListViewCommandSet`, `BaseFieldCustomizer`, `BaseClientSideWebPart`, `BaseDialog`): lag instansen, sett `context` og `properties` (og `domElement` for en web-del) på den slik SharePoint gjør, og kall `onInit`. Grunnklassene er ES5-konstruktørfunksjoner, som SPFx sine egne, fordi løsningene kompileres til ES5 og en ES5-underklasse ikke kan kalle en ekte `class`-konstruktør («Class constructor ... cannot be invoked without 'new'»). `BaseDialog.show()` rendrer etter gjeldende oppgave og løses først når dialogen lukkes, og `onAfterClose` kjøres etter lukkingen, som i SPFx. Eksempler: `PortfolioExtensions/src/extensions/*/*.test.ts`, `ProjectExtensions/src/extensions/projectSetup/projectSetup.test.ts`, `ProgramWebParts/src/webparts/*/*.test.tsx`.
- Alle `@microsoft/sp-*`-pakker peker på samme stubfil, og alle `@pnp/*` på én annen, så en `jest.mock` av én av dem gjelder alle i den testfilen. Skal en test bytte ut én verdi, for eksempel at `spfi()` skal gi testens stand-in, pakker den stubben i en `Proxy` som bare erstatter den ene verdien; se `PortfolioExtensions/src/extensions/ideaProcessing/ideaProcessing.test.ts`.
- Verdier fra stubbene er kjedbare proxyer. Jest regner alt som har en `asymmetricMatch`-funksjon som en matcher, så stubbene svarer `undefined` på den egenskapen; ellers ville `expect.anything()` og enhver likhetssjekk med en stubverdi feile. `LogLevel` fra `@pnp/logging` har de ekte tallene.
- Kode som leser byggekonstanten `DEBUG` (SPFx erstatter den ved bygging) trenger `;(globalThis as any).DEBUG = false` i testfilen, over importene når modulen leser den mens den lastes.
- I en åpen Fluent-skuff (`BasePanel`) blir aldri inngangsanimasjonen ferdig under jsdom, så `toBeVisible()` feiler for alt i den. Sjekk attributtet som skjuler et element i stedet, for eksempel `element.closest('[hidden]')`. Rollespørringer hopper dessuten over skjulte elementer; `{ hidden: true }` tar dem med.
- Fluent v8-komponenter leser tasten fra `keyCode`/`which`, ikke fra `key`: `fireEvent.keyDown(element, { key: 'Escape', keyCode: 27, which: 27 })`.
- `new Image()` lastes aldri under jsdom. Kode som forhåndslaster et bilde, testes med en stand-in for `window.Image` som kaller `onload` eller `onerror`; se `shared-library/src/components/ProjectLogo/ProjectLogo.test.tsx`.
- jsdom kan ikke navigere. `location.reload()` og `location.href = ...` rapporteres som «Not implemented: navigation» via `console.error`, og koden fortsetter etter kallet, der nettleseren ville ha lastet siden på nytt. Svelg bare den meldingen (`ignoreNavigation` i `PortfolioExtensions/src/extensions/testFixtures.ts`), og sjekk det som ble skrevet før navigeringen.
- `*.module.scss` løses til klassenavnene sine (`styles.foo === 'foo'`), så du kan spørre på klassenavn.
- Strengmoduler gir de norske tekstene, så `screen.getByText(strings.Nøkkel)` fungerer.
- Fluent UI v8 og v9 rendrer under jsdom. Første innlasting av `@fluentui/react-components` i en testfil tar 15-45 sekunder; samle testene for én funksjon i én fil i stedet for én fil per lite delkomponent.
- Interaksjon: bruk `@testing-library/user-event` (`userEvent.setup()`), ikke `fireEvent`, for klikk og tasting. Unntak for Fluent v9-menyer: `user-event` sin pekersekvens på et menyelement stopper aldri under jsdom og lar Jest-arbeideren henge i minutter, så klikk menyelementer med `fireEvent.click`. En nestet v9-meny (undermeny) kan ikke åpnes under jsdom i det hele tatt; sjekk utløseren (`aria-haspopup="menu"`) og les valgene fra hooken som bygger dem. Hver åpen v9-meny koster dessuten titalls sekunder å rive ned under jsdom, og kostnaden vokser for hver meny en testfil har rendret: rendre menyen én gang per fil, og test valgene gjennom hooken.
- Rollespørringer (`getByRole`) regner ut tilgjengelighetstreet for hele dokumentet og tar sekunder per kall i et stort Fluent-tre, særlig på en maskin under last. Bruk `getByText`, `getByTitle` eller `getByLabelText` når treet er stort (en åpen popover eller dialog i tillegg til web-delen), og rollespørringer der treet er lite.
- Kombinasjonsboks-familien i Fluent v9 (`Combobox`, `Dropdown`, `TagPicker`) gikk i en endeløs render-løkke under jsdom på React 17 i det den åpnet. På React 18 åpner den og velger (prøvd 2026-10-07), men én åpning tok 40–60 sekunder på en belastet maskin, så testene står fortsatt inn for den. En test som skal velge noe, erstatter `Combobox` og `Option` med en vanlig `<select>` som holder Fluents kontrakt (`onOptionSelect` kalles med valgets verdi og tekst); se `PortfolioExtensions/src/components/IdeaApprovalDialog/IdeaApprovalDialog.test.tsx`. En test som skriver i en `TagPicker`, bruker harnessens stand-in: `jest.mock('@fluentui/react-components', () => jest.requireActual('pp365-jest-config/lib/tagPickerStandIn').withTagPickerStandIn())` (se `PeoplePicker.test.tsx`). I nettleseren fungerte familien også på React 17. En v9-komponent kan prøves i en ekte nettleser uten SharePoint ved å bunte den med webpack fra løsningens `node_modules` og kjøre den i Playwrights Chromium (slik personvelgeren ble prøvd i fase 4, slice 7).
- Feil som avhenger av layout, finnes ikke under jsdom. Et eksempel er en Fluent v9-drawer som beholder en `transform` etter at den har glidd inn, slik at elementet man drar i «Vis eller skjul kolonner» (med `position: fixed`) havnet utenfor skjermen. Slike feil fanges bare av en nettlesertest: `e2e/tests/flows/edit-view-columns-drag.spec.ts` starter en dra-operasjon, sjekker at elementet ligger under pekeren og avbryter med Escape, og `edit-view-columns-header.spec.ts` scroller panelet og sjekker at knappene i header-en står på linje med lukk-knappen og innenfor header-en.
- I en `TagPicker` har de valgte taggene også rollen `option`. En nettlesertest som skal velge et søkeresultat, finner det på noe bare resultatene viser, som e-postadressen (`e2e/tests/flows/people-picker.spec.ts`).
- En åpen Fluent v9-popover posisjoneres mot utløseren sin, og under jsdom kostet det 13 sekunder per test på en maskin under last og over ett minutt i CI. En test som skal åpne en popover, erstatter `Popover`, `PopoverTrigger` og `PopoverSurface` med en enkel utgave som holder Fluents kontrakt (utløseren veksler via `onOpenChange`, flaten vises mens den er åpen); se `ProjectWebParts/src/components/ProjectPhases/ProjectPhases.test.tsx`. Innholdet i popoveren kan også testes direkte, uten popoveren rundt.
- Feilen «The `document` global was defined when React was initialized, but is not defined anymore» betyr at en komponent fortsatt gjorde asynkront arbeid (posisjonering av popover, timere) etter at testen var ferdig, og den tar hele Jest-arbeideren ned. Rydd opp og la arbeidet bli ferdig i `afterEach`: `cleanup()` etterfulgt av `await act(() => new Promise((r) => setTimeout(r, 50)))`.
- Hovedlisten i PortfolioWebParts (`List`) rendrer radene med Fluent v9 `Table` (`List/ListGrid`): markeringskolonnen gir en navnløs `columnheader` som må filtreres bort, og elementradene finnes på avkrysningsboksen sin (`strings.ListSelectRowLabel`), siden grupperader har sin egen; se `List.test.tsx`. `WebPartTitle` rendrer en `<h2>` rundt en `span[role=heading]`, så spør på `getByText(tittel, { selector: 'span' })`.
- Trenger komponenten SPFx-kontekst (`WebPartContext`, `pageContext`), lag et minimalt objekt med akkurat feltene komponenten leser og send det inn via props eller context-provider. Ikke bygg en generell SPFx-mock.
- Matcherne fra jest-dom (`toBeInTheDocument`, `toHaveClass`, ...) er gjort kjent for kompilatoren gjennom `src/jest-dom.d.ts` i hver løsning.

Kjør testene i en løsning med `npm test` (`heft test`), eller bare bygg-og-test uten pakking. Én fil: `npx heft test --test-path-pattern Header`, et regulært uttrykk over stien til den kompilerte testfilen (for eksempel `ProjectStatus/reducer`). Med SPFx 1.23 (`@rushstack/heft-jest-plugin` 2.0.6) virket ikke dette: valget gikk videre under Jest 29-navnet, som Jest 30 overså, så alle filene kjørte. Fra SPFx 1.24 (2.0.19) sendes det som Jest 30s `testPathPatterns`.

### Ende-til-ende med Playwright (`e2e/`)

`e2e/` er Rush-prosjektet `pp365-e2e`, med tre mapper: `tests/smoke` (røyktester av sider og webdeler), `tests/flows` (brukerreiser; fire av dem skriver til testtenanten og rydder etter seg) og `tests/local` (en løsnings lokale bundle via en utviklingsserver, bare med `E2E_LOCAL_BUNDLE=1`, aldri i CI). Røyktestene logger inn som en dedikert testbruker, åpner hub-sidene og et prosjektområde, venter på at SPFx-lerretet rendrer, sjekker at forventede webdeler monteres, og feiler på nettleserfeil som betyr at en bundle er ødelagt («Cannot find module», «Failed to load component», «ChunkLoadError»). Det siste er nettopp symptomet på et delt bibliotek som ikke er pakket inn, og er det pakkebeviset i `Build-Release.ps1` sikrer på byggetidspunktet.

Kjøring i CI: jobben «End-to-end smoke (test channel)» i `ci-channel-test.yml` kjører etter en vellykket «Upgrade (test channel)», altså mot den pakken som nettopp ble rullet ut til `SP_URL_TEST`. Arbeidsflyten utløses av push til grenene i `on.push.branches` (i dag `releases/1.15`, `feat/fluent-v9*` og `feat/dependency-upgrades*`) når filer under `SharePointFramework/`, `Install/`, `Templates/` eller `e2e/` er endret, og kan startes manuelt fra Actions-fanen (`workflow_dispatch`). Merk at en push til en av disse grenene oppgraderer testtenanten. E2E-jobben følger begge oppgraderingsløpene: den vanlige oppgraderingen og pakke-oppgraderingen som `[apps-only]`/`[apps-only:<løsninger>]` bruker. `[skip-e2e]` i commit-emnet hopper over E2E-jobben; `[skip-upgrade]` hopper over oppgraderingen og dermed også E2E.

#### Finne og lese E2E-rapporten fra CI

- **Rask oversikt**: jobbloggen lister hver test som bestått, feilet eller hoppet over, og skriver ut påstanden og lokatoren for hver feil (`github`-reporteren). Feil vises også som annotasjoner på kjøringens oppsummeringsside.
- **Full rapport**: nederst på oppsummeringssiden, under «Artifacts», ligger `playwright-report-test-channel` (7 dager, det lengste repoet tillater). Zip-filen inneholder `playwright-report/` (HTML-rapporten) og `test-results/` (per feilet test: `error-context.md` med sidens tilgjengelighetssnapshot, skjermbilde, video og ved nytt forsøk `trace.zip`), samt `test-results/junit.xml`.
- **Åpne rapporten lokalt**: fra `e2e/`:

  ```bash
  gh run download <run-id> -n playwright-report-test-channel -D ci-report
  npx playwright show-report ci-report/playwright-report   # åpner http://localhost:9323
  npx playwright show-trace ci-report/test-results/<test>/trace.zip
  ```

  `index.html` kan også åpnes rett fra filsystemet, men sporinger krever `show-report` eller trace.playwright.dev.
- Rapporten inneholder snapshot av sider i testtenanten. Den publiseres ikke utenfor GitHub, og artefakt-tilgangen på repoet skal ikke utvides.

Variabler og hemmeligheter i GitHub:

| Navn | Type | Innhold |
|---|---|---|
| `SP_URL_TEST` | variabel (finnes) | Hub-URL for testkanalen |
| `E2E_PROJECT_URL` | variabel | Et eksisterende, ferdig oppsatt prosjektområde i huben, ikke huben selv (prosjekttestene hoppes over med melding hvis variabelen mangler eller peker på huben) |
| `E2E_PROGRAM_URL` | variabel | Et eksisterende programområde i huben med minst ett underprosjekt (programtestene hoppes over med melding hvis variabelen mangler eller peker på huben) |
| `E2E_USERNAME` | hemmelighet | Testbrukerens UPN |
| `E2E_PASSWORD` | hemmelighet | Testbrukerens passord |

Krav til testbrukeren: en egen konto (for eksempel `pp365-e2e@<tenant>.onmicrosoft.com`) som er medlem av porteføljen og prosjektet, med minst mulig rettigheter ellers, ekskludert fra MFA gjennom en Conditional Access-policy som gjelder bare denne kontoen, og med passord som roteres og bare finnes som GitHub-hemmelighet. Ikke bruk en personlig konto, og ikke gjenbruk sertifikat-appen som utrullingen bruker: E2E trenger en brukersesjon i nettleseren.

Testene gjør mer enn å vente på at webdelene monteres: de prøveklikker (trial click) kontroller som må kunne nås (prosjektlenkene i tidslinjen, fasene i fasevelgeren), åpner filterpanel og informasjonspanel og lukker dem igjen, søker i porteføljeoversikten og sjekker resultattelleren, og feiler hvis en webdel viser feilgrensen «Noe gikk galt» eller nettleseren melder at en bundle ikke kunne lastes («Could not load … in require»). Layout som dekker kontroller (slik tidslinjen gjorde da tredjeparts-CSS ble hashet) feiler dermed på prøveklikket. Utgivelsesbygget sjekker i tillegg at ingen bundle inneholder hashede klassenavn fra tredjeparts stilark.

Sidenavn varierer mellom norsk og engelsk provisjonering og mellom tenanter. Hver test slår derfor opp siden i hubens eget SitePages-bibliotek (første eksisterende kandidat vinner, `E2E_PAGE_*` først) og hopper over med listen over sider som finnes når ingen kandidat passer. En hub-URL uten avsluttende skråstrek normaliseres, og en 404 rapporteres med URL-en som ble forsøkt. Testene venter på `[data-sp-web-part-id]`, som finnes både på lerretssider (Home.aspx) og på enkeltwebdel-appsider (Porteføljeoversikt, Prosjekttidslinje, Nytteoversikt). Verdien er webdelens komponent-id, og `openPage` feiler når en PP365-webdel på siden hører til en annen kanal enn den som testes (`E2E_CHANNEL`, standard `test`): siden kjører da den kanalens kode, og testen sier ingenting om bygget. Slik ble det oppdaget at tre av testhubens aggregerte oversikter, den dynamiske listen og prosjektets tidslinje brukte hovedkanalens webdeler (rettet på testmiljøet 2026-10-09).

Lokalt: `cp e2e/.env.example e2e/.env`, fyll inn, `npx playwright install chromium`, så `npm test` eller `npm run test:ui` i `e2e/`. Nye tester planlegges, genereres og repareres med Playwright-CLI-ferdigheten i `.claude/skills/playwright-cli` (`references/test-generation.md`).

### Når en test feiler

**Enhets- eller komponenttest feiler i bygget**

1. Bygget stopper; ingenting pakkes. Les hvilken test i loggen eller i `jest-output/JUnit.xml`.
2. Reproduser lokalt med `npm test` i løsningen. Avgjør om koden eller testen er feil. En test som var riktig og nå feiler er en regresjon: rett koden.
3. Er kravet endret med hensikt, oppdater testen i samme commit som koden. Slett aldri en påstand bare for å få grønt.
4. Endringer i `pp365-jest-config` skal kjøres mot minst `shared-library` og én forbruker før de sjekkes inn.

**E2E feiler etter utrulling til testkanalen**

1. Åpne artefaktet `playwright-report-test-channel` fra kjøringen. Sporingen viser hvert steg, nettverkskall og konsoll.
2. Klassifiser:
   - *Miljø*: innlogging feilet (utløpt passord, MFA-krav, endret policy), siden finnes ikke, tenanten svarer ikke. Rett hemmelighet, policy eller variabel; kjør jobben på nytt.
   - *Utrulling*: rett etter en oppgradering kan SharePoint i noen minutter gi en side forrige versjons manifest for en komponent, og bunten det peker på har oppgraderingen fjernet («Could not load … in require»). Oppsettet `tests/deployment.setup.ts` venter derfor inntil ti minutter på at hubben og prosjektets forside laster alle bunter fra appkatalogen før testene starter. Feiler oppsettet, er en bunt fortsatt borte etter ti minutter, og utrullingen er ødelagt.
   - *Regresjon*: en webdel monteres ikke, eller det er en fatal nettleserfeil. Opprett et issue i dette repoet med lenke til kjøringen og sporingen, merk det `bug`, og stopp utgivelsen til det er rettet. Det manuelle smoke-test-issuet for utgivelsen lenker til E2E-kjøringen.
   - *Testfeil*: siden endret seg med hensikt (ny tittel, ny side). Rett testen med Playwright-CLI-ferdigheten («heal»), i egen commit.
3. Én ny prøve i CI er slått på. En test som bare passerer på andre forsøk rapporteres som «flaky» i rapporten; tre flaky kjøringer på rad kvalifiserer til `test.fixme` med et issue, ikke til å øke antall forsøk.

**Eierskap**: den som åpner en PR fikser tester som feiler på grunn av PR-en. Den som lager en utgivelse sjekker at siste E2E-kjøring på testkanalen er grønn før smoke-test-issuene opprettes.

### Veikart

1. ~~Komponenttester for komponentene som konverteres fra Fluent UI v8 til v9.~~ Gjort i fase 3 og 4: hver webdel-rot, utvidelse og interaktiv komponent har tester.
2. Skriveflyter i E2E: kopi av dokumentmal, utkast til statusrapport, ny kolonne i porteføljeoversikten og underområde i et program er på plass og rydder etter seg. Gjenstår: prosjektoppsett, publisering av statusrapport og opprettelse av idé.
3. Flere kjøretidskontrakter (`test/runtime`) for dataadapterne, mot innspilte svar.
4. ~~Dekningsgrenser per løsning.~~ Gjort i fase 4 (se over).



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#maler)

## ➤ Maler

`Templates/` er Rush-prosjektet `pp365-templates`. Det holder innholdet installasjonen legger på porteføljehuben, og malene oppsettveiviseren legger på nye prosjektområder. Site scriptene ligger i `SiteScripts/src` (se [Site design og site scripts](site-design-og-site-scripts.md)), og ID-ene for hver installasjonskanal i `channels/` (se [Installasjonskanaler](kanaler.md)).

Ferdigheten [`pp365-templates`](../../.claude/skills/pp365-templates/SKILL.md) har oppskrifter på vanlige oppgaver, for eksempel en ny prosjektegenskap fra felt til oppgradering av eksisterende prosjekter.

### Mappene

| Kilde | Innhold | Blir til |
|---|---|---|
| `Portfolio/Portfolio.xml` og `Portfolio/Objects/` | Hubens nettstedskolonner, innholdstyper, lister med startrader, sider, navigasjon og egendefinerte handlinger. `Portfolio.xml` tar inn `Objects/<Type>/@.xml` med `xi:include`, og de lister én fil per kolonne, innholdstype, liste og side | `Portfolio.pnp` |
| `Portfolio/Resources.no-NB.resx` og `Resources.en-US.resx` | Tekstene, brukt som `{resource:Nøkkel}` i PnP-malen. Språket velges etter områdets LCID (1044 eller 1033) | En del av `Portfolio.pnp`. Filene følger også med utgivelsespakken, for installasjonsskriptene |
| `JsonTemplates/_JsonTemplateProject.json`, `_JsonTemplateProgram.json` og `_JsonTemplateParent.json` | Prosjekt-, program- og overordnet mal for oppsettveiviseren; se [Prosjektmaler (JSON)](js-provisjoneringsmal.md) | `Content/Portfolio_content.<språk>/ProjectTemplates/*.txt` (generert) |
| `Content/Portfolio_content.no-NB/` og `Content/Portfolio_content.en-US/` | Innholdsmalen for hvert språk: de genererte prosjektmalene, standardoppsettet for risiko- og mulighetsmatrisen under `SiteAssets/`, dokumentmalene i `Malbibliotek/` (bare norsk) og radene i v6-listene for fasesjekkpunkter og Planner-oppgaver. Filene skrives for hvert språk og bruker ikke ressurstokens | `Portfolio_content.<språk>.pnp` |
| `Taxonomy/Taxonomy.xml` | Termgruppen og termsettene for en ny tenant | `Taxonomy.pnp` |
| `Upgrade/<versjon>/<versjon>.xml` | Termer som eksisterende tenanter skal få (1.5.0, 1.8.1, 1.12.0 og 1.14.0) | `<versjon>.pnp` |
| `.tasks/` | Skriptene som genererer tekstfilene og prosjektmalene (under) | |

`.pnp`-filene lages bare av `Install/Build-Release.ps1`, med `Convert-PnPFolderToSiteTemplate` fra PnP.PowerShell; se [Bygge en ny utgivelse](../utgivelse/bygge-utgivelse.md). Med `-SkipBuildPnPTemplates`, som `[apps-only]`-kjøringene i CI bruker, lages de ikke.

### Bygge og validere

Kjør skriptene i `Templates/`. Alle står i [npm-skript](../spfx/npm-skript.md).

- `npm run build` kjører `generate-resx-json` (skriver `Templates/Resources.json`), `generate-resx-ts` (skriver `src/loc/shared/` i alle seks SPFx-løsningene) og `generate-project-templates` (skriver `.txt`-malene). Ingen løsning avhenger av `pp365-templates` i Rush, så kjør det selv etter hver endring i en `.resx`-fil eller en JSON-mal.
- `npm run validate-loc` skriver rapporter, men avslutter med 0 også når noe mangler. Les dem:
  - `resx-ts-report.json`: nøkler som mangler i et av språkene;
  - `pnp-missing-resource-tokens-report.json`: `{resource:}`-tokens i porteføljemalen som et språk mangler;
  - `<mal>-validation.md` ved siden av hver generert `.txt`: tokens som ikke ble byttet ut, for eksempel en `ControlId_` som mangler i kanalfila.
- `<mal>-validation.md`-filene ligger i repoet, og hver kjøring skriver et nytt tidsstempel i dem. Ta dem bare med i en commit når malinnholdet er endret.

`Templates/Resources.json`, `.txt`-filene under `ProjectTemplates/` og `src/loc/shared/` i løsningene er genererte og står i `.gitignore`. Rediger kildene, ikke dem.

### Tekstene (`.resx`)

- De to filene har de samme nøklene i samme rekkefølge, stort sett alfabetisk. Legg en ny nøkkel inn for hånd ved siden av naboen i begge filene.
- Én nøkkel brukes fire steder: `{resource:Nøkkel}` i `Portfolio/`, `{{Nøkkel}}` i JSON-malene, `Get-Resource -Name Nøkkel` i `Install/Scripts`, og `import resource from 'SharedResources'` i koden. Navn som koden og malene må være enige om, som listetitler og valgverdier, deler derfor én nøkkel.
- Hold verdiene ikke-tomme og på én linje: `generate-resx-ts` utelater tomme verdier fra språkfila og escaper bare `"`.
- `pwsh assets/scripts/Check-HardcodedAttributes.ps1 -Path <fil eller mappe>` lister `DisplayName`- og `Description`-verdier som ikke bruker `{resource:`.

### Slik når innholdet huben

`Install/Install.ps1` legger malene på huben.

- **Ny installasjon:** `Taxonomy.pnp`, så `Portfolio.pnp` og innholdsmalen for språket, søkekonfigurasjonen (`Install/SearchConfiguration.xml`) og `Scripts/PostInstall.ps1`.
- **Oppgradering (`-Upgrade`):** `Scripts/PreInstallUpgrade.ps1` før appene, så `Portfolio.pnp` uten håndtererne `Navigation`, `SupportedUILanguages` og `Files` (standardverdien til `-UpgradeExcludeHandlers`), innholdsmalen med bare `Files`, søkekonfigurasjonen, `PostInstall.ps1` og `Scripts/PostInstallUpgrade.ps1`.
- `Taxonomy.pnp` legges aldri på ved oppgradering. Nye termer for eksisterende tenanter går i en ny `Upgrade/<versjon>`-mal, som `PreInstallUpgrade.ps1` legger på bak en versjonssjekk.
- Innholdsmalen legges på med bare `Files` ved oppgradering. Filene byttes ut (også prosjektmalene i `Prosjektmaler`), men radene i innholdsmalens lister legges ikke inn; eksisterende huber får nye slike rader bare fra `PostInstallUpgrade.ps1`.
- `-SkipTemplate`, som `[apps-only]` bruker, hopper over malene. Før- og ettersteget for oppgradering kjører likevel.

Startrader (`<pnp:DataRows>`) oppfører seg etter `UpdateBehavior`:

- `Skip` (de fleste listene, f.eks. `Prosjektkolonner` med nøkkel `GtInternalName` og `Globale innstillinger` med `GtSettingsId`) legger til rader der nøkkelen mangler, og endrer aldri en rad som finnes.
- `Overwrite` (`Maloppsett`, `Hjelpeinnhold`, `Prosjektadministrasjonstilganger`, `Idekonfigurasjon` og `Tillatelseskonfigurasjon`) skriver radene sine på nytt ved hver oppgradering.
- På en ny hub er ID-en til en startrad plasseringen dens i `DataRows`, og oppslag mellom startrader bruker de ID-ene. Legg derfor nye rader sist; flytt eller sett aldri inn rader foran andre.

Hubens sider har `Overwrite="false"`, unntatt `Idemodul.xml` og `Konfigurasjon.xml`, så andre sider som finnes, blir stående. Navigasjonen hoppes over ved oppgradering; nye noder legges til i `PostInstallUpgrade.ps1`.

### Slik når innholdet prosjektområdene

Et prosjektområde får malen én gang, når oppsettveiviseren kjører: se [Prosjektmaler (JSON)](js-provisjoneringsmal.md). Malinnholdet på eksisterende prosjekter endres etterpå bare på tre måter:

- en administrator kjører veiviseren på nytt fra `Prosjektinformasjon` («Kjør oppsettveiviser»);
- egenskapslisten får nye felter fra hubens innholdstype når noen lagrer egenskapspanelet i `Prosjektinformasjon` (ikke når webdelen har `skipSyncToHub`);
- `Install/Scripts/UpgradeAllSitesToLatest.ps1 -Url <hub>` kjører hvert skript i `Install/Scripts/UpgradeAllSitesToLatest/` på alle gruppeområder i huben som har egenskapslisten (`Prosjektegenskaper`, på engelsk `ProjectProperties`). CI kjører det bare med `[upgrade-all-sites-to-latest]` i emnelinjen.

### Oppgraderingssteg

Stegene i `PreInstallUpgrade.ps1` og `PostInstallUpgrade.ps1` sjekker `$PreviousVersion -lt [version]"x.y.z"`, der `$PreviousVersion` er den nyeste versjonen i hubens `Installasjonslogg`. Skriptene i `UpgradeAllSitesToLatest/` sjekker `$global:__PreviousVersion`, den nest nyeste versjonen i loggen, altså den huben hadde før siste oppgradering.

- Bruk den åpne versjonen i `CHANGELOG.md` (`## x.y.z - TBA`) som `x.y.z`. Versjonen i `package.json` er forrige utgivelse helt til versjonen økes, og et steg som sjekker mot den, hopper over huber som er oppgradert fra den utgivelsen.
- Hver installasjon logger versjonen fra `package.json`. Fram til versjonen økes, kjører et steg for neste versjon derfor på nytt ved hver oppgradering, også ved hver CI-kjøring mot testkanalen. Hvert steg må tåle det, og ingen steg skal endre kundens egne rader eller navn.
- Hent lokaliserte navn med `Get-Resource -Name <Nøkkel>`. En ukjent nøkkel gir `Write-Error`, som stopper skriptet.

Flere regler og eksempler står i `pp365-templates`, «Writing upgrade steps».



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#prosjektmaler-json)

## ➤ Prosjektmaler (JSON)

Nye prosjektområder settes opp av oppsettveiviseren, `ProjectSetup`-utvidelsen i `ProjectExtensions`. Site scriptet `002000 - Setup extension.txt` knytter den til området (se [Site design og site scripts](site-design-og-site-scripts.md)). Veiviseren legger på en JSON-mal med motoren [sp-js-provisioning](https://github.com/Puzzlepart/sp-js-provisioning), som er låst til versjon `1.4.0` i `ProjectExtensions` og `PortfolioExtensions`.

### Kildene og de genererte malene

| Kilde i `Templates/JsonTemplates/` | Norsk mal | Engelsk mal |
|---|---|---|
| `_JsonTemplateProject.json` | `Standardmal` | `DefaultTemplate` |
| `_JsonTemplateProgram.json` | `Programmal` | `ProgramTemplate` |
| `_JsonTemplateParent.json` | `Overordnet` | `ParentTemplate` |

`npm run generate-project-templates` i `Templates/` (også en del av `npm run build` der) skriver hver mal til `Templates/Content/Portfolio_content.<språk>/ProjectTemplates/<navn>.txt`. Innholdsmalen laster filene opp til hubens bibliotek `Prosjektmaler`, og hver rad i listen `Maloppsett` peker på én fil. Filnavnene står i `templateNames` i `Templates/.tasks/generate-project-templates.js`, som bare kjenner `Project`, `Program` og `Parent`.

Tokens i kildene:

| Token | Byttes med |
|---|---|
| `{{Nøkkel}}` | Teksten for nøkkelen i språkets `.resx`-fil, f.eks. `"Name": "{{ContentTypes_Uncertainty_Name}}"` |
| `{{ControlId_<alias>}}` | ID-en til SPFx-komponenten med det aliaset, fra kanalfila; se [Installasjonskanaler](kanaler.md) |
| `{version}` | Versjonen i rotens `package.json` |

Rediger kildene, ikke `.txt`-filene: de er genererte og står i `.gitignore`.

### Parameters

Hver mal har et `Parameters`-objekt. I alle tre kildene ser det slik ut:

```json
{
  "Parameters": {
    "ProvisionSiteFields": "{{SiteFields_Project_Group}}",
    "CustomSiteFields": "{{SiteFields_CustomFields_Group}}",
    "ProjectContentTypeId": "0x0100805E9E4FEAAB4F0EABAB2600D30DB70C",
    "ProjectStatusContentTypeId": "0x010022252E35737A413FB56A1BA53862F6D5"
  }
}
```

Veiviseren leser malfila som raden brukeren velger i `Maloppsett`, peker på (kolonnen `Mal`). En verdi i raden går foran verdien i fila (`ProjectTemplate.getSchema()` i `shared-library`).

| Parameter | Brukes til | Kolonnen i `Maloppsett` som overstyrer |
|---|---|---|
| `ProvisionSiteFields` | Hubens nettstedskolonner i denne gruppen («Kolonner for Prosjektportalen (Prosjekt)») kopieres til prosjektområdet. Beregnede kolonner og kolonner som finnes fra før, hoppes over | `Prosjektkolonner` (`GtProjectColumns`) |
| `CustomSiteFields` | Kolonner i denne gruppen («Egendefinerte kolonner for Prosjektportalen») synkroniseres med huben, selv om navnet ikke begynner med `Gt` | `Kundespesifikke kolonner` (`GtProjectCustomColumns`) |
| `ProjectContentTypeId` | Innholdstypen på huben som egenskapslisten (`Prosjektegenskaper`) bygges fra | `Prosjekt innholdstype` (`GtProjectContentType`) |
| `ProjectStatusContentTypeId` | Innholdstypen for statusrapportene i `Prosjektstatus` | `Prosjektstatus innholdstype` (`GtProjectStatusContentType`) |
| `TimelineContentTypeId` | Innholdstypen for tidslinjeelementer. Uten den hopper veiviseren over oppsettet av tidslinjen. Finnes ikke i kildefilene | `Tidslinje innholdstype` (`GtTimelineContentType`) |
| `TermSetIds` | Termsett per felt (under) | `Prosjektfase Termsett ID` (`GtProjectPhaseTermId`), for `GtProjectPhase` |

Parameterne lagres som JSON i det skjulte feltet `TemplateParameters` i prosjektets egenskapsliste, og `Prosjektstatus` henter `ProjectStatusContentTypeId` derfra. Når veiviseren kjøres på nytt fra `Prosjektinformasjon`, beholdes de lagrede parameterne.

### TermSetIds

`TermSetIds` er et kart fra internt feltnavn til termsett-ID:

```json
{
  "Parameters": {
    "TermSetIds": {
      "<internt feltnavn>": "<termsett-ID>"
    }
  }
}
```

- Veiviseren bygger kartet fra `Parameters.TermSetIds` i fila, med `GtProjectPhase` fra kolonnen `Prosjektfase Termsett ID` i `Maloppsett`. Kolonnen har standardverdien `abcfc9d9-a263-4abb-8234-be973c46258a` (termsettet `Fase`); raden for programmalen bruker `54f92279-2602-4d70-95b5-e6113f27666e` (`Fase (Program)`). Kildefilene har ingen `TermSetIds`.
- Oppgaven `SetTaxonomyFields` kobler hvert felt i kartet til termsettet i standard termlager. Feltet må finnes på prosjektområdet.
- Utvidelsens egenskap `termSetIds`, som site scriptet setter, brukes bare når skjemaet mangler `Parameters.TermSetIds`. For vanlige maler lager veiviseren alltid kartet, så standardverdiene i site scriptet gjelder i praksis bare sentrale malpakker som har egne `Parameters` uten `TermSetIds`.

### Hva veiviseren gjør

Oppgavene kjører i denne rekkefølgen (`ProjectExtensions/src/extensions/projectSetup/tasks/index.ts`):

1. `PreTask` henter malen og parameterne. For en vanlig mal sjekker den at hver parameterverdi med `0x` er en innholdstype på huben, og at termsettet for `GtProjectPhase` finnes; ellers stopper veiviseren. Sjekken hoppes over når utvidelsens egenskap `forceTemplate` er satt. En sentral malpakke (`Malpakketype` = `Sentral` i `Maloppsett`) tar skjemaet fra `.pppkg`-fila raden peker på, bruker malfila raden peker på når pakken ikke har `Parameters`, og sjekkes ikke.
2. `SitePermissions`.
3. `SetupProjectInformation` lager egenskapslisten fra innholdstypen i `ProjectContentTypeId` og legger prosjektet til i hublisten `Prosjekter`.
4. `ProvisionSiteFields` kopierer kolonnene i gruppen `ProvisionSiteFields`.
5. `ApplyTemplate` legger på malen med sp-js-provisioning, og deretter hvert valgt prosjekttillegg (`Prosjekttillegg`) uten `Hooks`.
6. `SetTaxonomyFields` kobler feltene i `TermSetIds`.
7. `CopyListData` kopierer det valgte listeinnholdet (`Listeinnhold`), også Planner-oppgaver og tidslinjeelementer.
8. `CustomActions` og `Hooks`.

Veiviseren kjører bare når området settes opp, eller når en administrator kjører den på nytt. Hvordan eksisterende prosjekter ellers får endringer, står i [Maler](maler.md), «Slik når innholdet prosjektområdene».

### Prøve en mal lokalt

sp-js-provisioning er et eget repo. I en klone av det legger `npm run provision -- --site <url> --package <mappe|.pppkg|template.json>` en mal på et ekte område fra Node, med app-only-pålogging fra `debug/provision.settings.ts` (se `debug/README.md` der). Det etterligner hubimporten av malpakker, ikke veiviseren, og hopper over håndtererne som bare virker i nettleseren (taksonomi og innholdstyper). Feilsøk dem i nettleseren.

Designet for malpakker (`.pppkg`) og malpakkekatalogen står i [`docs/plans/template-catalog.md`](../../docs/plans/template-catalog.md).



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#site-design-og-site-scripts)

## ➤ Site design og site scripts

Kildene til site scriptene ligger i `SiteScripts/src`, én JSON-fil med endelsen `.txt` per script:

| Fil | Gjør |
|---|---|
| `001000 - Regionale innstillinger.txt` | Setter de regionale innstillingene (`setRegionalSettings`): `locale` 1044 (norsk), `timeZone` 4 og 24-timersklokke |
| `002000 - Setup extension.txt` | Knytter oppsettveiviseren (`ProjectSetup`-utvidelsen i `ProjectExtensions`) til området, med standardverdier for `termSetIds` (`GtProjectPhase` og `GtResourceRole`); se [Prosjektmaler (JSON)](js-provisjoneringsmal.md) |

### Slik installeres de

- `Install/Build-Release.ps1` kopierer `*.txt` til `SiteScripts/` i utgivelsespakken. Et kanalbygg kopierer i stedet kopiene `npm run generate-site-scripts` lager i `.dist/SiteScripts`, med kanalens komponent-ID-er; se [Installasjonskanaler](kanaler.md).
- `Install/Install.ps1` oppretter eller oppdaterer ett site script per fil. Tittelen er filnavnet uten de ni første tegnene (`001000 - `), og for en annen kanal enn `main` med ` - <kanal>` bakerst.
- Scriptene samles i site designet `Prosjektområde` (`Project Site` ved `-Language English`, med ` [<kanal>]` bakerst for en annen kanal enn `main`), og det blir hubens standard site design (`Set-PnPHubSite -SiteDesignId`). SharePoint kjører det på områder som knyttes til huben.
- Steget kjører både ved ny installasjon og ved `-Upgrade`, også med `-SkipTemplate` (`[apps-only]`). `-SkipSiteDesign` hopper over scriptene og designet, og `-SkipDefaultSiteDesignAssociation` over koblingen til huben.
- De samme filene brukes for begge språk, så også en engelsk installasjon får de regionale innstillingene over.

### Endringer

- Et endret site script når bare områder som knyttes til huben etterpå. For å kjøre designet på ett eksisterende område: `Invoke-PnPSiteDesign`, som vist i [`SiteScripts/src/README.md`](../../SiteScripts/src/README.md).
- `SiteScripts/` er ikke med i stifiltrene til arbeidsflytene i `.github/workflows/`. En push som bare endrer site scripts, ruller derfor ikke ut noe; endringen går ut med neste bygg som kjører.
- Komponent-ID-er i scriptene skrives med `main`-ID-ene; kanalbygget bytter dem.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#installasjonskanaler)

## ➤ Installasjonskanaler

En installasjonskanal gir løsningene og komponentene egne ID-er, slik at flere installasjoner av _Prosjektportalen 365_ kan ligge side om side i én tenant. Kanalene ligger i `channels/`:

| Fil | Kanal |
|---|---|
| `main.json` | Utgivelsen. ID-ene er de som står i kildekoden |
| `test.json` | Testkanalen, som `ci-channel-test.yml` bygger og ruller ut til testtenanten |
| `kurs.json` | Bygges på `main` når commit-meldingen har `[build-kurs]` |
| `i18n.json` | Ingen aktiv arbeidsflyt bygger den (`ci-channel-i18n.yml` ligger i `.github/workflows/unused/`) |

Hver fil gir hver SPFx-løsning egen `id`, `name` og `zippedPackage` (f.eks. `solution/pp-portfolio-web-parts-test.sppkg`) og hver komponent egen ID, oppslått på komponentens alias. Formatet står i `channels/$schema.json`.

### Hvor ID-ene byttes

SPFx-manifestene, porteføljemalen og site scriptene har `main`-ID-ene, og JSON-prosjektmalene bruker `{{ControlId_<alias>}}`. `Install/Build-Release.ps1 -Channel <kanal>` skriver kanalfila til `.current-channel-config.json` i roten og bytter ID-ene på fire steder:

- **SPFx-løsningene:** `config/package-solution.json` og hver `manifest.json` (`SharePointFramework/.tasks/modifySolutionFiles.js`). Webdelene får `hiddenFromToolbox`, så verktøykassen ikke viser dem to ganger. Filene tilbakestilles etter pakkingen.
- **Porteføljemalen:** `npm run generate-pnp-templates` kopierer `Templates/Portfolio` til `.dist/Templates/Portfolio` og bytter `main`-ID-ene der.
- **Site scriptene:** `npm run generate-site-scripts` kopierer `SiteScripts/src` til `.dist/SiteScripts` og bytter ID-ene der.
- **JSON-prosjektmalene:** `{{ControlId_<alias>}}` fylles fra `.current-channel-config.json`, eller fra `channels/main.json` når den fila ikke finnes.

`Install.ps1` i pakken vet hvilken kanal den hører til. Den gir site designet og site scriptene kanalnavnet i tittelen, logger kanalen i `Installasjonslogg`, og `-Upgrade` stopper når huben er installert med en annen kanal eller et annet språk.

Komponent-ID-er som står i TypeScript, byttes ikke. De to `ProjectSetupCustomAction.ts` i `SharePointFramework/ProjectWebParts/src/components/ProjectInformation/` (`RunProjectSetupDialog` og `CreateParentDialog`) bruker `main`-ID-en til `ProjectSetup` på norske områder (LCID 1044) og `i18n`-ID-en ellers.

### Bygge for en kanal

- Hele utgivelsespakken: `./Install/Build-Release.ps1 -Channel test` i PowerShell 7. `-Channel` godtar `test`, `kurs` og `i18n`. Pakken havner i `release/` med kanalnavnet bakerst; se [Bygge en ny utgivelse](../utgivelse/bygge-utgivelse.md).
- Én løsning: `npm run build:test` (eller `build:kurs`, `build:i18n`) i løsningen. Det lager bare den løsningens `.sppkg` og kjører ingen tester.
- I CI setter `ci-channel-test.yml` og `ci-build-debug.yml` `PP365_BUILD_NUMBER` til kjørenummeret, og løsningen og funksjonene får versjonen `x.y.z.<kjørenummer>`. Andre bygg har `x.y.z.0`.

Avbrytes et kanalbygg, blir filene liggende. En gjenglemt `.current-channel-config.json` får lokale genereringer til å bruke kanalens ID-er: slett den. Tilbakestill løsningene med `node ../.tasks/modifySolutionFiles.js --revert --force` og `node ../.tasks/setBundleConfig.js --revert` i hver av dem. Commit aldri kanal-ID-er i manifestene.

### Ny komponent eller ny kanal

Skriptene i roten trenger rotens egne avhengigheter, så kjør `npm install` i roten først.

- **Ny SPFx-komponent:** `npm run generate-channel-config` uten kanalnavn oppdaterer `channels/main.json` fra manifestene. Kjør deretter `npm run generate-channel-config <kanal> /update` for `test`, `kurs` og `i18n`. Med `/update` beholdes ID-ene som finnes, og nye komponenter får nye.
- **Uten `/update`** lages alle ID-ene i kanalen på nytt, som for en ny kanal. Gjør aldri det for en kanal som er installert et sted.
- **Ny kanal:** `npm run generate-channel-config <kanal>` skriver `channels/<kanal>.json`. Kanalen må også inn i `ValidateSet` for `-Channel` i `Install/Build-Release.ps1`, og trenger et `build:<kanal>`-skript i løsningene om den skal bygges der.
- `channels/` er ikke med i stifiltrene til arbeidsflytene, så en push som bare endrer kanalfilene, ruller ikke ut noe.

Hvordan CI bruker testkanalen, står i [Kontinuerlig integrasjon](../ci/kontinuerlig-integrasjon.md).



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#versjonering)

## ➤ Versjonering

Alle prosjektene i monorepoet har samme versjon som roten, og den settes bare der. Endre aldri versjonen i en enkelt løsning, og kjør aldri `npm version` inne i en løsning (se [NPM](npm.md)).

`npm version minor` (eller `patch`) i roten setter versjonen i rotens `package.json` og kjører `postversion`. Der skriver `sync-version` (`.tasks/automatic-versioning.js`) versjonen videre til:

- `package.json` i hvert prosjekt i `rush.json`: de seks SPFx-løsningene, `Templates`, `SharePointFramework/.tasks`, `.eslint-config`, `.jest-config` og `e2e`. Prosjektene leses fra `rush.json`, så et nytt prosjekt kommer med uten at skriptet endres.
- `config/package-solution.json` i hver løsning, som `x.y.z.0`.
- hver `src/**/manifest.json` i løsningene.

Skriptet kan også kjøres alene, og `--dry-run` viser hva det ville endret uten å skrive noe:

```bash
npm run sync-version
npm run sync-version -- --dry-run
```

Det trenger rotens egne avhengigheter (`glob`), som Rush ikke installerer, så kjør `npm install` i roten først. Løsningene henter hverandre med `workspace:*`, så ingen avhengighet må oppdateres for hånd. Hele løpet for en ny versjon står i [Opprettelse av en ny versjon](opprette-ny-versjon.md).

Pakkene som `ci-channel-test.yml` og `ci-build-debug.yml` bygger, får kjørenummeret som fjerde ledd (`x.y.z.<kjørenummer>`), slik at SharePoint henter manifestene på nytt. Pakker fra `main`, `ci-releases.yml` og lokale bygg har `x.y.z.0`. Se [Installasjonskanaler](../maler/kanaler.md).



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#smoke-test-prosessen)

## ➤ Smoke test-prosessen

> Automatiske tester tar over stadig mer av dette: enhets- og komponenttester kjører i hvert bygg, og Playwright-røyktester kjører mot testkanalen etter hver utrulling. Se kapittelet «Testregime». Den manuelle smoke-testen dekker skriveflytene som ennå ikke er automatisert, og skal alltid lenke til siste E2E-kjøring.

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
| smoketest-projectwebparts.yml | ProjectWebParts (prosjektinformasjon, faser, status, tidslinje, matriser, nytteoversikt, dynamisk liste, nyheter) |
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
- Malene ligger i `.github/ISSUE_TEMPLATE/` i det private repoet [prosjektportalen365-testing](https://github.com/Puzzlepart/prosjektportalen365-testing) (issue-skjemaer), og bør revideres ved større endringer i funksjonalitet. Nytt issue: «New issue» i det repoet og velg malen, eller åpne `https://github.com/Puzzlepart/prosjektportalen365-testing/issues/new?template=<malnavn>.yml`.
- Se også kommentarer i YAML-filene for detaljer om hvert testpunkt.

### Tips
- Smoke test bør alltid kjøres på både ny installasjon og oppgradering.
- Dokumentasjon og hjelpeinnhold testes separat i `smoketest-dokumentasjon.yml`.
- Oppsummerings-issue gir oversikt over fremdrift og ansvar.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#opprettelse-av-en-ny-versjon)

## ➤ Opprettelse av en ny versjon

Versjonsnummeret følger [Semantic Versioning](https://semver.org/). En minor-versjon (`x.y.0`) samler ny funksjonalitet av interesse for brukerne og utvikles på sin egen branch, `releases/x.y`. En patch (`x.y.z`) har feilrettinger og små justeringer. Når en versjon er klar, avgjøres i teamet.

Stegene under er slik 1.14.0 ble laget. Ferdigheten [`pp365-release`](../../.claude/skills/pp365-release/SKILL.md) har dem som sjekkliste, i del 6.

### 1. Før versjonsnummeret økes

- Siste Playwright-kjøring mot testkanalen (`ci-channel-test.yml`) er grønn, og smoke-testen er gjennomført med lenke til den kjøringen; se [Smoke test-prosessen](smoketest.md).
- `CHANGELOG.md`: `## x.y.z - TBA` blir `## x.y.z - DD.MM.YYYY`. For en minor lenker innledningen øverst i fila til `./releasenotes/x.y.z.md`.
- `releasenotes/x.y.z.md` (bare minor-versjoner har en slik fil): `(TBA)` i tittelen blir måned og år, som i `# Prosjektportalen 365 - 1.14.0 (September 2026)`. Bildene for hver `<!-- TODO skjermbilde -->` legges under `releasenotes/assets/x.y/`.

### 2. Øke versjonsnummeret

På `releases/x.y`, med en ren arbeidskopi, i roten av repoet:

```bash
npm install
npm version minor --no-git-tag-version
```

Bruk `patch` i stedet for `minor` for en patch. `npm install` gir skriptene i `postversion` rotens egne avhengigheter, som Rush ikke installerer.

`npm version` setter versjonen i rotens `package.json` og `package-lock.json` og kjører så `postversion`:

- `generate-readme` bygger `README.md` og `.development-guide/README.md` på nytt (den henter `@appnest/readme` med `npx`); se [README-generering](../ci/readme-generering.md).
- `sync-version` (`.tasks/automatic-versioning.js`) setter versjonen i `package.json` i hvert prosjekt i `rush.json` (de seks løsningene, `Templates`, `SharePointFramework/.tasks`, `.eslint-config`, `.jest-config` og `e2e`), i hver løsnings `config/package-solution.json` (som `x.y.z.0`) og i hver `src/**/manifest.json`; se [Versjonering](versjonering.md).
- `generate-sbom` skriver `SBOM.md`; se [SBOM-generering](../ci/sbom.md).

Commit alt som én commit på release-branchen, og push. For 1.14.0 var det commiten `v1.14.0` på `releases/1.14`.

Hvorfor `--no-git-tag-version`: uten flagget committer og tagger npm før `postversion` kjører. Da havner filene fra `postversion` utenfor commiten, og taggen havner på release-branchen. Taggen skal på `main` (steg 4), så push ingen tagger fra release-branchen.

Kjør aldri `npm version` inne i en løsning; se [NPM](npm.md).

### 3. Release-PR og pakkene

- Opprett en PR fra `releases/x.y` til `main` med tittelen `v<versjon>`, labelen `release-pr` og milepælen for versjonen. For 1.14.0 var det #1769, slått sammen med «Squash and merge».
- Push til `main` starter `build-release.yml` («Build release (main)») når den endrer noe under `SharePointFramework/`, `Install/` eller `Templates/`, som versjonscommiten gjør. Den laster opp artefaktene `release-package` (hovedkanalen) og `release-package-test` (testkanalen), og `release-package-kurs` når commit-meldingen har `[build-kurs]`. Den ruller ikke ut noe.
- Arbeidsflyten leser hele commit-meldingen, også punktlisten en squash-merge lager av alle commitene i versjonen. Sjekk at den ikke har `[skip-main-ci]` eller en `[build-kurs]` du ikke vil ha.
- Artefaktene slettes etter 7 dager, som er det lengste repoet tillater.
- Testpakken fra `main` har versjonen `x.y.z.0`. Testtenanten har allerede fått `x.y.z.<kjørenummer>` fra `ci-channel-test.yml`.

### 4. GitHub-utgivelsen

- Opprett utgivelsen `v<versjon>` med `main` som mål; GitHub lager taggen der.
- Teksten lenker til release notes og gjentar endringsloggens seksjon for versjonen under overskriftene i `.github/RELEASE_TEMPLATE.md`.
- Legg ved installasjonspakkene som zip-filer. For 1.14.0 het de `pp365-1.14.0.zip` og `pp365-1.14.0-test.zip`. Ingen bygg gir disse navnene: pakk innholdet i artefaktene `release-package` og `release-package-test`, eller gi nytt navn til zip-filene et lokalt bygg på `main` lager: `release/pp365-<versjon>.<hash>.zip`, og `release/pp365-<versjon>.<hash>-test.zip` med `-Channel test` (se [Bygge en ny utgivelse](bygge-utgivelse.md)).
- Taggen starter `generate-sbom.yml`, som bare laster opp SBOM-en som artefaktet `sbom`; den committer ingenting. `SBOM.md` er allerede oppdatert av `postversion`.

### 5. Neste versjon

- Opprett `releases/<neste>` og skriv branchnavnet inn i `on.push.branches` i `ci-releases.yml`, `ci-channel-test.yml` og `ci-build-debug.yml`, og der guiden nevner den gjeldende release-branchen: [Kom i gang](../kom-i-gang.md), [Kontinuerlig integrasjon](../ci/kontinuerlig-integrasjon.md) og [testing.md](../spfx/testing.md).
- Opprett milepælen for neste versjon om den mangler, og legg `## <neste> - TBA` øverst i `CHANGELOG.md`.

### Patch-versjoner

Patcher har ikke fulgt ett fast løp: 1.12.1 ble slått sammen til `main` fra `releases/1.13` (#1689), mens versjonscommitene for 1.13.1 ligger rett på `main`, uten release-PR. Hvilken branch en patch lages fra, avtales i teamet. Ellers gjelder stegene over med `npm version patch`, uten release notes-fil.



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#bygge-en-ny-utgivelse)

## ➤ Bygge en ny utgivelse

`Install/Build-Release.ps1` bygger installasjonspakken. Det kjører en full `rush rebuild` med testene, pakker hver løsning som `.sppkg`, bygger PnP-malene og site scripts og legger alt sammen med installasjonsskriptene og PnP.PowerShell i `release/`. Skriptet trenger Node 22 og PowerShell 7 (`pwsh`), og stopper på en annen hovedversjon av Node.

Fra roten:

```bash
npm run build-release
```

Lokalt havner pakken i `release/pp365-<versjon>.<hash>/` og som zip-fil ved siden av, `release/pp365-<versjon>.<hash>.zip`. Med `-Channel` får navnet kanalen på slutten (`-test`).

```powershell
./Install/Build-Release.ps1 -Channel test                               # testkanalens pakke
./Install/Build-Release.ps1 -Solutions ProjectWebParts,PortfolioWebParts # pakk bare disse løsningene
```

| Parameter | Hva den gjør |
| --- | --- |
| `-Channel test\|kurs\|i18n` | Bytter inn kanalens løsnings- og komponent-ID-er fra `channels/<kanal>.json` før bygget (se [Installasjonskanaler](../maler/kanaler.md)). |
| `-Solutions <navn,...>` | Pakker bare de oppgitte løsningene. Bygget er likevel en full `rush rebuild`, så `shared-library` kommer med i løsningene som bundler den. Navnene matches uten hensyn til store bokstaver og bindestrek. |
| `-SkipBuildPnPTemplates` | Hopper over PnP-malene. |
| `-SkipPnPPowerShell` | Installerer, importerer og sjekker ikke PnP.PowerShell, som bare malene trenger. Krever `-SkipBuildPnPTemplates`. |
| `-SkipBundle` | Legger ikke PnP.PowerShell-modulen i pakken. |
| `-RushTimeline` | Skriver byggetiden per prosjekt i loggen (og i jobbens sammendrag i CI). |
| `-CI` | CI-modus: installerer PnP.PowerShell og legger pakken rett i `release/`, uten zip-fil. |
| `-Force` | Sletter `node_modules` i løsningene før bygget. |

Skriptet stopper på feil som `npm run build` slipper gjennom:

- løsnings- eller komponent-ID-er fra en annen kanal i kildekoden, for eksempel fra en `npm run watch` som ikke ble avsluttet før en commit (`npm run check-channel-ids` sjekker det samme alene)
- en dekningsgrense i en løsnings `config/jest.config.json` som ikke er nådd (Jest melder det, men Heft feiler ikke)
- en løsning som ikke fikk en ny `.sppkg`
- en `pp365-*`-pakke som er ekstern i en bundle i stedet for bundlet inn
- tredjeparts-CSS med hashede klassenavn

CI kjører det samme skriptet. `build-release.yml` på `main` lager utgivelsespakken og testkanalens pakke, og kanal-arbeidsflytene bygger testkanalen før de ruller den ut; se [Kontinuerlig integrasjon](../ci/kontinuerlig-integrasjon.md). Hvordan en versjon lages og publiseres, står i [Opprettelse av en ny versjon](opprette-ny-versjon.md).



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#npm)

## ➤ NPM

SPFx-løsningene publiseres ikke lenger til npm. Siste versjon der er 1.8.4, fra august 2023, av `pp365-portfoliowebparts`, `pp365-portfolioextensions`, `pp365-programwebparts`, `pp365-projectwebparts` og `pp365-projectextensions`. `pp365-shared-library` finnes ikke på npm.

I repoet henter løsningene hverandre som Rush-prosjekter (`"pp365-shared-library": "workspace:*"`), så ingen bygg trenger pakkene fra npm.

Hver løsning har likevel `postversion`-skriptet `heft build --production && npm publish`. Kjør derfor aldri `npm version` eller `npm publish` inne i en løsning. Versjonen settes fra roten; se [Opprettelse av en ny versjon](opprette-ny-versjon.md).



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cut.png)](#kontinuerlig-integrasjon)

## ➤ Kontinuerlig integrasjon

Vi har satt opp kontinuerlig integrasjon (CI) ved hjelp av GitHub Actions.

### CI (releases/*)

[![CI (releases)](https://github.com/Puzzlepart/prosjektportalen365/actions/workflows/ci-releases.yml/badge.svg)](https://github.com/Puzzlepart/prosjektportalen365/actions/workflows/ci-releases.yml)

Nøkkelord kan brukes i commit-meldingen for å unngå (eller tvinge) at CI kjører noen av jobbene.

- `[skip-ci]` for å unngå at alle CI-prosesser starter. Unntak: `skills.yml`, som bare sjekker agentferdighetene og tar sekunder, og `build-release.yml` på `main`, som ikke leser taggen.
- `[skip-upgrade]` for å unngå at jobben «Oppgrader» starter. Dette vil også hoppe over jobben «Installer» da den er avhengig av «Oppgrader».
- `[skip-install]` for å unngå at jobben «Installer» starter.
- `[skip-main-ci]` (bare `main`) hopper over utgivelsespakken og kurs-pakken i `build-release.yml`. Testkanalens pakke bygges likevel.
- `[skip-test-ci]` (bare `main`) hopper over testkanalens pakke i `build-release.yml`. Uten taggen bygges den også når hovedpakken hoppes over (`[skip-main-ci]`) eller feiler; jobbens `if:` er `!cancelled() && …` (til 2026-10-09 `always() || …`, som alltid var sant, så taggen virket ikke).
- `[build-kurs]` (bare `main`) bygger også kurs-kanalens pakke i `build-release.yml`.
- `[apps-only]` for å bygge kun pakker (appkatalog), hopper over utrulling av maler. Brukes bare når ingenting i `Templates/` er endret: også `.resx`-tekster, JSON-maler og innhold går bare ut med en full kjøring.
- `[apps-only:<løsninger>]` som `[apps-only]`, men pakker og ruller ut **kun de oppgitte SPFx-løsningene** (kommaseparert) i stedet for alle, f.eks. `[apps-only:ProjectWebParts,PortfolioWebParts]`. Navnene matches uten hensyn til store/små bokstaver og bindestrek (`portfoliowebparts` er `PortfolioWebParts`). Gyldige navn: `shared-library`, `PortfolioExtensions`, `PortfolioWebParts`, `ProgramWebParts`, `ProjectExtensions`, `ProjectWebParts`. Bygget er likevel en full `rush rebuild`. `shared-library` er bundlet inn i hver løsning som bruker den, og `ProjectWebParts` og `PortfolioWebParts` i løsningene som henter komponenter fra dem, så en endring der når sidene bare gjennom løsningene du lister. Å liste `shared-library` alene ruller ikke ut noe som sidene bruker.
- `[upgrade-all-sites-to-latest]` for å kjøre skriptet `UpgradeAllSitesToLatest.ps1` i CI-modus etter en full oppgradering (ikke etter `[apps-only]`, siden jobben trenger det fulle bygget). Skriptet logger inn med sertifikatet og gir seg derfor ikke eiertilgang til områdene, og en feil gjør jobben rød.
- `[skip-e2e]` for å hoppe over Playwright-røyktestene som kjører etter oppgraderingen av testkanalen, også etter en `[apps-only]`-oppgradering (se «Testregime»). `[skip-upgrade]` hopper over dem indirekte.
- `[build-debug]` for å bygge utgivelsespakken i feilsøkingsarbeidsflyten, uten utrulling (se «CI (build debug)»). Sammen med `[skip-ci]` i samme emnelinje bygger bare den.

Bare emnelinjen (første linje) i commit-meldingen leses, slik at punktene i en squash-merge ikke styrer jobbene. Unntaket er `build-release.yml` på `main`: den leser hele meldingen, også punktlisten i en squash-merge, etter `[skip-main-ci]`, `[skip-test-ci]` og `[build-kurs]`.

### Bygg og installer (dev)

[ci-releases](../../.github/workflows/ci-releases.yml) kjører ved _push_ til `releases/1.15` som endrer noe under `SharePointFramework/`, `Install/` eller `Templates/`. Den bygger utgivelsespakken med [Build-Release.ps1](../../Install/Build-Release.ps1) `-CI`, oppgraderer utviklingshuben `https://puzzlepart.sharepoint.com/sites/pp365` med [Install.ps1](../../Install/Install.ps1) `-Upgrade`, og installerer så et nytt område, `<huben>_<commit>`, for å prøve en ny installasjon. Innloggingen skjer med et sertifikat for en app-registrering, fra hemmelighetene `CI_TENANT`, `CI_CLIENT_ID` og `CI_CERT_BASE64`.

En full kjøring tar rundt 85–90 minutter (bygg ~13, oppgradering ~28, ny installasjon ~46). Med `[apps-only]` bygges bare pakkene, og huben oppgraderes uten maler, på rundt 14 minutter.

### CI (channels/test)

[ci-channel-test](../../.github/workflows/ci-channel-test.yml) bygger en pakke for kanalen [test](../../channels/test.json), distribuerer den til URL-en som er spesifisert i `SP_URL_TEST`, og kjører deretter Playwright-røyktestene i `e2e/` mot den (jobben «End-to-end smoke (test channel)»). Pakkejobben (`[apps-only]`) skriver tiden per prosjekt i jobbens sammendrag og installerer ikke PnP.PowerShell, som bare malene trenger. Rapporten lastes opp som artefaktet `playwright-report-test-channel`; hvordan den leses står under «Testregime». Arbeidsflyten kan også startes manuelt fra Actions-fanen.

Alle kjøringene oppgraderer den samme testhuben og appkatalogen, uansett branch, så de deler én `concurrency`-gruppe (`ci-channel-test`): en kjøring venter mens en annen kjører, i stedet for at to deployer samtidig og overskriver hverandres pakker. GitHub holder bare den nyeste ventende kjøringen i gruppen og avbryter en eldre som venter. På samme branch inneholder den nyeste commiten endringene fra den eldre, men malene fra en avbrutt full kjøring blir ikke lagt på. Push derfor commiten som trenger full kjøring sist, eller vent til den er ferdig.

### CI (build debug)

[ci-build-debug](../../.github/workflows/ci-build-debug.yml) bygger testkanalens utgivelsespakke slik pakkejobben i `ci-channel-test` gjør, men ruller den ikke ut og trenger ingen hemmeligheter. Den er til å prøve og måle endringer i selve bygget (nye brytere i `Build-Release.ps1`, oppsettet av Rush og Heft) før de levende arbeidsflytene tar dem i bruk. Den kjører ved _push_ når emnelinjen inneholder `[build-debug]`, med samme argumenter som pakkejobben i `ci-channel-test`: `-RushTimeline` (tiden per prosjekt skrives i loggen og i jobbens sammendrag) og `-SkipPnPPowerShell` (bare PnP-malene, som jobben hopper over, trenger modulen). En endring i bygget legges inn her først, som en ny bryter i `Build-Release.ps1`, og flyttes til de levende arbeidsflytene når den er bevist. Pakken og Rush-loggene lastes opp som `release-package-debug` og `rush-logs-debug`.

To ting å vite når du måler: løperne varierer mye (samme bygg har tatt 506 og 711 sekunder), så bare tider fra samme kjøring kan sammenlignes. Og `package-solution` lager ny GUID for «Client Side Assets»-funksjonen og nye relasjons-ID-er (`Id="r5"`) ved hver kjøring, så to `.sppkg` fra samme kode er bare like når disse er maskert. Et faseinndelt bygg (build og test som egne Rush-faser) er prøvd og var tregere på GitHubs firekjerners løpere; resultatet står i `docs/plans/dependency-upgrades-phase-5.md`, slice 1c.

### Bygg utgivelse (main)

[build-release](../../.github/workflows/build-release.yml) kjører ved _push_ til `main` som endrer noe under `SharePointFramework/`, `Install/` eller `Templates/`. Den bygger utgivelsespakken og testkanalens pakke, og kurs-pakken med `[build-kurs]`, og laster dem opp som artefaktene `release-package`, `release-package-test` og `release-package-kurs`. Den ruller ikke ut noe, og tar rundt 25 minutter. Hvordan pakkene brukes i en utgivelse, står i [Opprettelse av en ny versjon](../utgivelse/opprette-ny-versjon.md).

### Aktive arbeidsflyter

GitHub kjører bare arbeidsflytfilene som ligger rett i `.github/workflows/`. De i `.github/workflows/unused/` (`automatic_chores.yml`, `ci-channel-i18n.yml`, `pr-package-spfx-dev.yml`) er tatt ut av bruk.

| Arbeidsflytfil        | Beskrivelse                                                                  | Utløser                                                                                  |
| --------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `ci-releases.yml`     | Bygg, oppgrader og installer til utviklingsmiljø                             | Push til `releases/1.15` (stier: SPFx, Install, Templates)                               |
| `ci-channel-test.yml` | Bygg og distribuer testkanalen, og kjør Playwright-testene mot den           | Push til `releases/1.15`, `feat/fluent-v9*` og `feat/dependency-upgrades*` (stier: SPFx, Install, Templates, e2e) |
| `ci-build-debug.yml`  | Bygg testkanalens pakke uten utrulling, for å prøve endringer i bygget       | Push til `releases/1.15` eller en `feat/**`-branch med `[build-debug]` i emnelinjen      |
| `build-release.yml`   | Bygg utgivelsespakke og test/kurs-kanalpakker                                | Push til `main` (stier: SPFx, Install, Templates)                                        |
| `generate-sbom.yml`   | Generer SBOM.md som artefakt; committer den bare ved manuell kjøring fra en branch | Tag-push `v*` eller manuell utløsning                                              |
| `skills.yml`          | Sjekk at agentferdighetene bare ligger i `.claude/skills` (`npm run check-skills`) | Push og pull request som endrer `.claude/skills`, `.github/skills` eller `.agents/skills` |

Hvilke brancher en arbeidsflyt kjører på, leses fra arbeidsflytfilen i commiten som pushes. En branch kan derfor få CI ved å legge seg selv til i sin egen kopi av filen, slik fase 5 gjorde i `ci-channel-test.yml`.



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

SBOM (Software Bill of Materials) er en liste over programvarekomponentene, bibliotekene og avhengighetene som brukes i Prosjektportalen 365. Vår SBOM lister de direkte avhengighetene slik `package.json` i hvert prosjekt oppgir dem (spesifikatoren, f.eks. `~9.74.8`), ikke de løste versjonene i lockfila eller de transitive avhengighetene. Den gir innsyn i hvilke åpen kildekode- og tredjepartskomponenter som er inkludert i prosjektet, noe som er viktig for:

- **Sikkerhet**: Identifisering av sårbare avhengigheter
- **Etterlevelse**: Oppfyllelse av regulatoriske krav
- **Lisenshåndtering**: Forståelse av lisensforpliktelser
- **Åpenhet**: Gi interessenter innsikt i prosjektets komponenter

### Automatisk generering

SBOM-en genereres automatisk når:

1. **Versjonsoppdateringer**: Når du kjører `npm version patch` eller `npm version minor`, regenererer `postversion`-hooken automatisk SBOM-en
2. **GitHub-utgivelser**: Når en versjons-tag (f.eks. `v1.12.0`) pushes til GitHub, genererer arbeidsflyten SBOM-en og laster den opp som byggartefakt. Den committer ingenting: en tag kan ikke få en ny commit, og `SBOM.md` fulgte allerede med `postversion`
3. **Manuell utløsning**: GitHub-arbeidsflyten kan utløses manuelt fra fanen «Actions». Kjørt fra en gren committer den også en endret SBOM til grenen

### Manuell generering

For å generere SBOM-en manuelt:

```bash
npm run generate-sbom
```

Dette vil:
- Lese `package.json` i roten og i hvert prosjekt i `rush.json`
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
3. Laster opp SBOM-en som byggartefaktet `sbom`
4. Bare ved manuell kjøring fra en gren: committer og pusher SBOM-en til grenen hvis avhengighetene er endret (tidsstempelet «Generated» alene teller ikke)

### Skriptdetaljer

Skriptet for SBOM-generering ligger i `.tasks/generate-sbom.js` og følger disse beste praksisene:

- **CycloneDX-inspirert format**: Basert på industristandarder
- **Fullstendig dekning**: Leser prosjektene fra `rush.json`, så et nytt prosjekt kommer med uten endring i skriptet
- **Lesbart format**: Generert som Markdown for enkel visning
- **Rik på metadata**: Inkluderer versjonsnumre og avhengighetsrelasjoner
- **Automatisert**: Integreres med eksisterende bygge- og versjoneringsprosesser

### Oppdatering av avhengigheter

Når du oppdaterer avhengigheter:

1. Oppdater de relevante `package.json`-filene
2. Kjør `npm run rush:update` i roten (aldri `npm install` i en løsning)
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
- `node common/scripts/install-run-rush-pnpm.js audit` - pnpms sikkerhetsskanner over hele Rush-lockfila (`--prod` for bare produksjonsavhengighetene). `npm audit` i roten ser bare rotens egne avhengigheter
- GitHub Dependabot - varsler om sårbare avhengigheter (de automatiske sikkerhetsoppdateringene er slått av i repoet)
- Snyk - Kontinuerlig sikkerhetsovervåking
- OWASP Dependency-Check - Sårbarhetsdeteksjon

`xlsx` (Excel-eksporten i `shared-library`) hentes fra SheetJS' egen CDN (`https://cdn.sheetjs.com/xlsx-<versjon>/xlsx-<versjon>.tgz`), ikke fra npm, så GitHubs avhengighetsgraf og Dependabot ser den ikke, og npm-registerets sikkerhetsmeldinger dekker bare versjonene som ligger der. Sjekk [SheetJS' sikkerhetsmeldinger](https://cdn.sheetjs.com/advisories/) ved hver utgivelse.
