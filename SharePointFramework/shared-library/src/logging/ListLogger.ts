/* eslint-disable max-classes-per-file */
import { ItemAddResult, List } from '@pnp/sp'
import {
  defaultListLoggerMemberMap,
  IListLoggerEntry,
  IListLoggerMemberMap,
  ListLoggerEntryLevel
} from './types'

class ListLogger {
  public list: any
  public memberMap: IListLoggerMemberMap
  public webUrl: string = ''
  public scope: string = ''

  /**
   * Initialize `ListLogger`
   *
   * @param list List
   * @param webUrl Web URL
   * @param scope scope
   * @param memberMap Member map
   */
  public init(
    list: any,
    webUrl?: string,
    scope?: string,
    memberMap: IListLoggerMemberMap = defaultListLoggerMemberMap
  ) {
    this.list = list
    this.memberMap = memberMap
    this.webUrl = webUrl
    this.scope = scope
  }

  /**
   * Log entry to SharePoint list specified when running `init()`.
   *
   * Will fail silently.
   *
   * @param entry Entry
   */
  public log(entry: IListLoggerEntry): Promise<ItemAddResult> {
    try {
      const spItem = this._getSpItem({ ...this._getEntryDefaults(), ...entry })
      return (this.list as List).items.add(spItem)
    } catch (error) {}
  }

  /**
   * Write message to SharePoint list specified when running `init()`.
   *
   * Will fail silently.
   *
   * @param message Message
   * @param functionName Function name
   * @param level Level (defaults to Info)
   */
  public write(
    message: string,
    functionName?: string,
    level: ListLoggerEntryLevel = 'Info'
  ): Promise<ItemAddResult> {
    return this.log({
      message,
      level,
      functionName,
      scope: this.scope
    })
  }

  /**
   * Get SP item properties for entry
   *
   * @param entry Entry
   */
  private _getSpItem(entry: IListLoggerEntry): Record<string, any> {
    let item: Record<string, any> = {}
    if (this.webUrl && this.memberMap.webUrl) {
      item[this.memberMap.webUrl] = this.webUrl
    }
    if (this.scope && this.memberMap.scope) {
      item[this.memberMap.scope] = this.scope
    }
    item = Object.keys(this.memberMap).reduce((_item, key) => {
      const fieldName = this.memberMap[key]
      if (entry[key]) {
        _item[fieldName] = entry[key]
      }
      return _item
    }, item)
    return item
  }

  private _getEntryDefaults(): Partial<IListLoggerEntry> {
    return {
      level: 'Info',
      webUrl: this.webUrl ?? document.location.href.split('/').slice(0, 5).join('/')
    } as Partial<IListLoggerEntry>
  }
}

export default new ListLogger()
