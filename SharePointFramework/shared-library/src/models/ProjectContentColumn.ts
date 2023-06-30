/* eslint-disable max-classes-per-file */
import { IColumn } from '@fluentui/react'
import { pick } from 'underscore'
import { SearchValueType } from '../types/SearchValueType'
import { ProjectColumnConfig, ProjectColumnConfigDictionary } from './ProjectColumnConfig'

export class SPProjectContentColumnItem {
  public Id: number = 0
  public Title: string = ''
  public GtSortOrder: number = 0
  public GtInternalName: string = ''
  public GtManagedProperty: string = ''
  public GtFieldDataType: string = ''
  public GtFieldCustomSort: string = ''
  public GtColMinWidth: number = 0
  public GtColMaxWidth: number = 0
  public GtIsRefinable: boolean = false
  public GtIsGroupable: boolean = false
}

export class ProjectContentColumn implements IColumn {
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
  public isMultiline?: boolean
  public isRefinable?: boolean
  public isGroupable?: boolean
  public isResizable?: boolean
  public isSorted?: boolean
  public isSortedDescending?: boolean
  public config?: ProjectColumnConfigDictionary
  public onColumnClick: any
  /**
   * Arbitrary data passthrough which can be used by the caller.
   */
  public data?: any

  constructor(item?: SPProjectContentColumnItem) {
    if (item) {
      this.id = item.Id
      this.fieldName = item.GtManagedProperty || item.GtInternalName
      this.key = item.GtManagedProperty
      this.name = item.Title
      this.sortOrder = item.GtSortOrder
      this.internalName = item.GtInternalName
      this.dataType = item.GtFieldDataType && item.GtFieldDataType.toLowerCase()
      this.isMultiline = this.dataType === 'note' || this.dataType === 'tags'
      this.isRefinable = item.GtIsRefinable
      this.isGroupable = item.GtIsGroupable
      this.isResizable = true
      this.minWidth = item.GtColMinWidth || 100
      this.maxWidth = item.GtColMaxWidth
      this.searchType = this._getSearchType(this.fieldName.toLowerCase())
      this.data = {
        isGroupable: this.isGroupable
      }
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
   * Configures the column with the given configuration.
   *
   * @param config Column configuration
   */
  public configure(config: ProjectColumnConfig[]): ProjectContentColumn {
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
}
