var IListLoggerEntry = (function () {
    function IListLoggerEntry() {
    }
    return IListLoggerEntry;
}());
export { IListLoggerEntry };
var IListLoggerMemberMap = (function () {
    function IListLoggerMemberMap() {
    }
    return IListLoggerMemberMap;
}());
export { IListLoggerMemberMap };
export default new (function () {
    function ListLogger() {
    }
    /**
     * Init ListLogger
     *
     * @param {any} list List
     * @param {IListLoggerMemberMap} memberMap Member map
     * @param {string} webUrl Web URL
     * @param {string} scope scope
     */
    ListLogger.prototype.init = function (list, memberMap, webUrl, scope) {
        this._list = list;
        this._memberMap = memberMap;
        this._webUrl = webUrl;
        this._scope = scope;
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
     * Write message
     *
     * @param {string} message Message
     * @param {ListLoggerEntryLevel} level Level
     * @param {string} functionName Function name
     */
    ListLogger.prototype.write = function (message, level, functionName) {
        if (level === void 0) { level = 'Info'; }
        return this.log({ message: message, level: level, functionName: functionName });
    };
    /**
     * Get sp item for entry
     *
     * @param {IListLoggerEntry} entry Entry
     */
    ListLogger.prototype.getSpItem = function (entry) {
        var _this = this;
        var item = {};
        if (this._webUrl && this._memberMap.webUrl) {
            item[this._memberMap.webUrl] = this._webUrl;
        }
        if (this._scope && this._memberMap.scope) {
            item[this._memberMap.scope] = this._scope;
        }
        item = Object.keys(this._memberMap).reduce(function (_item, key) {
            var fieldName = _this._memberMap[key];
            _item[fieldName] = entry[key];
            return _item;
        }, item);
        return item;
    };
    return ListLogger;
}());
//# sourceMappingURL=ListLogger.js.map