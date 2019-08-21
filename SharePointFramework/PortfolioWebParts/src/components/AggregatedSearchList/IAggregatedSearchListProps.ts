import { IColumn, DetailsListLayoutMode, SelectionMode, ConstrainMode } from 'office-ui-fabric-react/lib/DetailsList';
import { SearchResult } from '@pnp/sp';
import { IBaseComponentProps } from '../IBaseComponentProps';

export interface IAggregatedSearchListProps extends IBaseComponentProps {
    dataSource?: string;
    queryTemplate?: string;
    postFetch?: (results: SearchResult[]) => Promise<any[]>;
    selectProperties?: string[];
    showCommandBar?: boolean;
    showSearchBox?: boolean;
    loadingText?: string;
    searchBoxPlaceholderText?: string;
    excelExportEnabled?: boolean;
    columns?: IColumn[];
    layoutMode?: DetailsListLayoutMode;
    constrainMode?: ConstrainMode;
    selectionMode?: SelectionMode;
    groupByColumns?: IColumn[];
}

export const AggregatedSearchListDefaultProps: Partial<IAggregatedSearchListProps> = {
    showCommandBar: true,
    showSearchBox: true,
    layoutMode: DetailsListLayoutMode.justified,
    constrainMode: ConstrainMode.horizontalConstrained,
    selectionMode: SelectionMode.none,
    groupByColumns: [],
};