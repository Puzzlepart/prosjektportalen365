import { format } from '@fluentui/react'
import { sp } from '@pnp/sp'
import _ from 'lodash'
import moment from 'moment'
import { ProjectListModel, TimelineContentListModel } from 'pp365-portfoliowebparts/lib/models'
import strings from 'ProjectWebPartsStrings'
import { CSSProperties, useEffect } from 'react'
import { first } from 'underscore'
import {
  IProjectTimelineProps,
  IProjectTimelineState,
  ITimelineGroup,
  ITimelineGroups,
  ITimelineItem,
  TimelineGroupType
} from './types'

/**
 * Creating groups based on projects title, categories and types.
 *
 * @param projects Projects
 * 
 * @returns Timeline groups
 */
const createTimelineGroups = (
  projects: ProjectListModel[],
  timelineConfiguration: any[]
): ITimelineGroups => {
  const projectGroups = _.uniq(projects.map((project) => project.title)).map<ITimelineGroup>(
    (title, id) => {
      return {
        id,
        title,
        type: TimelineGroupType.Project
      }
    }
  )

  const categoryGroups = _.uniq(
    timelineConfiguration.map((item) => item.GtTimelineCategory)
  ).map<ITimelineGroup>((category, id) => {
    return {
      id,
      title: category,
      type: TimelineGroupType.Category
    }
  })

  const typeGroups = _.uniq(timelineConfiguration.map((item) => item.Title)).map<ITimelineGroup>(
    (type, id) => {
      return {
        id,
        title: type,
        type: TimelineGroupType.Type
      }
    }
  )

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
 * 
 * @returns Timeline items
 */
const transformItems = (timelineItems: TimelineContentListModel[], timelineGroups: ITimelineGroup[]): ITimelineItem[] => {
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
          item.elementType !== strings.BarLabel ? 'transparent' : item.hexColor || '#f35d69',
        backgroundColor:
          item.elementType !== strings.BarLabel ? 'transparent' : item.hexColor || '#f35d69'
      }
      const type = item.type || strings.PhaseLabel
      return {
        id,
        group: timelineGroups.find((g) => g.title === type).id,
        title:
          item.type === strings.ProjectLabel
            ? format(strings.ProjectTimelineItemInfo, item.title)
            : item.itemTitle,
        start_time:
          item.elementType !== strings.BarLabel
            ? moment(new Date(item.endDate))
            : moment(new Date(item.startDate)),
        end_time: moment(new Date(item.endDate)),
        itemProps: { style },
        project: item.title,
        projectUrl: item.url,
        data: {
          phase: item.phase,
          description: item.description || '',
          type,
          budgetTotal: item.budgetTotal,
          costsTotal: item.costsTotal,
          sortOrder: item.sortOrder || 99,
          hexColor: item.hexColor,
          category: item.timelineCategory ?? 'Styring',
          elementType: item.elementType || strings.BarLabel,
          filter: item.timelineFilter,
          tag: item.tag
        }
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
 * Get timeline items and columns
 */
const getTimelineData = async (props: IProjectTimelineProps) => {
  let projectDeliveries = []

  try {
    const timelineConfig = await props.hubSite.web.lists
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

    if (props.showProjectDeliveries) {
      // eslint-disable-next-line @typescript-eslint/no-extra-semi
      projectDeliveries = await sp.web.lists
        .getByTitle(props.projectDeliveriesListName || 'Prosjektleveranser')
        .items.select('Title', 'GtDeliveryDescription', 'GtDeliveryStartTime', 'GtDeliveryEndTime')
        .getAll()

      projectDeliveries = projectDeliveries
        .map((item) => {
          const config = _.find(
            timelineConfig,
            (col) => col.Title === (props.configItemTitle || 'Prosjektleveranse')
          )
          const model = new TimelineContentListModel(
            props.siteId,
            props.webTitle,
            item.Title,
            config?.Title ?? props.configItemTitle,
            config?.GtSortOrder ?? 90,
            config?.GtHexColor ?? '#384f61',
            config?.GtTimelineCategory ?? 'Styring',
            config?.GtElementType ?? strings.BarLabel,
            config?.GtShowElementPortfolio ?? false,
            config?.GtShowElementProgram ?? false,
            config?.GtTimelineFilter ?? true,
            item.GtDeliveryStartTime,
            item.GtDeliveryEndTime,
            item.GtDeliveryDescription
          )
          return model
        })
        .filter((t) => t)
    }

    const defaultViewColumns = (
      await props.hubSite.web.lists
        .getByTitle(strings.TimelineContentListName)
        .defaultView.fields.select('Items')
        .top(500)
        .get()
    )['Items']

    const filterString: string = defaultViewColumns
      .map((col: string) => `(InternalName eq '${col}')`)
      .join(' or ')

    const internalNames: string = await defaultViewColumns.map((col: string) => `${col}`).join(',')

    let timelineContentItems = await props.hubSite.web.lists
      .getByTitle(strings.TimelineContentListName)
      .items.select(
        internalNames,
        'Id',
        'GtTimelineTypeLookup/Title',
        'GtSiteIdLookupId',
        'GtSiteIdLookup/Title',
        'GtSiteIdLookup/GtSiteId'
      )
      .expand('GtSiteIdLookup', 'GtTimelineTypeLookup')
      .getAll()

    let timelineListItems = timelineContentItems.filter(
      (item) => item.GtSiteIdLookup.Title === props.webTitle
    )

    const timelineColumns = await props.hubSite.web.lists
      .getByTitle(strings.TimelineContentListName)
      .fields.filter(filterString)
      .select('InternalName', 'Title', 'TypeAsString')
      .top(500)
      .get()

    const columns: any[] = timelineColumns
      .filter((column) => column.InternalName !== 'GtSiteIdLookup')
      .map((column) => {
        return {
          key: column.InternalName,
          name: column.Title,
          fieldName: column.InternalName,
          data: { type: column.TypeAsString },
          minWidth: 150,
          maxWidth: 200,
          isResizable: true
        }
      })

    timelineListItems = timelineListItems.map((item) => {
      return {
        ...item,
        EditFormUrl: [
          `${props.hubSite.url}`,
          `/Lists/${strings.TimelineContentListName}/EditForm.aspx`,
          '?ID=',
          item.Id,
          '&Source=',
          encodeURIComponent(window.location.href)
        ].join('')
      }
    })

    timelineContentItems = timelineContentItems
      .filter((item) => item.GtSiteIdLookup.Title === props.webTitle)
      .map((item) => {
        const type = item.GtTimelineTypeLookup && item.GtTimelineTypeLookup.Title
        const config = _.find(timelineConfig, (col) => col.Title === type)

        const model = new TimelineContentListModel(
          item.GtSiteIdLookup?.GtSiteId,
          item.GtSiteIdLookup?.Title,
          item.Title,
          config?.Title,
          config?.GtSortOrder,
          config?.GtHexColor,
          config?.GtTimelineCategory,
          config?.GtElementType,
          config?.GtShowElementPortfolio,
          config?.GtShowElementProgram,
          config?.GtTimelineFilter,
          item.GtStartDate,
          item.GtEndDate,
          item.GtDescription,
          item.GtTag,
          item.GtBudgetTotal,
          item.GtCostsTotal
        )
        return model
      })
      .filter((t) => t)

    timelineContentItems = [...timelineContentItems, ...projectDeliveries]

    return [timelineContentItems, timelineListItems, columns, timelineConfig]
  } catch (error) {
    return []
  }
}

/**
 * Fetch project data
 */
const fetchProjectData = async (props: IProjectTimelineProps): Promise<any> => {
  try {
    const [projectData, timelineConfig] = await Promise.all([
      props.hubSite.web.lists
        .getByTitle(strings.ProjectsListName)
        .items.select('Id', 'GtStartDate', 'GtEndDate')
        .filter(`GtSiteId eq '${props.siteId}'`)
        .getAll(),
      props.hubSite.web.lists
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
        .top(500)
        .get()
    ])

    const config = _.find(timelineConfig, (col) => col.Title === strings.ProjectLabel)
    return {
      id: first(projectData).Id,
      startDate: first(projectData)?.GtStartDate,
      endDate:  first(projectData)?.GtEndDate,
      type: strings.ProjectLabel,
      sortOrder: config && config.GtSortOrder,
      hexColor: config && config.GtHexColor,
      timelineCategory: config && config.GtTimelineCategory,
      elementType: config && config.GtElementType,
      showElementPortfolio: config && config.GtShowElementPortfolio,
      showElementProgram: config && config.GtShowElementProgram,
      timelineFilter: config && config.GtTimelineFilter
    }
  } catch (error) {
    throw new Error(
      format(strings.ProjectTimelineErrorFetchText, props.siteId, props.webTitle, error)
    )
  }
}

/**
 * Fetch data for ProjectTimeline
 *
 * @param props Component properties for `ProjectTimeline`
 * @returns `ProjectTimeline` state
 */
const fetchData = async (props: IProjectTimelineProps): Promise<Partial<IProjectTimelineState>> => {
  try {
    const projectData = await fetchProjectData(props)
    const project = {
      siteId: props.siteId,
      groupId: props.siteId,
      title: props.webTitle,
      url: props.webUrl,
      ...projectData
    }

    const [
      timelineContentItems,
      timelineListItems,
      timelineColumns,
      timelineConfiguration
    ] = await getTimelineData(props)
    const timelineItems = [...timelineContentItems, ...[project]]
    const groups = createTimelineGroups([project], timelineConfiguration)
    const items = transformItems(timelineItems, groups.typeGroups)

    return {
      data: {
        items,
        groups: groups.typeGroups,
        timelineListItems,
        timelineColumns
      },
      timelineConfiguration,
      groups
    }
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
