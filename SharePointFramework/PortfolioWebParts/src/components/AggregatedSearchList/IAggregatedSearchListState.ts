import { IContextualMenuProps } from 'office-ui-fabric-react/lib/ContextualMenu'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { DataSource } from 'shared/lib/models/DataSource'

export interface IAggregatedSearchListState {
    /**
     * Whether the component is loading
     */
    isLoading: boolean;
    
    /**
     * Whether there's an export in progress
     */
    isExporting?: boolean;

    /**
     * Items to show in the details list
     */
    items?: any[];

    /**
     * Selected data source
     */
    selectedDataSource?: DataSource;

    /**
     * Available data sources
     */
    dataSources?: DataSource[];

    /**
     * Columns to show in the DetailsList
     */
    columns: IColumn[];

    /**
     * Column to group by
     */
    groupBy?: IColumn;

    /**
     * Column to sort by
     */
    sortBy?: IColumn;

    /**
     * Search term
     */
    searchTerm?: string;

    /**
     * Error
     */
    error?: string;

    /**
     * Props for column header context menu
     */
    columnContextMenu?: IContextualMenuProps;
}