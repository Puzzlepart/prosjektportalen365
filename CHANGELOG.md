The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

Every change is marked with issue ID.

## 1.3.0 - TBA 

### Added 

- Added new multi-user field _Prosjektstøtte_ #526
- Added "Avventer" as a new choice in Project LifeCycle #537
- Added a new section in "ProjectStatus" for timeline list #506  
- Added a new project webpart 'Prosjekttidslinje' for showcasing projects and items for the current project on a timeline #497

### Changed

- Removed "Home" from Portfolio menu bar
- Removed list views and risk matrix from previous status reports #374

### Fixed

- Fixed UI bug by downgrading the `office-ui-fabric-react` package version to `6.214.0` #535
- Fixed redirect after creating a new project status #530

## 1.2.9 - 08.09.2021

### Added

- Added multiline text-wrapping in project status #493
- Added description for site template #500

### Fixed

- Fixed issue where the site design had to be applied post project creation #492
- Fixed date not being recognized when exporting Portfolio overview to Excel. #495
- Fixed issue where changing project phase did not always update the portfolio page #518

## 1.2.8 - 17.06.2021

### Added

- Added rich text and lineshift support to field in project information #502

### Fixed

- Fixed issue with checklist status field missing options #485

## 1.2.7 - 20.05.2021

### Added

- Added a new portfolio webpart, 'Prosjekttidslinje' for showcasing projects on a timeline #435
- Added list 'Tidslinjeinnhold' to portfolio level #437
- Added 'Description' to document templates #379
- Supporting pre-defined template setting #461
- Added "Last Report Date" to Portfolio status overview #393
- Added report created date next to Project Status title #456

### Fixed

- Avoiding overwrite of portfolio views, columns, column configuration and insights graphs on update #440
- Overwriting configuration page to support new configuration links on update #425
- Fixed portfolio overview crashing when default view was selected #428
- Fixed inconsistent version history settings of lists #465
- Fixed Excel export issues at portfolio level #480

### Changed

- Changed Portfolio status view columns from "comments" to "status" #451
- Improved project properties sync and fetching #444 #449
- Overviews using PortfolioAggregation (Benefit overview, Experience log, Delivery overview, Risk overview) now initially sort on project and grouping now automatically sorts group from A-Z by project. Also removes groups when sorting to avoid the issue found in #459
- Updated description for most of the SiteFields throughout 'Prosjektportalen' #467
- Deactivated Export to Excel button on portfolio overview as well as aggregated portfolio pages (Gevinstoversikt, Erfaringslogg, Leveranseoversikt, Risikooversikt) #475

## 1.2.6 - 03.03.2021

### Added

- Added project template name to project properties #380
- Added support for phase sub text in phase selector #381
- Added support for navigation folders in document template picker #382
- Added support for permission configuration using a configuration list on the hubsite #387
- Added Description field to Usikkerhet #410
- Enabled version history on Prosjektmaler list #359

### Fixed

- Fixes issues with single folder in "Hent dokumentmal" #376
- Issues with custom project fields #378
- Fix for visible check in project information web part #385
- Setting phase check list and planner task list as visible #389
- Flexible portfolio aggregation web part #394
- Copying for documents to new projects #399
- Fixes issues with more than one status report template #400
- Fixed issues with missing projects on the front page #364
- Fixed support for latest PnP PowerShell #377

## 1.2.4 - 30.11.2020

### Added

- Added "default" option for extensions, similar to list content #328
- Added info message if there are unpublished statusreports #340
- Added published/unpublished indicators for statusreports in dropdown and ribbon #341
- Added possiblity to delete unpublished statusreports #343
- Added PNG snapshot when publishing project status #337

### Fixed

- Restricted access for members to certain lists #356
- Improved failure handling for PlannerConfiguration task in Project Setup #329
- Support adding AD groups to get porfolio insights from SP group #332, #352
- Change to latest statusreport when creating a new statusreport #343
- Issue were user couldn't exit the portfolio filter pane #353

## 1.2.3 - 2020-10-07

### Added

- Descriptions on configuration page #301
- New group "Porteføljeinnsyn". Grants users in this group insight into all projects in the portfolio #305
- "Porteføljeinnsyn" button on configuration page for adding users to the group #306
- Risk matrix toggle: Before and after risk reduction measures #293
- Support for planner tasks references/attachments #287

