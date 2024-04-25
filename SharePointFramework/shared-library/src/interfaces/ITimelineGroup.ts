export enum TimelineGroupType {
  Project,
  Category,
  Type,
  User,
  Role
}

export interface ITimelineGroup {
  id: number
  title: string
  type?: TimelineGroupType
  siteId?: string
  path?: string
}

export interface ITimelineGroups {
  projectGroup: ITimelineGroup[]
  categoryGroup: ITimelineGroup[]
  typeGroup: ITimelineGroup[]
}
