import * as moment from 'moment'

export interface ITimelineItemData {
  project: string
  projectUrl?: string
  phase?: string
  description?: string
  milestoneDate?: moment.Moment | Date
  type?: string
  budgetTotal?: string
  costsTotal?: string
  sortOrder?: number
  bgColorHex?: string
  textColorHex?: string
  /**
   * The colour a bar from elsewhere than the timeline configuration is edged in (the resource
   * allocation's full colour, whose fill fades), darkened by the timeline where it stands out too
   * little from the rows (WCAG 1.4.11). No edge without one.
   */
  edgeColor?: string
  category?: string
  elementType?: string
  filter?: boolean
  tag?: string
  role?: string
  resource?: string
  resourceUpn?: string
  department?: string
  allocation?: number
  comment?: string
  status?: string
  properties?: any
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