### Fixed

- View in portfolio overview was not changeable for non-admin users #308
- Projects set to Avsluttet are no longer visible on the front page #307

### Changed

- Disabled "Ny statusrapport" when a report is unpublished. #309

## 1.2.2 - 2020-06-24

### Added

- Planner tasks copied to the project site during provisioning get label Metodikk #276

#### 1.2.1 - 2020-05-22

### Added

- Not using refiners from search anymore in `PortfolioOverview`, retrieving the values from the current collection instead #244
- Removed lists Information and Milestones #266

### Fixed

- Removed "Add to portfolio" on Opportunities #270

## 1.2.0 - 2020-02-21

### Added

- Support for different phase term sets (to fully support different project templates/types) #201
- Support for different project metadata for different project types/templates
- Ability to connect template(s) to list content config
- Support for provisioning documents and folders to new project sites #190
- New column `Skjult` added to the list `Listeinnhold` #227
- Add the ability to set a template in Prosjektmaler as default #233
- Add the ability to set a icon for Prosjektmaler #233
- Improved layout for project template selector #233
- Support for role-only for resource allocation #214
- Misc allocation improvements #139
- Moving planner configuration to `Lists/Listeinnhold` (also support for cascade import #228
- Add `Gevinsteier` to `Gevinstanalyse og gevinstrealiseringsplan` #162
- Improved UI for summary view phase change modal #235
- Support for description for list content configurations (#240)

### Fixed

- Header columns mispositioned in portfolio overview #207
- Issue with mandatory project properties not synced to created projects #215
- Disabled template dropdown in project configurator if there's only 1 template selected

## 1.1.9 - 2020-01-20

### Fixed

- Fixed rendering of status sections, some properties had no effect #180
- Sync project propertes after phase change #196
- Fixed an issue with installation script
- Fixed an overview with retrieving document template and library picker #197

### Added

- Installation writes to output which user it is connected with #187

## 1.1.8 - 2020-01-10

### Fixed

- Stopped using PnP connections (which caused some issues) #185
- Removed library URL field from Listeinnhold list #183

## 1.1.7 - 2020-01-09

### Added

- RiskMatrix added as separate web part #97
- RiskMatrix added to project status #172
- Improved error messages when provisioning new projects #170
- Including previous budget numbers in new project status #167
- Better support for the Portfolio administrator role #133
- Made it possible to work with draft and published versions of project status reports #119
- Support for copying more than 100 items in CopyListData (up to 500)
- Support for installing to /teams/ #177

### Fixed

- Fixed lookups in list 'Prosjektkolonnekonfigurasjon' #142
- Fixed colors and columns not matching content #134
- Fixed an issue with invalid web part properties on Oppgaver.aspx #164
- Added support for currency fields in Portfolio Insights #155
- Fields with \_ in field name doesn't sync to portfolio
- Persists selection for ListContentSection/ExtensionsSection #182

## 1.1.6 - 2019-11-14

### Fixed

- Fixed a bug with current phase not being displayed in phase web part on project frontpage #149

## 1.1.5 - 2019-11-13

### Added

- Support for PSCredential in Install script #145
- Added missing resource for choice option (Choice_GtResourceAbsence_Linetasks) #148

### Fixed

- Fixed project column configuration to make status colors work in portfolio overview #142

## 1.1.4 - 2019-10-30

### Added

- Added list 'Interessentregister' to portfolio level
- Using list fields instead of content type for 'Dokumenter' to keep the OOTB document type dropdown #136
- Updated Standardmal.txt to include Parameters
- Fixed colors and columns not matching content for resource allocation #134

## 1.1.3 - 2019-10-15

### Fixed

- Fixed issue with document template selector on frontpage #128
- Include active/inactive projects field to filter projects from portfolio #99
- Fixed planner task creation. Still creating a plan even though setting `copyPlannerTasks` is set to `false` #132
- Fixed an issue with duplicate list items #135

## 1.1.2 - 2019-10-10

### Fixed

- Added `-SkipTaxonomy` switch to Install script

## 1.1.1 - 2019-10-09

### Fixed

- Fixed handling of user fields in project properties sync
- Fixed cache issue for ProjectInformation web part
- Economy fields also hidden from list instance due to issue with content type updates
- Added around in PortfolioOverview to fix issue with scroll #116
