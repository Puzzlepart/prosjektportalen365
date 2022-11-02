import { format, IColumn } from '@fluentui/react'
import { sp } from '@pnp/sp'
import _ from 'lodash'
import moment from 'moment'
import {
  ITimelineItem,
  ITimelineItemData
} from 'pp365-portfoliowebparts/lib/interfaces/ITimelineItem'
import {
  TimelineConfigurationListModel,
  TimelineContentListModel
} from 'pp365-portfoliowebparts/lib/models'
import strings from 'ProjectWebPartsStrings'
import { CSSProperties, useEffect } from 'react'
import { first } from 'underscore'
import {
  IProjectTimelineProps,
  IProjectTimelineState,
  ITimelineGroup,
  ITimelineGroups,
  TimelineGroupType
} from './types'

/**
 * Creating groups based on projects title, categories and types.
 *
 * @param project Project
 * @param timelineConfiguration Timeline configuration
 *
 * @returns Timeline groups
 */
const createTimelineGroups = (
  project: TimelineContentListModel,
  timelineConfiguration: TimelineConfigurationListModel[]
): ITimelineGroups => {
  const projectGroups = [
    {
      id: 0,
      title: project.title,
      type: TimelineGroupType.Project
    }
  ]

  const categoryGroups = _.uniq(timelineConfiguration.map((config) => config.timelineCategory)).map<
    ITimelineGroup
  >((category, id) => {
    return {
      id,
      title: category,
      type: TimelineGroupType.Category
    }
  })

  const typeGroups = _.uniq(timelineConfiguration.map((config) => config.title)).map<
    ITimelineGroup
  >((type, id) => {
    return {
      id,
      title: type,
      type: TimelineGroupType.Type
    }
  })

  return {
    projectGroups,
    categoryGroups,
    typeGroups
  }
}

/**
 * Transform items for timeline
 *
 * @param timelineItems Timeline items
 * @param timelineGroups Timeline groups
 * @param defaultGroupBy Default group by
 *
 * @returns Timeline items
 */
