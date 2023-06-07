import { ITimelineItem } from 'pp365-shared-library/lib/interfaces'

export interface IDetailsCalloutItem {
  item: ITimelineItem
  element: HTMLElement
}

export interface IDetailsCalloutProps {
  viewItem: IDetailsCalloutItem
  onDismiss: () => void
}
