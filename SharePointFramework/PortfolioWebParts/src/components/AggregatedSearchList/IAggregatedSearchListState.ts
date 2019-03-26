import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';

export interface IAggregatedSearchListState {
    isLoading: boolean;
    isExporting?: boolean;
    items?: any[];
    columns: IColumn[];
    groupBy?: IColumn;
    searchTerm?: string;
    error?: string;
}