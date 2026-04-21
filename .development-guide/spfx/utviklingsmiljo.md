## Konfigurasjon av utviklingsmiljø

### Oppsett av miljøsystemet

Prosjektportalen 365 bruker et tilpasset miljøoppsett for å gjøre det enkelt å utvikle mot forskjellige SharePoint-miljøer. Systemet består av flere komponenter som samarbeider:

#### 1. `.env.template` og `.env`

En delt `.env.template`-fil finnes i `.tasks/`-mappen og definerer standardverdier for alle SPFx-pakker. Når du kjører `npm run watch` for første gang, oppretter `prewatch`-skriptet automatisk en `.env`-fil i pakken.

**Automatisk oppretting av `.env`:** Skriptet `.tasks/createEnvironmentFile.js` kjøres som en del av `prewatch`. Dersom `.env` ikke finnes, leses malen fra `.tasks/.env.template` og tilgjengelige bundlenavn hentes automatisk fra pakkens `config/config.json`. Resultatet skrives til `.env` med bundlenavnene som kommentarer.

`.env`-filen inneholder konfigurasjonsvariabler for utviklingsmiljøet ditt:

| Variabel | Beskrivelse | Standard |
|---|---|---|
| `SERVE_CHANNEL` | Hvilken kanal som brukes for `environments.json`-oppslag. Tilgjengelige kanaler: `main`, `test`, `i18n`. | `main` |
| `SERVE_BUNDLE_REGEX` | Regulært uttrykk for å filtrere hvilke bundler som bygges under `watch`. Sett til et bundlenavn for raskere bygging. | _(tom – alle bundler bygges)_ |
| `SERVE_ENVIRONMENT` | Navn på miljøet fra `environments.json` som skal brukes. | _(ikke satt)_ |

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
"watch": "concurrently \"npm run serve\" \"livereload './dist/*.js' -e 'js' -w 250\"",
"prewatch": "node ../.tasks/pre-watch.js",
"postwatch": "node ../.tasks/post-watch.js",
```

- **prewatch**: Kjøres før hovedovervåkingsskriptet via skript i `.tasks/`-mappen:
  - Oppretter `.env` fra mal (med bundlenavn fra `config/config.json`)
  - Oppretter `serve.json` fra `serve.sample.json`
  - Oppretter `.vscode/launch.json` fra konfigurasjon
  - Filtrerer bundler i `config/config.json` basert på `SERVE_BUNDLE_REGEX`
  - Håndterer kanalbytte for ikke-main-kanaler via `modifySolutionFiles`

- **watch**: Kjører utviklingsserveren med miljøkonfigurasjonen

- **postwatch**: Rydder opp i midlertidige filer og konfigurasjoner

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
