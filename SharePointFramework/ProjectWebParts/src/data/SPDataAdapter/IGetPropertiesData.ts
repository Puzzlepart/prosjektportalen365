import { TypedHash } from '@pnp/common';
import { IEntityField } from 'sp-entityportal-service';

export interface IGetPropertiesData {
    editFormUrl?: string;
    versionHistoryUrl?: string;
    fieldValues?: TypedHash<any>;
    fieldValuesText?: TypedHash<string>;
    fields?: IEntityField[];
}
