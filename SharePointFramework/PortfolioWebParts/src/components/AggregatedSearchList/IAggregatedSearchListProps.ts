import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import IExcelExportConfig from 'prosjektportalen-spfx-shared/lib/interfaces/IExcelExportConfig';

export interface IAggregatedSearchListProps {
    title: string;
    dataSource: string;
    queryTemplate?: string;
    postFetch?: (results: any[]) => Promise<any[]>;
    selectProperties?: string[];
    showCommandBar?: boolean;
    showSearchBox?: boolean;
    excelExportConfig?: IExcelExportConfig;
    columns?: IColumn[];
    groupByColumns?: IColumn[];
}