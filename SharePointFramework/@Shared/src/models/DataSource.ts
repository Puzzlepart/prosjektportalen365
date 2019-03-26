export class DataSource {
    public QueryTemplate: string;

    /**
     * DataSource
     * 
     * @param {string} searchQuery Search query
     */
    constructor(searchQuery: string) {
        this.QueryTemplate = searchQuery;
    }
}