## Kontinuerlig integrasjon

Vi har satt opp kontinuerlig integrasjon (CI) ved hjelp av GitHub Actions.

### CI (releases/*)

[![CI (releases)](https://github.com/Puzzlepart/prosjektportalen365/actions/workflows/ci-releases.yml/badge.svg)](https://github.com/Puzzlepart/prosjektportalen365/actions/workflows/ci-releases.yml)

Nøkkelord kan brukes i commit-meldingen for å unngå (eller tvinge) at CI kjører noen av jobbene.

- `[skip-ci]` for å unngå at alle CI-prosesser starter. Unntak: `skills.yml`, som bare sjekker agentferdighetene og tar sekunder, og `build-release.yml` på `main`, som ikke leser taggen.
- `[skip-upgrade]` for å unngå at oppgraderingen starter, også pakkeoppgraderingen etter `[apps-only]`. Jobbene som følger den, hoppes da også over: «Installer», røyktestene og integrasjonstestene.
- `[fresh-install]` (bare `ci-releases.yml`) installerer et nytt hubområde, `<huben>_<commit>`, etter oppgraderingen, for å prøve en installasjon fra bunnen. Jobben kjørte før på hver push uten `[skip-install]`, og ingenting sletter områdene: 14. oktober 2026 lå det 354 slike på tenanten.
- `[skip-main-ci]` (bare `main`) hopper over utgivelsespakken og kurs-pakken i `build-release.yml`. Testkanalens pakke bygges likevel.
- `[skip-test-ci]` (bare `main`) hopper over testkanalens pakke i `build-release.yml`. Uten taggen bygges den også når hovedpakken hoppes over (`[skip-main-ci]`) eller feiler; jobbens `if:` er `!cancelled() && …` (til 2026-10-09 `always() || …`, som alltid var sant, så taggen virket ikke).
- `[build-kurs]` (bare `main`) bygger også kurs-kanalens pakke i `build-release.yml`.
- `[apps-only]` for å bygge kun pakker (appkatalog), hopper over utrulling av maler. Brukes bare når ingenting i `Templates/` er endret: også `.resx`-tekster, JSON-maler og innhold går bare ut med en full kjøring.
- `[apps-only:<løsninger>]` som `[apps-only]`, men pakker og ruller ut **kun de oppgitte SPFx-løsningene** (kommaseparert) i stedet for alle, f.eks. `[apps-only:ProjectWebParts,PortfolioWebParts]`. Navnene matches uten hensyn til store/små bokstaver og bindestrek (`portfoliowebparts` er `PortfolioWebParts`). Gyldige navn: `shared-library`, `PortfolioExtensions`, `PortfolioWebParts`, `ProgramWebParts`, `ProjectExtensions`, `ProjectWebParts`. Bygget er likevel en full `rush rebuild`. `shared-library` er bundlet inn i hver løsning som bruker den, og `ProjectWebParts` og `PortfolioWebParts` i løsningene som henter komponenter fra dem, så en endring der når sidene bare gjennom løsningene du lister. Å liste `shared-library` alene ruller ikke ut noe som sidene bruker.
- `[upgrade-all-sites-to-latest]` for å kjøre skriptet `UpgradeAllSitesToLatest.ps1` i CI-modus etter en full oppgradering (ikke etter `[apps-only]`, siden jobben trenger det fulle bygget). Skriptet logger inn med sertifikatet og gir seg derfor ikke eiertilgang til områdene, og en feil gjør jobben rød.
- `[skip-e2e]` for å hoppe over Playwright-røyktestene som kjører etter oppgraderingen av testkanalen, også etter en `[apps-only]`-oppgradering (se «Testregime»). `[skip-upgrade]` hopper over dem indirekte.
- `[skip-integration]` for å hoppe over integrasjonstestene i `integration/`, som kjører ved siden av røyktestene (se «Testregime»). `[skip-upgrade]` hopper over dem indirekte.
- `[build-debug]` for å bygge utgivelsespakken i feilsøkingsarbeidsflyten, uten utrulling (se «CI (build debug)»). Sammen med `[skip-ci]` i samme emnelinje bygger bare den.

Bare emnelinjen (første linje) i commit-meldingen leses, også på `main`, slik at punktene i en squash-merge ikke styrer jobbene. Til 14. oktober 2026 leste `build-release.yml` hele meldingen, så én `[skip-test-ci]` eller `[build-kurs]` i en hvilken som helst commit i en versjon slo inn. Legg taggen bakerst i emnelinjen i merge-dialogen.

### Bygg og installer (dev)

[ci-releases](../../.github/workflows/ci-releases.yml) kjører ved _push_ til `releases/1.15` som endrer noe under `SharePointFramework/`, `Install/` eller `Templates/`. Den bygger utgivelsespakken med [Build-Release.ps1](../../Install/Build-Release.ps1) `-CI -Channel main`, med kjørenummeret som fjerde ledd i versjonen slik testkanalen får det, og oppgraderer utviklingshuben `https://puzzlepart.sharepoint.com/sites/pp365` (variabelen `SP_URL`) med [Install.ps1](../../Install/Install.ps1) `-Upgrade`. Med `[fresh-install]` installerer den også et nytt område, `<huben>_<commit>`, for å prøve en ny installasjon. Kjøringene deler én `concurrency`-gruppe (`ci-releases`), så to push rett etter hverandre ikke oppgraderer huben samtidig. Innloggingen skjer som CI-appen «Prosjektportalen CI» (se under), fra hemmelighetene `CI_TENANT`, `CI_CLIENT_ID` og `CI_CERT_BASE64`.

En full kjøring tar rundt 40 minutter (bygg ~13, oppgradering ~28), og rundt 46 minutter til med `[fresh-install]`. Med `[apps-only]` bygges bare pakkene, og huben oppgraderes uten maler, på rundt 14 minutter.

### CI-appen «Prosjektportalen CI»

Jobbene som rører en tenant, logger inn som appregistreringen **Prosjektportalen CI** i Entra ID, app-only med et sertifikat. Den brukes av oppgraderingen og den nye installasjonen i `ci-releases.yml`, av oppgraderingene og `UpgradeAllSitesToLatest.ps1` i `ci-channel-test.yml` (`Install.ps1 -CI -Tenant … -CertificateBase64Encoded … -ClientId …`) og av integrasjonstestene i `integration/` (MSAL i Node). Playwright-testene bruker den ikke: de logger inn som e2e-brukeren (se «Testregime»).

| Hemmelighet | Innhold |
|---|---|
| `CI_CLIENT_ID` | Appens «Application (client) ID» |
| `CI_TENANT` | Tenanten appen logger inn i |
| `CI_CERT_BASE64` | Sertifikatet med privat nøkkel: en PFX uten passord, base64-kodet |

- Det er ikke flerleietaker-appen «Prosjektportalen» (`da6c31a6-b557-4ac3-9994-7315da06ea3a`), som `Install.ps1` bruker til interaktiv innlogging når `-ClientId` ikke er oppgitt. Gi aldri den appen rettigheter for CI: rettighetene på en flerleietaker-app blir bedt om fra alle kunder som godkjenner den.
- Rettighetene er applikasjonsrettigheter på SharePoint og må godkjennes av en administrator («Grant admin consent»); en rettighet som er lagt til uten godkjenning, virker ikke. `TermStore.Read.All` ble lagt til 2026-10-12 for integrasjonstestene, som leser termlageret: uten den svarer termlageret 403, og de testene hoppes over med den begrunnelsen. Resten står under «API permissions» på appen.
- App-only trimmes ingenting etter en brukers tilgang. Det en bruker bare får se med tilgang, prøves derfor av e2e-brukeren.
- Appen finnes i Entra admin center under App registrations. Hvilken app en kjøring brukte, viser Sign-in logs, fanen «Service principal sign-ins», ved kjøringens tidspunkt (ressursen «Office 365 SharePoint Online»).
- Sertifikatet har en utløpsdato, som står under «Certificates & secrets» på appen. Ved fornyelse lastes den offentlige delen opp der, og `CI_CERT_BASE64` byttes ut med den nye PFX-en i base64 i repoets hemmeligheter. Integrasjonstestene leser en PFX med tomt passord eller helt uten passord.

### CI (channels/test)

[ci-channel-test](../../.github/workflows/ci-channel-test.yml) bygger en pakke for kanalen [test](../../channels/test.json), distribuerer den til URL-en som er spesifisert i `SP_URL_TEST`, og kjører deretter Playwright-røyktestene i `e2e/` mot den (jobben «End-to-end smoke (test channel)») og, ved siden av dem, integrasjonstestene i `integration/` (jobben «Integration tests (test channel)», rapport i artefaktet `integration-report-test-channel`). Pakkejobben (`[apps-only]`) skriver tiden per prosjekt i jobbens sammendrag og installerer ikke PnP.PowerShell, som bare malene trenger. Rapporten lastes opp som artefaktet `playwright-report-test-channel`; hvordan den leses står under «Testregime». Arbeidsflyten kan også startes manuelt fra Actions-fanen.

Alle kjøringene oppgraderer den samme testhuben og appkatalogen, uansett branch, så de deler én `concurrency`-gruppe (`ci-channel-test`): en kjøring venter mens en annen kjører, i stedet for at to deployer samtidig og overskriver hverandres pakker. GitHub holder bare den nyeste ventende kjøringen i gruppen og avbryter en eldre som venter. På samme branch inneholder den nyeste commiten endringene fra den eldre, men malene fra en avbrutt full kjøring blir ikke lagt på. Push derfor commiten som trenger full kjøring sist, eller vent til den er ferdig.

### CI (build debug)

[ci-build-debug](../../.github/workflows/ci-build-debug.yml) bygger testkanalens utgivelsespakke slik pakkejobben i `ci-channel-test` gjør, men ruller den ikke ut og trenger ingen hemmeligheter. Den er til å prøve og måle endringer i selve bygget (nye brytere i `Build-Release.ps1`, oppsettet av Rush og Heft) før de levende arbeidsflytene tar dem i bruk. Den kjører ved _push_ når emnelinjen inneholder `[build-debug]`, med samme argumenter som pakkejobben i `ci-channel-test`: `-RushTimeline` (tiden per prosjekt skrives i loggen og i jobbens sammendrag) og `-SkipPnPPowerShell` (bare PnP-malene, som jobben hopper over, trenger modulen). En endring i bygget legges inn her først, som en ny bryter i `Build-Release.ps1`, og flyttes til de levende arbeidsflytene når den er bevist. Pakken og Rush-loggene lastes opp som `release-package-debug` og `rush-logs-debug`.

Den kjører også på hver pull request mot en release-branch (`releases/**`), uten tag og uten stifilter. Der er den bygget branch-beskyttelsen krever før merge, jobben «Build release package (pull request)»: full `rush rebuild` med Jest, dekningsgulvene og pakkebevisene, uten utrulling og uten hemmeligheter. En ny push til samme pull request avbryter bygget som kjører.

To ting å vite når du måler: løperne varierer mye (samme bygg har tatt 506 og 711 sekunder), så bare tider fra samme kjøring kan sammenlignes. Og `package-solution` lager ny GUID for «Client Side Assets»-funksjonen og nye relasjons-ID-er (`Id="r5"`) ved hver kjøring, så to `.sppkg` fra samme kode er bare like når disse er maskert. Et faseinndelt bygg (build og test som egne Rush-faser) er prøvd og var tregere på GitHubs firekjerners løpere; resultatet står i `docs/plans/dependency-upgrades-phase-5.md`, slice 1c.

### Bygg utgivelse (main)

[build-release](../../.github/workflows/build-release.yml) kjører ved _push_ til `main` som endrer noe under `SharePointFramework/`, `Install/` eller `Templates/`. Den bygger utgivelsespakken og testkanalens pakke, og kurs-pakken med `[build-kurs]`, og laster dem opp som artefaktene `release-package`, `release-package-test` og `release-package-kurs`. Den ruller ikke ut noe, og tar rundt 25 minutter. Hvordan pakkene brukes i en utgivelse, står i [Opprettelse av en ny versjon](../utgivelse/opprette-ny-versjon.md).

### Felles for arbeidsflytene

- **Tidsgrenser.** Hver jobb har `timeout-minutes`: bygg 45, full oppgradering 60, pakkeoppgradering 20, E2E 30, integrasjonstester 20 og `UpgradeAllSitesToLatest.ps1` 120. GitHubs standard er seks timer, og når kjøringene venter på hverandre (`concurrency`), holder en jobb som henger, alle senere like lenge.
- **Rettigheter.** `permissions: contents: read` for `GITHUB_TOKEN`; bare SBOM-jobben skriver, siden den committer `SBOM.md` ved manuell kjøring.
- **Rush-loggene** lastes opp som artefakt (`rush-logs-…`, 7 dager) når et bygg feiler. `Build-Release.ps1` skriver bare de siste 200 linjene i jobbloggen.
- **Hemmelighetene** sendes til skriptene som `$env:CI_CERT_BASE64`, `$env:CI_TENANT` og `$env:CI_CLIENT_ID`, som PowerShell leser når steget kjører. De skrives dermed aldri inn i stegets skript på runneren.
- **PnP.PowerShell** installeres i CI med `Install-ModuleWithRetry` fra `Install/Scripts/SharedFunctions.ps1`: tre forsøk med 30 sekunder imellom, siden runneren av og til ikke når PowerShell Gallery (kjøring 38522211703).
- **Versjoner av actions:** `actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-artifact@v7` og `actions/download-artifact@v8`, som alle kjører på Node 24.
- **Versjonsstempling:** `ci-releases.yml`, `ci-channel-test.yml` og `ci-build-debug.yml` setter `PP365_BUILD_NUMBER` (se [Installasjonskanaler](../maler/kanaler.md)).

### Aktive arbeidsflyter

GitHub kjører bare arbeidsflytfilene som ligger rett i `.github/workflows/`. Mappen `unused/` med `automatic_chores.yml`, `ci-channel-i18n.yml` og `pr-package-spfx-dev.yml` ble slettet 14. oktober 2026. Den påkrevde sjekken «Rush Install and Rebuild» i branch-beskyttelsen kom fra den siste og kunne aldri kjøre; branch-beskyttelsen skal kreve «Build release package (pull request)» i stedet. PR-jobben har et eget navn fordi en push til samme commit uten `[build-debug]` gir en hoppet-over jobb, og GitHub regner en hoppet-over jobb som bestått for en påkrevd sjekk. En hoppet-over jobb får det uevaluerte uttrykket i `name:` som navn (`github.event_name == 'pull_request' && …`), og listen over sjekker i branch-beskyttelsen viser den teksten også. Velg «Build release package (pull request)», som listen viser når en pull request har kjørt bygget den siste uka. Legg kravet i en regel for det eksakte navnet `releases/1.15`: den går foran jokertegnregelen `releases/1.1*`, og branchene til og med `releases/1.14` har ingen arbeidsflyt som kjører på pull requests.

| Arbeidsflytfil        | Beskrivelse                                                                  | Utløser                                                                                  |
| --------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `ci-releases.yml`     | Bygg og oppgrader utviklingsmiljøet; ny installasjon med `[fresh-install]`   | Push til `releases/1.15` (stier: SPFx, Install, Templates)                               |
| `ci-channel-test.yml` | Bygg og distribuer testkanalen, og kjør Playwright- og integrasjonstestene mot den | Push til `releases/1.15` og `feat/technical-backlog*` (stier: SPFx, Install, Templates, e2e, integration) |
| `ci-build-debug.yml`  | Bygg testkanalens pakke uten utrulling: for å prøve endringer i bygget, og som påkrevd bygg på pull requests | Push til `releases/1.15` eller en `feat/**`-branch med `[build-debug]` i emnelinjen, og hver pull request mot `releases/**` |
| `build-release.yml`   | Bygg utgivelsespakke og test/kurs-kanalpakker                                | Push til `main` (stier: SPFx, Install, Templates)                                        |
| `generate-sbom.yml`   | Generer SBOM.md som artefakt; committer den bare ved manuell kjøring fra en branch | Tag-push `v*` eller manuell utløsning                                              |
| `skills.yml`          | Sjekk at agentferdighetene bare ligger i `.claude/skills` (`npm run check-skills`) | Push og pull request som endrer `.claude/skills`, `.github/skills` eller `.agents/skills` |

Hvilke brancher en arbeidsflyt kjører på, leses fra arbeidsflytfilen i commiten som pushes. En branch kan derfor få CI ved å legge seg selv til i sin egen kopi av filen, slik fase 5 gjorde i `ci-channel-test.yml`.
