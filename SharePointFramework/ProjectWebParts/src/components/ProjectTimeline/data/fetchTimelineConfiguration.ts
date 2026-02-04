import SPDataAdapter from 'data/SPDataAdapter'
import {
  SPTimelineConfigurationItem,
  TimelineConfigurationModel
} from 'pp365-shared-library/lib/models'
import resource from 'SharedResources'

/**
 * Fetches the timeline configuration from the SharePoint list.
 * Optionally filters configuration items by template using GtTemplateOptions lookup by getting current template by matching TimelineContentTypeId
 *
 * @param timelineContentTypeId Optional content type ID to determine current template
 *
 * @returns A Promise that resolves to an array of `TimelineConfigurationModel` objects  based on specific template ( based on GtTemplateOptions).
 */
export async function fetchTimelineConfiguration(timelineContentTypeId?: string) {
  const configItems = await SPDataAdapter.portalDataService.web.lists
    .getByTitle(resource.Lists_TimelineConfiguration_Title)
    .items.select(...new SPTimelineConfigurationItem().fields, 'GtTemplateOptionsId')
    .expand('GtTemplateOptions')
    .orderBy('GtSortOrder')()

  if (!timelineContentTypeId) {
    return configItems.map((item) => new TimelineConfigurationModel(item)).filter(Boolean)
  }

  const templates = await SPDataAdapter.portalDataService.web.lists
    .getByTitle(resource.Lists_TemplateOptions_Title)
    .items.select('Id', 'Title', 'GtTimelineContentType')()

  const currentTemplate = templates.find(
    (t) => t.GtTimelineContentType === timelineContentTypeId
  )

  return configItems
    .filter((item) => {
      if (!item.GtTemplateOptionsId || item.GtTemplateOptionsId.length === 0) {
        return true
      }
      if (currentTemplate) {
        return item.GtTemplateOptionsId.includes(currentTemplate.Id)
      }
      return false
    })
    .map((item) => new TimelineConfigurationModel(item))
    .filter(Boolean)
}
