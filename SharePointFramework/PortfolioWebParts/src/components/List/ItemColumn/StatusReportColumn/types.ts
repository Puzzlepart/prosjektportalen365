import { IRenderItemColumnProps, IStatusShape } from 'pp365-shared-library'

/**
 * The status report cell's settings: the hub lists it reads, and whether the pointer resting on
 * the strip shows the details.
 */
export interface IStatusColumnProps extends IRenderItemColumnProps {
  statusReportListName?: string
  columnConfigListName?: string
  statusSectionsListName?: string

  /**
   * Show the details when the pointer rests on the strip for half a second (on by default). A
   * click, Enter or Space shows them as a dialog either way.
   */
  openOnHover?: boolean
}

/**
 * A status section of the hub (`Statusseksjoner`) that becomes a tile, with the colour and the
 * shape of each of its values.
 */
export interface IStatusSectionDefinition {
  /** The report's field, a `GtStatus*` field. */
  fieldName: string

  /** The section's title in `Statusseksjoner`. */
  name: string

  /** The section's icon (`GtSecIcon`). */
  iconName?: string

  /** Each value's colour in `Prosjektkolonnekonfigurasjon`. */
  colors: Record<string, string>

  /**
   * Each value's shape, given out per section (`getStatusShapes`) so that colours differ in shape
   * while a shape is free.
   */
  shapes: Record<string, IStatusShape>
}

/** A section of one report: its value, its comment, and the colour and shape it is shown with. */
export interface IStatusReportSection {
  fieldName: string
  name: string
  iconName?: string

  /** `undefined` when the section has no value. */
  value?: string

  comment?: string
  color?: string

  /** `empty` without a value, `unknown` for a value the configuration does not know. */
  shape: IStatusShape
}

/** A published status report, the latest of its report series. */
export interface IStatusReport {
  /** The report's list item id. */
  id: number

  /**
   * The shielded project's site whose status report list holds the report, as the row names it
   * (`StatusReportWebUrl`); none for a report in the hub's list. The ids of different lists can
   * be the same, so a row finds its report by both.
   */
  webUrl?: string

  /** The project's site id, from `GtSiteId`. */
  siteId: string

  /** The report series' scope key, from `GtSiteId`; empty for the project's default series. */
  scopeKey: string

  /** When the report was published (`GtLastReportDate`, else `Created`), as REST gives it. */
  publishedDate: string

  /** The overall status, a text, shown in the details only. */
  overallStatus?: string

  /** The sections in the hub's order (`GtSortOrder`). */
  sections: IStatusReportSection[]
}

/** What the column's `fetchData` gives the cells (`column.data.$`). */
export interface IStatusReportColumnData {
  /** The sections that become tiles, in the hub's order. */
  sections: IStatusSectionDefinition[]

  /** The title of the overall status section in `Statusseksjoner`, its heading in the details. */
  overallStatusName?: string

  /**
   * The reports the configured hub's rows point to (`StatusReportId`), and those of shielded
   * projects, from their own sites (`StatusReportWebUrl`).
   */
  reports: IStatusReport[]
}
