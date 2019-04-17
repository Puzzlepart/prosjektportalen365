import * as strings from 'RiskOverviewWebPartStrings';
import { IRiskOverviewWebPartProps } from '../IRiskOverviewWebPartProps';
import { RiskOverviewColumns } from './RiskOverviewColumns';

export interface IRiskOverviewProps extends IRiskOverviewWebPartProps {}

export const RiskOverviewDefaultProps: Partial<IRiskOverviewProps> = {
    title: strings.Title,
    columns: RiskOverviewColumns,
};