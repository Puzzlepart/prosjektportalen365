import { IGroupByOption } from 'prosjektportalen-spfx-shared/lib/interfaces/IGroupByOption';

export interface IRiskOverviewWebPartProps {
    dataSource: string;
    showCommandBar: boolean;
    groupByOptions: IGroupByOption[];
    excelExportEnabled: boolean;
}