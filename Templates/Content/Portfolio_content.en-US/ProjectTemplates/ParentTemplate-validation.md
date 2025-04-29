_The template was validated 29.4.2025, 12:05:02_

The template contains the following tokens that has not been found in the .resx files:

_No tokens with missing translations or replacement values found._

---

## Template Content

```txt
{
    "Version": "1.11.0",
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
                                    "Id": "da500bfe-49c7-4553-939a-b33254d77763",
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
                                    "Id": "77c58192-1d15-4c09-b62a-96f9c9ffe8ad",
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
                                    "Id": "555cb52f-48ef-4fa1-8984-7ec0176b2d52",
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
                                    "Id": "555cb52f-48ef-4fa1-8984-7ec0176b2d52",
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
                                    "Id": "555cb52f-48ef-4fa1-8984-7ec0176b2d52",
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
                                    "Id": "70c29af4-b55a-4207-911b-8f254ed99f03",
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
                                    "Id": "555cb52f-48ef-4fa1-8984-7ec0176b2d52",
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
                                    "Id": "555cb52f-48ef-4fa1-8984-7ec0176b2d52",
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
/Users/olemp/code/prosjektportalen365/Templates/Content/Portfolio_content.en-US/ProjectTemplates/ParentTemplate.txt
```

