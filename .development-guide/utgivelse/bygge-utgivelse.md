## Bygge en ny utgivelse

`Install/Build-Release.ps1` bygger installasjonspakken. Det kjører en full `rush rebuild` med testene, pakker hver løsning som `.sppkg`, bygger PnP-malene og site scripts og legger alt sammen med installasjonsskriptene og PnP.PowerShell i `release/`. Skriptet trenger Node 22 og PowerShell 7 (`pwsh`), og stopper på en annen hovedversjon av Node.

Fra roten:

```bash
npm run build-release
```

Lokalt havner pakken i `release/pp365-<versjon>.<hash>/` og som zip-fil ved siden av, `release/pp365-<versjon>.<hash>.zip`. Med `-Channel` får navnet kanalen på slutten (`-test`).

```powershell
./Install/Build-Release.ps1 -Channel test                               # testkanalens pakke
./Install/Build-Release.ps1 -Solutions ProjectWebParts,PortfolioWebParts # pakk bare disse løsningene
```

| Parameter | Hva den gjør |
| --- | --- |
| `-Channel test\|kurs\|i18n` | Bytter inn kanalens løsnings- og komponent-ID-er fra `channels/<kanal>.json` før bygget (se [Installasjonskanaler](../maler/kanaler.md)). |
| `-Solutions <navn,...>` | Pakker bare de oppgitte løsningene. Bygget er likevel en full `rush rebuild`, så `shared-library` kommer med i løsningene som bundler den. Navnene matches uten hensyn til store bokstaver og bindestrek. |
| `-SkipBuildPnPTemplates` | Hopper over PnP-malene. |
| `-SkipPnPPowerShell` | Installerer, importerer og sjekker ikke PnP.PowerShell, som bare malene trenger. Krever `-SkipBuildPnPTemplates`. |
| `-SkipBundle` | Legger ikke PnP.PowerShell-modulen i pakken. |
| `-RushTimeline` | Skriver byggetiden per prosjekt i loggen (og i jobbens sammendrag i CI). |
| `-CI` | CI-modus: installerer PnP.PowerShell og legger pakken rett i `release/`, uten zip-fil. |
| `-Force` | Sletter `node_modules` i løsningene før bygget. |

Skriptet stopper på feil som `npm run build` slipper gjennom:

- løsnings- eller komponent-ID-er fra en annen kanal i kildekoden, for eksempel fra en `npm run watch` som ikke ble avsluttet før en commit (`npm run check-channel-ids` sjekker det samme alene)
- en dekningsgrense i en løsnings `config/jest.config.json` som ikke er nådd (Jest melder det, men Heft feiler ikke)
- en løsning som ikke fikk en ny `.sppkg`
- en `pp365-*`-pakke som er ekstern i en bundle i stedet for bundlet inn
- tredjeparts-CSS med hashede klassenavn

CI kjører det samme skriptet. `build-release.yml` på `main` lager utgivelsespakken og testkanalens pakke, og kanal-arbeidsflytene bygger testkanalen før de ruller den ut; se [Kontinuerlig integrasjon](../ci/kontinuerlig-integrasjon.md). Hvordan en versjon lages og publiseres, står i [Opprettelse av en ny versjon](opprette-ny-versjon.md).
