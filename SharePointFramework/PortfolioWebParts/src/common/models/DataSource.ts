export class DataSource {
    public QueryTemplate: string;

    constructor(searchQuery: string) {
        this.QueryTemplate = searchQuery;
    }
}