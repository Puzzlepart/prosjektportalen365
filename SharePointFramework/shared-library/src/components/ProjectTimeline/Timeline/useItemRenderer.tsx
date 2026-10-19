import { ITimelineItem } from '../../../interfaces'
import { ReactCalendarItemRendererProps } from 'react-calendar-timeline'
import styles from './Timeline.module.scss'
import React from 'react'
import resource from 'SharedResources'
import { getContrastingShade, getReadableTextColor, getTint } from '../../../util'

/**
 * The timeline's grey rows (react-calendar-timeline's `rgba(0, 0, 0, 0.05)` over white): the
 * fainter of the two backgrounds its items lie on, so the one their edges are measured against.
 */
const TIMELINE_ROW_BACKGROUND = '#f2f2f2'

/**
 * Timeline item renderer hook. Each item is a button that opens its details, by click or by Enter
 * or Space (WCAG 2.1.1); a milestone, which shows no text, is named by its title.
 *
 * The colours come from the timeline configuration, whose defaults gave white text under 4.5:1
 * and bars and milestones under 3:1 against the timeline. A bar of the configuration is drawn in a
 * light tone of its colour, edged in the colour, darkened where that is under 3:1 against the
 * grey rows (WCAG 1.4.11), and a milestone is edged in a darker shade of its own colour. A bar's
 * text keeps its configured colour where that reads on the bar, and is black or white where it
 * does not (WCAG 1.4.3). Bars from elsewhere keep their fill, and only their text is chosen; one
 * that names an edge colour (the resource allocation, whose fill fades with the allocation) is
 * edged in it, darkened in the same way.
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

    /**
     * A milestone's shape in its colour, edged in a shade at least a quarter darker that stands
     * out against the grey rows, so the edge shows round any colour (WCAG 1.4.11).
     */
    const milestone = (color: string, shape: string, size: React.CSSProperties) => (
      <div
        className={`${styles.itemContent} ${styles.milestone} ${shape} rc-milestoneitem-content`}
        style={
          {
            maxHeight: `${calProps.itemContext.dimensions.height}`,
            ...size,
            '--milestone-fill': color,
            '--milestone-edge':
              getContrastingShade(color, TIMELINE_ROW_BACKGROUND, 3, 0.75) ?? color
          } as React.CSSProperties
        }
      />
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
            {milestone(calProps.item.data.bgColorHex || '#ffc800', styles.diamond, {
              width: '22px',
              height: '24px',
              marginTop: '-2px',
              marginLeft: '3px'
            })}
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
            {milestone(calProps.item.data.bgColorHex || '#add8e6', styles.triangle, {
              width: '22px',
              height: '19px',
              marginLeft: '3px'
            })}
          </div>
        )
      }
      default: {
        const style = htmlProps.style ?? {}
        const configured = String(style.backgroundColor ?? style.background ?? '')
        const isConfiguredBar =
          calProps.item.data.elementType === resource.TimelineConfiguration_Bar_ElementType
        const tint = isConfiguredBar ? getTint(configured) : undefined
        const edgeColor = tint ? configured : calProps.item.data?.edgeColor
        const edge = edgeColor && getContrastingShade(edgeColor, TIMELINE_ROW_BACKGROUND)
        const background = tint ?? configured
        const barStyle: React.CSSProperties = {
          ...style,
          ...(tint ? { background, backgroundColor: background } : {}),
          ...(edge
            ? {
                border: `1px solid ${edge}`,
                // The calendar sets the line height to the item's height; the edge takes 2px of it.
                lineHeight: `${calProps.itemContext.dimensions.height - 2}px`
              }
            : {})
        }
        return (
          <div
            {...htmlProps}
            {...buttonProps}
            style={{ ...barStyle, color: getReadableTextColor(background, style.color) }}
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
