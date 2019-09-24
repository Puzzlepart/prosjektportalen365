import { override } from '@microsoft/decorators';
import { task } from 'decorators/task';
import * as strings from 'ProjectExtensionsStrings';
import * as stringFormat from 'string-format';
import { DOMParser } from 'xmldom';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { BaseTaskError } from '../BaseTaskError';
import { IBaseTaskParams } from '../IBaseTaskParams';

export class SPField {
    // tslint:disable-next-line: naming-convention
    public InternalName: string = '';
    // tslint:disable-next-line: naming-convention
    public Title?: string = '';
    // tslint:disable-next-line: naming-convention
    public SchemaXml: string = '';
    // tslint:disable-next-line: naming-convention
    public TypeAsString?: string = '';
}

export default new class ProvisionSiteFields extends BaseTask {
    public taskName = 'ProvisionSiteFields';
    
    /**
     * Execute ProvisionSiteFields
     * 
     * @param {IBaseTaskParams} params Task parameters 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            const siteFields = await params.data.hub.web.fields.filter(`Group eq '${strings.SiteFieldsGroupName}' and TypeAsString ne 'Calculated'`).select(...Object.keys(new SPField())).get<SPField[]>();
            for (let i = 0; i < siteFields.length; i++) {
                let siteField = siteFields[i];
                this.logInformation('Processing site field', { siteField });
                onProgress(stringFormat(strings.ProvisionSiteFieldsText, siteField.Title), 'EditCreate');
                let fieldXml = ProvisionSiteFields.parseFieldXml(siteField);
                this.logInformation(`Processing site field ${siteField.Title}`, { fieldXml });
                await params.web.fields.createFieldAsXml(fieldXml);
                this.logInformation(`Site field ${siteField.Title} successfully created`, { fieldXml });
            }
            return params;
        } catch (error) {
            this.logError('Failed to provision site fields to site');
            throw new BaseTaskError(this.taskName, strings.ProvisionSiteFieldsErrorMessage, '');
        }
    }

    /**
     * Parse field XML
     * 
     * @param {SPField} siteField Site field
     * @param {Object} attributes Attributes
     */
    public static parseFieldXml(siteField: SPField, attributes: { [key: string]: string } = {}): string {
        let { documentElement } = new DOMParser().parseFromString(siteField.SchemaXml);
        documentElement.removeAttribute('Version');
        documentElement.removeAttribute('SourceID');
        documentElement.removeAttribute('Required');
        documentElement.removeAttribute('WebId');
        documentElement.removeAttribute('Hidden');
        documentElement.removeAttribute('List');
        for (let key of Object.keys(attributes)) {
            documentElement.setAttribute(key, attributes[key]);
        }
        return documentElement.toString();
    }
};