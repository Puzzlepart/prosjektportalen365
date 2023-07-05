/* eslint-disable max-classes-per-file */
import { IProjectContentColumn } from '../interfaces/IProjectContentColumn'
import { SearchValueType } from '../types/SearchValueType'

export class SPProjectContentColumnItem {
  public Id?: number = 0
  public Title: string = ''
  public GtSortOrder?: number = 0
  public GtInternalName?: string = ''
  public GtManagedProperty?: string = ''
  public GtFieldDataType?: string = ''
  public GtColMinWidth: number = 0
  public GtColMaxWidth?: number = 0
  public GtIsGroupable?: boolean = false
  public GtDataSourceCategory?: string = ''
}

export class ProjectContentColumn implements IProjectContentColumn {
  public key: string
  public fieldName: string
  public name: string
  public minWidth: number
  public maxWidth: number
  public id?: number
  public sortOrder?: number
  public internalName?: string
  public iconName?: string
  public dataType?: string
  public searchType?: SearchValueType
  public isGroupable?: boolean
  public isResizable?: boolean
  public isSorted?: boolean
  public isSortedDescending?: boolean
  public isMultiline?: boolean
  public onColumnClick: any
  public data?: any
  public $map: Map<string, any>

  constructor(item?: SPProjectContentColumnItem) {
    this.id = item?.Id
    this.fieldName = item?.GtManagedProperty ?? item?.GtInternalName ?? ''
    this.key = item?.GtManagedProperty
    this.name = item?.Title
    this.sortOrder = item?.GtSortOrder
    this.internalName = item?.GtInternalName
    this.dataType = item?.GtFieldDataType ? item?.GtFieldDataType.toLowerCase() : 'text'
    this.isGroupable = item?.GtIsGroupable
    this.isResizable = true
    this.isMultiline = this.dataType === 'note' || this.dataType === 'tags'
    this.minWidth = item?.GtColMinWidth ?? 100
    this.maxWidth = item?.GtColMaxWidth
    this.searchType = this._getSearchType()
    this.data = {
      isGroupable: this.isGroupable
    }
    this.$map = this._toMap()
  }

  /**
   * Creates a new ProjectColumn
   *
   * @param key Key
   * @param fieldName Field name
   * @param name Name
   * @param iconName Icon name
   * @param onColumnClick On column click
   * @param minWidth Min width
   */
  public create(
    key: string,
    fieldName: string,
    name: string,
    iconName: string,
    onColumnClick: any,
    minWidth: number
  ): ProjectContentColumn {
    this.key = key
    this.fieldName = fieldName
    this.name = name
    this.iconName = iconName
    this.onColumnClick = onColumnClick
    this.minWidth = minWidth
    return this
  }

  /**
   * Get search type from field name
   */
  private _getSearchType?(): SearchValueType {
    const fieldNameLower = this.fieldName.toLowerCase()
    const searchTypeMap: Record<string, SearchValueType> = {
      owsdate: SearchValueType.OWSDATE,
      owsuser: SearchValueType.OWSUSER,
      owstaxid: SearchValueType.OWSTAXID,
      owscurr: SearchValueType.OWSCURR,
      owsmtxt: SearchValueType.OWSMTXT
    }
    const searchType = Object.keys(searchTypeMap).find((key) => fieldNameLower.indexOf(key) !== -1)
    if (searchType) {
      return searchTypeMap[searchType]
    }
    return SearchValueType.OWSTEXT
  }

  /**
   * Set arbitrary data on the column. Such as `renderAs` or
   * `isGroupable`.
   *
   * @param data Data to set
   * @returns
   */
  public setData(data: any): ProjectContentColumn {
    this.data = { ...this.data, ...data }
    return this
  }

  /**
   * Converts the column to a map used in `ColumnFormPanel`.
   *
   * @private
   */
  private _toMap(): Map<string, any> {
    return new Map<string, any>([
      ['id', this.id],
      ['key', this.key],
      ['fieldName', this.fieldName],
      ['name', this.name],
      ['minWidth', this.minWidth],
      ['maxWidth', this.maxWidth],
      ['sortOrder', this.sortOrder],
      ['internalName', this.internalName],
      ['iconName', this.iconName],
      ['dataType', this.dataType],
      ['data', this.data]
    ])
  }
}
