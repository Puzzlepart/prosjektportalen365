## Maler

`Templates/` er Rush-prosjektet `pp365-templates`. Det holder innholdet installasjonen legger på porteføljehuben, og malene oppsettveiviseren legger på nye prosjektområder. Site scriptene ligger i `SiteScripts/src` (se [Site design og site scripts](site-design-og-site-scripts.md)), og ID-ene for hver installasjonskanal i `channels/` (se [Installasjonskanaler](kanaler.md)).

Ferdigheten [`pp365-templates`](../../.claude/skills/pp365-templates/SKILL.md) har oppskrifter på vanlige oppgaver, for eksempel en ny prosjektegenskap fra felt til oppgradering av eksisterende prosjekter.

### Mappene

| Kilde | Innhold | Blir til |
|---|---|---|
| `Portfolio/Portfolio.xml` og `Portfolio/Objects/` | Hubens nettstedskolonner, innholdstyper, lister med startrader, sider, navigasjon og egendefinerte handlinger. `Portfolio.xml` tar inn `Objects/<Type>/@.xml` med `xi:include`, og de lister én fil per kolonne, innholdstype, liste og side | `Portfolio.pnp` |
| `Portfolio/Resources.no-NB.resx` og `Resources.en-US.resx` | Tekstene, brukt som `{resource:Nøkkel}` i PnP-malen. Språket velges etter områdets LCID (1044 eller 1033) | En del av `Portfolio.pnp`. Filene følger også med utgivelsespakken, for installasjonsskriptene |
| `JsonTemplates/_JsonTemplateProject.json`, `_JsonTemplateProgram.json` og `_JsonTemplateParent.json` | Prosjekt-, program- og overordnet mal for oppsettveiviseren; se [Prosjektmaler (JSON)](js-provisjoneringsmal.md) | `Content/Portfolio_content.<språk>/ProjectTemplates/*.txt` (generert) |
| `Content/Portfolio_content.no-NB/` og `Content/Portfolio_content.en-US/` | Innholdsmalen for hvert språk: de genererte prosjektmalene, standardoppsettet for risiko- og mulighetsmatrisen under `SiteAssets/`, dokumentmalene i `Malbibliotek/` (bare norsk) og radene i v6-listene for fasesjekkpunkter og Planner-oppgaver. Filene skrives for hvert språk og bruker ikke ressurstokens | `Portfolio_content.<språk>.pnp` |
| `Taxonomy/Taxonomy.xml` | Termgruppen og termsettene for en ny tenant | `Taxonomy.pnp` |
| `Upgrade/<versjon>/<versjon>.xml` | Termer som eksisterende tenanter skal få (1.5.0, 1.8.1, 1.12.0 og 1.14.0) | `<versjon>.pnp` |
| `.tasks/` | Skriptene som genererer tekstfilene og prosjektmalene (under) | |

`.pnp`-filene lages bare av `Install/Build-Release.ps1`, med `Convert-PnPFolderToSiteTemplate` fra PnP.PowerShell; se [Bygge en ny utgivelse](../utgivelse/bygge-utgivelse.md). Med `-SkipBuildPnPTemplates`, som `[apps-only]`-kjøringene i CI bruker, lages de ikke.

### Bygge og validere

Kjør skriptene i `Templates/`. Alle står i [npm-skript](../spfx/npm-skript.md).

- `npm run build` kjører `generate-resx-json` (skriver `Templates/Resources.json`), `generate-resx-ts` (skriver `src/loc/shared/` i alle seks SPFx-løsningene) og `generate-project-templates` (skriver `.txt`-malene). Ingen løsning avhenger av `pp365-templates` i Rush, så kjør det selv etter hver endring i en `.resx`-fil eller en JSON-mal.
- `npm run validate-loc` skriver rapporter, men avslutter med 0 også når noe mangler. Les dem:
  - `resx-ts-report.json`: nøkler som mangler i et av språkene;
  - `pnp-missing-resource-tokens-report.json`: `{resource:}`-tokens i porteføljemalen som et språk mangler;
  - `<mal>-validation.md` ved siden av hver generert `.txt`: tokens som ikke ble byttet ut, for eksempel en `ControlId_` som mangler i kanalfila.
- `<mal>-validation.md`-filene ligger i repoet, og hver kjøring skriver et nytt tidsstempel i dem. Ta dem bare med i en commit når malinnholdet er endret.

`Templates/Resources.json`, `.txt`-filene under `ProjectTemplates/` og `src/loc/shared/` i løsningene er genererte og står i `.gitignore`. Rediger kildene, ikke dem.

### Tekstene (`.resx`)

- De to filene har de samme nøklene i samme rekkefølge, stort sett alfabetisk. Legg en ny nøkkel inn for hånd ved siden av naboen i begge filene.
- Én nøkkel brukes fire steder: `{resource:Nøkkel}` i `Portfolio/`, `{{Nøkkel}}` i JSON-malene, `Get-Resource -Name Nøkkel` i `Install/Scripts`, og `import resource from 'SharedResources'` i koden. Navn som koden og malene må være enige om, som listetitler og valgverdier, deler derfor én nøkkel.
- Hold verdiene ikke-tomme og på én linje: `generate-resx-ts` utelater tomme verdier fra språkfila og escaper bare `"`.
- `pwsh assets/scripts/Check-HardcodedAttributes.ps1 -Path <fil eller mappe>` lister `DisplayName`- og `Description`-verdier som ikke bruker `{resource:`.

