/* eslint-disable max-classes-per-file */
import { stringIsNullOrEmpty } from '@pnp/common'
import { pick } from 'underscore'
import { IProjectColumn } from '../interfaces/IProjectColumn'
import { SearchValueType } from '../types/SearchValueType'
import { ProjectColumnConfig, ProjectColumnConfigDictionary } from './ProjectColumnConfig'
import { tryParseJson } from '../helpers'
import { ColumnDataType } from '../types'

export class SPProjectColumnItem {
  public Id?: number = 0
  public Title: string = ''
  public GtSortOrder: number = 0
  public GtInternalName?: string = ''
  public GtManagedProperty?: string = ''
  public GtShowFieldProjectStatus?: boolean = false
  public GtShowFieldFrontpage?: boolean = false
  public GtShowFieldPortfolio?: boolean = false
  public GtFieldDataType?: string = ''
  public GtFieldCustomSort?: string = ''
  public GtFieldDataTypeProperties?: string = ''
  public GtColMinWidth?: number = 0
  public GtIsRefinable?: boolean = false
  public GtIsGroupable?: boolean = false
}

export type ProjectColumnCustomSort = {
  name: string
  order: string[]
  iconName?: string
}

export type ProjectColumnData = {
  isGroupable?: boolean
  visibility?: string[]
  dataTypeProperties?: Record<string, any>
  isSelected?: boolean
  renderAs?: ColumnDataType
}

export class ProjectColumn implements IProjectColumn {
  public key: string
  public fieldName: string
  public name: string
  public minWidth: number
  public id?: number
  public sortOrder?: number
  public internalName?: string
  public iconName?: string
  public dataType?: ColumnDataType
  public searchType?: SearchValueType
  public isRefinable?: boolean
  public isGroupable?: boolean
  public isResizable?: boolean
  public isSorted?: boolean
  public isSortedDescending?: boolean
  public isMultiline?: boolean
  public config?: ProjectColumnConfigDictionary
  public onColumnClick: any
  public customSorts?: ProjectColumnCustomSort[]
  public data?: ProjectColumnData

  constructor(item?: SPProjectColumnItem) {
    this.id = item?.Id
    this.fieldName = item?.GtManagedProperty ?? item?.GtInternalName ?? ''
    this.key = item?.GtManagedProperty
    this.name = item?.Title
    this.sortOrder = item?.GtSortOrder
    this.internalName = item?.GtInternalName
    this.dataType = (
      item?.GtFieldDataType ? item?.GtFieldDataType.toLowerCase() : 'text'
    ) as ColumnDataType
    this.isRefinable = item?.GtIsRefinable
    this.isGroupable = item?.GtIsGroupable
    this.isResizable = true
    this.isMultiline = this.dataType === 'note' || this.dataType === 'tags'
    this.minWidth = item?.GtColMinWidth ?? 100
    this.searchType = this._getSearchType()
    this.customSorts = this._getCustomSorts(item?.GtFieldCustomSort)
    this.data = {
      isGroupable: this.isGroupable,
      visibility: [
        item?.GtShowFieldFrontpage && 'Frontpage',
        item?.GtShowFieldProjectStatus && 'ProjectStatus',
        item?.GtShowFieldPortfolio && 'Portfolio'
      ].filter(Boolean),
      dataTypeProperties: tryParseJson(item?.GtFieldDataTypeProperties, {})
    }
  }

  /**
   * Get custom sorts from value. Value is a string with the following format:
   * <key>:<value>,<value>,<value>;<key>:<value>,<value>,<value> separated by ;.
   * Regex is used to match the values.
   *
   * **Example:** "Status:Active,On hold,Completed;Priority:High,Medium,Low"
   *
   * @param value Value for custom sort
   */
  private _getCustomSorts(value: string): ProjectColumnCustomSort[] {
    if (stringIsNullOrEmpty(value)) return []
    const regex = /(?<name>[\w\søæå]*)(\((?<icon>[\w\søæå,]*)\))?:(?<order>[\w\søæå,]*)/gm
    const matches = [...value.matchAll(regex)].map((m) => m.groups).filter((g) => !!g.name)
    return matches.map(({ name, icon, order }) => ({
      name,
      iconName: icon,
      order: order.split(',')
    }))
  }

  /**
   * Checks if the column is visible on the given page.
   *
   * @param page Page to check
   */
  public isVisible(page: 'Frontpage' | 'ProjectStatus' | 'Portfolio') {
    return this.data?.visibility?.includes(page)
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
  ): ProjectColumn {
    this.key = key
    this.fieldName = fieldName
    this.name = name
    this.iconName = iconName
    this.onColumnClick = onColumnClick
    this.minWidth = minWidth
    return this
  }

  /**
   * Configures the column with the given configuration.
   *
   * @param config Column configuration
   */
  public configure(config: ProjectColumnConfig[]): ProjectColumn {
    this.config = config
      .filter((col) => col.columnId === this.id)
      .reduce(
        (obj, c) => ({
          ...obj,
          [c.value]: pick(c, ['color', 'iconName', 'tooltipColumnPropertyName'])
        }),
        {}
      ) as ProjectColumnConfigDictionary
    return this
  }

  /**
   * Get search type from field name
   */
  public _getSearchType?(): SearchValueType {
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
   */
  public setData(data: ProjectColumnData): ProjectColumn {
    this.data = { ...this.data, ...data }
    return this
  }
}
