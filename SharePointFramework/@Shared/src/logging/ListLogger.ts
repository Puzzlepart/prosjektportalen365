import { ItemAddResult, List } from '@pnp/sp';

export type ListLoggerEntryLevel = 'Info' | 'Warning' | 'Error';

export class IListLoggerEntry {
    webUrl: string;
    scope: string;
    functionName?: string;
    message: string;
    level: ListLoggerEntryLevel;
}

export default new class ListLogger {
    protected _list: any;
    protected _memberMap: { [key: string]: string };

    /**
     * Init ListLogger
     * 
     * @param {any} list List
     * @param {Object} memberMap Member map
     */
    public init(list: any, memberMap: { [key: string]: string }) {
        this._list = list;
        this._memberMap = memberMap;
    }

    /**
     * Log entry
     * 
     * @param {IListLoggerEntry} entry Entry
     */
    public log(entry: IListLoggerEntry): Promise<ItemAddResult> {
        let spItem = this.getSpItem(entry);
        return (this._list as List).items.add(spItem);
    }

    /**
     * Get sp item for entry
     * 
     * @param {IListLoggerEntry} entry Entry
     */
    private getSpItem(entry: IListLoggerEntry) {
        return Object.keys(this._memberMap).reduce((_item, key) => {
            let fieldName = this._memberMap[key];
            _item[fieldName] = entry[key];
            return _item;
        }, {});
    }
}