var IListLoggerEntry = (function () {
    function IListLoggerEntry() {
    }
    return IListLoggerEntry;
}());
export { IListLoggerEntry };
export default new (function () {
    function ListLogger() {
    }
    /**
     * Init ListLogger
     *
     * @param {any} list List
     * @param {Object} memberMap Member map
     */
    ListLogger.prototype.init = function (list, memberMap) {
        this._list = list;
        this._memberMap = memberMap;
    };
    /**
     * Log entry
     *
     * @param {IListLoggerEntry} entry Entry
     */
    ListLogger.prototype.log = function (entry) {
        var spItem = this.getSpItem(entry);
        return this._list.items.add(spItem);
    };
    /**
     * Get sp item for entry
     *
     * @param {IListLoggerEntry} entry Entry
     */
    ListLogger.prototype.getSpItem = function (entry) {
        var _this = this;
        return Object.keys(this._memberMap).reduce(function (_item, key) {
            var fieldName = _this._memberMap[key];
            _item[fieldName] = entry[key];
            return _item;
        }, {});
    };
    return ListLogger;
}());
//# sourceMappingURL=ListLogger.js.map