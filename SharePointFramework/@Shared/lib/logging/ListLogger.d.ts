import { ItemAddResult } from '@pnp/sp';
export declare type ListLoggerEntryLevel = 'Info' | 'Warning' | 'Error';
export declare class IListLoggerEntry {
    webUrl: string;
    scope: string;
    functionName?: string;
    message: string;
    level: ListLoggerEntryLevel;
}
declare const _default: {
    _list: any;
    _memberMap: {
        [key: string]: string;
    };
    init(list: any, memberMap: {
        [key: string]: string;
    }): void;
    log(entry: IListLoggerEntry): Promise<ItemAddResult>;
    getSpItem(entry: IListLoggerEntry): {};
};
export default _default;
