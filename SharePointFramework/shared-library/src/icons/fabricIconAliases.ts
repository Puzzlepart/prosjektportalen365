import { FabricIconAlias } from './types'

/**
 * Maps legacy UI Fabric (MDL2) icon names to canonical Fluent UI icon catalog
 * entries.
 *
 * Why this exists: icon names are stored as list data (`GtSecIcon`,
 * `GtPortfolioFabricIcon`, `GtIconName`, `GtPortfolioColumnIconName`) and the
 * template `DataRows` are provisioned with `UpdateBehavior="Skip"`. Upgraded
 * tenants therefore keep the old UI Fabric names forever, and customers may
 * have typed the same names themselves. Resolving them here at render time
 * gives Fluent icons without any data migration.
 *
 * Rules:
 * - Entries are permanent. Removing one is a breaking change for every tenant
 *   that still stores that name.
 * - Keys are UI Fabric names, values are canonical catalog names (never the
 *   other way around). `FluentIconName` and `getFluentIcons()` stay limited to
 *   canonical names.
 * - Keep the `SiteFields_*Icon*_Description` texts in
 *   `Templates/Portfolio/Resources.*.resx` in sync when adding an alias.
 *
 * Intentionally not aliased: `ExcelLogoInverse` (brand icon, stays UI Fabric)
 * and `Page`.
 */
export const fabricIconAliases: Record<string, FabricIconAlias> = {
  BarChart4: 'DataBarVertical',
  DateTime: 'CalendarClock',
  Product: 'Box',
  BranchCommit: 'BranchFork',
  BulletedList: 'TextBulletList',
  PhotoCollection: 'ImageMultiple',
  Contact: 'Person',
  CircleStop: 'RecordStop',
  LocationCircle: 'Location',
  TimelineDelivery: 'Timeline',
  Asterisk: 'Warning',
  BacklogList: 'TaskListLtr',
  SizeLegacy: 'PeopleTeam',
  FabricFolder: 'Folder',
  BulletedTreeList: 'TextBulletListTree',
  ViewList: 'AppsList',
  CircleFill: { name: 'Circle', filled: true }
}
