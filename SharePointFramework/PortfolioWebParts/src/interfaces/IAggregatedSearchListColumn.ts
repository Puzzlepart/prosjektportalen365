import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';

export interface IAggregatedSearchListColumn extends IColumn {
    isGroupable?: boolean;
    fieldNameDisplay?: string;
}
