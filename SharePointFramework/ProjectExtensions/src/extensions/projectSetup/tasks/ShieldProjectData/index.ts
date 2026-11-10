import { format, ShieldedProjectService, tryParseJson } from 'pp365-shared-library'
import * as strings from 'ProjectExtensionsStrings'
import resource from 'SharedResources'
import SPDataAdapter from 'data/SPDataAdapter'
import { IProjectSetupData } from 'extensions/projectSetup'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../types'

/**
 * The content types of the hub's status reports and archive log entries, when the template names
 * none of its own.
 */
const STATUS_REPORT_CONTENT_TYPE_ID = '0x010022252E35737A413FB56A1BA53862F6D5'
const ARCHIVE_LOG_CONTENT_TYPE_ID = '0x0100D9254F0E5237494285C0BB7BEA0A754A'

/**
 * Sets up a shielded project: the lists it keeps its project data in on its own site, instead of
 * on the hub. Runs only when a selected extension shields project data (`GtShieldsProjectData`)
 * or the project is shielded already.
 *
 * The project's properties item gets the template's project content type and the site's ID, URL
 * and group, which the hub's entry has for other projects, so the portfolio finds it. Status reports, their attachments and the archive log get
 * lists with the hub's titles and content types. The groups for insight into shielded projects
 * (`SitePermissions`) get read access to these lists, not to the site.
 *
 * The status report list is created last: the project counts as shielded once it exists
 * (`PortalDataService.shieldedProjectState`).
 */
export class ShieldProjectData extends BaseTask {
  constructor(data: IProjectSetupData) {
    super('ShieldProjectData', data)
  }

  /**
   * Execute ShieldProjectData
   *
   * @param params Task parameters
   * @param onProgress On progress function
   */
  public async execute(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<IBaseTaskParams> {
    if (!this.data.isShieldedProject) return params
    super.initExecute(params, onProgress)
    try {
      const parameters: Record<string, string> = params.templateSchema?.Parameters ?? {}
      const readerGroupNames = this.data.shieldedListGroupNames ?? []
      const service = new ShieldedProjectService(
        SPDataAdapter.portalDataService.web,
        params.web,
        params.webAbsoluteUrl
      )
      const progressFunc = (field: string) =>
        this.onProgress(
          strings.ShieldProjectDataText,
          format(strings.ShieldProjectDataFieldText, field),
          'LockClosed'
        )
      this.onProgress(strings.ShieldProjectDataText, strings.ShieldProjectDataSubText, 'LockClosed')
      this.logInformation('Setting up the lists for project data on the project site', {
        readerGroupNames
      })

      const properties = await service.ensureList({
        listName: resource.Lists_ProjectProperties_Title,
        template: 100,
        contentTypeId: parameters.ProjectContentTypeId,
        readerGroupNames,
        progressFunc
      })
      if (properties.listContentTypeId) {
        await service.setItemsContentType(
          resource.Lists_ProjectProperties_Title,
          properties.listContentTypeId,
          {
            GtSiteId: params.context.pageContext.site.id.toString(),
            GtSiteUrl: params.webAbsoluteUrl,
            GtGroupId: params.context.pageContext.legacyPageContext.groupId
          }
        )
      }
      await service.ensureList({
        listName: resource.Lists_ArchiveLog_Title,
        template: 100,
        contentTypeId: ARCHIVE_LOG_CONTENT_TYPE_ID,
        readerGroupNames
      })
      await service.ensureList({
        listName: resource.Lists_ProjectStatusAttachments_Title,
        template: 101,
        readerGroupNames
      })
      await service.ensureList({
        listName: resource.Lists_ProjectStatus_Title,
        template: 100,
        contentTypeId: parameters.ProjectStatusContentTypeId || STATUS_REPORT_CONTENT_TYPE_ID,
        readerGroupNames,
        progressFunc
      })
      await this._markTemplateParameters(params)
      return params
    } catch (error) {
      throw new BaseTaskError(this.taskName, strings.ShieldProjectDataErrorMessage, error)
    }
  }

  /**
   * Records `ShieldedProject` in the template parameters of the project's properties item. Done
   * here, not in `SetupProjectInformation`, because a rerun of the setup leaves the template
   * parameters as they are (`skipUpdateTemplateParameters`). It is for information only: whether
   * a project is shielded is decided by its list for status reports.
   *
   * @param params Task parameters
   */
  private async _markTemplateParameters(params: IBaseTaskParams): Promise<void> {
    const list = params.web.lists.getByTitle(resource.Lists_ProjectProperties_Title)
    const [item] = await list.items.select('Id', 'TemplateParameters').top(1)<
      { Id: number; TemplateParameters: string }[]
    >()
    if (!item) return
    const templateParameters: Record<string, any> = tryParseJson(item.TemplateParameters, {})
    if (templateParameters.ShieldedProject === true) return
    await list.items.getById(item.Id).update({
      TemplateParameters: JSON.stringify({ ...templateParameters, ShieldedProject: true })
    })
  }
}
