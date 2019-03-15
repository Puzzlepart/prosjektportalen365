import { DataSource } from '../models/DataSource';
export default class DataSourceService {
    private list;
    constructor(web: any);
    /**
     * Get by name
     *
     * @param {string} name Name
     * @param {string} hubSiteId Hub site id (optional)
     */
    getByName(name: string, hubSiteId?: string): Promise<DataSource>;
}
