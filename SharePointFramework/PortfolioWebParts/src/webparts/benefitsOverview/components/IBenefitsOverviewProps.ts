import { WebPartContext } from '@microsoft/sp-webpart-base';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { IGroupByOption } from 'prosjektportalen-spfx-shared/lib/interfaces/IGroupByOption';

import { IBenefitsOverviewWebPartProps } from '../IBenefitsOverviewWebPartProps';
export interface IBenefitsOverviewProps extends IBenefitsOverviewWebPartProps {
    context: WebPartContext;
    columns?: IColumn[];
    groupByOptions?: IGroupByOption[];
}

export const BenefitsOverviewDefaultProps: Partial<IBenefitsOverviewProps> = {
    columns: [
        {
            key: 'siteTitle',
            fieldName: 'siteTitle',
            name: 'Prosjekt',
            minWidth: 100,
            maxWidth: 150,
            isResizable: true,
        },
        {
            key: 'benefit.title',
            fieldName: 'benefit.title',
            name: 'Gevinst',
            minWidth: 220,
            maxWidth: 300,
            isMultiline: true,
            isResizable: true,
        },
        {
            key: 'title',
            fieldName: 'title',
            name: 'Måleindikator',
            minWidth: 100,
            isMultiline: true,
            isResizable: true,
        },
        {
            key: 'benefit.responsible',
            fieldName: 'benefit.responsible',
            name: 'Gevinstansvarlig',
            minWidth: 100,
            isResizable: true,
        },
        {
            key: 'indicator',
            fieldName: 'indicator',
            name: 'Måleindikator',
            minWidth: 100,
            maxWidth: 150,
            isResizable: true,
        },
        {
            key: 'unit',
            fieldName: 'unit',
            name: 'Måleenhet',
            minWidth: 100,
            maxWidth: 100,
            isResizable: true,
        },
        {
            key: 'startValue',
            fieldName: 'startValue',
            name: 'Startverdi',
            minWidth: 100,
            maxWidth: 100,
            isResizable: true,
        },
        {
            key: 'desiredValue',
            fieldName: 'desiredValue',
            name: 'Ønsket verdi',
            minWidth: 100,
            maxWidth: 100,
            isResizable: true,
        },
        {
            key: 'measurements[0].value',
            fieldName: 'measurements[0].value',
            name: 'Siste måling',
            minWidth: 100,
            maxWidth: 100,
            isResizable: true,
        },
        {
            key: 'measurements[0].achievement',
            fieldName: 'measurements[0].achievement',
            name: 'Måloppnåelse',
            minWidth: 100,
            maxWidth: 100,
            isResizable: true,
        }
    ],
    groupByOptions: [{ name: 'Prosjekt', key: 'SiteTitle' }],
};