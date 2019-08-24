import * as React from 'react';
import * as strings from 'PortfolioWebPartsStrings';
import { formatDate } from 'shared/lib/helpers';
import { IAggregatedSearchListColumn } from 'interfaces';

export const DELIVERIES_OVERVIEW_COLUMNS: IAggregatedSearchListColumn[] = [
    {
        key: 'SiteTitle',
        fieldName: 'SiteTitle',
        name: strings.SiteTitleLabel,
        minWidth: 100,
        maxWidth: 150,
        isResizable: true,
        onRender: (item: any) => <a href={item.SPWebUrl} target='_blank'>{item.SiteTitle}</a>,
        isGroupable: true,
    },
    {
        key: 'Title',
        fieldName: 'Title',
        name: strings.TitleLabel,
        minWidth: 220,
        maxWidth: 250,
        isMultiline: true,
        isResizable: true,
    },
    {
        key: 'GtDeliveryDescriptionOWSMTXT',
        fieldName: 'GtDeliveryDescriptionOWSMTXT',
        name: strings.DeliveryDescriptionLabel,
        minWidth: 220,
        maxWidth: 220,
        isMultiline: true,
        isResizable: true,
    },
    {
        key: 'GtDeliveryStartTimeOWSDATE',
        fieldName: 'GtDeliveryStartTimeOWSDATE',
        name: strings.DeliveryStartTimeLabel,
        minWidth: 100,
        maxWidth: 150,
        isResizable: true,
        onRender: (item, _index, column) => formatDate(item[column.fieldName]),
    },
    {
        key: 'GtDeliveryEndTimeOWSDATE',
        fieldName: 'GtDeliveryEndTimeOWSDATE',
        name: strings.DeliveryEndTimeLabel,
        minWidth: 100,
        maxWidth: 150,
        isResizable: true,
        onRender: (item, _index, column) => formatDate(item[column.fieldName]),
    },
    {
        key: 'GtDeliveryStatusOWSCHCS',
        fieldName: 'GtDeliveryStatusOWSCHCS',
        name: strings.DeliveryStatusLabel,
        minWidth: 100,
        maxWidth: 150,
        isResizable: true,
    },
    {
        key: 'GtDeliveryStatusCommentOWSMTXT',
        fieldName: 'GtDeliveryStatusCommentOWSMTXT',
        name: strings.DeliveryStatusCommentLabel,
        minWidth: 220,
        maxWidth: 220,
        isMultiline: true,
        isResizable: true,
    },
];
