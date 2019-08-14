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
  public type: SectionType;

  /**
 * Constructor
 *
 * @param {any} obj Section object
 */
  constructor(obj: any) {
    this.name = obj.Title;
    this.iconName = obj.GtSecIcon;
    this.source = obj.GtSecSource;
    this.listTitle = obj.GtSecList;
    this.viewQuery = obj.GtSecViewQuery;
    this.viewFields = obj.GtSecViewFields ? obj.GtSecViewFields.split(",") : [];
    this.rowLimit = obj.GtSecRowLimit;
    this.fieldName = obj.GtSecFieldName;
    this.showRiskMatrix = obj.GtSecShowRiskMatrix;
    this.showInNavbar = obj.GtSecShowInNavbar;
    this.showInStatusSection = obj.GtSecShowInStatusSection;
    this.showAsSection = obj.GtSecShowAsSection;
    this.sortOrder = obj.GtSortOrder;
    this.customComponent = obj.GtSecCustomComponent;
    this.statusProperties = {};
    this.commentFieldName = `${this.fieldName}Comment`;
    this.type = this.getType(obj.ContentTypeId);
  }

  /**
 * Get type
 * 
 * @param {string} contentTypeId Content type id
 */
  private getType(contentTypeId: string): SectionType {
    if (this.fieldName === strings.OverallStatusFieldName) {
      return SectionType.SummarySection;
    }
    if (contentTypeId.indexOf("0x01004CEFE616A94A3A48A27D9DEBDF5EC82802") !== -1) {
      return SectionType.StatusSection;
    }
    if (contentTypeId.indexOf("0x01004CEFE616A94A3A48A27D9DEBDF5EC82803") !== -1) {
      return SectionType.ProjectPropertiesSection;
    }
    if (contentTypeId.indexOf("0x01004CEFE616A94A3A48A27D9DEBDF5EC82804") !== -1) {
      return SectionType.RiskSection;
    }
    if (contentTypeId.indexOf("0x01004CEFE616A94A3A48A27D9DEBDF5EC82805") !== -1) {
      return SectionType.ListSection;
    }
  }
}
