## Kontinuerlig integrasjon

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
- `[apps-only:<løsninger>]` som `[apps-only]`, men bygger og ruller ut **kun de oppgitte SPFx-løsningene** (komma-separert) i stedet for alle. Navnene matches uten hensyn til store/små bokstaver og bindestrek, f.eks. `ApplyUpgradeTemplate` eller `[apps-only:PortfolioExtensions,shared-library]`. Gyldige navn: `shared-library`, `PortfolioExtensions`, `PortfolioWebParts`, `ProgramWebParts`, `ProjectExtensions`, `ProjectWebParts`.
- `[upgrade-all-sites-to-latest]` for å kjøre skriptet `UpgradeAllSitesToLatest.ps1` i CI-modus.
- `[skip-e2e]` for å hoppe over Playwright-røyktestene som kjører etter oppgraderingen av testkanalen, også etter en `[apps-only]`-oppgradering (se «Testregime»). `[skip-upgrade]` hopper over dem indirekte.
- `[build-debug]` for å bygge utgivelsespakken i feilsøkingsarbeidsflyten, uten utrulling (se «CI (build debug)»). Sammen med `[skip-ci]` i samme emnelinje bygger bare den.

Bare emnelinjen (første linje) i commit-meldingen leses, slik at punktene i en squash-merge ikke styrer jobbene.

### Bygg og installer (dev)

[ci-releases](../../.github/workflows/ci-releases.yml) bygger en ny utgivelse ved _push_ til **releases/***.

Den kjører [Build-Release.ps1](../../Install/Build-Release.ps1) med parameteren `-CI`, deretter kjører den [Install.ps1](../../Install/Install.ps1) (også med `-CI`-parameter, denne gangen med en kryptert streng som består av brukernavnet og passordet, lagret i en GitHub-hemmelighet). URL-en å installere til er lagret i GitHub-hemmeligheten `CI_DEV_TARGET_URL`.

Med gjeldende tilnærming, uten hurtigbuffer (da den kjører `npm ci`), tar en full kjøring omtrent 25-35 minutter.

![image](./development-guide/assets/ci.png)

### CI (channels/test)

[ci-channel-test](../../.github/workflows/ci-channel-test.yml) bygger en pakke for kanalen [test](../../channels/test.json), distribuerer den til URL-en som er spesifisert i `SP_URL_TEST`, og kjører deretter Playwright-røyktestene i `e2e/` mot den (jobben «End-to-end smoke (test channel)»). Pakkejobben (`[apps-only]`) skriver tiden per prosjekt i jobbens sammendrag og installerer ikke PnP.PowerShell, som bare malene trenger. Rapporten lastes opp som artefaktet `playwright-report-test-channel`; hvordan den leses står under «Testregime». Arbeidsflyten kan også startes manuelt fra Actions-fanen.

### CI (build debug)

[ci-build-debug](../../.github/workflows/ci-build-debug.yml) bygger testkanalens utgivelsespakke slik pakkejobben i `ci-channel-test` gjør, men ruller den ikke ut og trenger ingen hemmeligheter. Den er til å prøve og måle endringer i selve bygget (nye brytere i `Build-Release.ps1`, oppsettet av Rush og Heft) før de levende arbeidsflytene tar dem i bruk. Den kjører ved _push_ når emnelinjen inneholder `[build-debug]`, med samme argumenter som pakkejobben i `ci-channel-test`: `-RushTimeline` (tiden per prosjekt skrives i loggen og i jobbens sammendrag) og `-SkipPnPPowerShell` (bare PnP-malene, som jobben hopper over, trenger modulen). En endring i bygget legges inn her først, som en ny bryter i `Build-Release.ps1`, og flyttes til de levende arbeidsflytene når den er bevist. Pakken og Rush-loggene lastes opp som `release-package-debug` og `rush-logs-debug`.

To ting å vite når du måler: løperne varierer mye (samme bygg har tatt 506 og 711 sekunder), så bare tider fra samme kjøring kan sammenlignes. Og `package-solution` lager ny GUID for «Client Side Assets»-funksjonen og nye relasjons-ID-er (`Id="r5"`) ved hver kjøring, så to `.sppkg` fra samme kode er bare like når disse er maskert. Et faseinndelt bygg (build og test som egne Rush-faser) er prøvd og var tregere på GitHubs firekjerners løpere; resultatet står i `docs/plans/dependency-upgrades-phase-5.md`, slice 1c.

### Bygg utgivelse (main)

[build-release](../../.github/workflows/build-release.yml) bygger en ny utgivelsespakke ved **push** til **main**.

### Aktive arbeidsflyter

| Arbeidsflytfil            | Beskrivelse                                      | Utløser                                           |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| `ci-releases.yml`         | Bygg, oppgrader og installer til utviklingsmiljø | Push til `main` (stier: SPFx, Install, Templates) |
| `build-release.yml`       | Bygg utgivelsespakke + test/kurs-kanalpakker     | Push til `main`                                   |
| `ci-channel-test.yml`     | Bygg og distribuer testkanal                     | Push til releases-branch                          |
| `ci-build-debug.yml`      | Bygg testkanalens pakke uten utrulling (måling)  | Push med `[build-debug]` i emnelinjen             |
| `ci-channel-i18n.yml`     | Bygg og distribuer i18n (engelsk) kanal          | Push til `main` (krever `i18n:` i commit)         |
| `pr-package-spfx-dev.yml` | Rush install, lint og rebuild ved pull requests  | PR mot release-branches                           |
| `automatic_chores.yml`    | Automatisk linting og commit av rettelser        | Push til releases-branch                          |
| `generate-sbom.yml`       | Generer og commit SBOM.md                        | Tag-push `v*` eller manuell utløsning             |
