import { TypedHash } from '@pnp/common';
export interface IGetPropertiesData {
    editFormUrl?: string;
    versionHistoryUrl?: string;
    fieldValues?: TypedHash<any>;
    fieldValuesText?: TypedHash<string>;
}
