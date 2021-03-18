import { TypedHash } from '@pnp/common'
import * as moment from 'moment'

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
  phase?: string
  type?: string
  budgetTotal?: string
  costsTotal?: string
  role?: string
  resource?: string
  props: TypedHash<any>
}
