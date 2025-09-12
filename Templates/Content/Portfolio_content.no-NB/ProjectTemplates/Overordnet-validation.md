_The template was validated 9/11/2025, 9:34:17 AM_

The template contains the following tokens that has not been found in the .resx files:

_No tokens with missing translations or replacement values found._

---

## Template Content

```txt
{
    "Version": "1.11.1",
    "Parameters": {
        "ProvisionSiteFields": "Kolonner for Prosjektportalen (Prosjekt)",
        "CustomSiteFields": "Egendefinerte kolonner for Prosjektportalen",
        "ProjectContentTypeId": "0x0100805E9E4FEAAB4F0EABAB2600D30DB70C",
        "ProjectStatusContentTypeId": "0x010022252E35737A413FB56A1BA53862F6D5"
    },
    "Navigation": {
        "QuickLaunch": [
            {
                "Url": "SitePages/OverordnetOversikt.aspx",
                "Title": "Underordnet innhold",
                "Children": [
                    {
                        "Url": "SitePages/Admin.aspx",
                        "Title": "Administrasjon"
                    },
                    {
                        "Url": "SitePages/OverordnetOversikt.aspx",
                        "Title": "Oversikt"
                    },
                    {
                        "Url": "SitePages/OverordnetGevinster.aspx",
                        "Title": "Gevinster"
                    },
                    {
                        "Url": "SitePages/OverordnetTidslinje.aspx",
                        "Title": "Tidslinje"
                    },
                    {
                        "Url": "SitePages/OverordnetLeveranser.aspx",
                        "Title": "Leveranser"
                    },
                    {
                        "Url": "SitePages/OverordnetUsikkerheter.aspx",
                        "Title": "Usikkerheter"
                    },
                    {
                        "Url": "SitePages/OverordnetKommunikasjon.aspx",
                        "Title": "Kommunikasjonsplaner"
                    },
                    {
                        "Url": "SitePages/OverordnetRessursallokeringer.aspx",
                        "Title": "Ressursallokeringer"
                    }
                ]
            }
        ]
    },
    "ClientSidePages": [
        {
            "Name": "Admin.aspx",
            "Title": "Administrasjon",
            "PageLayoutType": "SingleWebPartAppPage",
            "CommentsDisabled": true,
            "Sections": [
                {
                    "Columns": [
                        {
                            "Factor": 12,
                            "Controls": [
                                {
                                    "Id": "9570e369-21a6-4bf5-8198-13506499de52",
                                    "Properties": {
                                        "title": "Administrasjon av underområder"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "Name": "OverordnetOversikt.aspx",
            "Title": "Oversikt",
            "PageLayoutType": "SingleWebPartAppPage",
            "CommentsDisabled": true,
            "Sections": [
                {
                    "Columns": [
                        {
                            "Factor": 12,
                            "Controls": [
                                {
                                    "Id": "01417142-67c8-498b-a6da-6e78003023dd",
                                    "Properties": {
                                        "title": "Oversikt over underområder",
                                        "showCommandBar": true,
                                        "showFilters": true,
                                        "showGroupBy": true,
                                        "showSearchBox": true,
                                        "showViewSelector": true,
                                        "showExcelExportButton": true
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "Name": "OverordnetGevinster.aspx",
            "Title": "Gevinster",
            "PageLayoutType": "SingleWebPartAppPage",
            "CommentsDisabled": true,
            "Sections": [
                {
                    "Columns": [
                        {
                            "Factor": 12,
                            "Controls": [
                                {
                                    "Id": "37c7e990-483d-4f70-b9b9-def1790817e7",
                                    "Properties": {
                                        "title": "Gevinster for underområder",
                                        "dataSource": "Alle gevinstelementer for underområder",
                                        "dataSourceCategory": "Gevinstoversikt",
                                        "dataSourceLevel": "Overordnet/Program",
                                        "showCommandBar": true,
                                        "showViewSelector": true,
                                        "showSearchBox": true
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "Name": "OverordnetKommunikasjon.aspx",
            "Title": "Kommunikasjonsplaner",
            "PageLayoutType": "SingleWebPartAppPage",
            "CommentsDisabled": true,
            "Sections": [
                {
                    "Columns": [
                        {
                            "Factor": 12,
                            "Controls": [
                                {
                                    "Id": "37c7e990-483d-4f70-b9b9-def1790817e7",
                                    "Properties": {
                                        "title": "Kommunikasjonsplaner for underområder",
                                        "dataSource": "Alle kommunikasjonsplaner for underområder",
                                        "dataSourceCategory": "Kommunikasjonsoversikt",
                                        "showCommandBar": true,
                                        "showViewSelector": true,
                                        "showSearchBox": true
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "Name": "OverordnetRessursallokeringer.aspx",
            "Title": "Ressursallokeringer",
            "PageLayoutType": "SingleWebPartAppPage",
            "CommentsDisabled": true,
            "Sections": [
                {
                    "Columns": [
                        {
                            "Factor": 12,
                            "Controls": [
                                {
                                    "Id": "37c7e990-483d-4f70-b9b9-def1790817e7",
                                    "Properties": {
                                        "title": "Ressursallokeringer for underområder",
                                        "dataSource": "Alle ressursallokeringer for underområder",
                                        "dataSourceCategory": "Ressursallokering",
                                        "hiddenColumns": [
                                            "Title"
                                        ],
                                        "showCommandBar": true,
                                        "showViewSelector": true,
                                        "showSearchBox": true
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "Name": "OverordnetTidslinje.aspx",
            "Title": "Tidslinje",
            "PageLayoutType": "SingleWebPartAppPage",
            "CommentsDisabled": true,
            "Sections": [
                {
                    "Columns": [
                        {
                            "Factor": 12,
                            "Controls": [
                                {
                                    "Id": "f97a38ab-78c2-400e-899f-b0d4cda76166",
                                    "Properties": {
                                        "title": "Tidslinje for underområder",
                                        "infoText": "Her listes alle prosjektene med start- og sluttdato i prosjektet. Prosjekttidslinjen støtter også faser, delfaser og milepæler. For å zoome inn/ut i tidslinje: ALT+Musehjul."
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "Name": "OverordnetLeveranser.aspx",
            "Title": "Leveranser",
            "PageLayoutType": "SingleWebPartAppPage",
            "CommentsDisabled": true,
            "Sections": [
                {
                    "Columns": [
                        {
                            "Factor": 12,
                            "Controls": [
                                {
                                    "Id": "37c7e990-483d-4f70-b9b9-def1790817e7",
                                    "Properties": {
                                        "title": "Leveranser for underområder",
                                        "dataSource": "Alle leveranser for underområder",
                                        "dataSourceCategory": "Leveranseoversikt",
                                        "dataSourceLevel": "Overordnet/Program",
                                        "showCommandBar": true,
                                        "showViewSelector": true,
                                        "showSearchBox": true
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "Name": "OverordnetUsikkerheter.aspx",
            "Title": "Usikkerheter",
            "PageLayoutType": "SingleWebPartAppPage",
            "CommentsDisabled": true,
            "Sections": [
                {
                    "Columns": [
                        {
                            "Factor": 12,
                            "Controls": [
                                {
                                    "Id": "37c7e990-483d-4f70-b9b9-def1790817e7",
                                    "Properties": {
                                        "title": "Usikkerheter for underområder",
                                        "dataSource": "Alle risikoelementer for underområder",
                                        "dataSourceCategory": "Usikkerhetsoversikt",
                                        "dataSourceLevel": "Overordnet/Program",
                                        "showCommandBar": true,
                                        "showViewSelector": true,
                                        "showSearchBox": true
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}
```

## Template Path

```txt
/Users/bloom/Code/Prosjektportalen/pp365_110/Templates/Content/Portfolio_content.no-NB/ProjectTemplates/Overordnet.txt
```

