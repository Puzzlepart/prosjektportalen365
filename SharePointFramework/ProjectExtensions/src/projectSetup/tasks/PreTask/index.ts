import { IProjectSetupData } from 'projectSetup'
import * as strings from 'ProjectExtensionsStrings'
import { PortalDataService } from 'pp365-shared/lib/services'
import { SpEntityPortalService } from 'sp-entityportal-service'
import initSpfxJsom, { ExecuteJsomQuery } from 'spfx-jsom'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import _ from 'underscore'

export class PreTask extends BaseTask {
  constructor(data: IProjectSetupData) {
    super('PreTask', data)
  }

  /**
   * Execute PreTask
   *
   * @param params Task parameters
   * @param onProgress On progress function
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(params: IBaseTaskParams): Promise<IBaseTaskParams> {
    params.templateSchema = await this.data.selectedTemplate.getSchema()
    await this.validateContentTypes(params)
    try {
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

  /**
   * Checks that the content types are valid and exist in the hub
   * @param params IBaseTaskParams
   */
  private async validateContentTypes(params: IBaseTaskParams): Promise<void> {
    const contentTypeToValidate: string[] = (_.toArray(params.templateSchema.Parameters) as string[])
    .filter((item: string) => item.includes('0x'))

    await Promise.all(
      contentTypeToValidate.map(async (ct) => {
        try {
          await this.data.hub.web.contentTypes.getById(ct).get()
        } catch (error) {
          throw new BaseTaskError(this.taskName,strings.PreTaskErrorMessage,`Innholdstypen ${ct} eksisterer ikke. 
          Sjekk om prosjektegenskaper og prosjektstatus innholdstypene er korrekt i maloppsett.`)
        }
      })
    )
  }
}
