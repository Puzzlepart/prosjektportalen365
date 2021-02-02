import { IProjectSetupData } from 'extensions/projectSetup'
import * as strings from 'ProjectExtensionsStrings'
import { PortalDataService } from 'pp365-shared/lib/services'
import { SpEntityPortalService } from 'sp-entityportal-service'
import initSpfxJsom, { ExecuteJsomQuery } from 'spfx-jsom'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'

export class PreTask extends BaseTask {
  public taskName = 'PreTask'

  constructor(data: IProjectSetupData) {
    super(data)
  }

  /**
   * Execute PreTask
   *
   * @param {IBaseTaskParams} params Task parameters
   * @param {OnProgressCallbackFunction} onProgress On progress function
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(params: IBaseTaskParams): Promise<IBaseTaskParams> {
    try {
      params.templateSchema = await this.data.selectedTemplate.getSchema()
      params.spfxJsomContext = await initSpfxJsom(params.context.pageContext.site.absoluteUrl, {
        loadTaxonomy: true
      })
      params.entityService = new SpEntityPortalService({
        portalUrl: this.data.hub.url,
        listName: params.properties.projectsList,
        identityFieldName: 'GtGroupId',
        urlFieldName: 'GtSiteUrl'
      })
      params.portal = new PortalDataService().configure({ urlOrWeb: this.data.hub.web })
      params.spfxJsomContext.jsomContext.web['set_isMultilingual'](false)
      params.spfxJsomContext.jsomContext.web.update()
      await ExecuteJsomQuery(params.spfxJsomContext.jsomContext)
      return params
    } catch (error) {
      throw new BaseTaskError(this.taskName, strings.PreTaskErrorMessage, error)
    }
  }
}
