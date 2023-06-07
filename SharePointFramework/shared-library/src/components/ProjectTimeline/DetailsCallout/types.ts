import { ITimelineItem } from '../../../interfaces/ITimelineItem'

export interface IDetailsCalloutProps {
  timelineItem: { item: ITimelineItem; element: HTMLElement }
  onDismiss: () => void
}
