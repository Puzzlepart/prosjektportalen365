## Kom i gang med Prosjektportalen 365

Denne siden er en vei gjennom den første uka for nye utviklere. Den gjentar ikke resten av [utviklingsguiden](../README.md), som er den autoritative dokumentasjonen: er denne siden og resten av guiden uenige, gjelder de andre kapitlene, og denne siden bør rettes. Les seksjonene i rekkefølge og følg lenkene når du trenger detaljene.

### 1. Hva du jobber med

Prosjektportalen 365 er et prosjektstyringsverktøy for Microsoft 365, bygget av Puzzlepart (nå Crayon Consulting) og distribuert som åpen kildekode (MIT). Installasjonen setter opp et porteføljeområde (hub) med oversikt over prosjektene, og hvert prosjekt får et eget område (en Microsoft 365-gruppe) med lister, sider og logikk etter Prosjektveiviseren, Digitaliseringsdirektoratets prosjektmodell. Det finnes også et programnivå over prosjektene. Brukerne har en egen [brukermanual](https://puzzlepart.github.io/prosjektportalen-manual/).

Repoet er et Rush-monorepo (pnpm, Heft, SPFx 1.23.2):

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

Endrer du `shared-library` underveis: `rush rebuild -o pp365-shared-library`, så tar `watch` det med. Navngitte miljøer (`environments.json`, `SERVE_ENVIRONMENT`, `npm run watch -- --serve-config <navn>`) står i samme kapittel.

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
- **Kjør** `npm test` i en løsning (bygger først). Én fil: `npx heft test --test-path-ignore-patterns '^(?!.*Header\.test\.)'` (i cmd.exe med doble anførselstegn); `--test-path-pattern` blir oversett. `shared-library` må være bygget først.
- **Komponenttester** bruker React Testing Library og `jest.mock` av hooken eller dataadapteren, og `jest.mock(...)` må stå over importene. Importer aldri `@pnp/*` i en test; harnessen `pp365-jest-config` stubber den.
- **Dekningsgulv:** hver løsnings `config/jest.config.json` har `coverageThreshold`. Lokalt melder Jest bare et gulv som ikke nås, mens utgivelsesbygget i CI stopper på det: se på dekningen før du pusher. Gulvene skal bare opp: løft dem når du legger til tester, senk dem aldri.
- **Playwright (`e2e/`):** røyktester (`tests/smoke`) og brukerreiser (`tests/flows`; fire av dem skriver til testtenanten og rydder etter seg) mot testtenanten. De kjører i CI etter hver utrulling til testkanalen (`ci-channel-test.yml`), og rapporten lastes opp som artefaktet `playwright-report-test-channel`. Lokalt i `e2e/`: `cp .env.example .env`, fyll inn, `npx playwright install chromium` og `npm test`.
- Den som åpner en PR, retter tester som feiler på grunn av den. Slett aldri en påstand bare for å få grønt.

### 6. Fra endring til merge

Se [branching og arbeidsflyt](git/branching-og-arbeidsflyt.md), [commit-praksis](git/commit-praksis.md) og [kontinuerlig integrasjon](ci/kontinuerlig-integrasjon.md).

1. **Branch.** `main` er siste utgivelse. Utviklingen skjer på release-branchen for neste minor, `releases/x.y` (nå `releases/1.15`). Lag din branch derfra: `issues/<nr>` for et issue, `feat/<navn>` for større arbeid.
2. **Commit** på engelsk, semantisk: `<type>(<scope>): <subject>`, f.eks. `fix(projectwebparts): resolve timeline rendering issue`. Typene er `feat`, `fix`, `docs`, `style`, `refactor`, `chore`, `ci` og `install`.
3. **CI-tagger i emnelinjen.** Bare første linje leses, også i en squash-merge:
   - `[skip-ci]`: ingen bygg eller utrulling, f.eks. for dokumentasjon.
   - `[apps-only]`: bare SPFx-pakkene, ikke malene; bruk det når `Templates/` er urørt.
   - `[apps-only:X]`: bare de oppgitte løsningene, f.eks. `[apps-only:ProjectWebParts,shared-library]`.
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
