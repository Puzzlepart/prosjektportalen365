## Installasjonskanaler

For å støtte installasjon av flere forekomster av _Prosjektportalen 365_ i en leietaker, støtter vi **installasjonskanaler**.

### Generere en ny kanalkonfigurasjon

For å generere en ny kanalkonfigurasjon, bruk `npm`-skriptet `generate-channel-config`.

For å generere en ny kanalkonfigurasjon for `test`:

```javascript
npm run-script generate-channel-config test
```

For å oppdatere en eksisterende kanalkonfigurasjon, legg til flagget `/update`:

```javascript
npm run-script generate-channel-config test /update
```

### Bygge en ny versjon for en kanal

For å bygge en ny versjon for en kanal, legg til flagget `-Channel` når du kjører utgivelsesskriptet.

**Eksempel (bygger for testkanal):**

```powershell
Install/Build-Release.ps1 -Channel test
```

### Hvordan kanalbygget fungerer (`.current-channel-config.json`)

Flere forekomster av _Prosjektportalen 365_ kan leve side om side i samme leietaker bare fordi hver kanal har **egne, unike GUID-er** for hver SPFx-løsning og hver komponent (webdeler og utvidelser). Uten dette ville løsningene kollidere i leietakerens appkatalog. De kanalspesifikke GUID-ene ligger i `channels/<navn>.json`.

For at hele byggeverktøykjeden (både PowerShell og en rekke Node-skript) skal vite _hvilken_ kanal som bygges, kopierer byggeprosessen den valgte kanalfilen til en fast, kjent sti i rota av repoet: `.current-channel-config.json`. Alle verktøyene leser fra denne ene filen i stedet for at kanalnavnet må sendes inn til hvert enkelt skript. Filen er en _midlertidig_ pekefil som finnes kun under bygget, og er git-ignorert.

Livssyklusen til filen under et kanalbygg (f.eks. `-Channel test`):

| Steg | Hva skjer |
| --- | --- |
| **Skrives** | `Build-Release.ps1` laster `channels/test.json`, validerer den (se under) og skriver en kopi til `.current-channel-config.json`. |
| **Leses av generatorene** | `generate-pnp-templates`, `generate-site-scripts` og `generate-project-templates` leser filen og bytter ut GUID-ene i kildeartefaktene. Hovedmønsteret er at hver **main**-GUID byttes ut med den tilsvarende **kanal**-GUID-en, slik at malene peker på kanalens faktisk utrullede komponenter. |
| **Kopieres til utgivelsen** | Filen legges i utgivelsesmappen, slik at installasjonspakken vet hvilken kanal den tilhører. |
| **Leses ved oppgradering** | `UpgradeAllSitesToLatest.ps1` leser filen for å vite hvilken kanal sitene skal oppgraderes mot. |
| **Slettes** | Ved et rent fullført bygg fjerner `Build-Release.ps1` filen igjen. |

> [!NOTE]
> Selve SPFx-pakkingen (`.sppkg`) leser ikke `.current-channel-config.json` direkte. PowerShell-løkka skriver i stedet ut en `config/.generated-solution-config.json` per løsning, og `modifySolutionFiles.js` skriver midlertidig om `package-solution.json` (id/navn/zippedPackage) og hver `manifest.json` (komponent-id, `hiddenFromToolbox`) før bygg, og tilbakestiller etterpå.

### Skjemavalidering

Kanalkonfigurasjonen valideres mot JSON-skjemaet i `channels/$schema.json` før bygget fortsetter. Hvis konfigurasjonen ikke samsvarer med skjemaet, skriver bygget ut en advarsel, men **fortsetter likevel**:

```text
Channel configuration might not be valid (the JSON does not match the schema). Manually check schema, build continues...
```

### Viktig: avbrutt bygg

Fordi filen opprettes ved start og først slettes ved et _rent_ fullført bygg, blir den **liggende igjen hvis bygget avbrytes eller feiler**. To av generatorene (`generate-pnp-templates` og `generate-site-scripts`) leser filen uten reserveløsning – et senere bygg som du tror er et vanlig `main`-bygg vil da i stillhet produsere artefakter for den gamle kanalen.

> [!IMPORTANT]
> Hvis et kanalbygg avbrytes, slett `.current-channel-config.json` manuelt før du bygger på nytt:
>
> ```powershell
> Remove-Item .current-channel-config.json
> ```
