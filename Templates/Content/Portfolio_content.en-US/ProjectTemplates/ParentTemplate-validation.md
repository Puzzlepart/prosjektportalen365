_The template was validated 9/11/2025, 9:34:17 AM_

The template contains the following tokens that has not been found in the .resx files:

_No tokens with missing translations or replacement values found._

---

## Template Content

```txt
{
    "Version": "1.11.1",
    "Parameters": {
        "ProvisionSiteFields": "Project Portal Columns (Project)",
        "CustomSiteFields": "Project Portal Columns (Custom)",
        "ProjectContentTypeId": "0x0100805E9E4FEAAB4F0EABAB2600D30DB70C",
        "ProjectStatusContentTypeId": "0x010022252E35737A413FB56A1BA53862F6D5"
    },
    "Navigation": {
        "QuickLaunch": [
            {
                "Url": "SitePages/ParentOverview.aspx",
                "Title": "Child content",
                "Children": [
                    {
                        "Url": "SitePages/Admin.aspx",
                        "Title": "Admin"
                    },
                    {
                        "Url": "SitePages/ParentOverview.aspx",
                        "Title": "Overview"
                    },
                    {
                        "Url": "SitePages/ParentBenefitOverview.aspx",
                        "Title": "Benefits"
                    },
                    {
                        "Url": "SitePages/ParentTimeline.aspx",
                        "Title": "Timeline"
                    },
                    {
                        "Url": "SitePages/ParentDeliveries.aspx",
                        "Title": "Deliveries"
                    },
                    {
                        "Url": "SitePages/ParentUncertainties.aspx",
                        "Title": "Uncertainties"
                    },
                    {
                        "Url": "SitePages/ParentCommunicationPlan.aspx",
                        "Title": "Communication Plan"
                    },
                    {
                        "Url": "SitePages/ParentResourceAllocation.aspx",
                        "Title": "Resource Allocation"
                    }
                ]
            }
        ]
    },
    "ClientSidePages": [
        {
            "Name": "Admin.aspx",
            "Title": "Admin",
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
                                        "title": "Admin"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "Name": "ParentOverview.aspx",
            "Title": "Overview",
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
                                        "title": "Overview for child projects",
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
            "Name": "ParentBenefitOverview.aspx",
            "Title": "Benefits",
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
                                        "title": "Benefits for child projects",
                                        "dataSource": "All benefit elements for child projects",
                                        "dataSourceCategory": "Benefit Overview",
                                        "dataSourceLevel": "Parent/Program",
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
            "Name": "ParentCommunicationPlan.aspx",
            "Title": "Communication Plan",
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
                                        "title": "Communication Plans for child projects",
                                        "dataSource": "Alle communication plans for child projects",
                                        "dataSourceCategory": "Communication Plan",
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
            "Name": "ParentResourceAllocation.aspx",
            "Title": "Resource Allocation",
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
                                        "title": "Resource allocations for child projects",
                                        "dataSource": "All resource allocations for child projects",
                                        "dataSourceCategory": "Resource Allocation",
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
            "Name": "ParentTimeline.aspx",
            "Title": "Timeline",
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
                                        "title": "Timeline for child projects",
                                        "infoText": "Here you will find a list of all projects with start and end dates in the project. The project timeline also supports phases, subphases and milestones. To zoom in/out in the timeline: ALT+Mousewheel."
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "Name": "ParentDeliveries.aspx",
            "Title": "Deliveries",
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
                                        "title": "Deliveries for child projects",
                                        "dataSource": "All Project Deliveries for child projects",
                                        "dataSourceCategory": "Project Deliveries",
                                        "dataSourceLevel": "Parent/Program",
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
            "Name": "ParentUncertainties.aspx",
            "Title": "Uncertainties",
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
                                        "title": "Uncertainties for child projects",
                                        "dataSource": "All risks for child projects",
                                        "dataSourceCategory": "Uncertainty Overview",
                                        "dataSourceLevel": "Parent/Program",
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
/Users/bloom/Code/Prosjektportalen/pp365_110/Templates/Content/Portfolio_content.en-US/ProjectTemplates/ParentTemplate.txt
```

