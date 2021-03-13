import * as moment from 'moment'

export interface ISPProjectItem {
  GtGroupId: string
  GtSiteId: string
  GtSiteUrl: string
  GtProjectPhaseText: string
  GtStartDate: moment.Moment
  GtEndDate: moment.Moment
  GtProjectOwnerId: number
  GtProjectManagerId: number
}
