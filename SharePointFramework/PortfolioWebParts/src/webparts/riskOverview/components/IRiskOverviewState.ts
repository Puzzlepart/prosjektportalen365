import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';

export interface IRiskOverviewState {
    isLoading: boolean;
    items?: any[];
    columns: IColumn[];
    groupBy?: IColumn;
    searchTerm?: string;
    error?: string;
}