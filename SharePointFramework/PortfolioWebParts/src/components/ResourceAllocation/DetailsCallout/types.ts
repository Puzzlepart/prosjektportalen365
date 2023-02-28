import { ITimelineItem } from 'interfaces/ITimelineItem'

export interface IDetailsCalloutItem {
  item: ITimelineItem
  element: HTMLElement
}

export interface IDetailsCalloutProps {
  viewItem: IDetailsCalloutItem
  onDismiss: () => void
}
