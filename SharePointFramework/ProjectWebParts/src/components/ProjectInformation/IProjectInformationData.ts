import { ProjectPropertyModel } from "models";

export interface IProjectInformationData {
  properties?: ProjectPropertyModel[];
  editFormUrl?: string;
  versionHistoryUrl?: string;
  itemId?: number;
}