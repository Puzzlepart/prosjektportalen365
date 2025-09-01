import { format } from '@fluentui/react'
import moment from 'moment'
import { ITimelineItem } from 'pp365-shared-library/lib/interfaces/ITimelineItem'
import { TimelineContentModel } from 'pp365-shared-library/lib/models'
import strings from 'ProjectWebPartsStrings'
import { CSSProperties } from 'react'
import { IProjectTimelineProps, ITimelineGroup } from '../types'
import resource from 'SharedResources'

/**
 * Transform items for timeline
 *
 * @param timelineItems Timeline items
 * @param timelineGroups Timeline groups
 * @param props Component properties for `ProjectTimeline`
 *
 * @returns Timeline items
 */
export function transformItems(
  timelineItems: TimelineContentModel[],
  timelineGroups: ITimelineGroup[],
  props: IProjectTimelineProps
): ITimelineItem[] {
  let _project: any
  let _siteId: any
  let _itemTitle: any
  try {
    const items: ITimelineItem[] = timelineItems
      .filter((item) => item.type)
      .map((item, id) => {
        _project = item.title
        _itemTitle = item.itemTitle
        _siteId = item.siteId ?? 'N/A'

        const background =
          item.getConfig('elementType') !== resource.TimelineConfiguration_Bar_ElementType
            ? 'transparent'
            : item.getConfig('bgColorHex', '#f35d69')

        const style: CSSProperties = {
          border: 'none',
          cursor: 'auto',
          outline: 'none',
          color: item.getConfig('textColorHex', '#ffffff'),
          background,
          backgroundColor: background
        }

        const timelineItem: ITimelineItem = {
          id,
          group: 0,
          title:
            item.type === resource.TimelineConfiguration_Project_Title
              ? format(strings.ProjectTimelineItemInfo, item.title)
              : item.itemTitle,
          start_time:
            item.getConfig('elementType') !== resource.TimelineConfiguration_Bar_ElementType
              ? item.endDate
                ? moment(new Date(item.endDate))
                : undefined
              : item.startDate
              ? moment(new Date(item.startDate))
              : undefined,
          end_time: item.endDate ? moment(new Date(item.endDate)) : undefined,
          itemProps: { style }
        }
        timelineItem.data = {
          project: item.title,
          projectUrl: item.url,
          type: item.type || resource.TimelineConfiguration_Phase_Title,
          category: item.getConfig('timelineCategory', props.defaultCategory),
          phase: item.phase,
          description: item.description ?? '',
          budgetTotal: item.budgetTotal,
          costsTotal: item.costsTotal,
          tag: item.tag,
          sortOrder: item.getConfig<number>('sortOrder', 99),
          bgColorHex: item.getConfig('bgColorHex'),
          textColorHex: item.getConfig('textColorHex'),
          elementType: item.getConfig(
            'elementType',
            resource.TimelineConfiguration_Bar_ElementType
          ),
          filter: item.getConfig('timelineFilter')
        }
        switch (props.defaultGroupBy) {
          case strings.CategoryFieldLabel:
            timelineItem.group = timelineGroups.find(
              (g) => g.title === timelineItem.data.category
            ).id
            break
          case strings.TypeLabel:
            timelineItem.group = timelineGroups.find((g) => g.title === timelineItem.data.type).id
            break
          default:
            timelineItem.group = timelineGroups.find(
              (g) => g.title === timelineItem.data.project
            ).id
            break
        }
        return timelineItem
      })

    return items.filter((i) => i)
  } catch (error) {
    throw new Error(
      format(
        strings.ProjectTimelineErrorTransformItemText,
        _siteId,
        _itemTitle ? `${_itemTitle} (${_project})` : _project,
        error
      )
    )
  }
}
