import { ITimelineGroup, ITimelineGroups, ITimelineItem, TimelineGroupType } from '../../interfaces'
import _ from 'lodash'
import sortArray from 'array-sort'
import {
  ProjectListModel,
  TimelineConfigurationListModel,
  TimelineContentListModel
} from '../../models'
import { useEffect } from 'react'
import { IProjectTimelineProps, IProjectTimelineState } from './types'
import { format } from '@fluentui/react/lib/Utilities'
import strings from 'PortfolioWebPartsStrings'
import moment from 'moment'

/**
 * Creating groups based on projects title
 *
 * @param projects Projects
 * @returns Timeline groups
 */
const transformGroups = (
  projects: ProjectListModel[],
  timelineConfiguration: TimelineConfigurationListModel[]
): ITimelineGroups => {
  const mappedProjects = _.uniq(projects.map((project) => project.title)).map((title) => {
    const project = projects.find((project) => project.title === title)
    return {
      title: project.title,
      siteId: project.siteId
    }
  })

  const projectGroup: ITimelineGroup[] = mappedProjects.map((project, id) => {
    return {
      id,
      title: project.title,
      type: TimelineGroupType.Project,
      siteId: project.siteId
    }
  })

  const categoryGroup: ITimelineGroup[] = _.uniq(
    timelineConfiguration.map((item) => item.timelineCategory)
  ).map((category, id) => {
    return {
      id,
      title: category,
      type: TimelineGroupType.Category
    }
  })

  const typeGroup: ITimelineGroup[] = _.uniq(timelineConfiguration.map((item) => item.title)).map(
    (type, id) => {
      return {
        id,
        title: type,
        type: TimelineGroupType.Type
      }
    }
  )

  return {
    projectGroup: sortArray(projectGroup, ['type', 'title']),
    categoryGroup,
    typeGroup
  }
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
  let _item: TimelineContentListModel, _siteId: string
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
          category: item.timelineCategory,
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
 *
 * @returns `ProjectTimeline` state
 */
const fetchData = async (props: IProjectTimelineProps): Promise<Partial<IProjectTimelineState>> => {
  try {
    const timelineConfiguration = await props.dataAdapter.fetchTimelineConfiguration()
    const [
      projects,
      projectData,
      timelineContentItems,
      timelineAggregatedContent = []
    ] = await Promise.all([
      props.dataAdapter.fetchEnrichedProjects(),
      props.dataAdapter.fetchTimelineProjectData(timelineConfiguration),
      props.dataAdapter.fetchTimelineContentItems(timelineConfiguration),
      props.dataAdapter.fetchTimelineAggregatedContent(
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

    let timelineItems = filteredProjects.map<TimelineContentListModel>((project) => {
      const config = projectData.configElement
      const statusReport = projectData?.reports?.find((statusReport) => {
        return statusReport.siteId === project.siteId
      })
      return {
        ...project,
        ...config,
        ...statusReport
      }
    })

    timelineItems = [...timelineItems, ...filteredTimelineItems]

    const groups = transformGroups(filteredProjects, timelineConfiguration)

    const items = transformItems(timelineItems, groups.projectGroup)

    return {
      data: {
        items,
        groups: groups.projectGroup
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
