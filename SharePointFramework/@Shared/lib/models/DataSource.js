var DataSource = (function () {
    /**
     * DataSource
     *
     * @param {string} searchQuery Search query
     * @param {string} hubSiteId Hub site id (optional)
     */
    function DataSource(searchQuery, hubSiteId) {
        this.QueryTemplate = searchQuery;
        if (hubSiteId) {
            this.QueryTemplate = "DepartmentId:{" + hubSiteId + "} " + this.QueryTemplate;
        }
    }
    return DataSource;
}());
export { DataSource };
//# sourceMappingURL=DataSource.js.map