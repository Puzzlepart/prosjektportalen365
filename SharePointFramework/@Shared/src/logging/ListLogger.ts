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
  public list: any
  public memberMap: IListLoggerMemberMap
  public webUrl: string = ''
  public scope: string = ''

  /**
   * Initialize ListLogger
   *
   * @param {any} list List
   * @param {IListLoggerMemberMap} memberMap Member map
   * @param {string} webUrl Web URL
   * @param {string} scope scope
   */
  public init(list: any, memberMap: IListLoggerMemberMap, webUrl?: string, scope?: string) {
    this.list = list
    this.memberMap = memberMap
    this.webUrl = webUrl
    this.scope = scope
  }

  /**
   * Log entry
   *
   * @param {IListLoggerEntry} entry Entry
   */
  public log(entry: IListLoggerEntry): Promise<ItemAddResult> {
    const spItem = this.getSpItem(entry)
    return (this.list as List).items.add(spItem)
  }

  /**
   * Write message
   *
   * @param {string} message Message
   * @param {ListLoggerEntryLevel} level Level
   * @param {string} functionName Function name
   */
  public write(message: string, level: ListLoggerEntryLevel = 'Info', functionName?: string) {
    return this.log({ message, level, functionName, webUrl: this.webUrl, scope: this.scope })
  }

  /**
   * Get sp item for entry
   *
   * @param {IListLoggerEntry} entry Entry
   */
  public getSpItem(entry: IListLoggerEntry) {
    let item: { [key: string]: string } = {}

    if (this.webUrl && this.memberMap.webUrl) {
      item[this.memberMap.webUrl] = this.webUrl
    }
    if (this.scope && this.memberMap.scope) {
      item[this.memberMap.scope] = this.scope
    }
    item = Object.keys(this.memberMap).reduce((_item, key) => {
      const fieldName = this.memberMap[key]
      _item[fieldName] = entry[key]
      return _item
    }, item)
    return item
  }
})()
