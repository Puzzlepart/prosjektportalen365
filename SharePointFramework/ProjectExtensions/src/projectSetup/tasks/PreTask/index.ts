import { IProjectSetupData } from 'projectSetup'
import * as strings from 'ProjectExtensionsStrings'
import { PortalDataService } from 'pp365-shared/lib/services'
import { SpEntityPortalService } from 'sp-entityportal-service'
import initSpfxJsom, { ExecuteJsomQuery } from 'spfx-jsom'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import _ from 'underscore'
import { ITaxonomySession, Session } from '@pnp/sp-taxonomy'
import SPDataAdapter from 'data/SPDataAdapter'

export class PreTask extends BaseTask {
  constructor(data: IProjectSetupData) {
    super('PreTask', data)
  }

  /**
   * Execute PreTask
   *
   * @param params Task parameters
   */
  public async execute(params: IBaseTaskParams): Promise<IBaseTaskParams> {
    params.templateSchema = await this.data.selectedTemplate.getSchema()
    if (!params.properties.forceTemplate) {
      await this.validateParameters(params)
    }

    try {
      params.spfxJsomContext = await initSpfxJsom(params.context.pageContext.site.absoluteUrl, {
        loadTaxonomy: true
      })
      params.entityService = new SpEntityPortalService({
        portalUrl: SPDataAdapter.portal.url,
        listName: params.properties.projectsList,
        identityFieldName: 'GtGroupId',
        urlFieldName: 'GtSiteUrl'
      })
      params.portal = await new PortalDataService().configure({
        pageContext: params.context.pageContext
      })
      params.spfxJsomContext.jsomContext.web['set_isMultilingual'](false)
      params.spfxJsomContext.jsomContext.web.update()
      await ExecuteJsomQuery(params.spfxJsomContext.jsomContext)
      return params
    } catch (error) {
      throw new BaseTaskError(this.taskName, strings.PreTaskErrorMessage, error)
    }
  }

  /**
   * Checks that the parameters are valid
   *
   * @param params - Task params
   */
  private async validateParameters(params: IBaseTaskParams): Promise<void> {
    const parametersToValidate: string[] = _.toArray(params.templateSchema.Parameters) as string[]
    const [termSetIds] = parametersToValidate.filter((param) => _.isObject(param))
    const contentTypesToValidate = parametersToValidate
      .filter((param) => !_.isObject(param))
      .filter((ct) => ct.includes('0x'))
    await this.validateTermSetIds(termSetIds)
    await this.validateContentTypes(contentTypesToValidate)
  }

  /**
   * Checks that the term set IDs are valid
   *
   * @param termSetIds - Term set IDs
   */
  private async validateTermSetIds(termSetIds: any) {
    const taxonomySession: ITaxonomySession = new Session()
    const termSet = await taxonomySession
      .getDefaultSiteCollectionTermStore()
      .getTermSetById(termSetIds.GtProjectPhase)
      .get()
    if (!termSet.Name) {
      this.logError(`Failed to validate term set ${termSetIds.GtProjectPhase}`)
      throw new BaseTaskError(
        this.taskName,
        strings.PreTaskTermSetIdValidationErrorMessage,
        strings.TermSetDoesNotExistError
      )
    }
  }

  /**
   * Checks that the content types are valid and exist in the hub
   *
   * @param contentTypes - Content types to validate
   */
  private async validateContentTypes(contentTypes: string[]): Promise<void> {
    await Promise.all(
      contentTypes.map(async (ct) => {
        try {
          await SPDataAdapter.portal.web.contentTypes.getById(ct).get()
        } catch (error) {
          this.logError(`Failed to validate content type ${ct}`)
          throw new BaseTaskError(
            this.taskName,
            strings.PreTaskContentTypeValidationErrorMessage,
            error
          )
        }
      })
    )
  }
}
