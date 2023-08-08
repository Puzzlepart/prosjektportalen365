## JS Provisioning Template

Not everything we want to do is available with site designs, so we're also using [sp-js-provisioning](https://github.com/Puzzlepart/sp-js-provisioning). Please note that we're using the Puzzlepart fork from **pnp**.

With our PnP content templates (see **3.2.2**) we're provisioning a default template. The default templates for our supported languages are built from the source file [_JsonTemplate.json](../Templates/_JsonTemplate.json).

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

| Parameter                  | Description                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------- |
| ProvisionSiteFields        | The site fields in this group will be copied to the project site during provisioning. |
| ProjectContentTypeId       | Content type ID for the Project properties content type                               |
| ProjectStatusContentTypeId | Content type ID for the Project status content type                                   |

In addition to the parameters specified in [Standardmal.txt](../Templates/Portfolio/Prosjektmaler/Standardmal.txt), there's also the following parameters:

| Parameter  | Description                                                                           |
| ---------- | ------------------------------------------------------------------------------------- |
| TermSetIds | An map of term set fields and term set id. Used to override the default term set ids. |

Say you'd like to use the term set with ID **54da9f47-c64e-4a26-80f3-4d3c3fa1b7b2** for project phase. The internal field name for project phase is **GtProjectPhase**. With the default template, the **Parameters** object would look like this:

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
