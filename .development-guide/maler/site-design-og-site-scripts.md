## Site design og site scripts

Kildene til site scriptene ligger i `SiteScripts/src`, én JSON-fil med endelsen `.txt` per script:

| Fil | Gjør |
|---|---|
| `001000 - Regionale innstillinger.txt` | Setter de regionale innstillingene (`setRegionalSettings`): `locale` 1044 (norsk), `timeZone` 4 og 24-timersklokke |
| `002000 - Setup extension.txt` | Knytter oppsettveiviseren (`ProjectSetup`-utvidelsen i `ProjectExtensions`) til området, med standardverdier for `termSetIds` (`GtProjectPhase` og `GtResourceRole`); se [Prosjektmaler (JSON)](js-provisjoneringsmal.md) |

### Slik installeres de

- `Install/Build-Release.ps1` kopierer `*.txt` til `SiteScripts/` i utgivelsespakken. Et kanalbygg kopierer i stedet kopiene `npm run generate-site-scripts` lager i `.dist/SiteScripts`, med kanalens komponent-ID-er; se [Installasjonskanaler](kanaler.md).
- `Install/Install.ps1` oppretter eller oppdaterer ett site script per fil. Tittelen er filnavnet uten de ni første tegnene (`001000 - `), og for en annen kanal enn `main` med ` - <kanal>` bakerst.
- Scriptene samles i site designet `Prosjektområde` (`Project Site` ved `-Language English`, med ` [<kanal>]` bakerst for en annen kanal enn `main`), og det blir hubens standard site design (`Set-PnPHubSite -SiteDesignId`). SharePoint kjører det på områder som knyttes til huben.
- Steget kjører både ved ny installasjon og ved `-Upgrade`, også med `-SkipTemplate` (`[apps-only]`). `-SkipSiteDesign` hopper over scriptene og designet, og `-SkipDefaultSiteDesignAssociation` over koblingen til huben.
- De samme filene brukes for begge språk, så også en engelsk installasjon får de regionale innstillingene over.

### Endringer

- Et endret site script når bare områder som knyttes til huben etterpå. For å kjøre designet på ett eksisterende område: `Invoke-PnPSiteDesign`, som vist i [`SiteScripts/src/README.md`](../../SiteScripts/src/README.md).
- `SiteScripts/` er ikke med i stifiltrene til arbeidsflytene i `.github/workflows/`. En push som bare endrer site scripts, ruller derfor ikke ut noe; endringen går ut med neste bygg som kjører.
- Komponent-ID-er i scriptene skrives med `main`-ID-ene; kanalbygget bytter dem.
