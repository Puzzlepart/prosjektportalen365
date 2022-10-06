/* eslint-disable max-classes-per-file */
import { ItemAddResult, List } from '@pnp/sp'
import { IListLoggerEntry } from './IListLoggerEntry'
import { IListLoggerMemberMap } from './IListLoggerMemberMap'
import { ListLoggerEntryLevel } from './ListLoggerEntryLevel'

export const defaultListLoggerMemberMap = {
  webUrl: 'GtLogWebUrl',
  scope: 'GtLogScope',
  functionName: 'GtLogFunctionName',
  message: 'GtLogMessage',
  level: 'GtLogLevel',
  component: 'GtLogComponent',
}

class ListLogger {
  public list: any
  public memberMap: IListLoggerMemberMap
  public webUrl: string = ''
  public scope: string = ''

  /**
   * Initialize ListLogger
   *
   * @param list List
   * @param webUrl Web URL
   * @param scope scope
   * @param memberMap Member map
   */
  public init(list: any, webUrl?: string, scope?: string, memberMap: IListLoggerMemberMap = defaultListLoggerMemberMap) {
    this.list = list
    this.memberMap = memberMap
    this.webUrl = webUrl
    this.scope = scope
  }

  /**
   * Log entry
   *
   * @param entry Entry
   */
  public log(entry: IListLoggerEntry): Promise<ItemAddResult> {
    const spItem = this._getSpItem({ level: 'Info', ...entry })
    return (this.list as List).items.add(spItem)
  }

  /**
   * Write message
   *
   * @param message Message
   * @param functionName Function name
   * @param level Level (defaults to Info)
   */
  public write(message: string, functionName?: string, level: ListLoggerEntryLevel = 'Info') {
    return this.log({ message, level, functionName, webUrl: this.webUrl, scope: this.scope })
  }

  /**
   * Get sp item for entry
   *
   * @param entry Entry
   */
  private _getSpItem(entry: IListLoggerEntry) {
    let item: Record<string, any> = {}

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
}


export default new ListLogger()