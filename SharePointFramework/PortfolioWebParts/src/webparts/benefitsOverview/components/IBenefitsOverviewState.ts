import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { BenefitMeasurementIndicator } from 'prosjektportalen-spfx-shared/lib/models';

export interface IBenefitsOverviewState {
    isLoading: boolean;
    items?: BenefitMeasurementIndicator[];
    columns: IColumn[];
    groupBy?: IColumn;
    searchTerm?: string;
}