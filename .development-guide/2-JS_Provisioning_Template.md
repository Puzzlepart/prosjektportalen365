## JS Provisjoneringsmal

Ikke alt vi ønsker å gjøre er tilgjengelig med `site design`, så vi bruker også [sp-js-provisioning](https://github.com/Puzzlepart/sp-js-provisioning). Vær oppmerksom på at vi bruker `Puzzlepart-branch` fra **pnp**.

Med våre PnP-innholdsmaler (se **3.2.2**) setter vi opp en standardmal. Standardmalene for våre støttede språk er bygget fra kildefilen [_JsonTemplate.json](../Templates/_JsonTemplate.json).

Vennligst merk **Parameters**-objektet.

```json
{
  "Parameters": {
    "ProvisionSiteFields": "Kolonner for Prosjektportalen (Prosjekt)",
    "ProjectContentTypeId": "0x0100805E9E4FEAAB4F0EABAB2600D30DB70C",
    "ProjectStatusContentTypeId": "0x010022252E35737A413FB56A1BA53862F6D5"
  }
}
```

| Parameter                  | Beskrivelse                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| ProvisionSiteFields        | Feltene på nettstedet i denne gruppen vil bli kopiert til prosjektnettstedet under oppsett. |
| ProjectContentTypeId       | Innholdstype-ID for egenskapsinnholdstypen for prosjektet                                   |
| ProjectStatusContentTypeId | Innholdstype-ID for innholdstypen for prosjektstatus                                        |

I tillegg til parameterne som er spesifisert i [Standardmal.txt](../Templates/Portfolio/Prosjektmaler/Standardmal.txt), er det også følgende parametere:

| Parameter  | Beskrivelse                                                                               |
| ---------- | ----------------------------------------------------------------------------------------- |
| TermSetIds | Et kart over termsettfelt og termsett-ID. Brukes til å overstyre standard termsett-ID-er. |

Si at du vil bruke termsettet med ID-en **54da9f47-c64e-4a26-80f3-4d3c3fa1b7b2** for prosjektfase. Det interne feltnavnet for prosjektfasen er **GtProjectPhase**. Med standardmalen ville **Parameters**-objektet se slik ut:

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
