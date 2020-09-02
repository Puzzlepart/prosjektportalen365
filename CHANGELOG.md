The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

#### 1.2.3 - TBA

### Added
- Show only benefits (gevinster) that are toggled as "Show at portfolio level" #268
- Support for attachments on provisioned planner tasks #274

#### 1.2.2 - 2020-06-24

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
- Fields with _ in field name doesn't sync to portfolio
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
- Fixed planner task creation. Still creating a plan even though  setting `copyPlannerTasks` is set to `false` #132
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
