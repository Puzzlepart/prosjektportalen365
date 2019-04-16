import { IColumn, DetailsListLayoutMode, SelectionMode, ConstrainMode } from 'office-ui-fabric-react/lib/DetailsList';
import IExcelExportConfig from '../../../../@Shared/lib/interfaces/IExcelExportConfig';
import { SearchResult } from '@pnp/sp';

export interface IAggregatedSearchListProps {
    title: string;
    dataSource: string;
    legacyPageContext?: any;
    queryTemplate?: string;
    postFetch?: (results: SearchResult[]) => Promise<any[]>;
    selectProperties?: string[];
    showCommandBar?: boolean;
    showSearchBox?: boolean;
    loadingText?: string;
    searchBoxLabelText?: string;
    excelExportConfig?: IExcelExportConfig;
    columns?: IColumn[];
    layoutMode?: DetailsListLayoutMode;
    constrainMode?: ConstrainMode;
    selectionMode?: SelectionMode;
    groupByColumns?: IColumn[];
}