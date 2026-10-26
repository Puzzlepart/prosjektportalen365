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

[ci-channel-test](../../.github/workflows/ci-channel-test.yml) bygger en pakke for kanalen [test](../../channels/test.json), distribuerer den til URL-en som er spesifisert i `SP_URL_TEST`, og kjører deretter Playwright-røyktestene i `e2e/` mot den (jobben «End-to-end smoke (test channel)») og, ved siden av dem, integrasjonstestene i `integration/` (jobben «Integration tests (test channel)», rapport i artefaktet `integration-report-test-channel`). Pakkejobben (`[apps-only]`) skriver tiden per prosjekt i jobbens sammendrag og installerer ikke PnP.PowerShell, som bare malene trenger. Rapporten lastes opp som artefaktet `playwright-report-test-channel`, uten sporingene og uten innloggingens egne resultater; hvordan den leses står under «Testregime». Siste steg i begge testjobbene, «Publish the report to the test report site», legger rapporten på testrapportsiden (se under) og lenken i jobbens sammendrag. Arbeidsflyten kan også startes manuelt for en gren med `gh workflow run ci-channel-test.yml --ref <gren>`. Actions-fanen viser knappen først når `main`s kopi har utløseren, altså fra 1.15.0.

Alle kjøringene oppgraderer den samme testhuben og appkatalogen, uansett branch, så de deler én `concurrency`-gruppe (`ci-channel-test`): en kjøring venter mens en annen kjører, i stedet for at to deployer samtidig og overskriver hverandres pakker. GitHub holder bare den nyeste ventende kjøringen i gruppen og avbryter en eldre som venter. På samme branch inneholder den nyeste commiten endringene fra den eldre, men malene fra en avbrutt full kjøring blir ikke lagt på. Push derfor commiten som trenger full kjøring sist, eller vent til den er ferdig.

### Testrapportsiden

Testrapportsiden viser Playwright-rapporten og integrasjonsrapporten fra hver kjøring av `ci-channel-test.yml` i nettleseren, så ingen trenger å laste ned et artefakt eller kjøre `show-report`. Det er et privat GitHub Pages-område på branchen `gh-pages` i et eget, privat repo (variabelen `TEST_REPORTS_REPOSITORY`, for eksempel `Puzzlepart/prosjektportalen365-test-reports`). Adressen er tilfeldig, `https://<ord>.pages.github.io/`, og endres ikke så lenge Pages er slått på. Lenken står i jobbens sammendrag. Forsiden lister kjøringene de siste 7 dagene, nyeste først; hvordan rapportene leses, står i «Testregime».

**Hvorfor privat, og hvorfor i et annet repo.** `Puzzlepart/prosjektportalen365` er offentlig: artefaktene kan lastes ned av alle som er logget inn på GitHub, og et Pages-område fra repoet ville vært offentlig. Rapportene inneholder snapshot av sider i testtenanten, og Playwrights sporinger inneholder e2e-brukerens øktinformasjonskapsler, `storageState` og forespørselshodene; Playwright 1.63 maskerer ingenting (sjekket 2026-10-14). Pages med tilgangskontroll finnes bare for private og interne repoer på GitHub Enterprise Cloud. Puzzlepart-organisasjonen er på Enterprise Cloud (ikke EMU), med `members_can_create_private_pages=true`. Uten EMU er et Pages-område offentlig som standard, også fra et privat repo, så synligheten må settes til privat med en gang Pages er slått på, før CI publiserer noe. Området kan åpnes av alle med lesetilgang til rapportrepoet. Organisasjonens basisrettighet er skriv, så det er alle organisasjonens 40 medlemmer (14. oktober 2026): de samme som allerede har skrivetilgang til det offentlige repoet og gjennom en arbeidsflyt kunne lest hemmelighetene der.

**Slik virker det.** Siste steg i E2E-jobben og i integrasjonsjobben, «Publish the report to the test report site» (`if: !cancelled()`, `continue-on-error: true`, `timeout-minutes: 10`), kjører `.tasks/publish-test-report.js` (CommonJS, uten avhengigheter):

