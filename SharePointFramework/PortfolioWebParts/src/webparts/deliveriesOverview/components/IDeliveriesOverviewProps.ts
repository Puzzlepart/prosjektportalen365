import { IDeliveriesOverviewWebPartProps } from '../IDeliveriesOverviewWebPartProps';
import { DeliveriesOverviewColumns } from './DeliveriesOverviewColumns';

export interface IDeliveriesOverviewProps extends IDeliveriesOverviewWebPartProps { }

export const DeliveriesOverviewDefaultProps: Partial<IDeliveriesOverviewProps> = {
    columns: DeliveriesOverviewColumns,
};
