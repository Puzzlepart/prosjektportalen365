import { TypedHash } from '@pnp/common'
import * as moment from 'moment'

export interface IItemData {
  phase?: string
  description?: string
  milestoneDate?: moment.Moment
  type?: string
  budgetTotal?: string
  costsTotal?: string
  sortOrder?: number
  hexColor?: string
  elementType?: string
  filter?: boolean
}
export interface ITimelineItem {
  id: number
  title: string
  group: number
  start_time: moment.Moment
  end_time: moment.Moment
  allocation?: number
  itemProps: React.HTMLProps<HTMLDivElement>
  project: string
  projectUrl?: string
  data?: IItemData
  role?: string
  resource?: string
  props: TypedHash<any>
}
