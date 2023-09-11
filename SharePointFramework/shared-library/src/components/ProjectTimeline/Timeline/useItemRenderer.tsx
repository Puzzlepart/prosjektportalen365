import { ITimelineItem } from '../../../interfaces'
import { ReactCalendarItemRendererProps } from 'react-calendar-timeline'
import * as strings from 'SharedLibraryStrings'
import styles from './Timeline.module.scss'
import React from 'react'

/**
 * Timeline item renderer hook.
 *
 * @param onItemClick On item click
 */
export function useItemRenderer(
  onItemClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, item: ITimelineItem) => void
) {
  return (calProps: ReactCalendarItemRendererProps<ITimelineItem>) => {
    const htmlProps = calProps.getItemProps(calProps.item.itemProps)

    const diamondStyle = {
      maxHeight: `${calProps.itemContext.dimensions.height}`,
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      width: '22px',
      height: '24px',
      backgroundColor: calProps.item.data.bgColorHex || '#ffc800',
      marginTop: '-2px'
    }

    const triangleStyle = {
      maxHeight: `${calProps.itemContext.dimensions.height}`,
      width: '0',
      height: '0',
      borderLeft: '11px solid transparent',
      borderRight: '11px solid transparent',
      borderBottom: `22px solid ${calProps.item.data.bgColorHex || 'lightblue'}`,
      marginTop: '-3px'
    }

    switch (calProps.item.data.elementType) {
      case strings.DiamondLabel: {
        return (
          <div
            {...htmlProps}
            className={`${styles.timelineItemMilestone} rc-item`}
            onClick={(event) => onItemClick(event, calProps.item)}
          >
            <div
              className={`${styles.itemContent} rc-milestoneitem-content`}
              style={diamondStyle}
            />
          </div>
        )
      }
      case strings.TriangleLabel: {
        return (
          <div
            {...htmlProps}
            className={`${styles.timelineItemMilestone} rc-item`}
            onClick={(event) => onItemClick(event, calProps.item)}
          >
            <div
              className={`${styles.itemContent} rc-milestoneitem-content`}
              style={triangleStyle}
            />
          </div>
        )
      }
      default: {
        return (
          <div
            {...htmlProps}
            className={`${styles.timelineItem} rc-item`}
            onClick={(event) => onItemClick(event, calProps.item)}
          >
            <div
              className={`${styles.itemContent} rc-item-content`}
              style={{
                maxHeight: `${calProps.itemContext.dimensions.height}`,
                paddingLeft: '8px'
              }}
            >
              {calProps.item.title}
            </div>
          </div>
        )
      }
    }
  }
}
