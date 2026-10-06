## Opprettelse av en ny versjon

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
- `sync-version` (`.tasks/automatic-versioning.js`) setter versjonen i `SharePointFramework/*/package.json`, i hver løsnings `config/package-solution.json` (som `x.y.z.0`) og i hver `src/**/manifest.json`.
- `generate-sbom` skriver `SBOM.md`; se [SBOM-generering](../ci/sbom.md).

`sync-version` hopper over mappene som begynner med punktum, og mappene utenfor `SharePointFramework/`. Sett versjonen for hånd i `SharePointFramework/.tasks/package.json`, `SharePointFramework/.eslint-config/package.json`, `SharePointFramework/.jest-config/package.json`, `Templates/package.json` og `e2e/package.json`. Se også [Versjonering](versjonering.md).

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
- Taggen starter `generate-sbom.yml`, som i dag feiler på steget «Push changes». `SBOM.md` er allerede oppdatert av `postversion`.

### 5. Neste versjon

- Opprett `releases/<neste>` og skriv branchnavnet inn i `on.push.branches` i `ci-releases.yml`, `ci-channel-test.yml` og `ci-build-debug.yml`, og der guiden nevner den gjeldende release-branchen: [Kom i gang](../kom-i-gang.md), [Kontinuerlig integrasjon](../ci/kontinuerlig-integrasjon.md) og [testing.md](../spfx/testing.md).
- Opprett milepælen for neste versjon om den mangler, og legg `## <neste> - TBA` øverst i `CHANGELOG.md`.

### Patch-versjoner

Patcher har ikke fulgt ett fast løp: 1.12.1 ble slått sammen til `main` fra `releases/1.13` (#1689), mens versjonscommitene for 1.13.1 ligger rett på `main`, uten release-PR. Hvilken branch en patch lages fra, avtales i teamet. Ellers gjelder stegene over med `npm version patch`, uten release notes-fil.
