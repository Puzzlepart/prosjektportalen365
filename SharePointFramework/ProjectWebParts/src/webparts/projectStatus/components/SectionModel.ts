import IStatusFieldsConfig, { IStatusProperties } from '../../../common/models/config/IStatusFieldsConfig';

export enum SectionType {
  StatusSection,
  RiskSection,
  ProjectPropertiesSection,
  ListSection,
}

export default class SectionModel {
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
  public statusProperties?: IStatusProperties;
  private contentTypeId: string;




  /**
 * Constructor
 *
 * @param {any} obj Section object
 * @param {any} project Project properties
 * @param {IStatusFieldsConfig} statusFieldsConfig Status fields config
 */
  constructor(obj: any, project: any, statusFieldsConfig?: IStatusFieldsConfig) {
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
    this.contentTypeId = obj.ContentTypeId;
    this.statusProperties = {};

    if (this.getType() === SectionType.RiskSection) {
      this.fieldName = 'GtStatusRisk';
    }

    this.commentFieldName = `${this.fieldName}Comment`;

  }

  /**
 * Get type
 */
  public getType(): SectionType {
    if (this.contentTypeId.indexOf("0x01004CEFE616A94A3A48A27D9DEBDF5EC82802") !== -1) {
      return SectionType.StatusSection;
    }
    if (this.contentTypeId.indexOf("0x01004CEFE616A94A3A48A27D9DEBDF5EC82803") !== -1) {
      return SectionType.ProjectPropertiesSection;
    }
    if (this.contentTypeId.indexOf("0x01004CEFE616A94A3A48A27D9DEBDF5EC82804") !== -1) {
      return SectionType.RiskSection;
    }
    if (this.contentTypeId.indexOf("0x01004CEFE616A94A3A48A27D9DEBDF5EC82805") !== -1) {
      return SectionType.ListSection;
    }
  }

  public getHtmlElementId(element?: string): string {
    if (element) {
      return `section-${this.cleanString(this.name)}-${element}`;
    } else {
      return `section-${this.cleanString(this.name)}`;
    }
  }

  private cleanString(str: string, length?: number): string {
    str = str
      .trim()
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/å/g, "a")
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/[^a-z0-9-]/gi, "");
    return str.substring(0, length ? length : Math.min(80, str.length));
  }

}
