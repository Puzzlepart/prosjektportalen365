
import * as strings from 'BenefitsOverviewWebPartStrings';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { IBenefitsOverviewWebPartProps } from '../IBenefitsOverviewWebPartProps';
import { BenefitsOverviewColumns } from './BenefitsOverviewColumns';


export interface IBenefitsOverviewProps extends IBenefitsOverviewWebPartProps {
    hubSiteId?: string;
    columns?: IColumn[];
    groupByColumns?: IColumn[];
}

export const BenefitsOverviewDefaultProps: Partial<IBenefitsOverviewProps> = {
    columns: BenefitsOverviewColumns,
    groupByColumns: [
        { name: strings.BenefitTitleLabel, key: 'benefit.title', fieldName: 'benefit.title', minWidth: 0 },
        { name: strings.BenefitResponsibleLabel, key: 'benefit.responsible', fieldName: 'benefit.responsible', minWidth: 0 },
    ],
};