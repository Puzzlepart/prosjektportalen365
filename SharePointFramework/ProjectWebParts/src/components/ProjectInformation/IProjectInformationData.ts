import { ProjectPropertyModel } from "./ProjectProperty";

export interface IProjectInformationData {
  properties?: ProjectPropertyModel[];
  editFormUrl?: string;
  versionHistoryUrl?: string;
  itemId?: number;
  itemSiteUrl?: string;
  statusReports?: { Id: number, Created: string }[];
}