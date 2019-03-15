import { List } from '@pnp/sp';
import { DataSource } from '../models/DataSource';
declare const _default: {
    list: List;
    getByName(name: string, hubSiteId?: string): Promise<DataSource>;
};
export default _default;
