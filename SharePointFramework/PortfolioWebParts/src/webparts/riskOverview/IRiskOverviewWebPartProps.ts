import IGroupByOption from '../../common/interfaces/IGroupByOption';

export interface IRiskOverviewWebPartProps {
    dataSource: string;
    showCommandBar: boolean;
    groupByOptions: IGroupByOption[];
    excelExportEnabled: boolean;
}