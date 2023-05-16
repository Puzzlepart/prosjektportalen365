/* eslint-disable max-classes-per-file */
import { stringIsNullOrEmpty } from '@pnp/common'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { pick } from 'underscore'
import { SearchValueType } from '../types/SearchValueType'
import { ProjectColumnConfig, ProjectColumnConfigDictionary } from './ProjectColumnConfig'

export class SPProjectColumnItem {
  public Id: number = 0
  public Title: string = ''
  public GtSortOrder: number = 0
  public GtInternalName: string = ''
  public GtManagedProperty: string = ''
  public GtShowFieldProjectStatus: boolean = false
  public GtShowFieldFrontpage: boolean = false
  public GtShowFieldPortfolio: boolean = false
  public GtFieldDataType: string = ''
  public GtFieldCustomSort: string = ''
  public GtColMinWidth: number = 0
  public GtIsRefinable: boolean = false
  public GtIsGroupable: boolean = false
}

export type ProjectColumnCustomSort = {
  order: string[]
  iconName?: string
}

export class ProjectColumn implements IColumn {
  public key: string
  public fieldName: string
  public name: string
  public minWidth: number
  public id?: number
  public sortOrder?: number
  public internalName?: string
  public iconName?: string
  public dataType?: string
  public searchType?: SearchValueType
  public isMultiline?: boolean
  public isRefinable?: boolean
  public isGroupable?: boolean
  public isResizable?: boolean
  public isSorted?: boolean
  public isSortedDescending?: boolean
  public config?: ProjectColumnConfigDictionary
  public onColumnClick: any
  public customSorts?: Record<string, ProjectColumnCustomSort>

  constructor(private _item?: SPProjectColumnItem) {
    if (_item) {
      this.id = _item.Id
      this.fieldName = _item.GtManagedProperty || _item.GtInternalName
      this.key = _item.GtManagedProperty
      this.name = _item.Title
      this.sortOrder = _item.GtSortOrder
      this.internalName = _item.GtInternalName
      this.dataType = _item.GtFieldDataType && _item.GtFieldDataType.toLowerCase()
      this.isMultiline = this.dataType === 'note' || this.dataType === 'tags'
      this.isRefinable = _item.GtIsRefinable
      this.isGroupable = _item.GtIsGroupable
      this.isResizable = true
      this.minWidth = _item.GtColMinWidth || 100
      this.searchType = this._getSearchType(this.fieldName.toLowerCase())
      this.customSorts = this._getCustomSorts(_item.GtFieldCustomSort)
    }
  }

  /**
   * Get custom sorts from value. Value is a string with the following format:
   * <key>:<value>,<value>,<value>;<key>:<value>,<value>,<value> separated by ;.
   *
   * @param value Value for custom sort
   */
  private _getCustomSorts(value: string): Record<string, ProjectColumnCustomSort> {
    if (stringIsNullOrEmpty(value)) return {}
    const regex = /(?<name>[\w\søæå]*)(\((?<icon>[\w\søæå,]*)\))?:(?<order>[\w\søæå,]*)/gm
    const matches = [...value.matchAll(regex)].map((m) => m.groups)
    return matches.reduce((obj, item) => {
      const { name, icon, order } = item
      return name
        ? {
          ...obj,
          [name]: {
            order: order.split(','),
            iconName: icon
          }
        }
        : obj
    }, {} as Record<string, ProjectColumnCustomSort>)
  }

  public isVisible(page: 'Frontpage' | 'ProjectStatus' | 'Portfolio') {
    switch (page) {
      case 'Frontpage':
        return this._item.GtShowFieldFrontpage
      case 'ProjectStatus':
        return this._item.GtShowFieldProjectStatus
      case 'Portfolio':
        return this._item.GtShowFieldPortfolio
    }
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
   *
   * @param fieldName Field name
   */
  private _getSearchType?(fieldName: string): SearchValueType {
    if (fieldName.indexOf('owsdate') !== -1) {
      return SearchValueType.OWSDATE
    }
    if (fieldName.indexOf('owsuser') !== -1) {
      return SearchValueType.OWSUSER
    }
    if (fieldName.indexOf('owstaxid') !== -1) {
      return SearchValueType.OWSTAXID
    }
    if (fieldName.indexOf('owscurr') !== -1) {
      return SearchValueType.OWSCURR
    }
    if (fieldName.indexOf('owsmtxt') !== -1) {
      return SearchValueType.OWSMTXT
    }
    return SearchValueType.OWSTEXT
  }
}
