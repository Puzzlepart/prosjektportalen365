import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { IDeliveriesOverviewWebPartProps } from '../IDeliveriesOverviewWebPartProps';
import formatDate from '../../../common/helpers/formatDate';

export interface IDeliveriesOverviewProps extends IDeliveriesOverviewWebPartProps {
    context: WebPartContext;
    columns?: IColumn[];
}

export const DeliveriesOverviewDefaultProps: Partial<IDeliveriesOverviewProps> = {
    columns: [{
        key: 'Title',
        fieldName: 'Title',
        name: 'Tittel',
        minWidth: 220,
        maxWidth: 300,
        isMultiline: true,
        isResizable: true,
    },
    {
        key: 'SiteTitle',
        fieldName: 'SiteTitle',
        name: 'Prosjekt',
        minWidth: 220,
        isMultiline: true,
        isResizable: true,
    },
    {
        key: 'GtDeliveryDescriptionOWSMTXT',
        fieldName: 'GtDeliveryDescriptionOWSMTXT',
        name: 'Leveransebeskrivelse',
        minWidth: 220,
        isMultiline: true,
        isResizable: true,
    },
    {
        key: 'GtDeliveryStartTimeOWSDATE',
        fieldName: 'GtDeliveryStartTimeOWSDATE',
        name: 'Starttidspunkt',
        minWidth: 100,
        isMultiline: false,
        isResizable: true,
        onRender: (item, _index, column) => formatDate(item[column.fieldName]),
    },
    {
        key: 'GtDeliveryEndTimeOWSDATE',
        fieldName: 'GtDeliveryEndTimeOWSDATE',
        name: 'Sluttidspunkt',
        minWidth: 100,
        isMultiline: false,
        isResizable: true,
        onRender: (item, _index, column) => formatDate(item[column.fieldName]),
    },
    {
        key: 'GtDeliveryStatusOWSCHCS',
        fieldName: 'GtDeliveryStatusOWSCHCS',
        name: 'Leveransestatus',
        minWidth: 100,
        isMultiline: false,
        isResizable: true,
    },
    {
        key: 'GtDeliveryStatusCommentOWSMTXT',
        fieldName: 'GtDeliveryStatusCommentOWSMTXT',
        name: 'Kommentar, leveransestatus',
        minWidth: 220,
        isMultiline: true,
        isResizable: true,
    }],
};