1. Sjekker at området er privat, og publiserer ingenting ellers: rapportrepoet er ikke offentlig (jobbens `GITHUB_TOKEN` ser ingen andre private repoer, så API-et svarer 404), repoets offentlige Pages-adresse (`https://puzzlepart.github.io/<repo>/`) viser ingenting uten innlogging (hos et privat område sender den videre til områdets egen adresse og derfra til innloggingen på GitHub, en side som svarer 200, så det er hvor videresendingene ender som avgjør), og `TEST_REPORTS_URL` svarer ikke på en anonym forespørsel med innhold (et privat område sender videre til innloggingen på GitHub). Sjekken kjøres ved hver publisering, fordi alle administratorer av rapportrepoet kan sette synligheten tilbake til offentlig. 14. oktober 2026 var alle private Puzzlepart-repoer med Pages offentlige.
2. Henter `gh-pages` i rapportrepoet over SSH med deploy-nøkkelen. GitHubs vertsnøkler leses fra `https://api.github.com/meta`, så den første tilkoblingen sjekkes i stedet for å stoles på.
3. Kopierer rapporten til `runs/<kjørings-id>-<forsøk>/<suite>/`: `e2e/playwright-report` for `e2e` og `integration/test-results` for `integration`. Ved siden av skrives `runs/<kjørings-id>-<forsøk>/<suite>.json` med utfallet av teststeget, antallene (fra Playwrights `test-results/results.json` og fra sammendraget integrasjonsrapporten bygger inn), kjøringen, commiten, branchen, emnelinjen og `publishedAt`. Et nytt forsøk av en kjøring får dermed en egen rad.
4. Sletter kjøringer eldre enn 7 dager, like lenge som artefaktene (organisasjonen holder artefakter og logger i høyst 7 dager), og deretter de eldste kjøringene så lenge kjøringene til sammen er over 800 MB, siden Pages publiserer høyst 1 GB. Kjøringen som publiseres, slettes aldri. En fil over 95 MiB utelates med en advarsel, siden git avviser filer over 100 MiB.
5. Skriver `.nojekyll`, så Pages publiserer filene som de er, uten Jekyll, og `index.html`, forsiden (på engelsk): kjøring, commit og en kolonne for E2E og en for integrasjon med utfall, antall og lenke.
6. Pusher én commit uten foreldre med `--force-with-lease`, så branchen aldri samler historikk med gamle rapporter. E2E- og integrasjonsjobben kjører samtidig og pusher begge. Pushen lykkes bare om branchen står der den sto da den ble hentet; en push som taper fordi den andre jobben kom først, begynner på nytt fra steg 2, opptil fem forsøk. Et git-kall som henger, avbrytes etter 5 minutter, og SSH-tilkoblingen har egne tidsgrenser.

Til slutt skriver skriptet lenken til rapporten og til forsiden i jobbens sammendrag (`$GITHUB_STEP_SUMMARY`). Pages publiserer endringen et minutt eller to etter steget, med arbeidsflyten `pages-build-deployment` i rapportrepoet. En feil i publiseringen, også et offentlig område eller et steg som når tidsgrensen, gjør ikke jobben rød, men vises som en advarsel: jobbens resultat er testenes. Skriptets tester ligger i `.tasks/publish-test-report.test.js` og kjører mot et lokalt bart repo (`TEST_REPORTS_REMOTE`) med `npm run test:tasks`, som CI ikke kjører: kjør dem selv etter en endring i skriptet.

| Navn | Type | Innhold |
|---|---|---|
| `TEST_REPORTS_DEPLOY_KEY` | hemmelighet | Den private delen av en SSH-deploy-nøkkel med skrivetilgang til rapportrepoet |
| `TEST_REPORTS_REPOSITORY` | variabel | Rapportrepoet, `eier/navn` |
| `TEST_REPORTS_URL` | variabel | Områdets adresse, for lenkene i jobbens sammendrag og sjekken av at området er privat |

Uten `TEST_REPORTS_REPOSITORY`, `TEST_REPORTS_URL` eller `TEST_REPORTS_DEPLOY_KEY` skriver steget bare en `::notice` om at testrapportsiden ikke er satt opp, og avslutter med 0, så CI virker før området finnes. Rapportene ligger da bare i artefaktene.

Området ble satt opp 26. oktober 2026 etter stegene under: rapportrepoet er `Puzzlepart/prosjektportalen365-test-reports`, og adressen står i variabelen `TEST_REPORTS_URL`.

