export enum TimelineResourceType {
  User,
  Role
}

export enum TimelineGroupType {
  Project,
  Category,
  Type
}

export interface ITimelineGroup {
  id: number
  title: string
  type?: TimelineGroupType
  resourceType?: TimelineResourceType
  siteId?: string
  path?: string
}

export interface ITimelineGroups {
  projectGroup: ITimelineGroup[]
  categoryGroup: ITimelineGroup[]
  typeGroup: ITimelineGroup[]
}
