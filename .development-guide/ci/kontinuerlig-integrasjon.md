## Kontinuerlig integrasjon

Vi har satt opp kontinuerlig integrasjon (CI) ved hjelp av GitHub Actions.

### CI (releases/*)

[![CI (releases)](https://github.com/Puzzlepart/prosjektportalen365/actions/workflows/ci-releases.yml/badge.svg)](https://github.com/Puzzlepart/prosjektportalen365/actions/workflows/ci-releases.yml)

Nøkkelord kan brukes i commit-meldingen for å unngå (eller tvinge) at CI kjører noen av jobbene.

- `[skip-ci]` for å unngå at alle CI-prosesser starter. Unntak: `skills.yml`, som bare sjekker agentferdighetene og tar sekunder, og `build-release.yml` på `main`, som ikke leser taggen.
- `[skip-upgrade]` for å unngå at jobben «Oppgrader» starter. Dette vil også hoppe over jobben «Installer» da den er avhengig av «Oppgrader».
- `[skip-install]` for å unngå at jobben «Installer» starter.
- `[skip-main-ci]` (bare `main`) hopper over utgivelsespakken og kurs-pakken i `build-release.yml`. Testkanalens pakke bygges likevel.
- `[skip-test-ci]` (bare `main`) skulle hoppet over testkanalens pakke i `build-release.yml`, men virker ikke i dag: jobbens `if:` begynner med `always()`, så betingelsen er alltid sann.
- `[build-kurs]` (bare `main`) bygger også kurs-kanalens pakke i `build-release.yml`.
- `[apps-only]` for å bygge kun pakker (appkatalog), hopper over utrulling av maler. Brukes bare når ingenting i `Templates/` er endret: også `.resx`-tekster, JSON-maler og innhold går bare ut med en full kjøring.
- `[apps-only:<løsninger>]` som `[apps-only]`, men pakker og ruller ut **kun de oppgitte SPFx-løsningene** (kommaseparert) i stedet for alle, f.eks. `[apps-only:ProjectWebParts,PortfolioWebParts]`. Navnene matches uten hensyn til store/små bokstaver og bindestrek (`portfoliowebparts` er `PortfolioWebParts`). Gyldige navn: `shared-library`, `PortfolioExtensions`, `PortfolioWebParts`, `ProgramWebParts`, `ProjectExtensions`, `ProjectWebParts`. Bygget er likevel en full `rush rebuild`. `shared-library` er bundlet inn i hver løsning som bruker den, og `ProjectWebParts` og `PortfolioWebParts` i løsningene som henter komponenter fra dem, så en endring der når sidene bare gjennom løsningene du lister. Å liste `shared-library` alene ruller ikke ut noe som sidene bruker.
- `[upgrade-all-sites-to-latest]` for å kjøre skriptet `UpgradeAllSitesToLatest.ps1` i CI-modus.
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
