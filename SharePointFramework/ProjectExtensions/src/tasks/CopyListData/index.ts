import { TypedHash } from '@pnp/common';
import { sp, Web } from '@pnp/sp';
import { IProjectSetupApplicationCustomizerData } from 'extensions/projectSetup/IProjectSetupApplicationCustomizerData';
import * as strings from 'ProjectExtensionsStrings';
import * as formatString from 'string-format';
import { ListContentConfig } from '../../models';
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask';
import { OnProgressCallbackFunction } from '../OnProgressCallbackFunction';

export class CopyListData extends BaseTask {
    public taskName = 'CopyListData';

    constructor(data: IProjectSetupApplicationCustomizerData) {
        super(data);
    }

    /**
     * Execute CopyListData
     * 
     * @param {IBaseTaskParams} params Task parameters 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            for (let i = 0; i < this.data.selectedListContentConfig.length; i++) {
                const listConfig = this.data.selectedListContentConfig[i];
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
            let progressText = formatString(strings.CopyListDataText, sourceItems.length, listConfig.sourceList, listConfig.destinationLibrary || listConfig.destinationList);
            onProgress(progressText, '', 'List');
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
                onProgress(progressText, formatString(strings.ProcessListItemText, i + 1, sourceItems.length), 'List');
                await destList.items.add(properties, destListProps.ListItemEntityTypeFullName);
            }
        } catch (error) {
            throw error;
        }
    }
}
