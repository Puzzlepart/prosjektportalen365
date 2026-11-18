import { IProjectSetupData } from 'extensions/projectSetup'
import * as strings from 'ProjectExtensionsStrings'
import { CloudTemplatePackage, PortalDataService } from 'pp365-shared-library/lib/services'
import { getTermStore, ITermSetInfo, SpEntityPortalService } from 'pp365-shared-library'
import initSpfxJsom, { ExecuteJsomQuery } from 'spfx-jsom'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import _ from 'underscore'
import resource from 'SharedResources'
import SPDataAdapter from 'data/SPDataAdapter'
import { Schema } from 'sp-js-provisioning'
import { NO_TEMPLATE_ID } from '../../constants'
import { getImportedPackageTemplate, layerPackageTemplate } from '../../packageTemplate'

/** Prepares template schemas, validates hub dependencies and initializes provisioning services. */
export class PreTask extends BaseTask {
  constructor(data: IProjectSetupData) {
    super('PreTask', data)
  }

  /** Loads the selected schema and prepares JSOM, entity and portal services for later tasks. */
  public async execute(params: IBaseTaskParams): Promise<IBaseTaskParams> {
    super.initExecute(params)

    if (this.data.selectedTemplate && this.data.selectedTemplate.id !== NO_TEMPLATE_ID) {
      // A catalog template's row points at the standard template, and its package's own project
      // template goes on top of it, as the packages are written.
      const { templateSchema, packageTemplateSchema } = layerPackageTemplate(
        await this.data.selectedTemplate.getSchema(),
        await this._getPackageTemplate()
      )
      params.templateSchema = templateSchema
      params.packageTemplateSchema = packageTemplateSchema
      // Publishing a cloud template provisions its hub dependencies, so only the others are
      // validated against the hub.
      if (!this.data.selectedTemplate.isCloudTemplate && !params.properties.forceTemplate) {
        await this.validateParameters(params)
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
   * Reads the selected catalog template's own project template: a cloud template's from its
   * package (downloaded here when a forced setup skipped the dialog), an imported one's from the
   * hub's Template Library. Other templates have none.
   */
  private async _getPackageTemplate(): Promise<Schema | undefined> {
    const template = this.data.selectedTemplate
    if (template.isCloudTemplate) {
      const cloudPackage =
        this.data.resolvedCloudTemplate?.package ??
        (await CloudTemplatePackage.fromUrl(template.cloudSourceUrl))
      return (await cloudPackage.getProjectTemplateSchema()) as Schema
    }
    if (!template.isImportedTemplate || !template.packageId) return undefined
    try {
      return await getImportedPackageTemplate(
        SPDataAdapter.portalDataService.web,
        resource.Lists_TemplateLibrary_Title,
        template.packageId
      )
    } catch (error) {
      throw new BaseTaskError(this.taskName, strings.PreTaskErrorMessage, error)
    }
  }

  /** Validates the phase term set and content-type IDs declared in template parameters. */
  private async validateParameters(params: IBaseTaskParams): Promise<void> {
    const parametersToValidate: string[] = _.toArray(params.templateSchema.Parameters) as string[]
    const [termSetIds] = parametersToValidate.filter((param) => _.isObject(param))
    const contentTypesToValidate = parametersToValidate
      .filter((param) => !_.isObject(param))
      .filter((ct) => ct.includes('0x'))
    await this.validateTermSetIds(termSetIds)
    await this.validateContentTypes(contentTypesToValidate)
  }

  /** Verifies that the configured GtProjectPhase term set exists and has a name. */
  private async validateTermSetIds(termSetIds: any) {
    const termSetId = termSetIds?.GtProjectPhase
    let termSet: ITermSetInfo
    try {
      termSet = await getTermStore(this.params.sp.web).sets.getById(termSetId)()
    } catch (error) {
      // The term store answers 404 for an unknown term set rather than an empty payload.
      this.logError(`Failed to validate term set ${termSetId}`, error)
      throw new BaseTaskError(
        this.taskName,
        strings.PreTaskTermSetIdValidationErrorMessage,
        error?.status === 404 ? strings.TermSetDoesNotExistError : error
      )
    }
    if (!termSet?.localizedNames?.[0]?.name) {
      this.logError(`Failed to validate term set ${termSetId}`)
      throw new BaseTaskError(
        this.taskName,
        strings.PreTaskTermSetIdValidationErrorMessage,
        strings.TermSetDoesNotExistError
      )
    }
  }

  /** Verifies that each configured content type can be read from the hub. */
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
