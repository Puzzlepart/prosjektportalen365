
import * as strings from 'BenefitsOverviewWebPartStrings';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { IGroupByOption } from 'prosjektportalen-spfx-shared/lib/interfaces/IGroupByOption';
import { IBenefitsOverviewWebPartProps } from '../IBenefitsOverviewWebPartProps';
import { BenefitsOverviewColumns } from './BenefitsOverviewColumns';


export interface IBenefitsOverviewProps extends IBenefitsOverviewWebPartProps {
    context: WebPartContext;
    columns?: IColumn[];
    groupByOptions?: IGroupByOption[];
}

export const BenefitsOverviewDefaultProps: Partial<IBenefitsOverviewProps> = {
    columns: BenefitsOverviewColumns,
    groupByOptions: [{ name: strings.SiteTitleLabel, key: 'SiteTitle' }],
};