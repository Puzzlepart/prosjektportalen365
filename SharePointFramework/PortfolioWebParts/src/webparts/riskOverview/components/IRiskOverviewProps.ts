import * as strings from 'RiskOverviewWebPartStrings';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { IRiskOverviewWebPartProps } from '../IRiskOverviewWebPartProps';
import { RiskOverviewColumns } from './RiskOverviewColumns';

export interface IRiskOverviewProps extends IRiskOverviewWebPartProps {}

export const RiskOverviewDefaultProps: Partial<IRiskOverviewProps> = {
    title: strings.Title,
    columns: RiskOverviewColumns,
};