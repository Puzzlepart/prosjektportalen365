import * as moment from 'moment'

export interface ITimelineItemData {
  project: string
  projectUrl?: string
  phase?: string
  description?: string
  milestoneDate?: moment.Moment
  type?: string
  budgetTotal?: string
  costsTotal?: string
  sortOrder?: number
  bgColorHex?: string
  textColorHex?: string
  category?: string
  elementType?: string
  filter?: boolean
  tag?: string
  role?: string
  resource?: string
  allocation?: number
}

export interface ITimelineItem {
  id: number
  title: string
  group: number
  start_time: moment.Moment | Date
  end_time: moment.Moment | Date
  itemProps: React.HTMLProps<HTMLDivElement>
  props?: Record<string, any>
  data?: ITimelineItemData
}
