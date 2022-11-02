import { ITimelineItem } from 'interfaces/ITimelineItem'

export interface IDetailsCalloutProps {
  viewItem: { item: ITimelineItem; element: HTMLElement }
  onDismiss: () => void
}
