import React from 'react'
import { ReactCalendarItemRendererProps } from 'react-calendar-timeline'
import { IDetailsCalloutItem } from './DetailsCallout/types'
import styles from './ResourceAllocation.module.scss'

/**
 * Timeline item renderer
 */
export function itemRenderer(
  props: ReactCalendarItemRendererProps<any>,
  onItemClick: (details: IDetailsCalloutItem) => void
) {
  const htmlProps = props.getItemProps(props.item.itemProps)
  return (
    <div
      {...htmlProps}
      className={`${styles.timelineItem} rc-item`}
      onClick={(event) =>
        onItemClick({ element: event.currentTarget, item: props.item })
      }
    >
      <div
        className={`${styles.itemContent} rc-item-content`}
        style={{ maxHeight: `${props.itemContext.dimensions.height}` }}
      >
        {props.item.title}
      </div>
    </div>
  )
}