### Slik når innholdet huben

`Install/Install.ps1` legger malene på huben.

- **Ny installasjon:** `Taxonomy.pnp`, så `Portfolio.pnp` og innholdsmalen for språket, søkekonfigurasjonen (`Install/SearchConfiguration.xml`) og `Scripts/PostInstall.ps1`.
- **Oppgradering (`-Upgrade`):** `Scripts/PreInstallUpgrade.ps1` før appene, så `Portfolio.pnp` uten håndtererne `Navigation`, `SupportedUILanguages` og `Files` (standardverdien til `-UpgradeExcludeHandlers`), innholdsmalen med bare `Files`, søkekonfigurasjonen, `PostInstall.ps1` og `Scripts/PostInstallUpgrade.ps1`.
- `Taxonomy.pnp` legges aldri på ved oppgradering. Nye termer for eksisterende tenanter går i en ny `Upgrade/<versjon>`-mal, som `PreInstallUpgrade.ps1` legger på bak en versjonssjekk.
- Innholdsmalen legges på med bare `Files` ved oppgradering. Filene byttes ut (også prosjektmalene i `Prosjektmaler`), men radene i innholdsmalens lister legges ikke inn; eksisterende huber får nye slike rader bare fra `PostInstallUpgrade.ps1`.
- `-SkipTemplate`, som `[apps-only]` bruker, hopper over malene. Før- og ettersteget for oppgradering kjører likevel.

Startrader (`<pnp:DataRows>`) oppfører seg etter `UpdateBehavior`:

- `Skip` (de fleste listene, f.eks. `Prosjektkolonner` med nøkkel `GtInternalName` og `Globale innstillinger` med `GtSettingsId`) legger til rader der nøkkelen mangler, og endrer aldri en rad som finnes.
- `Overwrite` (`Maloppsett`, `Hjelpeinnhold`, `Prosjektadministrasjonstilganger`, `Idekonfigurasjon` og `Tillatelseskonfigurasjon`) skriver radene sine på nytt ved hver oppgradering.
- På en ny hub er ID-en til en startrad plasseringen dens i `DataRows`, og oppslag mellom startrader bruker de ID-ene. Legg derfor nye rader sist; flytt eller sett aldri inn rader foran andre.

Hubens sider har `Overwrite="false"`, unntatt `Idemodul.xml` og `Konfigurasjon.xml`, så andre sider som finnes, blir stående. Navigasjonen hoppes over ved oppgradering; nye noder legges til i `PostInstallUpgrade.ps1`.

### Slik når innholdet prosjektområdene

Et prosjektområde får malen én gang, når oppsettveiviseren kjører: se [Prosjektmaler (JSON)](js-provisjoneringsmal.md). Malinnholdet på eksisterende prosjekter endres etterpå bare på tre måter:

- en administrator kjører veiviseren på nytt fra `Prosjektinformasjon` («Kjør oppsettveiviser»);
- egenskapslisten får nye felter fra hubens innholdstype når noen lagrer egenskapspanelet i `Prosjektinformasjon` (ikke når webdelen har `skipSyncToHub`);
- `Install/Scripts/UpgradeAllSitesToLatest.ps1 -Url <hub>` kjører hvert skript i `Install/Scripts/UpgradeAllSitesToLatest/` på alle gruppeområder i huben som har egenskapslisten (`Prosjektegenskaper`, på engelsk `ProjectProperties`). CI kjører det bare med `[upgrade-all-sites-to-latest]` i emnelinjen.

### Oppgraderingssteg

Stegene i `PreInstallUpgrade.ps1` og `PostInstallUpgrade.ps1` sjekker `$PreviousVersion -lt [version]"x.y.z"`, der `$PreviousVersion` er den nyeste versjonen i hubens `Installasjonslogg`. Skriptene i `UpgradeAllSitesToLatest/` sjekker `$global:__PreviousVersion`, den nest nyeste versjonen i loggen, altså den huben hadde før siste oppgradering.

- Bruk den åpne versjonen i `CHANGELOG.md` (`## x.y.z - TBA`) som `x.y.z`. Versjonen i `package.json` er forrige utgivelse helt til versjonen økes, og et steg som sjekker mot den, hopper over huber som er oppgradert fra den utgivelsen.
- Hver installasjon logger versjonen fra `package.json`. Fram til versjonen økes, kjører et steg for neste versjon derfor på nytt ved hver oppgradering, også ved hver CI-kjøring mot testkanalen. Hvert steg må tåle det, og ingen steg skal endre kundens egne rader eller navn.
- Hent lokaliserte navn med `Get-Resource -Name <Nøkkel>`. En ukjent nøkkel gir `Write-Error`, som stopper skriptet.

Flere regler og eksempler står i `pp365-templates`, «Writing upgrade steps».
