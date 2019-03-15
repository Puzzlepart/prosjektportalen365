export class DataSource {
    public QueryTemplate: string;

    /**
     * DataSource
     * 
     * @param {string} searchQuery Search query
     * @param {string} hubSiteId Hub site id (optional)
     */
    constructor(searchQuery: string, hubSiteId?: string) {
        this.QueryTemplate = searchQuery;
        if(hubSiteId) {
            this.QueryTemplate = `DepartmentId:{${hubSiteId}} ${this.QueryTemplate}`;
        }
    }
}