/* eslint-disable max-classes-per-file */
import { ItemAddResult, List } from '@pnp/sp'
import { IListLoggerEntry } from './IListLoggerEntry'
import { IListLoggerMemberMap } from './IListLoggerMemberMap'
import { ListLoggerEntryLevel } from './ListLoggerEntryLevel'

export const defaultListLoggerMemberMap: Record<string, string> = {
  webUrl: 'GtLogWebUrl',
  scope: 'GtLogScope',
  functionName: 'GtLogFunctionName',
  message: 'GtLogMessage',
  level: 'GtLogLevel',
  component: 'GtLogComponentName',
  context: 'GtLogContext'
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
      webUrl: this.webUrl ?? this._getEntryDefaults().webUrl,
      scope: this.scope
    })
  }

  /**
   * Get sp item for entry
   *
   * @param entry Entry
   */
  private _getSpItem(entry: IListLoggerEntry) {
    let item: Record<string, any> = {}
    item = Object.keys(this.memberMap).reduce((_item, key) => {
      const fieldName = this.memberMap[key]
      _item[fieldName] = entry[key]
      return _item
    }, item)
    if (this.webUrl && this.memberMap.webUrl) {
      item[this.memberMap.webUrl] = this.webUrl
    }
    if (this.scope && this.memberMap.scope) {
      item[this.memberMap.scope] = this.scope
    }
    // eslint-disable-next-line no-console
    console.log(this, item)
    return item
  }

  private _getEntryDefaults(): Partial<IListLoggerEntry> {
    return {
      level: 'Info',
      webUrl: document.location.href.split('/').slice(0, 5).join('/')
    } as Partial<IListLoggerEntry>
  }
}

export default new ListLogger()
