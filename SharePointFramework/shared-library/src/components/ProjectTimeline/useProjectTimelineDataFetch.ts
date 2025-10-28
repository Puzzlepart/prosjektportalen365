import { format } from '@fluentui/react/lib/Utilities'
import sortArray from 'array-sort'
import _ from 'lodash'
import moment from 'moment'
import strings from 'SharedLibraryStrings'
import { CSSProperties, useEffect } from 'react'
import {
  ITimelineGroup,
  ITimelineItem,
  ITimelineItemData,
  TimelineGroupType
} from '../../interfaces'
import { ProjectListModel, TimelineContentModel } from '../../models'
import { IProjectTimelineProps, IProjectTimelineState } from './types'
import resource from 'SharedResources'

/**
 * Creating groups based on projects title
 *
 * @param projects Projects
 *
 * @returns Timeline groups
 */
const createProjectGroups = (projects: ProjectListModel[]): ITimelineGroup[] => {
  const mappedProjects = _.uniq(projects.map((project) => project.title)).map((title) => {
    const project = projects.find((project) => project.title === title)
    return {
      title: project.title,
      siteId: project.siteId,
      path: project.url,
      isProgram: project.isProgram
    }
  })

  const projectGroups = mappedProjects.map<ITimelineGroup>((project, id) => {
    return {
      id,
      title: project.title,
      type: TimelineGroupType.Project,
      siteId: project.siteId,
      path: project.path,
      isProgram: project.isProgram
    }
  })

  return sortArray(projectGroups, ['type', 'title'])
}

/**
 * Transform items for timeline
 *
 * @param timelineItems Timeline items
 * @param groups Groups
 * @returns Timeline items
 */
const transformItems = (
  timelineItems: TimelineContentModel[],
  groups: ITimelineGroup[]
): ITimelineItem[] => {
  let _ctxItem: TimelineContentModel
  try {
    const items = timelineItems.map<ITimelineItem>((item, id) => {
      _ctxItem = item

      const group = _.find(groups, (grp) => item.siteId.indexOf(grp.siteId) !== -1)

      if (!group) return null

      const background =
        item.getConfig('elementType') !== resource.TimelineConfiguration_Bar_ElementType
          ? 'transparent'
          : item.getConfig('bgColorHex', '#f35d69')

      const style: CSSProperties = {
        border: 'none',
        cursor: 'auto',
        outline: 'none',
        color: item.getConfig('textColorHex', '#ffffff'),
        background: background,
        backgroundColor: background
      }
      const data: ITimelineItemData = {
        project: item.title,
        projectUrl: item.url,
        phase: item.phase,
        description: item.description,
        type: item.type,
        budgetTotal: item.budgetTotal,
        costsTotal: item.costsTotal,
        sortOrder: item.getConfig('sortOrder'),
        bgColorHex: item.getConfig('bgColorHex'),
        textColorHex: item.getConfig('textColorHex'),
        category: item.getConfig('timelineCategory'),
        elementType: item.getConfig('elementType'),
        filter: item.getConfig('timelineFilter'),
        tag: item.tag,
        properties: item.properties
      }
      return {
        id,
        group: group.id,
        title:
          item.type === resource.TimelineConfiguration_Project_Title
            ? format(strings.ProjectTimelineItemInfo, item.title)
            : item.itemTitle,
        start_time:
          item.getConfig('elementType') !== resource.TimelineConfiguration_Bar_ElementType
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
        _ctxItem?.siteId ?? 'N/A',
        _ctxItem.itemTitle ? `${_ctxItem.itemTitle} (${_ctxItem.title})` : _ctxItem.title,
        _ctxItem.type,
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
    const timelineConfig = await props.dataAdapter.fetchTimelineConfiguration()
    const [projects, projectData, timelineContentItems, timelineAggregatedContent = []] =
      await Promise.all([
        props.dataAdapter.fetchEnrichedProjects(),
        props.dataAdapter.fetchTimelineProjectData(timelineConfig),
        props.dataAdapter.fetchTimelineContentItems(timelineConfig),
        props.dataAdapter.fetchTimelineAggregatedContent(
          props.configItemTitle,
          props.dataSourceName,
          timelineConfig
        )
      ])

    const filteredProjects: any[] = projects.filter((project) => {
      return project.startDate !== null && project.endDate !== null
    })

    const filteredTimelineItems = [...timelineContentItems, ...timelineAggregatedContent].filter(
      (item) =>
        filteredProjects.some((project) => {
          return project.title.indexOf(item.title) !== -1
        })
    )

    const config = projectData.configElement
    let timelineItems = []

    // Only add project elements if showElementPortfolio or showElementProgram is true
    if (config?.showElementPortfolio || config?.showElementProgram) {
      timelineItems = filteredProjects.map<TimelineContentModel>((project) => {
        const statusReport = projectData?.reports?.find((statusReport: any) => {
          return statusReport.siteId === project.siteId
        })
        const data = projectData?.data?.find((data: any) => {
          return data.siteId === project.siteId
        })

        return new TimelineContentModel(
          project.siteId,
          project.title,
          project.title,
          resource.TimelineConfiguration_Project_Title,
          project.startDate,
          project.endDate,
          '',
          '',
          statusReport?.budgetTotal,
          statusReport?.costsTotal,
          project.url,
          project.phase,
          data?.properties
        ).usingConfig(config)
      })
    }

    timelineItems = [...timelineItems, ...filteredTimelineItems]
    const groups = createProjectGroups(filteredProjects)
    const items = transformItems(timelineItems, groups)
    const columns = projectData?.columns ?? []

    return {
      data: {
        items,
        groups
      },
      timelineConfig,
      columns
    } as Partial<IProjectTimelineState>
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
