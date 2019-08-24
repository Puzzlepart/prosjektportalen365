import { IAggregatedSearchListProps } from '../';

export interface IBenefitsOverviewProps  extends IAggregatedSearchListProps {
    /**
     * Columns to hide from the DetailsList
     */
    hiddenColumns?: string[];
}