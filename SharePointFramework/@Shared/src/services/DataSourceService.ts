import { DataSource } from '../models/DataSource';

export default class DataSourceService {
    private list: any;

    constructor(web: any) {
        this.list = web.lists.getByTitle('Datakilder');
    }

    /**
     * Get by name
     * 
     * @param {string} name Name
     * @param {string} hubSiteId Hub site id (optional)
     */
    public async getByName(name: string, hubSiteId?: string): Promise<DataSource> {
        const [dataSource] = await this.list.items.select('GtSearchQuery').filter(`Title eq '${name}'`).get<Array<{ GtSearchQuery: string }>>();
        if (dataSource) {
            return new DataSource(dataSource.GtSearchQuery, hubSiteId);
        } else {
            return null;
        }
    }
};