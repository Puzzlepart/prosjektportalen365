## Versjonering

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
