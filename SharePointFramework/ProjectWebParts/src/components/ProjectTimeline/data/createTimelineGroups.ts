import _ from 'lodash'
import {
  TimelineConfigurationModel,
  TimelineContentModel
} from 'pp365-shared-library/lib/models'
import { ITimelineGroup, ITimelineGroups, TimelineGroupType } from '../types'

/**
 * Creating groups based on projects title, categories and types.
 *
 * @param project Project
 * @param timelineConfiguration Timeline configuration
 *
 * @returns Timeline groups
 */
export function createTimelineGroups(
  project: TimelineContentModel,
  timelineConfiguration: TimelineConfigurationModel[]
): ITimelineGroups {
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