**Engangsoppsett.** En med administratortilgang i organisasjonen gjør det én gang, i denne rekkefølgen. CI oppretter ingenting selv.

> **Viktig:** Pages er offentlig som standard, også fra et privat repo. Gjør området privat (steg 3) før hemmeligheten og variablene settes (steg 4 og 5): fra da publiserer hver kjøring rapportene, med sporingene.

1. Opprett et privat repo bare for rapportene, uten hemmeligheter og uten issues:

   ```bash
   gh repo create Puzzlepart/prosjektportalen365-test-reports --private --add-readme --description "CI test reports for prosjektportalen365 (private GitHub Pages)"
   ```

2. Lag branchen `gh-pages` fra `main`:

   ```bash
   gh api repos/Puzzlepart/prosjektportalen365-test-reports/git/refs -f ref=refs/heads/gh-pages -f sha=$(gh api repos/Puzzlepart/prosjektportalen365-test-reports/git/ref/heads/main --jq .object.sha)
   ```

3. Slå på Pages fra den branchen, og gjør området privat med en gang:

   ```bash
   gh api -X POST repos/Puzzlepart/prosjektportalen365-test-reports/pages -f 'source[branch]=gh-pages' -f 'source[path]=/'
   ```

   ```bash
   gh api -X PUT repos/Puzzlepart/prosjektportalen365-test-reports/pages -F public=false
   ```

   Det samme i nettleseren: Settings > Pages, Source «Deploy from a branch», `gh-pages`, `/ (root)`, og «GitHub Pages visibility» Private. Sjekk i et privat nettleservindu at adressen ber om innlogging på GitHub. Adressen er tilfeldig:

   ```bash
   gh api repos/Puzzlepart/prosjektportalen365-test-reports/pages --jq .html_url
   ```

   Actions må være slått på i rapportrepoet, fordi Pages bygger området med arbeidsflyten `pages-build-deployment` der.

4. Lag deploy-nøkkelen, legg den offentlige delen i rapportrepoet med skrivetilgang og den private som hemmelighet i dette repoet, og slett begge filene etterpå:

   ```bash
   ssh-keygen -t ed25519 -N "" -C "prosjektportalen365 CI test reports" -f pp365-test-reports
   ```

   ```bash
   gh repo deploy-key add pp365-test-reports.pub --repo Puzzlepart/prosjektportalen365-test-reports --allow-write --title "prosjektportalen365 CI"
   ```

   ```bash
   gh secret set TEST_REPORTS_DEPLOY_KEY --repo Puzzlepart/prosjektportalen365 < pp365-test-reports
   ```

   ```bash
   rm pp365-test-reports pp365-test-reports.pub
   ```

5. Sett variablene, med adressen fra steg 3:

   ```bash
   gh variable set TEST_REPORTS_REPOSITORY --repo Puzzlepart/prosjektportalen365 --body Puzzlepart/prosjektportalen365-test-reports
   ```

   ```bash
   gh variable set TEST_REPORTS_URL --repo Puzzlepart/prosjektportalen365 --body https://<ord>.pages.github.io/
   ```

Neste kjøring av `ci-channel-test.yml` publiserer. Valgfri herding: et regelsett (ruleset) i rapportrepoet som beskytter `main` mot deploy-nøkkelen, som ellers kan pushe til alle brancher der. Sett aldri Pages-synligheten tilbake til offentlig.

### CI (build debug)

[ci-build-debug](../../.github/workflows/ci-build-debug.yml) bygger testkanalens utgivelsespakke slik pakkejobben i `ci-channel-test` gjør, men ruller den ikke ut og trenger ingen hemmeligheter. Den er til å prøve og måle endringer i selve bygget (nye brytere i `Build-Release.ps1`, oppsettet av Rush og Heft) før de levende arbeidsflytene tar dem i bruk. Den kjører ved _push_ når emnelinjen inneholder `[build-debug]`, med samme argumenter som pakkejobben i `ci-channel-test`: `-RushTimeline` (tiden per prosjekt skrives i loggen og i jobbens sammendrag) og `-SkipPnPPowerShell` (bare PnP-malene, som jobben hopper over, trenger modulen). En endring i bygget legges inn her først, som en ny bryter i `Build-Release.ps1`, og flyttes til de levende arbeidsflytene når den er bevist. Pakken og Rush-loggene lastes opp som `release-package-debug` og `rush-logs-debug`.

