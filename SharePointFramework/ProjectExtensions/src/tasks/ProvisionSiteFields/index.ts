import { override } from '@microsoft/decorators';
import { task } from 'decorators/task';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import { Web } from 'sp-js-provisioning';
import * as stringFormat from 'string-format';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { BaseTaskError } from '../BaseTaskError';
import { IBaseTaskParams } from '../IBaseTaskParams';
import { DOMParser } from 'xmldom';

export class SPField {
    // tslint:disable-next-line: naming-convention
    public InternalName: string = '';
    // tslint:disable-next-line: naming-convention
    public Title: string = '';
    // tslint:disable-next-line: naming-convention
    public SchemaXml: string = '';
    // tslint:disable-next-line: naming-convention
    public TypeAsString: string = '';
}

@task('ProvisionSiteFields')
export default class ProvisionSiteFields extends BaseTask {
    /**
     * Execute ProvisionSiteFields
     * 
     * @param {IBaseTaskParams} params Task parameters 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    @override
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            const web = new Web(params.context.pageContext.web.absoluteUrl);
            const existingSiteFields = await web.fields.select(...Object.keys(new SPField())).get<SPField[]>();
            const siteFields = await params.data.hub.web.fields.filter(`Group eq '${strings.SiteFieldsGroupName}' and TypeAsString ne 'Calculated'`).select(...Object.keys(new SPField())).get<SPField[]>();
            for (let i = 0; i < siteFields.length; i++) {
                let siteField = siteFields[i];
                if (existingSiteFields.filter(exf => exf.InternalName === siteField.InternalName).length > 0) continue;
                this.logInformation('Processing site field', { siteField });
                onProgress(stringFormat(strings.ProvisionSiteFieldsText, siteField.Title), 'EditCreate');
                let fieldXml = this._getFieldXml(siteField);
                this.logInformation(`Processing site field ${siteField.Title}`, { fieldXml });
                await web.fields.createFieldAsXml(fieldXml);
                this.logInformation(`Site field ${siteField.Title} successfully created`, { fieldXml });
            }
            return params;
        } catch (error) {
            this.logError('Failed to provision site fields to site');
            throw new BaseTaskError(this.name, strings.ProvisionSiteFieldsErrorMessage, '');
        }
    }

    /**
     * Get field XML
     * 
     * @param {SPField} siteField Site field
     */
    private _getFieldXml(siteField: SPField): string {
        let { documentElement } = new DOMParser().parseFromString(siteField.SchemaXml);
        documentElement.removeAttribute('Version');
        documentElement.removeAttribute('SourceID');
        documentElement.removeAttribute('Required');
        documentElement.removeAttribute('WebId');
        documentElement.removeAttribute('Hidden');
        documentElement.removeAttribute('List');
        return documentElement.toString();
    }
}
