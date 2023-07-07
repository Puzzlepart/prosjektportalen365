import { getObjectValue as get } from 'pp365-shared-library'
import * as strings from 'ProjectExtensionsStrings'
import { IProjectSetupData } from 'projectSetup'
import { ExecuteJsomQuery } from 'spfx-jsom'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'

export class SetTaxonomyFields extends BaseTask {
  constructor(data: IProjectSetupData) {
    super('SetTaxonomyFields', data)
  }

  /**
   * Execute CopyListData
   *
   * @param params Task parameters
   * @param onProgress On progress function
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(params: IBaseTaskParams): Promise<IBaseTaskParams> {
    try {
      const {
        spfxJsomContext: { jsomContext, defaultTermStore }
      } = params
      await ExecuteJsomQuery(jsomContext, [{ clientObject: defaultTermStore, exps: 'Id' }])
      this.logInformation(`Retrieved ID ${defaultTermStore.get_id()} for default term store`)
      const termSetIds = get(
        params.templateSchema,
        'Parameters.TermSetIds',
        params.properties.termSetIds
      )
      Object.keys(termSetIds).forEach((fieldName) => {
        const termSetId = termSetIds[fieldName]
        if (!termSetId) {
          return params
        }
        this.logInformation(`Setting Term Set ID ${termSetId} for ${fieldName}`)
        const field: SP.Field = jsomContext.rootWeb.get_fields().getByInternalNameOrTitle(fieldName)
        const taxField: SP.Taxonomy.TaxonomyField = jsomContext.clientContext.castTo(
          field,
          SP.Taxonomy.TaxonomyField
        ) as SP.Taxonomy.TaxonomyField
        taxField.set_sspId(defaultTermStore.get_id())
        taxField.set_termSetId(new SP.Guid(termSetId))
        taxField.updateAndPushChanges(true)
      })
      await ExecuteJsomQuery(jsomContext)
      return params
    } catch (error) {
      throw new BaseTaskError(this.taskName, strings.SetTaxonomyFieldsErrorMessage, error)
    }
  }
}
