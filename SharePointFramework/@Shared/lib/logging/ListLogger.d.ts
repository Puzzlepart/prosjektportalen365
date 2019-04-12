import { ItemAddResult } from '@pnp/sp';
export declare type ListLoggerEntryLevel = 'Info' | 'Warning' | 'Error';
export declare class IListLoggerEntry {
    webUrl?: string;
    scope?: string;
    functionName?: string;
    message: string;
    level: ListLoggerEntryLevel;
}
export declare class IListLoggerMemberMap {
    webUrl?: string;
    scope?: string;
    functionName?: string;
    message?: string;
    level?: string;
}
declare const _default: {
    _list: any;
    _memberMap: IListLoggerMemberMap;
    _webUrl: string;
    _scope: string;
    init(list: any, memberMap: IListLoggerMemberMap, webUrl?: string, scope?: string): void;
    log(entry: IListLoggerEntry): Promise<ItemAddResult>;
    write(message: string, level?: ListLoggerEntryLevel, functionName?: string): Promise<ItemAddResult>;
    getSpItem(entry: IListLoggerEntry): {
        [key: string]: string;
    };
};
export default _default;
