import { ITimelineItem } from '../../../interfaces'
import { ReactCalendarItemRendererProps } from 'react-calendar-timeline'
import styles from './Timeline.module.scss'
import React from 'react'
import resource from 'SharedResources'
import { getContrastRatio, getReadableTextColor } from '../../../util'

/**
 * The colour behind the timeline's items, which a milestone's colour is measured against.
 */
const TIMELINE_BACKGROUND = '#ffffff'

/**
 * Timeline item renderer hook. Each item is a button that opens its details, by click or by Enter
 * or Space (WCAG 2.1.1); a milestone, which shows no text, is named by its title. A bar's text
 * keeps its configured colour where that is readable on the bar, and is black or white where it is
 * not (WCAG 1.4.3), and a milestone too faint against the timeline is outlined (WCAG 1.4.11): the
 * colours come from the timeline configuration, whose defaults fall short of both.
 *
 * @param onItemClick Opens an item's details, from a click or from the keyboard
 */
export function useItemRenderer(
  onItemClick: (event: React.SyntheticEvent<HTMLDivElement>, item: ITimelineItem) => void
) {
  return (calProps: ReactCalendarItemRendererProps<ITimelineItem>) => {
    const htmlProps = calProps.getItemProps(calProps.item.itemProps)
    const buttonProps: React.HTMLAttributes<HTMLDivElement> = {
      role: 'button',
      tabIndex: 0,
      'aria-haspopup': 'dialog',
      onClick: (event) => onItemClick(event, calProps.item),
      onKeyDown: (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        onItemClick(event, calProps.item)
      }
    }

    const diamondColor = calProps.item.data.bgColorHex || '#ffc800'
    const diamondStyle = {
      maxHeight: `${calProps.itemContext.dimensions.height}`,
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      width: '22px',
      height: '24px',
      backgroundColor: diamondColor,
      marginTop: '-2px',
      marginLeft: '3px'
    }

    const triangleColor = calProps.item.data.bgColorHex || '#add8e6'
    const triangleStyle = {
      maxHeight: `${calProps.itemContext.dimensions.height}`,
      width: '0',
      height: '0',
      borderLeft: '11px solid transparent',
      borderRight: '11px solid transparent',
      borderBottom: `19px solid ${triangleColor}`,
      marginLeft: '3px',
      padding: 0
    }

    /**
     * A milestone's shape, outlined when its colour is too faint against the timeline: a shape
     * cut out with `clip-path` cannot have a border, so the outline is a shadow on a wrapper.
     */
    const milestone = (color: string, shape: React.ReactElement) =>
      (getContrastRatio(color, TIMELINE_BACKGROUND) ?? 3) < 3 ? (
        <div className={styles.milestoneOutline}>{shape}</div>
      ) : (
        shape
      )

    switch (calProps.item.data.elementType) {
      case resource.TimelineConfiguration_Diamond_ElementType: {
        return (
          <div
            {...htmlProps}
            {...buttonProps}
            aria-label={calProps.item.title}
            className={`${styles.timelineItemMilestone} rc-item`}
          >
            {milestone(
              diamondColor,
              <div
                className={`${styles.itemContent} rc-milestoneitem-content`}
                style={diamondStyle}
              />
            )}
          </div>
        )
      }
      case resource.TimelineConfiguration_Triangle_ElementType: {
        return (
          <div
            {...htmlProps}
            {...buttonProps}
            aria-label={calProps.item.title}
            className={`${styles.timelineItemMilestone} rc-item`}
          >
            {milestone(
              triangleColor,
              <div
                className={`${styles.itemContent} rc-milestoneitem-content`}
                style={triangleStyle}
              />
            )}
          </div>
        )
      }
      default: {
        const style = htmlProps.style ?? {}
        const background = String(style.backgroundColor ?? style.background ?? '')
        return (
          <div
            {...htmlProps}
            {...buttonProps}
            style={{ ...style, color: getReadableTextColor(background, style.color) }}
            className={`${styles.timelineItem} rc-item`}
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
