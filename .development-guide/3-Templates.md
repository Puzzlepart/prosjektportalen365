## Maler

### JSON-provisjonmal

På rotnivået i mappen **Maler** finner du følgende filer:

| Fil/Mappe                       | Beskrivelse                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `Clean-Resx.ps1`                | Skript for å fjerne ubrukte **.resx**-ressurser                                              |
| `Find-FieldUsage.ps1`           | Skript for å finne bruk av felt                                                              |
| `Get-ComponentProperties.ps1`   | Skript for å hente komponentegenskaper fra `<pnp:ClientSidePage>`-instanser                  |
| `Encode-JSON.ps1`               | Skript for å ta innholdet av en JSON-fil, kode og minimere det, og lagre det i en `.txt`-fil |
| `Search-Resx.ps1`               | Skript for å søke etter ubrukte **.resx**-ressurser                                          |
| `tasks/generateResxJson.js`     | Node-skript for å generere en JSON-representasjon av **.resx**-filene                        |
| `tasks/generateJsonTemplate.js` | Node-skript for å generere JSON-maler for hver språk                                         |
| `_JsonTemplate.json`            | JSON-prosjektmal                                                                             |

#### Bygging av JSON-maler

Ved endringer i JSON-malen kan npm-oppgaven `watch` brukes. Den overvåker `_JsonTemplate.json` og bygger lokalversjon av dette til den tilsvarende innholdsmalen.

Ressurser fra **.resx**-filene i mappen "Portfolio" kan brukes i malen ved å bruke `{{tokens}}`.

**Eksempel:**

```json
{
    "ID": "0x0100A87AE71CBF2643A6BC9D0948BD2EE897",
    "Name": "{{ContentTypes_Uncertainty_Name}}",
    "Description": "",
    "Group": "{{ContentTypes_Group}}"
}
```

### PnP-maler

I tillegg har vi to PnP-provisjonsmaler.

| Mal                                 | Beskrivelse         |
| ----------------------------------- | ------------------- |
| [Portfolio](../Templates/Portfolio) | Porteføljeelementer |
| [Taxonomy](../Templates/Taxonomy)   | Taksonomi           |

#### Portefølje

| Fil/Mappe          | Beskrivelse                                                      |
| ------------------ | ---------------------------------------------------------------- |
| Objects            | PnP-elementer. Se https://github.com/pnp/PnP-Provisioning-Schema |
| SiteAssets         | Filer som skal lastes opp til SiteAssets                         |
| Portfolio.xml      | Hovedmal-fil                                                     |
| `Resources.*.resx` | Ressursfiler                                                     |

#### Innholdsmaler

Innholdsmaler finnes i mappen **Innhold**. Navnet på malen følger følgende mønster:

`Portfolio_content.{language_code}.xml`
`Portfolio_content_BA.{language_code}.xml`

`language_code` kan for eksempel være **no-NB** eller **en-US**.

Malene inneholder JSON-mal(er), oppgaver for planleggeren og elementer for sjekkliste for faser.
