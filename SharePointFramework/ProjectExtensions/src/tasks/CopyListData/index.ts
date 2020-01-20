import { TypedHash } from '@pnp/common';
import { List, sp } from '@pnp/sp';
import { IProjectSetupData } from 'extensions/projectSetup';
import * as strings from 'ProjectExtensionsStrings';
import { SPField } from 'shared/lib/models/SPField';
import * as formatString from 'string-format';
import { ListContentConfig } from '../../models';
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask';
import { OnProgressCallbackFunction } from '../OnProgressCallbackFunction';

export class CopyListData extends BaseTask {
    public taskName = 'CopyListData';

    constructor(data: IProjectSetupData) {
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
     * Get source items
     * 
     * @param {ListContentConfig} listContentConfig List config
     */
    private async _getSourceItems(listConfig: ListContentConfig) {
        try {
            return await listConfig.list.items.select(...listConfig.fields, 'TaxCatchAll/ID', 'TaxCatchAll/Term').expand('TaxCatchAll').top(500).get();
        } catch (error) {
            try {
                return await listConfig.list.items.select(...listConfig.fields).top(500).get();
            } catch (error) {
                return [];
            }
        }
    }

    /**
     * Get source fields
     * 
     * @param {ListContentConfig} listContentConfig List config
     */
    private async _getSourceFields(listContentConfig: ListContentConfig): Promise<SPField[]> {
        try {
            return await listContentConfig.list.fields.select(...Object.keys(new SPField())).get<SPField[]>();
        } catch (error) {
            return [];
        }
    }

    /**
     * Get list entity type
     * 
     * @param {List} destList Destination list
     */
    private async _getListProperties(destList: List) {
        try {
            return await destList.select('ListItemEntityTypeFullName', 'ItemCount').get<{ ListItemEntityTypeFullName: string, ItemCount: number }>();
        } catch (error) {
            return undefined;
        }
    }

    /**
     * Process list items
     * 
     * @param {ListContentConfig} listContentConfig List config
     * @param {OnProgressCallbackFunction} onProgress On progress function
     * @param {number} batchChunkSize Batch chunk size (defaults to 25)
     */
    private async _processListItems(listContentConfig: ListContentConfig, onProgress: OnProgressCallbackFunction, batchChunkSize: number = 25) {
        try {
            this.logInformation('Processing list items', { listConfig: listContentConfig });
            let destList = sp.web.lists.getByTitle(listContentConfig.destinationList);
            let [destListProperties, sourceListProperties] = await Promise.all([
                this._getListProperties(destList),
                this._getListProperties(listContentConfig.list),
            ]);
            let progressText = formatString(strings.CopyListDataText, sourceListProperties.ItemCount, listContentConfig.sourceList, listContentConfig.destinationList);
            onProgress(progressText, '', 'List');

            let [sourceItems, sourceFields] = await Promise.all([
                this._getSourceItems(listContentConfig),
                this._getSourceFields(listContentConfig),
            ]);

            let itemsToAdd = sourceItems.map(itm => this._getProperties(listContentConfig.fields, itm, sourceFields));

            for (let i = 0, j = 0; i < itemsToAdd.length; i += batchChunkSize, j++) {
                let batch = sp.createBatch();
                let batchItems = itemsToAdd.slice(i, i + batchChunkSize);
                this.logInformation(`Processing batch ${j + 1} with ${batchItems.length} items`, {});
                onProgress(progressText, formatString(strings.ProcessListItemText, j + 1, batchItems.length), 'List');
                batchItems.forEach(item => destList.items.inBatch(batch).add(item, destListProperties.ListItemEntityTypeFullName));
                await batch.execute();
            }
        } catch (error) {
            throw error;
        }
    }


    /**
     * Get item properties
     * 
     * @param {string[]} fields Fields
     * @param {TypedHash} sourceItem Source item
     * @param {any[]} sourceFields Source fields
     */
    private _getProperties(fields: string[], sourceItem: TypedHash<any>, sourceFields: SPField[]) {
        return fields.reduce((obj: TypedHash<any>, fieldName: string) => {
            let fieldValue = sourceItem[fieldName];
            if (fieldValue) {
                const [field] = sourceFields.filter(fld => fld.InternalName === fieldName);
                if (field) {
                    switch (field.TypeAsString) {
                        case 'TaxonomyFieldType':
                            {
                                const [textField] = sourceFields.filter(fld => fld.Id === field.TextField);
                                if (textField) {
                                    const [taxonomyFieldValue] = (sourceItem.TaxCatchAll || []).filter((tax: any) => tax.ID === fieldValue.WssId);
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
    }
}
