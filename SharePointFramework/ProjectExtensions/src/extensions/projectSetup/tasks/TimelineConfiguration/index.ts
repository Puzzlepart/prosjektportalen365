import { format } from '@fluentui/react/lib/Utilities'
import * as strings from 'ProjectExtensionsStrings'
import { IProjectSetupData } from 'extensions/projectSetup'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../types'
import { SPDataAdapter } from 'data'
import { ContentConfig } from 'pp365-shared-library'
import resource from 'SharedResources'

/**
 * @class TimelineConfiguration
 */
export class TimelineConfiguration extends BaseTask {
  /**
   * Constructor
   *
   * @param data Project setup data
   * @param _contentConfig Content configuration with source timeline elements
   */
  constructor(data: IProjectSetupData, private _contentConfig: ContentConfig) {
    super('TimelineConfiguration', data)
  }

  /**
   * Fetch source timeline items from the content config source list
   */
  private async _fetchSourceItems() {
    try {
      this.logInformation(
        `Fetching source timeline items from ${this._contentConfig.sourceListProps.Title}`
      )

      const items = await this._contentConfig.sourceList.items.getAll()

      this.logInformation(`Found ${items.length} source timeline items`)
      return items
    } catch (error) {
      throw new Error(`_fetchSourceItems: ${error.message}`)
    }
  }

  /**
   * Create timeline items in the hub Tidslinjeinnhold list
   *
   * @param timelineContentTypeId Content type ID for timeline items
   * @param siteId Site ID for the project
   * @param onProgress On progress function
   */
  private async _createTimelineItems(
    timelineContentTypeId: string,
    siteId: string,
    onProgress: OnProgressCallbackFunction
  ) {
    try {
      const sourceItems = await this._fetchSourceItems()

      if (sourceItems.length === 0) {
        this.logInformation('No source timeline items found, skipping timeline configuration')
        return
      }

      const timelineList = SPDataAdapter.portalDataService.web.lists.getByTitle(
        resource.Lists_TimelineContent_Title
      )

      const [projectItem] = await SPDataAdapter.portalDataService.web.lists
        .getByTitle(resource.Lists_Projects_Title)
        .items.filter(`GtSiteId eq '${siteId.replace(/([{}])/g, '')}'`)()

      const fieldsToCopy = this._contentConfig.fields || []

      for (let i = 0; i < sourceItems.length; i++) {
        const item = sourceItems[i]
        onProgress(
          strings.TimelineConfigurationText,
          format(strings.CreatingTimelineItemText, item.Title),
          'TimelineLogo'
        )

        try {
          const itemData: any = {
            ContentTypeId: timelineContentTypeId,
            GtSiteIdLookupId: projectItem.Id
          }

          fieldsToCopy.forEach((fieldName) => {
            if (item[fieldName] !== undefined && item[fieldName] !== null) {
              itemData[fieldName] = item[fieldName]
            }
          })

          this.logInformation(`Creating timeline item: ${item.Title}`, itemData)
          await timelineList.items.add(itemData)
          this.logInformation(`Successfully created timeline item: ${item.Title}`)
        } catch (error) {
          this.logWarning(`Failed to create timeline item: ${item.Title} - ${error.message}`, error)
        }
      }
    } catch (error) {
      throw new Error(`_createTimelineItems: ${error.message}`)
    }
  }

  /**
   * Execute TimelineConfiguration
   *
   * @param params Task parameters
   * @param onProgress On progress function
   */
  public async execute(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<IBaseTaskParams> {
    const templateParameters = params.templateSchema.Parameters
    const timelineContentTypeId = templateParameters?.TimelineContentTypeId || ''
    const siteId = params.context.pageContext.site.id.toString()

    if (!timelineContentTypeId) {
      this.logWarning(
        'Skipping timeline configuration: Missing TimelineContentTypeId in template parameters'
      )
      return params
    }

    this.logInformation(
      `Setting up timeline items from ${this._contentConfig.sourceListProps.Title}`
    )
    try {
      await this._createTimelineItems(timelineContentTypeId, siteId, onProgress)
    } catch (error) {
      this.logWarning('Failed to set up timeline items', error)
      throw new BaseTaskError(
        this.taskName,
        strings.TimelineConfigurationErrorMessage,
        `${error.statusCode || 'Error'}: ${error.message}`
      )
    }
    return params
  }
}
