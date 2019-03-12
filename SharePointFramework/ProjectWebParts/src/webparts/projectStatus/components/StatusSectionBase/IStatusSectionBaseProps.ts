import { WebPartContext } from '@microsoft/sp-webpart-base';
import ProjectStatusReport from "../../models/ProjectStatusReport";
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';

export interface IStatusSectionBaseProps {
    report: ProjectStatusReport;
    context: WebPartContext;
    entityFields: any[];
    entityItem: any;
    fieldNames?: string[];
    projectDeliveryColumns?: IColumn[];
}

export const StatusSectionDefaultProps: Partial<IStatusSectionBaseProps> = {
  projectDeliveryColumns: [
    {
      key: 'title',
      name: 'Tittel',
      fieldName: null,
      minWidth: 200
    },
    {
      key: 'acceptanceDate',
      name: 'Godkjent dato',
      fieldName: null,
      minWidth: 200
    },
    {
      key: 'deliveryStatus',
      name: 'Leveransestatus',
      fieldName: null,
      minWidth: 200
    },
    {
      key: 'deliveryStatusComment',
      name: 'Kommentar, leveransestatus',
      fieldName: null,
      minWidth: 200
    },
    {
      key: 'qualityExpectations',
      name: 'Kvalitetsforventninger',
      fieldName: null,
      minWidth: 200
    }
  ]
};
