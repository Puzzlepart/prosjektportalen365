The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## 1.1.5 - TBA

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
