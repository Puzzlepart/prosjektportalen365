import * as strings from 'RiskOverviewWebPartStrings';
import { RiskOverviewColumns } from './RiskOverviewColumns';
import { IAggregatedSearchListProps } from '../';

export interface IRiskOverviewProps extends IAggregatedSearchListProps { }

export const RiskOverviewDefaultProps: Partial<IRiskOverviewProps> = {
    title: strings.Title,
    columns: RiskOverviewColumns,
};