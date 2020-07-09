# Development guide

## 1. Site Design / Site Scripts

Everything related to the site design and the corresponding site scripts reside in the folder **SiteScripts**. 

The source files are found in the **src** folder.

## 2. JS Provisioning Template

Not everything we want to do is available with site designs, so we're also using [sp-js-provisioning](https://github.com/Puzzlepart/sp-js-provisioning). Please note that we´re using the Puzzlepart fork from **pnp**.

With our PnP templates we're provisioning [Standardmal.txt](../Templates/Portfolio/Prosjektmaler/Standardmal.txt).

Please note the **Parameters** object.

```json
{
  "Parameters": {
    "ProvisionSiteFields": "Kolonner for Prosjektportalen (Prosjekt)",
    "ProjectContentTypeId": "0x0100805E9E4FEAAB4F0EABAB2600D30DB70C",
    "ProjectStatusContentTypeId": "0x010022252E35737A413FB56A1BA53862F6D5"
  }
}
```

| Parameter                  | Description                                                  |
| -------------------------- | ------------------------------------------------------------ |
| ProvisionSiteFields        | The site fields in this group will be copied to the project site during provisioning. |
| ProjectContentTypeId       | Content type ID for the Project properties content type      |
| ProjectStatusContentTypeId | Content type ID for the Project status content type          |



In addition to the parameters specified in [Standardmal.txt](../Templates/Portfolio/Prosjektmaler/Standardmal.txt), there's also the following parameters:

| Parameter  | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| TermSetIds | An map of term set fields and term set id. Used to override the default term set ids. |

Say you'd like to use the term set with ID **54da9f47-c64e-4a26-80f3-4d3c3fa1b7b2** for project phase. The internal field name for project phase is **GtProjectPhase**. If you build on [Standardmal.txt](../Templates/Portfolio/Prosjektmaler/Standardmal.txt), the **Parameters** object would look like this:


```json
{
  "Parameters": {
    "ProvisionSiteFields": "Kolonner for Prosjektportalen (Prosjekt)",
    "ProjectContentTypeId": "0x0100805E9E4FEAAB4F0EABAB2600D30DB70C",
    "ProjectStatusContentTypeId": "0x010022252E35737A413FB56A1BA53862F6D5",
    "TermSetIds": {
      "GtProjectPhase": "54da9f47-c64e-4a26-80f3-4d3c3fa1b7b2"
    }
  }
}
```



## 3. Templates

### 3.1 Introduction

At the root level of the **Templates** folder, the following files are found:

| File/Folder               | Description                                                  |
| ------------------------- | ------------------------------------------------------------ |
| `Clean-Resx.ps1`          | Script to remove unused **.resx** resources                  |
| `Find-FieldUsage.ps1`     | Script to find field usage                                   |
| `generateResxJson.js`     | Node script to generate a JSON representation of the **.resx** files |
| `generateJsonTemplate.js` | Node script to generate JSON templates for each language     |
| `Search-Resx.ps1`         | Script to search for unused **.resx** resources              |
| `_JsonTemplate.json`      | JSON project template                                        |


#### 3.11. Building JSON templates

When doing changes to the JSON template the npm task `watch` can be used. This watches `_JsonTemplate.json` and builds localized version of this to the corresponding Content template.

### 3.2 PnP templates

In addition we have two PnP provisioning templates. 

| Template                            | Description      |
| ----------------------------------- | ---------------- |
| [Portfolio](../Templates/Portfolio) | Portfolio assets |
| [Taxonomy](../Templates/Taxonomy)   | Taxonomy         |

### 3.3 Portfolio

| File/Folder          | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| Objects              | PnP assets. See https://github.com/pnp/PnP-Provisioning-Schema |
| SiteAssets           | Files to be uploaded to SiteAssets                           |
| Portfolio.xml        | Main template file                                           |
| `Resources.*.resx` | Resource files                               |

### 3.3 Content templates

Content templates are found in the **Content** folder. The name of the template follows the following pattern:

`Portfolio_content.{language_code}.xml`

`language_code` can be for example **no-NB** or **en-US**.

The templates contains the JSON template(s), planner tasks and phase checklist items.