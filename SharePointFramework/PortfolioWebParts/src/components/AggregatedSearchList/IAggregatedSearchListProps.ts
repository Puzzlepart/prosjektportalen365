import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { sp } from '@pnp/sp';
import IExcelExportConfig from 'prosjektportalen-spfx-shared/lib/interfaces/IExcelExportConfig';

export interface IAggregatedSearchListProps {
    title: string;
    dataSource: string;
    queryTemplate?: string;
    customFetch?: (props: IAggregatedSearchListProps) => Promise<any[]>;
    selectProperties?: string[];
    showCommandBar?: boolean;
    excelExportEnabled?: boolean;
    excelExportConfig?: IExcelExportConfig;
    columns?: IColumn[];
    groupByColumns?: IColumn[];
}