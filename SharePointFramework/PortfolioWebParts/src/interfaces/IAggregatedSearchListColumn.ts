import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';

export interface IAggregatedSearchListColumn extends IColumn {
    /**
     * @todo Describe property
     */
    isGroupable?: boolean;
    
    /**
     * @todo Describe property
     */
    fieldNameDisplay?: string;
}
