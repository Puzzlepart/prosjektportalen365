import { RiskOverviewColumns } from './RiskOverviewColumns';
import { IAggregatedSearchListProps } from '../';

export interface IRiskOverviewProps extends IAggregatedSearchListProps { }

export const RiskOverviewDefaultProps: Partial<IRiskOverviewProps> = {
    columns: RiskOverviewColumns,
};