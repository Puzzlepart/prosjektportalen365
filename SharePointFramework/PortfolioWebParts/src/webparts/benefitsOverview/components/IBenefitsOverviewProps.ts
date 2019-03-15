import { WebPartContext } from '@microsoft/sp-webpart-base';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import IGroupByOption from '../../../common/interfaces/IGroupByOption';
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
            minWidth: 220,
            maxWidth: 300,
            isMultiline: true,
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
            minWidth: 220,
            maxWidth: 300,
            isMultiline: true,
            isResizable: true,
        },
        {
            key: 'benefit.responsible',
            fieldName: 'benefit.responsible',
            name: 'Gevinstansvarlig',
            minWidth: 220,
            maxWidth: 300,
            isMultiline: true,
            isResizable: true,
        },
        {
            key: 'indicator',
            fieldName: 'indicator',
            name: 'Måleindikator',
            minWidth: 220,
            maxWidth: 300,
            isMultiline: true,
            isResizable: true,
        },
        {
            key: 'unit',
            fieldName: 'unit',
            name: 'Måleenhet',
            minWidth: 220,
            maxWidth: 300,
            isMultiline: true,
            isResizable: true,
        },
        {
            key: 'startValue',
            fieldName: 'startValue',
            name: 'Startverdi',
            minWidth: 220,
            maxWidth: 300,
            isMultiline: true,
            isResizable: true,
        },
        {
            key: 'desiredValue',
            fieldName: 'desiredValue',
            name: 'Ønsket verdi',
            minWidth: 220,
            maxWidth: 300,
            isMultiline: true,
            isResizable: true,
        },
        {
            key: 'measurements[0].value',
            fieldName: 'measurements[0].value',
            name: 'Siste måling',
            minWidth: 220,
            maxWidth: 300,
            isMultiline: true,
            isResizable: true,
        },
        {
            key: 'measurements[0].achievement',
            fieldName: 'measurements[0].achievement',
            name: 'Måloppnåelse',
            minWidth: 220,
            maxWidth: 300,
            isMultiline: true,
            isResizable: true,
        }
    ],
    groupByOptions: [{ name: 'Prosjekt', key: 'SiteTitle' }],
};