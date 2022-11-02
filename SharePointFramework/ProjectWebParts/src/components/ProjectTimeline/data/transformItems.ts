import { format } from '@fluentui/react'
import moment from 'moment'
import {
  ITimelineItem,
  ITimelineItemData
} from 'pp365-portfoliowebparts/lib/interfaces/ITimelineItem'
import { TimelineContentListModel } from 'pp365-portfoliowebparts/lib/models'
import strings from 'ProjectWebPartsStrings'
import { CSSProperties } from 'react'
import { ITimelineGroup } from '../types'

/**
 * Transform items for timeline
 *
 * @param timelineItems Timeline items
 * @param timelineGroups Timeline groups
 * @param defaultGroupBy Default group by
 *
 * @returns Timeline items
 */
export function transformItems(
  timelineItems: TimelineContentListModel[],
  timelineGroups: ITimelineGroup[],
  defaultGroupBy: string
): ITimelineItem[] {
  let _project: any
  let _siteId: any
  let _itemTitle: any
  try {
    const items: ITimelineItem[] = timelineItems.map((item, id) => {
      _project = item.title
      _itemTitle = item.itemTitle
      _siteId = item.siteId || 'N/A'

      const background = item.getConfig('elementType') !== strings.BarLabel
        ? 'transparent'
        : item.getConfig('hexColor', '#f35d69')

      const style: CSSProperties = {
        border: 'none',
        cursor: 'auto',
        outline: 'none',
        color: item.getConfig('textColorHex', '#ffffff'),
        background,
        backgroundColor: background
      }
      const type = item.type || strings.PhaseLabel
      const category = item.getConfig('timelineCategory', 'Styring')
      const project = item.title
      let group = 0

      switch (defaultGroupBy) {
        case strings.CategoryFieldLabel: group = timelineGroups.find((g) => g.title === category).id
          break
        case strings.TypeLabel: group = timelineGroups.find((g) => g.title === type).id
          break
        default: group = timelineGroups.find((g) => g.title === project).id
          break
      }
      const data: ITimelineItemData = {
        project,
        projectUrl: item.url,
        type,
        category,
        phase: item.phase,
        description: item.description ?? '',
        budgetTotal: item.budgetTotal,
        costsTotal: item.costsTotal,
        tag: item.tag,
        sortOrder: item.getConfig<number>('sortOrder', 99),
        hexColor: item.getConfig('hexColor'),
        elementType: item.getConfig('elementType', strings.BarLabel),
        filter: item.getConfig('timelineFilter')
      }
      return {
        id,
        group,
        title:
          item.type === strings.ProjectLabel
            ? format(strings.ProjectTimelineItemInfo, item.title)
            : item.itemTitle,
        start_time:
          item.getConfig('elementType') !== strings.BarLabel
            ? moment(new Date(item.endDate))
            : moment(new Date(item.startDate)),
        end_time: moment(new Date(item.endDate)),
        itemProps: { style },
        data
      } as ITimelineItem
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