Den kjører også på hver pull request mot en release-branch (`releases/**`), uten tag og uten stifilter. Der er den bygget branch-beskyttelsen krever før merge, jobben «Build release package (pull request)»: full `rush rebuild` med Jest, dekningsgulvene og pakkebevisene, uten utrulling og uten hemmeligheter. En ny push til samme pull request avbryter bygget som kjører.

To ting å vite når du måler: løperne varierer mye (samme bygg har tatt 506 og 711 sekunder), så bare tider fra samme kjøring kan sammenlignes. Og `package-solution` lager ny GUID for «Client Side Assets»-funksjonen og nye relasjons-ID-er (`Id="r5"`) ved hver kjøring, så to `.sppkg` fra samme kode er bare like når disse er maskert. Et faseinndelt bygg (build og test som egne Rush-faser) er prøvd og var tregere på GitHubs firekjerners løpere; resultatet står i `docs/plans/dependency-upgrades-phase-5.md`, slice 1c.

### Bygg utgivelse (main)

[build-release](../../.github/workflows/build-release.yml) kjører ved _push_ til `main` som endrer noe under `SharePointFramework/`, `Install/` eller `Templates/`. Den bygger utgivelsespakken og testkanalens pakke, og kurs-pakken med `[build-kurs]`, og laster dem opp som artefaktene `release-package`, `release-package-test` og `release-package-kurs`. Den ruller ikke ut noe, og tar rundt 25 minutter. Hvordan pakkene brukes i en utgivelse, står i [Opprettelse av en ny versjon](../utgivelse/opprette-ny-versjon.md).

### Felles for arbeidsflytene

- **Tidsgrenser.** Hver jobb har `timeout-minutes`: bygg 45, full oppgradering 60, pakkeoppgradering 20, E2E 30, integrasjonstester 20 og `UpgradeAllSitesToLatest.ps1` 120. Publiseringsstegene til testrapportsiden har sin egen grense på 10 minutter, så et steg som henger, ikke tar testjobben med seg. GitHubs standard er seks timer, og når kjøringene venter på hverandre (`concurrency`), holder en jobb som henger, alle senere like lenge.
- **Rettigheter.** `permissions: contents: read` for `GITHUB_TOKEN`; bare SBOM-jobben skriver, siden den committer `SBOM.md` ved manuell kjøring. Publiseringsstegene i `ci-channel-test.yml` pusher til et annet repo, rapportrepoet bak testrapportsiden, med deploy-nøkkelen `TEST_REPORTS_DEPLOY_KEY` over SSH, ikke med `GITHUB_TOKEN`.
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
| `ci-channel-test.yml` | Bygg og distribuer testkanalen, og kjør Playwright- og integrasjonstestene mot den | Push til `releases/1.15` (stier: SPFx, Install, Templates, e2e, integration, `.tasks/publish-test-report.js` og arbeidsflytfilen) |
| `ci-build-debug.yml`  | Bygg testkanalens pakke uten utrulling: for å prøve endringer i bygget, og som påkrevd bygg på pull requests | Push til `releases/1.15` eller en `feat/**`-branch med `[build-debug]` i emnelinjen, og hver pull request mot `releases/**` |
| `build-release.yml`   | Bygg utgivelsespakke og test/kurs-kanalpakker                                | Push til `main` (stier: SPFx, Install, Templates)                                        |
| `generate-sbom.yml`   | Generer SBOM.md som artefakt; committer den bare ved manuell kjøring fra en branch | Tag-push `v*` eller manuell utløsning                                              |
| `skills.yml`          | Sjekk at agentferdighetene bare ligger i `.claude/skills` (`npm run check-skills`) | Push og pull request som endrer `.claude/skills`, `.github/skills` eller `.agents/skills` |

Hvilke brancher en arbeidsflyt kjører på, leses fra arbeidsflytfilen i commiten som pushes. En branch kan derfor få CI ved å legge seg selv til i sin egen kopi av filen, slik fase 5 gjorde i `ci-channel-test.yml`.
