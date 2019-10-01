import { List } from '@pnp/sp';
import { DataSource, SPDataSourceItem } from '../../models/DataSource';

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
        const [item] = await this.list.items.select(...Object.keys(new SPDataSourceItem())).filter(`Title eq '${name}'`).get<SPDataSourceItem[]>();
        if (item) {
            return new DataSource(item);
        } else {
            return null;
        }
    }

    /**
     * Get by category
     * 
     * @param {string} category Category
     */
    public async getByCategory(category: string): Promise<DataSource[]> {
        const items = await this.list.items.select(...Object.keys(new SPDataSourceItem())).filter(`GtDataSourceCategory eq '${category}'`).get<SPDataSourceItem[]>();
        return items.map(item => new DataSource(item));
    }
};