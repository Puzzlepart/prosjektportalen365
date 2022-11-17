export enum SectionType {
  SummarySection,
  StatusSection,
  UncertaintySection,
  ProjectPropertiesSection,
  ListSection
}

export class SectionModel {
  public id: number
  public name: string
  public iconName: string
  public source: string
  public listTitle: string
  public viewQuery: string
  public viewFields: string[]
  public rowLimit: number
  public viewName: string
  public fieldName: string
  public commentFieldName: string
  public statusClassName: string
  public showRiskMatrix: boolean
  public showInStatusSection: boolean
  public showAsSection: boolean
  public sortOrder: number
  public customComponent: string
  public statusValue: string
  public statusComment?: string
  public statusProperties?: any

  /**
   * Constructor
   *
   * @param _item Section SP item
   */
  constructor(private _item: Record<string, any>) {
    this.id = _item.Id
    this.name = _item.Title
    this.iconName = _item.GtSecIcon
    this.source = _item.GtSecSource
    this.listTitle = _item.GtSecList
    this.viewQuery = _item.GtSecViewQuery
    this.viewFields = _item.GtSecViewFields ? _item.GtSecViewFields.split(',') : []
    this.rowLimit = _item.GtSecRowLimit
    this.viewName = _item.GtSecView
    this.fieldName = _item.GtSecFieldName
    this.showRiskMatrix = _item.GtSecShowRiskMatrix
    this.showInStatusSection = _item.GtSecShowInStatusSection
    this.showAsSection = _item.GtSecShowAsSection
    this.sortOrder = _item.GtSortOrder
    this.customComponent = _item.GtSecCustomComponent
    this.statusProperties = {}
  }

  public get type(): SectionType {
    if (this.fieldName === 'GtOverallStatus') {
      return SectionType.SummarySection
    }
    if (this._item.ContentTypeId.indexOf('0x01004CEFE616A94A3A48A27D9DEBDF5EC82802') !== -1) {
      return SectionType.StatusSection
    }
    if (this._item.ContentTypeId.indexOf('0x01004CEFE616A94A3A48A27D9DEBDF5EC82803') !== -1) {
      return SectionType.ProjectPropertiesSection
    }
    if (this._item.ContentTypeId.indexOf('0x01004CEFE616A94A3A48A27D9DEBDF5EC82804') !== -1) {
      return SectionType.UncertaintySection
    }
    if (this._item.ContentTypeId.indexOf('0x01004CEFE616A94A3A48A27D9DEBDF5EC82805') !== -1) {
      return SectionType.ListSection
    }
  }
}
