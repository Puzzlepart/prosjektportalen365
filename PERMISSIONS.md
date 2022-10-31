# Permissions and roles for various areas and components of Prosjektportalen 365

## Installation

| Area                       | Permission/role  | Description                                                     |
| -------------------------- | ---------------- | --------------------------------------------------------------- |
| Install/Upgrade            | SharePoint Admin | User must be SharePoint admin to install PP365                  |
| Install/Upgrade - Taxonomy | Term Store Admin | User must be Term Store admin to add terms connected to PP365   |
| Install/Upgrade - Apps     | Member/Owner     | User must have permission to the appcatalog site for the tenant |
| Install - API              | Global Admin     | A global admin needs to approve API requests after installation |

## Project creation

| Action/Feature         | Permission/role    | Microsoft group | Description                                                          |
| ---------------------- | ------------------ | --------------- | -------------------------------------------------------------------- |
| Create project         | SharePoint Members | 'Medlemmer'     | As long as 'Site creation' is enabled                                |
| Connect project to hub | Hub associatives   | N/A             | Global admins can give people access to associate sites with the hub |

## Portfolio level

| WebPart/Component    | Action/Feature           | Permission/role       | Microsoft group | Description |
| -------------------- | ------------------------ | --------------------- | --------------- | ----------- |
| PortfolioOverview    | Create new view          | SharePoint Site Admin | 'Eiere'         |             |
| PortfolioOverview    | Column settings for view | SharePoint Site Admin | 'Eiere'         |             |
| PortfolioAggregation | Create new view          | SharePoint Site Admin | 'Eiere'         |             |

## Project/Program level

| WebPart/Component     | Action/Feature                       | Permission/role       | Microsoft group | Description |
| --------------------- | ------------------------------------ | --------------------- | --------------- | ----------- |
| ProjectSetup          | Setup dialog for configuring project | SharePoint Site Admin | 'Eiere'         |             |
| ProjectInformation    | Edit project properties              | SharePoint Site Admin | 'Eiere'         |             |
| ProjectInformation    | View version history                 | SharePoint Site Admin | 'Eiere'         |             |
| ProjectInformation    | Transform to parent project          | SharePoint Site Admin | 'Eiere'         |             |
| ProjectInformation    | View all properties                  | SharePoint Members    | 'Medlemmer'     |             |
| ProjectInformation    | Edit site information                | SharePoint Site Admin | 'Eiere          |             |
| ProjectInformation    | Child project admin (Program)        | SharePoint Site Admin | 'Eiere          |             |
| ProjectInformation    | WebPart 'Configure' settings         | SharePoint Site Admin | 'Eiere          |             |
| ProjectPhases         | Change phase button                  | SharePoint Site Admin | 'Eiere          |             |
| ProjectStatus         | Create statusreports                 | SharePoint Members    | 'Medlemmer'     |             |
| ProjectStatus         | Edit statusreports                   | SharePoint Members    | 'Medlemmer'     |             |
| ProjectStatus         | Publish statusreports                | SharePoint Members    | 'Medlemmer'     |             |
| ProjectStatus         | Delete statusreports                 | SharePoint Members    | 'Medlemmer'     |             |
| ProgramAdministration | Add project to program               | SharePoint Site Admin | 'Eiere          |             |
| ProgramAdministration | Remove project to program            | SharePoint Site Admin | 'Eiere          |             |

### SharePoint Site Admin

The check does the following:

- `this.context.pageContext.legacyPageContext.isSiteAdmin`
