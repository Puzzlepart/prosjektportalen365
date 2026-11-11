## Installasjonskanaler

En installasjonskanal gir løsningene og komponentene egne ID-er, slik at flere installasjoner av _Prosjektportalen 365_ kan ligge side om side i én tenant. Kanalene ligger i `channels/`:

| Fil | Kanal |
|---|---|
| `main.json` | Utgivelsen. ID-ene er de som står i kildekoden. `ci-releases.yml` bygger med den (`-Channel main`) for å få kjørenummeret i versjonen |
| `test.json` | Testkanalen, som `ci-channel-test.yml` bygger og ruller ut til testtenanten |
| `kurs.json` | Bygges på `main` når commit-meldingen har `[build-kurs]` |
| `i18n.json` | Ingen arbeidsflyt bygger den; `Build-Release.ps1 -Channel i18n` eller `npm run build:i18n` i en løsning bygger den lokalt |

Hver fil gir hver SPFx-løsning egen `id`, `name` og `zippedPackage` (f.eks. `solution/pp-portfolio-web-parts-test.sppkg`) og hver komponent egen ID, oppslått på komponentens alias. Formatet står i `channels/$schema.json`.

### Hvor ID-ene byttes

SPFx-manifestene, porteføljemalen og site scriptene har `main`-ID-ene, og JSON-prosjektmalene bruker `{{ControlId_<alias>}}`. `Install/Build-Release.ps1 -Channel <kanal>` skriver kanalfila til `.current-channel-config.json` i roten og bytter ID-ene på fire steder:

- **SPFx-løsningene:** `config/package-solution.json` og hver `manifest.json` (`SharePointFramework/.tasks/modifySolutionFiles.js`). Webdelene får `hiddenFromToolbox` når kanalen har egne ID-er, så verktøykassen ikke viser dem to ganger; med `main` beholder de plassen sin i verktøykassen. Filene tilbakestilles etter pakkingen.
- **Porteføljemalen:** `npm run generate-pnp-templates` kopierer `Templates/Portfolio` til `.dist/Templates/Portfolio` og bytter `main`-ID-ene der.
- **Site scriptene:** `npm run generate-site-scripts` kopierer `SiteScripts/src` til `.dist/SiteScripts` og bytter ID-ene der.
- **JSON-prosjektmalene:** `{{ControlId_<alias>}}` fylles fra `.current-channel-config.json`, eller fra `channels/main.json` når den fila ikke finnes.

`Install.ps1` i pakken vet hvilken kanal den hører til. Den gir site designet og site scriptene kanalnavnet i tittelen, logger kanalen i `Installasjonslogg`, og `-Upgrade` stopper når huben er installert med en annen kanal eller et annet språk.

`Scripts/UpgradeAllSitesToLatest.ps1` i pakken leser kanalen fra `.current-channel-config.json` i pakkens rot, der `Build-Release.ps1 -Channel` legger den. Uten fila oppgraderer skriptet alle områdene med `main`-ID-ene, og sier det i loggen. Fila begynner med punktum, og `actions/upload-artifact` tar ikke med slike filer uten `include-hidden-files: true`. Før 5. november 2026 manglet den i alle pakkene fra CI, så oppgraderingen av alle områdene i testhuben la `main`-kanalens bunntekst ved siden av testkanalens. Steget for bunnteksten (`EnsureFooterExtension.ps1`) fjerner nå en annen kanals bunntekst bare når pakken har kanalfila.

Komponent-ID-er som står i TypeScript, byttes ikke. `PROJECT_SETUP_COMPONENT_ID` i `SharePointFramework/ProjectWebParts/src/components/ProjectInformation/projectSetupComponentId.ts` er `main`-ID-en til `ProjectSetup`, og `Kjør oppsettveiviser` og `Gjør om til overordnet prosjekt` legger den inn som handling på områder på alle språk. På en annen kanal enn `main` starter de derfor `main`-kanalens veiviser, eller ingen når `main` ikke er installert i tenanten.

### Bygge for en kanal

- Hele utgivelsespakken: `./Install/Build-Release.ps1 -Channel test` i PowerShell 7. `-Channel` tar navnet på en fil i `channels/`: `main`, `test`, `kurs` eller `i18n`. Pakken havner i `release/` med kanalnavnet bakerst; se [Bygge en ny utgivelse](../utgivelse/bygge-utgivelse.md).
- Én løsning: `npm run build:test` (eller `build:kurs`, `build:i18n`) i løsningen. Det lager bare den løsningens `.sppkg` og kjører ingen tester.
- I CI setter `ci-releases.yml`, `ci-channel-test.yml` og `ci-build-debug.yml` `PP365_BUILD_NUMBER` til kjørenummeret, og løsningen og funksjonene får versjonen `x.y.z.<kjørenummer>`. Andre bygg har `x.y.z.0`.

Avbrytes et kanalbygg, blir filene liggende. En gjenglemt `.current-channel-config.json` får lokale genereringer til å bruke kanalens ID-er: slett den. Tilbakestill løsningene med `node ../.tasks/modifySolutionFiles.js --revert --force` og `node ../.tasks/setBundleConfig.js --revert` i hver av dem. Commit aldri kanal-ID-er i manifestene.

### Ny komponent eller ny kanal

Skriptene i roten trenger rotens egne avhengigheter, så kjør `npm install` i roten først.

- **Ny SPFx-komponent:** `npm run generate-channel-config` uten kanalnavn oppdaterer `channels/main.json` fra manifestene. Kjør deretter `npm run generate-channel-config <kanal> /update` for `test`, `kurs` og `i18n`. Med `/update` beholdes ID-ene som finnes, og nye komponenter får nye.
- **Uten `/update`** lages alle ID-ene i kanalen på nytt, som for en ny kanal. Gjør aldri det for en kanal som er installert et sted.
- **Ny kanal:** `npm run generate-channel-config <kanal>` skriver `channels/<kanal>.json`. Kanalen må også inn i `ValidateSet` for `-Channel` i `Install/Build-Release.ps1`, og trenger et `build:<kanal>`-skript i løsningene om den skal bygges der.
- `channels/` er ikke med i stifiltrene til arbeidsflytene, så en push som bare endrer kanalfilene, ruller ikke ut noe.

Hvordan CI bruker testkanalen, står i [Kontinuerlig integrasjon](../ci/kontinuerlig-integrasjon.md).
