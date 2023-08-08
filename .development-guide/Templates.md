
## Templates

### JSON provisioning template

At the root level of the **Templates** folder, the following files are found:

| File/Folder                     | Description                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| `Clean-Resx.ps1`                | Script to remove unused **.resx** resources                                                   |
| `Find-FieldUsage.ps1`           | Script to find field usage                                                                    |
| `Get-ComponentProperties.ps1`   | Script to get component properties from `<pnp:ClientSidePage>` instances                      |
| `Encode-JSON.ps1`               | Script to take the content of a JSON file, encode and minfiy at, and store it in a `.txt`file |
| `Search-Resx.ps1`               | Script to search for unused **.resx** resources                                               |
| `tasks/generateResxJson.js`     | Node script to generate a JSON representation of the **.resx** files                          |
| `tasks/generateJsonTemplate.js` | Node script to generate JSON templates for each language                                      |
| `_JsonTemplate.json`            | JSON project template                                                                         |

#### Building JSON templates

When doing changes to the JSON template the npm task `watch` can be used. This watches `_JsonTemplate.json` and builds localized version of this to the corresponding Content template.

Resources from the **.resx** files in the folder Portfolio can be used in the template using `{{tokens}}`.

**Example:**

```json
{
    "ID": "0x0100A87AE71CBF2643A6BC9D0948BD2EE897",
    "Name": "{{ContentTypes_Uncertainty_Name}}",
    "Description": "",
    "Group": "{{ContentTypes_Group}}"
}
```

### PnP templates

In addition we have two PnP provisioning templates. 

| Template                            | Description      |
| ----------------------------------- | ---------------- |
| [Portfolio](../Templates/Portfolio) | Portfolio assets |
| [Taxonomy](../Templates/Taxonomy)   | Taxonomy         |

#### Portfolio

| File/Folder        | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| Objects            | PnP assets. See https://github.com/pnp/PnP-Provisioning-Schema |
| SiteAssets         | Files to be uploaded to SiteAssets                             |
| Portfolio.xml      | Main template file                                             |
| `Resources.*.resx` | Resource files                                                 |

#### Content templates

Content templates are found in the **Content** folder. The name of the template follows the following pattern:

`Portfolio_content.{language_code}.xml`
`Portfolio_content_BA.{language_code}.xml`

`language_code` can be for example **no-NB** or **en-US**.

The templates contains the JSON template(s), planner tasks and phase checklist items.
