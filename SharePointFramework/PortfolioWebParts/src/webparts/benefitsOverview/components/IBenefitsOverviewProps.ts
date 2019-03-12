import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import IGroupByOption from '../../../common/interfaces/IGroupByOption';
export interface IBenefitsOverviewProps {
    columns?: IColumn[];
    groupByOptions?: IGroupByOption[];
}

export const BenefitsOverviewDefaultProps: Partial<IBenefitsOverviewProps> = {
    columns: [{
        key: 'Title',
        fieldName: 'Title',
        name: 'Tittel',
        minWidth: 220,
        maxWidth: 300,
        isMultiline: true,
        isResizable: true,
    }],
    groupByOptions: [{ name: 'Prosjekt', key: 'SiteTitle' }],
};