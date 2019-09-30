import { sp, Web } from '@pnp/sp';
import { TypedHash } from '@pnp/common';
import * as strings from 'ProjectExtensionsStrings';
import * as formatString from 'string-format';
import { ListContentConfig } from '../../models';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { BaseTaskError } from '../BaseTaskError';
import { IBaseTaskParams } from '../IBaseTaskParams';

export default new class CopyListData extends BaseTask {
    public taskName = 'CopyListData';
    private _progressText: string;

    /**
     * Execute CopyListData
     * 
     * @param {IBaseTaskParams} params Task parameters 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            for (let i = 0; i < params.data.selectedListConfig.length; i++) {
                const listConfig = params.data.selectedListConfig[i];
                this._progressText = formatString(strings.CopyListDataText, listConfig.sourceList, listConfig.destinationLibrary || listConfig.destinationList);
                onProgress(this._progressText, '', 'List');
                await this._processListItems(listConfig, onProgress);
            }
            return params;
        } catch (error) {
            throw new BaseTaskError(this.taskName, strings.CopyListDataErrorMessage, error);
        }
    }

    /**
     * Process list items
     * 
     * @param {ListContentConfig} listConfig List config
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    private async _processListItems(listConfig: ListContentConfig, onProgress: OnProgressCallbackFunction) {
        try {
            this.logInformation('Processing list items', { listConfig });
            let destList = sp.web.lists.getByTitle(listConfig.destinationList);
            let [sourceItems, sourceFields, destListProps] = await Promise.all([
                (listConfig.web as Web).lists.getByTitle(listConfig.sourceList).items.select(...listConfig.fields, 'TaxCatchAll/ID', 'TaxCatchAll/Term').expand('TaxCatchAll').get<any[]>(),
                (listConfig.web as Web).lists.getByTitle(listConfig.sourceList).fields.select('Id', 'InternalName', 'TypeAsString', 'TextField').get<Array<{ Id: string, InternalName: string, TypeAsString: string, TextField: string }>>(),
                destList.select('ListItemEntityTypeFullName').get<{ ListItemEntityTypeFullName: string }>(),
            ]);
            for (let i = 0; i < sourceItems.length; i++) {
                let properties = listConfig.fields.reduce((obj: TypedHash<any>, fieldName: string) => {
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
                                            obj[textField.InternalName] = `-1;#${taxonomyFieldValue.Term}|${fieldValue.TermGuid}`;
                                        }
                                    }
                                }
                                    break;
                                default: {
                                    obj[fieldName] = fieldValue;
                                }
                            }
                        }
                    }
                    return obj;
                }, {});
                this.logInformation(`Processing list item ${i + 1}`, { properties, TaxCatchAll: sourceItems[i].TaxCatchAll });
                onProgress(this._progressText, formatString(strings.ProcessListItemText, i + 1, sourceItems.length), 'List');
                await destList.items.add(properties, destListProps.ListItemEntityTypeFullName);
            }
        } catch (error) {
            throw error;
        }
    }
};
