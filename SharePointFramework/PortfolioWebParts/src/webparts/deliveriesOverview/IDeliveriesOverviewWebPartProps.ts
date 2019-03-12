import IGroupByOption from '../../common/interfaces/IGroupByOption';

export interface IDeliveriesOverviewWebPartProps { 
    dataSource: string;
    groupByOptions: IGroupByOption[];
    excelExportEnabled: boolean;
  }