const transformItems = (
  timelineItems: TimelineContentListModel[],
  timelineGroups: ITimelineGroup[],
  defaultGroupBy: string
): ITimelineItem[] => {
  let _project: any
  let _siteId: any
  let _itemTitle: any
  try {
    const items: ITimelineItem[] = timelineItems.map((item, id) => {
      _project = item.title
      _itemTitle = item.itemTitle
      _siteId = item.siteId || 'N/A'

      const style: CSSProperties = {
        color: 'white',
        border: 'none',
        cursor: 'auto',
        outline: 'none',
        background:
          item.getConfig('elementType') !== strings.BarLabel
            ? 'transparent'
            : item.getConfig('hexColor', '#f35d69'),
        backgroundColor:
          item.getConfig('elementType') !== strings.BarLabel
            ? 'transparent'
            : item.getConfig('hexColor', '#f35d69')
      }
      const type = item.type || strings.PhaseLabel
      const category = item.getConfig('timelineCategory', 'Styring')
      const project = item.title
      let group = 0

      switch (defaultGroupBy) {
        case strings.CategoryFieldLabel:
          {
            group = timelineGroups.find((g) => g.title === category).id
          }
          break
        case strings.TypeLabel:
          {
            group = timelineGroups.find((g) => g.title === type).id
          }
          break
        default:
          {
            group = timelineGroups.find((g) => g.title === project).id
          }
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

/**
 * Get timeline configuration
 *
 * @param props Component properties for `ProjectTimeline`
 */
const fetchTimelineConfiguration = async (props: IProjectTimelineProps) => {
  return (
    await props.hubSite.web.lists
      .getByTitle(strings.TimelineConfigurationListName)
      .items.select(
        'Title',
        'GtSortOrder',
        'GtHexColor',
        'GtTimelineCategory',
        'GtElementType',
        'GtShowElementPortfolio',
        'GtShowElementProgram',
        'GtTimelineFilter'
      )
      .getAll()
  )
    .map((item) => {
      const model = new TimelineConfigurationListModel(
        item.GtSortOrder,
        item.Title,
        item.GtHexColor,
        item.GtTimelineCategory,
        item.GtElementType,
        item.GtShowElementPortfolio,
        item.GtShowElementProgram,
        item.GtTimelineFilter
      )
      return model
    })
    .filter((p) => p)
}

/**
 * Fetch timeline items and columns
 *
 * @param props Component properties for `ProjectTimeline`
 * @param timelineConfig Timeline configuration
 */
const fetchTimelineData = async (
  props: IProjectTimelineProps,
  timelineConfig: TimelineConfigurationListModel[]
) => {
  try {
    const timelineContentList = props.hubSite.web.lists.getByTitle(strings.TimelineContentListName)
    let projectDeliveries = []
    if (props.showProjectDeliveries) {
      // eslint-disable-next-line @typescript-eslint/no-extra-semi
      projectDeliveries = await sp.web.lists
        .getByTitle(props.projectDeliveriesListName)
        .items.select('Title', 'GtDeliveryDescription', 'GtDeliveryStartTime', 'GtDeliveryEndTime')
        .getAll()

      projectDeliveries = projectDeliveries
        .map((item) => {
          const config = _.find(timelineConfig, (col) => col.title === props.configItemTitle)
          return new TimelineContentListModel(
            props.siteId,
            props.webTitle,
            item.Title,
            config?.title ?? props.configItemTitle,
            item.GtDeliveryStartTime,
            item.GtDeliveryEndTime,
            item.GtDeliveryDescription
          ).setConfig({
            sortOrder: 90,
            hexColor: '#384f61',
            timelineCategory: 'Styring',
            elementType: strings.BarLabel,
            timelineFilter: true,
            ...config
          })
        })
        .filter((t) => t)
    }

    const defaultViewColumns = (
      await timelineContentList.defaultView.fields.select('Items').top(500).get()
    )['Items'] as string[]

    const filterString = defaultViewColumns.map((col) => `(InternalName eq '${col}')`).join(' or ')

    // eslint-disable-next-line prefer-const
    let [timelineContentItems, timelineColumns] = await Promise.all([
      timelineContentList.items
        .select(
          ...defaultViewColumns,
          'Id',
          'GtTimelineTypeLookup/Title',
          'GtSiteIdLookupId',
          'GtSiteIdLookup/Title',
          'GtSiteIdLookup/GtSiteId'
        )
        .expand('GtSiteIdLookup', 'GtTimelineTypeLookup')
        .getAll(),
      timelineContentList.fields
        .filter(filterString)
        .select('InternalName', 'Title', 'TypeAsString')
        .top(500)
        .get()
    ])

    let timelineListItems = timelineContentItems.filter(
      (item) => item.GtSiteIdLookup.Title === props.webTitle
    )

    const columns = timelineColumns
      .filter((column) => column.InternalName !== 'GtSiteIdLookup')
      .map<IColumn>((column) => ({
        key: column.InternalName,
        name: column.Title,
        fieldName: column.InternalName,
        data: { type: column.TypeAsString },
        minWidth: 150,
        maxWidth: 200,
        isResizable: true
      }))

    timelineListItems = timelineListItems.map((item) => ({
      ...item,
      EditFormUrl: [
        `${props.hubSite.url}`,
        `/Lists/${strings.TimelineContentListName}/EditForm.aspx`,
        '?ID=',
        item.Id,
        '&Source=',
        encodeURIComponent(window.location.href)
      ].join('')
    }))

    timelineContentItems = timelineContentItems
      .filter((item) => item.GtSiteIdLookup.Title === props.webTitle)
      .map((item) => {
        const type = item.GtTimelineTypeLookup?.Title
        const config = _.find(timelineConfig, (col) => col.title === type)
        return new TimelineContentListModel(
          item.GtSiteIdLookup?.GtSiteId,
          item.GtSiteIdLookup?.Title,
          item.Title,
          config?.title,
          item.GtStartDate,
          item.GtEndDate,
          item.GtDescription,
          item.GtTag,
          item.GtBudgetTotal,
          item.GtCostsTotal
        ).setConfig(config)
      })
      .filter((t) => t)

    timelineContentItems = [...timelineContentItems, ...projectDeliveries]

    return { timelineContentItems, timelineListItems, columns, timelineConfig } as const
  } catch (error) {
    return null
  }
}

/**
 * Fetch project data
 *
 * @param props Component properties for `ProjectTimeline`
 * @param timelineConfig Timeline configuration
 */
const fetchProjectData = async (
  props: IProjectTimelineProps,
  timelineConfig: TimelineConfigurationListModel[]
): Promise<TimelineContentListModel> => {
  try {
    const projectData = await props.hubSite.web.lists
      .getByTitle(strings.ProjectsListName)
      .items.select('Id', 'GtStartDate', 'GtEndDate')
      .filter(`GtSiteId eq '${props.siteId}'`)
      .getAll()

    const config = _.find(timelineConfig, (col) => col.title === strings.ProjectLabel)
    return new TimelineContentListModel(
      props.siteId,
      props.webTitle,
      props.webTitle,
      strings.ProjectLabel,
      first(projectData)?.GtStartDate,
      first(projectData)?.GtEndDate
    ).setConfig(config)
  } catch (error) {
    throw new Error(
      format(strings.ProjectTimelineErrorFetchText, props.siteId, props.webTitle, error)
    )
  }
}

/**
 * Get selected groups based on `defaultGroupBy`
 *
 * @param groups Timeline groups
 * @param defaultGroupBy Default group by
 */
const getSelectedGroups = (groups: ITimelineGroups, defaultGroupBy: string) => {
  switch (defaultGroupBy) {
    case strings.CategoryFieldLabel:
      return groups.categoryGroups
    case strings.TypeLabel:
      return groups.typeGroups
    default:
      return groups.projectGroups
  }
}

/**
 * Fetch data for ProjectTimeline
 *
 * @param props Component properties for `ProjectTimeline`
 *
 * @returns `ProjectTimeline` state
 */
const fetchData = async (props: IProjectTimelineProps): Promise<Partial<IProjectTimelineState>> => {
  try {
    const timelineConfig = await fetchTimelineConfiguration(props)
    const [timelineData, project] = await Promise.all([
      fetchTimelineData(props, timelineConfig),
      fetchProjectData(props, timelineConfig)
    ])
    const groups = createTimelineGroups(project, timelineConfig)
    const selectedGroups = getSelectedGroups(groups, props.defaultGroupBy)
    const items = transformItems(
      [...timelineData.timelineContentItems, project],
      selectedGroups,
      props.defaultGroupBy
    )

    return {
      data: {
        items,
        groups: selectedGroups,
        listItems: timelineData.timelineListItems,
        listColumns: timelineData.columns
      },
      timelineConfig,
      groups
    } as const
  } catch (error) {
    return { error }
  }
}

/**
 * Fetch hook for ProjectTimeline
 *
 * @param props Component properties for `ProjectTimeline`
 * @param refetch Timestamp for refetch. Changes to this variable refetches the data in `useEffect`
 * @param fetchCallback Fetch callback
 */
export const useProjectTimelineDataFetch = (
  props: IProjectTimelineProps,
  refetch: number,
  fetchCallback: (data: Partial<IProjectTimelineState>) => void
) => {
  useEffect(() => {
    fetchData(props).then(fetchCallback)
  }, [refetch])
}
