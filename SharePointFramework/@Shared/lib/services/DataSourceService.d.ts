import { DataSource } from '../models/DataSource';
export default class DataSourceService {
    private list;
    /**
     * Creates a new instance of DataSourceService
     *
     * @param {any} web Web
     * @param {string} listName List name
     */
    constructor(web: any, listName?: string);
    /**
     * Get by name
     *
     * @param {string} name Name
     */
    getByName(name: string): Promise<DataSource>;
}
