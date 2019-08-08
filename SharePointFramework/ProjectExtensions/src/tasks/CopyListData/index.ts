import { sp, Web } from '@pnp/sp';
import { override } from '@microsoft/decorators';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import * as stringFormat from 'string-format';
import { IBaseTaskParams } from '../IBaseTaskParams';
import { BaseTaskError } from '../BaseTaskError';
import { ListContentConfig } from '../../models';
import { task } from 'decorators/task';

@task('CopyListData')
export default class CopyListData extends BaseTask {
    /**
     * Execute CopyListData
     * 
     * @param {IBaseTaskParams} params Params 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    @override
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            for (let i = 0; i < params.data.selectedListConfig.length; i++) {
                const listConfig = params.data.selectedListConfig[i];
                onProgress(stringFormat(strings.CopyListDataText, listConfig.sourceList, listConfig.destinationLibrary || listConfig.destinationList), 'List');
                await this.processListItems(listConfig);
            }
            return params;
        } catch (error) {
            throw new BaseTaskError(this.name, strings.CopyListDataErrorMessage, error);
        }
    }

    /**
     * Process list items
     * 
     * @param {ListContentConfig} listConfig List config
     */
    private async processListItems(listConfig: ListContentConfig) {
        try {
            this.logInformation('Processing list items', { listConfig });
            let destList = sp.web.lists.getByTitle(listConfig.destinationList);
            let [sourceItems, sourceFields, { ListItemEntityTypeFullName }] = await Promise.all([
                (listConfig.web as Web).lists.getByTitle(listConfig.sourceList).items.select(...listConfig.fields, 'TaxCatchAll/ID', 'TaxCatchAll/Term').expand('TaxCatchAll').get<any[]>(),
                (listConfig.web as Web).lists.getByTitle(listConfig.sourceList).fields.select('Id', 'InternalName', 'TypeAsString', 'TextField').get<Array<{ Id: string, InternalName: string, TypeAsString: string, TextField: string }>>(),
                destList.select('ListItemEntityTypeFullName').get<{ ListItemEntityTypeFullName: string }>(),
            ]);
            for (let i = 0; i < sourceItems.length; i++) {
                let properties = listConfig.fields.reduce((_properties: { [x: string]: any; }, fieldName: string) => {
                    let fieldValue = sourceItems[i][fieldName];
                    if (fieldValue) {
                        const [field] = sourceFields.filter(fld => fld.InternalName === fieldName);
                        if (field) {
                            switch (field.TypeAsString) {
                                case 'TaxonomyFieldType': {
                                    const [textField] = sourceFields.filter(fld => fld.Id === field.TextField);
                                    if (textField) {
                                        const [taxonomyFieldValue] = sourceItems[i].TaxCatchAll.filter((tca: { ID: number, Term: string }) => tca.ID === fieldValue.WssId);
                                        if (taxonomyFieldValue) {
                                            _properties[textField.InternalName] = `-1;#${taxonomyFieldValue.Term}|${fieldValue.TermGuid}`;
                                        }
                                    }
                                }
                                    break;
                                default: {
                                    _properties[fieldName] = fieldValue;
                                }
                            }
                        }
                    }
                    return _properties;
                }, {});
                this.logInformation(`Processing list item ${i + 1}`, { properties, TaxCatchAll: sourceItems[i].TaxCatchAll });
                await destList.items.add(properties, ListItemEntityTypeFullName);
            }
        } catch (error) {
            throw error;
        }
    }
}
