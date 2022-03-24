export enum TimelineGroupType {
  User,
  Role
}

export interface ITimelineGroup {
  id: number
  title: string
  type?: TimelineGroupType
}
