import { List } from '@pnp/sp';
import { DataSource } from '../models/DataSource';

export class DataSourceService {
    private list: List;

    /**
     * Creates a new instance of DataSourceService
     * 
     * @param {any} web Web
     * @param {string} listName List name 
     */
    constructor(web: any, listName: string = 'Datakilder') {
        this.list = web.lists.getByTitle(listName);
    }

    /**
     * Get by name
     * 
     * @param {string} name Name
     */
    public async getByName(name: string): Promise<DataSource> {
        const [dataSource] = await this.list.items.select('GtSearchQuery').filter(`Title eq '${name}'`).get<Array<{ GtSearchQuery: string }>>();
        if (dataSource) {
            return new DataSource(dataSource.GtSearchQuery);
        } else {
            return null;
        }
    }
};