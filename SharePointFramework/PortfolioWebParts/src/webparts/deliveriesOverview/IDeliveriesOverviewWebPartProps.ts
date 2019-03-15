import { IGroupByOption } from 'prosjektportalen-spfx-shared/lib/interfaces/IGroupByOption';

export interface IDeliveriesOverviewWebPartProps {
  dataSource: string;
  groupByOptions: IGroupByOption[];
  excelExportEnabled: boolean;
}