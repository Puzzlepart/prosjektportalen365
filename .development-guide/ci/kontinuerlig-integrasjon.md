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
- `[packages-only]` for å bygge kun pakker (appkatalog), hopper over utrulling av maler. Brukes dersom du ikke har gjort noen endringer på .xml-filene i Templates.
- `[upgrade-all-sites-to-latest]` for å kjøre skriptet `UpgradeAllSitesToLatest.ps1` i CI-modus.

### Bygg og installer (dev)

[ci-releases](../../.github/workflows/ci-releases.yml) bygger en ny utgivelse ved _push_ til **releases/***.

Den kjører [Build-Release.ps1](../../Install/Build-Release.ps1) med parameteren `-CI`, deretter kjører den [Install.ps1](../../Install/Install.ps1) (også med `-CI`-parameter, denne gangen med en kryptert streng som består av brukernavnet og passordet, lagret i en GitHub-hemmelighet). URL-en å installere til er lagret i GitHub-hemmeligheten `CI_DEV_TARGET_URL`.

Med gjeldende tilnærming, uten hurtigbuffer (da den kjører `npm ci`), tar en full kjøring omtrent 25-35 minutter.

![image](./assets/ci.png)

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
