import { IProjectSetupData } from 'extensions/projectSetup'
import * as strings from 'ProjectExtensionsStrings'
import { CloudTemplatePackage, PortalDataService } from 'pp365-shared-library/lib/services'
import { SpEntityPortalService } from 'sp-entityportal-service'
import initSpfxJsom, { ExecuteJsomQuery } from 'spfx-jsom'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import _ from 'underscore'
import resource from 'SharedResources'
import SPDataAdapter from 'data/SPDataAdapter'
import { NO_TEMPLATE_ID } from '../../constants'

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
    super.initExecute(params)

    if (this.data.selectedTemplate && this.data.selectedTemplate.id !== NO_TEMPLATE_ID) {
      if (this.data.selectedTemplate.isCloudTemplate) {
        // Forced/auto setup can bypass dialog resolution, so download on demand.
        // Hub-bound validation remains disabled because cloud publication provisions
        // dependencies; thin packages fall back to the standard schema below.
        const cloudPackage =
          this.data.resolvedCloudTemplate?.package ??
          (await CloudTemplatePackage.fromUrl(this.data.selectedTemplate.cloudSourceUrl))
        const bundled = await cloudPackage.getProjectTemplateSchema()
        // Thin packages omit Parameters and rely on the standard template for base
        // schema. This only reads the hub; later tasks apply bundled artifacts.
        params.templateSchema =
          bundled.Parameters && Object.keys(bundled.Parameters).length > 0
            ? bundled
            : await this.data.selectedTemplate.getSchema()
      } else {
        params.templateSchema = await this.data.selectedTemplate.getSchema()
        if (!params.properties.forceTemplate) {
          await this.validateParameters(params)
        }
      }
    } else {
      params.templateSchema = { Parameters: {} }
    }

    try {
      params.spfxJsomContext = await initSpfxJsom(params.context.pageContext.site.absoluteUrl, {
        loadTaxonomy: true
      })
      params.entityService = new SpEntityPortalService(params.context, {
        portalUrl: SPDataAdapter.portalDataService.url,
        listName: resource.Lists_Projects_Title,
        identityFieldName: 'GtGroupId',
        urlFieldName: 'GtSiteUrl'
      })
      params.portalDataService = await new PortalDataService().configure({
        spfxContext: params.context
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
    const termSet = await this.params.sp.termStore.sets.getById(termSetIds.GtProjectPhase)()
    if (!termSet?.localizedNames[0]?.name) {
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
      contentTypes.map(async (contentTypeId) => {
        try {
          await SPDataAdapter.portalDataService.web.contentTypes.getById(contentTypeId)()
        } catch (error) {
          this.logError(`Failed to validate content type ${contentTypeId}`)
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
