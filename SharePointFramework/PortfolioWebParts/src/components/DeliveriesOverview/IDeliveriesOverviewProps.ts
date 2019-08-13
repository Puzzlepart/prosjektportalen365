import { DeliveriesOverviewColumns } from './DeliveriesOverviewColumns';
import { IAggregatedSearchListProps } from '../';

export interface IDeliveriesOverviewProps extends IAggregatedSearchListProps { }

export const DeliveriesOverviewDefaultProps: Partial<IDeliveriesOverviewProps> = {
    columns: DeliveriesOverviewColumns,
};
