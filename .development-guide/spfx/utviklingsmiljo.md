## Konfigurasjon av utviklingsmiljø

### Oppsett av miljøsystemet

Prosjektportalen 365 bruker et tilpasset miljøoppsett for å gjøre det enkelt å utvikle mot forskjellige SharePoint-miljøer. Systemet består av flere komponenter som samarbeider:

#### 1. `environments.json`

Denne filen definerer flere SharePoint-miljøer du kan utvikle mot. Hvert miljø angir:

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

#### 2. `.env`-filen

`.env`-filen inneholder konfigurasjonsvariabler for utviklingsmiljøet ditt:

```text
SERVE_ENVIRONMENT=Porteføljeoversikt
NODE_ENV=development
```

Den viktigste innstillingen er `SERVE_ENVIRONMENT`, som angir hvilket miljø fra `environments.json` som skal brukes når du kjører `npm run watch`. Dette lar deg raskt bytte mellom forskjellige SharePoint-miljøer ved å endre kun én verdi.

#### 3. Overvåkingsskript i `package.json`

Overvåkingsskriptene knytter alt sammen:

```json
"watch": "concurrently \"npm run serve\" \"livereload './dist/*.js' -e 'js' -w 250\"",
"prewatch": "node node_modules/pzl-spfx-tasks --pre-watch --loglevel silent",
"postwatch": "node node_modules/pzl-spfx-tasks --post-watch --loglevel silent",
```

- **prewatch**: Kjøres før hovedovervåkingsskriptet og bruker `pzl-spfx-tasks`-pakken til å:
  - Lese `SERVE_ENVIRONMENT` fra `.env`
  - Finne det samsvarende miljøet i `environments.json`
  - Forberede SPFx-konfigurasjonen basert på det valgte miljøet
  - Sette opp riktig `serve.json`-konfigurasjon
  - Konfigurere pakkeoptimalisering for utvikling

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
