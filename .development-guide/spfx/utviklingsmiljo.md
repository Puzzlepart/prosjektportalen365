## Konfigurasjon av utviklingsmiljø

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

- **watch**: Kjører utviklingsserveren (webpack-dev-server via Heft) med miljøkonfigurasjonen. Heft legger selv på feilsøkingsparametrene `debug`, `noredir` og `debugManifestsFile=https://localhost:4321/temp/build/manifests.js`, samt `loadSPFX`/`customActions` for utvidelser. Live-reload er innebygd, så `concurrently` og `livereload` er ikke lenger i bruk.

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

- **Terminal:** bruk PowerShell 7 (`pwsh`) eller Git Bash. Windows PowerShell 5.1 kan ikke `&&`, som flere kommandoer i guiden bruker, og stopper `npm.ps1` med standard kjørepolicy (`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` løser det). I `cmd.exe` er enkle anførselstegn ikke anførselstegn: bruk doble, for eksempel rundt mønsteret til `--test-path-ignore-patterns`.
- **Node:** nvm-windows leser ikke nødvendigvis `.nvmrc`. Installer og velg versjonen med navn: `nvm install 22.22.2` og `nvm use 22.22.2`.
- **Linjeskift:** `.gitattributes` sjekker ut all tekst med LF på alle maskiner, uansett `core.autocrlf`, så lint, tester og utgivelsespakken bygger fra de samme bytene som på macOS og i CI. Prettiers `endOfLine: auto` er et sikkerhetsnett for en fil en editor lagrer med CRLF. En klone fra før `.gitattributes` kom inn, sjekkes ut på nytt én gang, etter at endringene er committet eller lagt til side: `git rm -r --cached -q . && git reset --hard`.
- **Lange stier:** pnpm-lageret gir stier på over 250 tegn. Slå på lange stier i Windows (`LongPathsEnabled`) og i git (`git config --global core.longpaths true`), og klon til en kort sti, for eksempel `C:\src\pp365`.
- **Miljøvariabler:** `VAR=verdi kommando` virker bare i bash og zsh. I PowerShell: `$env:NODE_OPTIONS='--max-old-space-size=8192'`; i cmd: `set NODE_OPTIONS=--max-old-space-size=8192`. Der det finnes en `.env`-fil, er den veien som virker overalt (`SERVE_CHANNEL` i løsningens `.env`, `E2E_LOCAL_BUNDLE` i `e2e/.env`).
- **Kopiering:** `cp` virker i PowerShell, der den er et alias for `Copy-Item`, og i Git Bash, men ikke i `cmd.exe`.

