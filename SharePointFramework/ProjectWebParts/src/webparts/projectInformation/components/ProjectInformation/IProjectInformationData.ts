import ProjectPropertyModel from "../../models/ProjectPropertyModel";

export interface IProjectInformationData {
  properties?: ProjectPropertyModel[];
  editFormUrl?: string;
  versionHistoryUrl?: string;
  itemId?: number;
}