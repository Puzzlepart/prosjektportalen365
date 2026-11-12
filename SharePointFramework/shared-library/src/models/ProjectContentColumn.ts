import { tryParseJson } from '../util'
import { IProjectContentColumn } from '../interfaces/IProjectContentColumn'
import { ColumnDataType } from '../types'

/**
 * Represents a stored project-content column definition.
 */
export class SPProjectContentColumnItem {
  public Id?: number = 0
  public Title?: string = ''
  public GtSortOrder?: number = 0
  public GtInternalName?: string = ''
  public GtManagedProperty?: string = ''
  public GtFieldDataType?: string = ''
  public GtColMinWidth?: number = 0
  public GtColMaxWidth?: number = 0
  public GtIsGroupable?: boolean = false
  public GtDataSourceCategory?: string = ''
  public GtFieldDataTypeProperties?: string = ''
  public GtFieldLocked?: boolean = false
  public GtDataSourceLevel?: string[] = []
  public GtIdeaCopyToProcess?: boolean = false
}

/**
 * Carries renderer, grouping and locking settings for a content column.
 */
export type ProjectContentColumnData = {
  isGroupable?: boolean
  dataTypeProperties?: Record<string, any>
  isSelected?: boolean
  renderAs?: any
  isLocked?: boolean
}

/**
 * Maps a stored content column to list rendering and grouping settings.
 */
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
  public dataType?: ColumnDataType
  public isGroupable?: boolean
  public isResizable?: boolean
  public isSorted?: boolean
  public isSortedDescending?: boolean
  public isMultiline?: boolean
  public ideaCopyToProcess?: boolean
  public data?: ProjectContentColumnData

  constructor(item?: SPProjectContentColumnItem) {
    this.id = item?.Id
    this.fieldName = item?.GtManagedProperty ?? item?.GtInternalName ?? ''
    this.key = item?.GtManagedProperty
    this.name = item?.Title
    this.sortOrder = item?.GtSortOrder
    this.internalName = item?.GtInternalName
    this.dataType = (
      item?.GtFieldDataType ? item?.GtFieldDataType.toLowerCase() : 'text'
    ) as ColumnDataType
    this.isGroupable = item?.GtIsGroupable
    this.isResizable = true
    this.isMultiline = this.dataType === 'note' || this.dataType === 'tags'
    this.minWidth = item?.GtColMinWidth ?? 100
    this.maxWidth = item?.GtColMaxWidth
    this.ideaCopyToProcess = item?.GtIdeaCopyToProcess
    this.data = {
      isGroupable: this.isGroupable,
      dataTypeProperties: tryParseJson(item?.GtFieldDataTypeProperties, {}),
      renderAs: this.dataType,
      isLocked: item?.GtFieldLocked
    }
  }

  /**
   * Set arbitrary data on the column. Such as `renderAs`,
   * `isGroupable`, `dataTypeProperties`, etc.
   *
   * If `renderAs` is specified, the property `dataType` will be set to the same value.
   */
  public setData?(data: ProjectContentColumnData = {}): ProjectContentColumn {
    this.data = { ...this.data, ...data }
    if (this.data.renderAs) {
      this.dataType = this.data.renderAs
    }
    return this
  }

  /**
   * Merges renderer data and applies non-nullish display-name and width overrides.
   */
  public merge(column: ProjectContentColumn): ProjectContentColumn {
    this.name = column.name ?? this.name
    this.minWidth = column.minWidth ?? this.minWidth
    this.maxWidth = column.maxWidth ?? this.maxWidth
    return this.setData({
      ...column.data,
      dataTypeProperties: {
        ...this.data.dataTypeProperties,
        ...column.data.dataTypeProperties
      },
      renderAs: column.data.renderAs ?? this.dataType ?? 'text'
    })
  }
}
