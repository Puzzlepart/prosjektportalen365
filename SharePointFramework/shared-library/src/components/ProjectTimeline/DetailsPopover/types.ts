import { PopoverProps } from '@fluentui/react-components'
import { ITimelineItem } from '../../../interfaces/ITimelineItem'

export interface IDetailsPopoverProps extends Pick<PopoverProps, 'open'> {
  /**
   * Timeline item to show details for.
   */
  timelineItem: { item: ITimelineItem; element: HTMLElement }

  /**
   * Callback to dismiss the popover.
   */
  onDismiss: () => void
}
