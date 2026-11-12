/**
 * Identifies the grouping dimension represented by a timeline row.
 */
export enum TimelineGroupType {
  Project,
  Category,
  Type,
  User,
  Role
}

/**
 * Defines a timeline row and its optional project identity.
 */
export interface ITimelineGroup {
  id: number
  title: string
  type?: TimelineGroupType
  siteId?: string
  path?: string
  isProgram?: boolean
}

/**
 * Collects timeline rows by project, category and item type.
 */
export interface ITimelineGroups {
  projectGroup: ITimelineGroup[]
  categoryGroup: ITimelineGroup[]
  typeGroup: ITimelineGroup[]
}
