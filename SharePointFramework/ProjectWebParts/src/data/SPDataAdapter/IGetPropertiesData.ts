import { TypedHash } from '@pnp/common';
import { IEntityField } from 'sp-entityportal-service';

export interface IGetPropertiesData {    
    /**
     * @todo Describe property
     */
    editFormUrl?: string;
    
    /**
     * @todo Describe property
     */
    versionHistoryUrl?: string;
    
    /**
     * @todo Describe property
     */
    fieldValues?: TypedHash<any>;
    
    /**
     * @todo Describe property
     */
    fieldValuesText?: TypedHash<string>;
    
    /**
     * @todo Describe property
     */
    fields?: IEntityField[];
}
