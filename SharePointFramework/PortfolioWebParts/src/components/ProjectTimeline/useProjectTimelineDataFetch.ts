import { ITimelineGroup, ITimelineItem } from 'interfaces'
import _ from 'lodash'
import sortArray from 'array-sort'
import { ProjectListModel, TimelineContentListModel } from 'models'
import { useContext, useEffect } from 'react'
import {
  IProjectTimelineProps,
  IProjectTimelineState
} from './types'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import strings from 'PortfolioWebPartsStrings'
import moment from 'moment'
import { ProjectTimelineContext } from './context'

/**
   * Creating groups based on projects title
   *
   * @param projects Projects
   * @returns Timeline groups
   */
const transformGroups = (projects: ProjectListModel[]): ITimelineGroup[] => {
  const mappedProjects = _.uniq(projects.map((project) => project.title)).map((title) => {
    const project = projects.find((project) => project.title === title)
    return {
      title: project.title,
      siteId: project.siteId
    }
  })

  const groups: ITimelineGroup[] = mappedProjects.map((project, id) => {
    return {
      id,
      title: project.title,
      siteId: project.siteId
    }
  })
  return sortArray(groups, ['type', 'title'])
}

/**
 * Transform items for timeline
 *
 * @param timelineItems Timeline items
 * @param groups Groups
 * @returns Timeline items
 */
const transformItems = (
  timelineItems: TimelineContentListModel[],
  groups: ITimelineGroup[]
): ITimelineItem[] => {
  let _item, _siteId
  try {
    const items: ITimelineItem[] = timelineItems.map((item, id) => {
      _item = item

      const group = _.find(groups, (grp) => item.siteId.indexOf(grp.siteId) !== -1)
      _siteId = group.siteId || 'N/A'

      if (group === null) return

      const style: React.CSSProperties = {
        color: 'white',
        border: 'none',
        cursor: 'auto',
        outline: 'none',
        background:
          item.elementType !== strings.BarLabel ? 'transparent' : item.hexColor || '#f35d69',
        backgroundColor:
          item.elementType !== strings.BarLabel ? 'transparent' : item.hexColor || '#f35d69'
      }
      return {
        id,
        group: group.id,
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
          description: item.description,
          type: item.type,
          budgetTotal: item.budgetTotal,
          costsTotal: item.costsTotal,
          sortOrder: item.sortOrder,
          hexColor: item.hexColor,
          elementType: item.elementType,
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
        _item.itemTitle ? `${_item.itemTitle} (${_item.title})` : _item.title,
        _item.type,
        error
      )
    )
  }
}

/**
 * Fetch data for ProjectTimeline
 *
 * @param props Component properties for `ProjectTimeline`
 * @returns `ProjectTimeline` state
 */
const fetchData = async (
  props: IProjectTimelineProps
): Promise<Partial<IProjectTimelineState>> => {
  try {
    const data = props.dataAdapter

    const timelineConfiguration = await data.fetchTimelineConfiguration()

    const [
      projects,
      projectData,
      timelineContentItems,
      timelineAggregatedContent = []
    ] = await Promise.all([
      data.fetchEnrichedProjects(),
      data.fetchTimelineProjectData(timelineConfiguration),
      data.fetchTimelineContentItems(timelineConfiguration),
      data.fetchTimelineAggregatedContent(
        props.configItemTitle,
        props.dataSourceName,
        timelineConfiguration
      )
    ])

    const filteredProjects = projects.filter((project) => {
      return project.startDate !== null && project.endDate !== null
    })

    const filteredTimelineItems = [...timelineContentItems, ...timelineAggregatedContent].filter(
      (item) => {
        return filteredProjects.some((project) => {
          return project.title.indexOf(item.title) !== -1
        })
      }
    )

    let timelineItems: TimelineContentListModel[] = filteredProjects.map((project) => {
      const config = projectData.configElement
      const statusReport = projectData.reports.find((statusReport) => {
        return statusReport.siteId === project.siteId
      })
      return {
        ...project,
        ...statusReport,
        ...config
      }
    })

    timelineItems = [...timelineItems, ...filteredTimelineItems]

    const groups = transformGroups(filteredProjects)
    const items = transformItems(timelineItems, groups)

    return { data: { items, groups }, timelineConfiguration }
  } catch (error) {
    return { error }
  }
}

/**
 * Fetch hook for ProjectTimeline
 *
 * @param props Component properties for `ProjectTimeline`
 * @param fetchCallback Fetch callback
 */
export const useProjectTimelineDataFetch = (
  props: IProjectTimelineProps,
  fetchCallback: (data: Partial<IProjectTimelineState>) => void
) => {
  useEffect(() => {
    fetchData(props).then(fetchCallback)
  }, [])
}
