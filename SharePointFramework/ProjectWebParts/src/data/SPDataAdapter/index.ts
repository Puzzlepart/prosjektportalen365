import { IProgressIndicatorProps } from '@fluentui/react/lib/ProgressIndicator'
import { LogLevel, Logger } from '@pnp/logging'
import * as strings from 'ProjectWebPartsStrings'
import { ItemFieldValues } from 'pp365-shared-library'
import { DefaultCaching, SPDataAdapterBase } from 'pp365-shared-library/lib/data'
import { IProjectDataServiceParams, ProjectDataService } from 'pp365-shared-library/lib/services'
import { SPFxContext } from 'pp365-shared-library/lib/types'
import { IConfigurationFile } from 'types'
import _ from 'underscore'
import { ISPDataAdapterConfiguration } from './types'

class SPDataAdapter extends SPDataAdapterBase<ISPDataAdapterConfiguration> {
  public project: ProjectDataService
  private _name = 'SPDataAdapter'

  /**
   * Configure the SP data adapter
   *
   * @param spfxContext SPFx context
   * @param configuration Configuration
   */
  public async configure(
    spfxContext: SPFxContext,
    configuration: ISPDataAdapterConfiguration
  ): Promise<void> {
    await super.configure(spfxContext, configuration)
    this.project = new ProjectDataService({
      ...this.settings,
      spfxContext,
      entityService: this.entityService,
      propertiesListName: strings.ProjectPropertiesListName
     } as IProjectDataServiceParams)
  }

  /**
   * Sync property item from site to associated hub. `this.getMappedProjectProperties` is used to
   * map the properties item fields to the hub fields. `updateEntityItem` from `sp-entityportal-service`
   * is used to update the hub entity item. If any errors occur, the original error is passed to the caller.
   *
   * @param title Title of the project
   * @param fieldValues Field values for the properties item
   * @param templateParameters Template parameters
   * @param progressFunc Progress function
   */
  public async syncPropertyItemToHub(
    title: string,
    fieldValues: ItemFieldValues,
    templateParameters: Record<string, any>,
    progressFunc: (props: IProgressIndicatorProps) => void
  ): Promise<void> {
    try {
      progressFunc({
        label: strings.SyncProjectPropertiesValuesProgressLabel,
        description: strings.SyncProjectPropertiesValuesProgressDescription
      })
      const properties = await this.getMappedProjectProperties(fieldValues, {
        customSiteFieldsGroup: templateParameters.CustomSiteFields,
        projectContentTypeId: templateParameters.ProjectContentTypeId
      })
      await this.entityService.updateEntityItem(this.settings.siteId, {
        ...properties,
        Title: title
      })
      Logger.log({
        message: `(${this._name}) (syncPropertyItemToHub) Successfully synced item to hub entity.`,
        data: { properties },
        level: LogLevel.Info
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Fetch term field context. Fetches the `InternalName` and `TermSetId` for the field,
   * aswell as the `InternalName` for the text field.
   *
   * @param fieldName Field name for phase
   */
  public async getTermFieldContext(fieldName: string) {
    const field = await this.sp.web.fields
      .getByInternalNameOrTitle(fieldName)
      .select('InternalName', 'TermSetId', 'TextField')
      .using(DefaultCaching)<{
      InternalName: string
      TermSetId: string
      TextField: string
    }>()
    const textField = await this.sp.web.fields
      .getById(field.TextField)
      .select('InternalName')
      .using(DefaultCaching)<{ InternalName: string }>()
    return {
      fieldName: field.InternalName,
      termSetId: field.TermSetId,
      textField: textField.InternalName
    } as const
  }

  /**
   * Clear cache for the project.
   */
  public clearCache() {
    this.project.clearCache()
  }

  /**
   * Get configuration files from the specified folder `folderPath` relative to
   * the configuration folder (`strings.SiteAssetsConfigurationFolder`) in Site Assets.
   *
   * @param folderPath Folder path relative to the configuration folder in Site Assets
   */
  public async getConfigurations(folderPath: string): Promise<IConfigurationFile[]> {
    try {
      const { ServerRelativeUrl } = await this.portal.web.rootFolder
        .select('ServerRelativeUrl')
        .using(DefaultCaching)<{
        ServerRelativeUrl: string
      }>()
      const folderRelativeUrl = `${ServerRelativeUrl}/${strings.SiteAssetsConfigurationFolder}/${folderPath}`
      const folder = this.portal.web.getFolderByServerRelativePath(folderRelativeUrl)
      const files = await folder.files
        .select('Name', 'ServerRelativeUrl', 'ListItemAllFields/Title')
        .expand('ListItemAllFields')
        .using(DefaultCaching)()
      return files.map((file) => ({
        name: file.Name,
        title:
          _.get(file, 'ListItemAllFields.Title') ??
          `${strings.UnknownConfigurationName} (${file.Name})`,
        url: file.ServerRelativeUrl
      }))
    } catch {
      return []
    }
  }
}

export default new SPDataAdapter()
