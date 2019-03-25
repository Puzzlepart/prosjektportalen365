import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';

export interface IRiskOverviewWebPartProps {
    dataSource: string;
    showCommandBar: boolean;
    groupByColumns: IColumn[];
    excelExportEnabled: boolean;
}