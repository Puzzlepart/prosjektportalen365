import { IProjectSetupData } from 'extensions/projectSetup'
import * as strings from 'ProjectExtensionsStrings'
import * as formatString from 'string-format'
import { transformFieldXml } from 'shared/lib/helpers'
import { SPField } from 'shared/lib/models'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../OnProgressCallbackFunction'

export class ProvisionSiteFields extends BaseTask {
    public taskName = 'ProvisionSiteFields';

    constructor(data: IProjectSetupData) {
        super(data)
    }

    /**
     * Execute ProvisionSiteFields
     * 
     * @param {IBaseTaskParams} params Task parameters 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            if ((params.templateSchema.Parameters || {}).ProvisionSiteFields) {
                this.logInformation('Provisionining site fields to site', { parameters: params.templateSchema.Parameters })
                const existingSiteFields = await params.web.fields.select(...Object.keys(new SPField())).get<SPField[]>()
                const siteFields = await this.data.hub.web.fields.filter(`Group eq '${params.templateSchema.Parameters.ProvisionSiteFields}' and TypeAsString ne 'Calculated'`).select(...Object.keys(new SPField())).get<SPField[]>()
                this.logInformation(`Retrieved ${siteFields.length} site fields from hub`)
                for (let i = 0; i < siteFields.length; i++) {
                    const siteField = siteFields[i]
                    if (existingSiteFields.filter(exf => exf.InternalName === siteField.InternalName).length > 0) {
                        this.logInformation(`Site field ${siteField.InternalName} already exists in site`)
                        continue
                    }
                    onProgress(strings.ProvisionSiteFieldsText, formatString(strings.ProvisionSiteFieldText, siteField.Title), 'EditCreate')
                    const fieldXml = transformFieldXml(siteField.SchemaXml)
                    this.logInformation(`Processing site field ${siteField.Title} (${siteField.InternalName})`, fieldXml)
                    await params.web.fields.createFieldAsXml(fieldXml)
                    this.logInformation(`Site field ${siteField.Title} (${siteField.InternalName}) successfully created`)
                }
            }
            return params
        } catch (error) {
            this.logError('Failed to provision site fields to site')
            throw new BaseTaskError(this.taskName, strings.ProvisionSiteFieldsErrorMessage, '')
        }
    }
}