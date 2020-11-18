/* eslint-disable max-classes-per-file */
import { ItemAddResult, List } from '@pnp/sp'

export type ListLoggerEntryLevel = 'Info' | 'Warning' | 'Error'

export class IListLoggerEntry {
  webUrl?: string
  scope?: string
  functionName?: string
  message: string
  level: ListLoggerEntryLevel
}

export class IListLoggerMemberMap {
  webUrl?: string
  scope?: string
  functionName?: string
  message?: string
  level?: string
}

export default new (class ListLogger {
  private _list: any
  private _memberMap: IListLoggerMemberMap
  private _webUrl: string = ''
  private _scope: string = ''

  /**
   * Initialize ListLogger
   *
   * @param {any} list List
   * @param {IListLoggerMemberMap} memberMap Member map
   * @param {string} webUrl Web URL
   * @param {string} scope scope
   */
  public init(list: any, memberMap: IListLoggerMemberMap, webUrl?: string, scope?: string) {
    this._list = list
    this._memberMap = memberMap
    this._webUrl = webUrl
    this._scope = scope
  }

  /**
   * Log entry
   *
   * @param {IListLoggerEntry} entry Entry
   */
  public log(entry: IListLoggerEntry): Promise<ItemAddResult> {
    const spItem = this.getSpItem(entry)
    return (this._list as List).items.add(spItem)
  }

  /**
   * Write message
   *
   * @param {string} message Message
   * @param {ListLoggerEntryLevel} level Level
   * @param {string} functionName Function name
   */
  public write(message: string, level: ListLoggerEntryLevel = 'Info', functionName?: string) {
    return this.log({ message, level, functionName, webUrl: this._webUrl, scope: this._scope })
  }

  /**
   * Get sp item for entry
   *
   * @param {IListLoggerEntry} entry Entry
   */
  private getSpItem(entry: IListLoggerEntry) {
    let item: { [key: string]: string } = {}

    if (this._webUrl && this._memberMap.webUrl) {
      item[this._memberMap.webUrl] = this._webUrl
    }
    if (this._scope && this._memberMap.scope) {
      item[this._memberMap.scope] = this._scope
    }
    item = Object.keys(this._memberMap).reduce((_item, key) => {
      const fieldName = this._memberMap[key]
      _item[fieldName] = entry[key]
      return _item
    }, item)
    return item
  }
})()
