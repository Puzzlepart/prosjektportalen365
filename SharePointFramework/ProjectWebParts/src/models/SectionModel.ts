import * as strings from 'ProjectWebPartsStrings';

export enum SectionType {
  SummarySection,
  StatusSection,
  RiskSection,
  ProjectPropertiesSection,
  ListSection,
}

export class SectionModel {
  public name: string;
  public iconName: string;
  public source: string;
  public listTitle: string;
  public viewQuery: string;
  public viewFields: string[];
  public rowLimit: number;
  public fieldName: string;
  public commentFieldName: string;
  public statusClassName: string;
  public showRiskMatrix: boolean;
  public showInNavbar: boolean;
  public showInStatusSection: boolean;
  public showAsSection: boolean;
  public sortOrder: number;
  public customComponent: string;
  public statusValue: string;
  public statusComment?: string;
  public statusProperties?: any;

  /**
 * Constructor
 *
 * @param {any} _obj Section object
 */
  constructor(private _obj: any) {
    this.name = _obj.Title;
    this.iconName = _obj.GtSecIcon;
    this.source = _obj.GtSecSource;
    this.listTitle = _obj.GtSecList;
    this.viewQuery = _obj.GtSecViewQuery;
    this.viewFields = _obj.GtSecViewFields ? _obj.GtSecViewFields.split(',') : [];
    this.rowLimit = _obj.GtSecRowLimit;
    this.fieldName = _obj.GtSecFieldName;
    this.showRiskMatrix = _obj.GtSecShowRiskMatrix;
    this.showInNavbar = _obj.GtSecShowInNavbar;
    this.showInStatusSection = _obj.GtSecShowInStatusSection;
    this.showAsSection = _obj.GtSecShowAsSection;
    this.sortOrder = _obj.GtSortOrder;
    this.customComponent = _obj.GtSecCustomComponent;
    this.statusProperties = {};
    this.commentFieldName = `${this.fieldName}Comment`;
  }

  public get type(): SectionType {
    if (this.fieldName === strings.OverallStatusFieldName) {
      return SectionType.SummarySection;
    }
    if (this._obj.ContentTypeId.indexOf('0x01004CEFE616A94A3A48A27D9DEBDF5EC82802') !== -1) {
      return SectionType.StatusSection;
    }
    if (this._obj.ContentTypeId.indexOf('0x01004CEFE616A94A3A48A27D9DEBDF5EC82803') !== -1) {
      return SectionType.ProjectPropertiesSection;
    }
    if (this._obj.ContentTypeId.indexOf('0x01004CEFE616A94A3A48A27D9DEBDF5EC82804') !== -1) {
      return SectionType.RiskSection;
    }
    if (this._obj.ContentTypeId.indexOf('0x01004CEFE616A94A3A48A27D9DEBDF5EC82805') !== -1) {
      return SectionType.ListSection;
    }
  }
}
