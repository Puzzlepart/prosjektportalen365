import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';

export interface IDeliveriesOverviewWebPartProps {
  dataSource: string;
  groupByColumns: IColumn[];
  excelExportEnabled: boolean;
}