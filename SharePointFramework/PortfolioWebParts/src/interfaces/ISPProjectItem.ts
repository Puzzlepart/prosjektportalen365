export interface ISPProjectItem {
  GtGroupId: string
  GtSiteId: string
  GtSiteUrl: string
  GtProjectPhaseText: string
  GtStartDate: string
  GtEndDate: string
  GtProjectOwnerId: number
  GtProjectManagerId: number
  Title?: string
  Id?: number
  GtIsProgram?: boolean
  GtIsParentProject?: boolean
}
