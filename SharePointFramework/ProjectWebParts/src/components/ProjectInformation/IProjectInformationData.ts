import { ProjectPropertyModel } from "./ProjectProperty";
import { ProjectStatusReport } from "models";

export interface IProjectInformationData {
  properties?: ProjectPropertyModel[];
  editFormUrl?: string;
  versionHistoryUrl?: string;
  itemId?: number;
  statusReports?: ProjectStatusReport[];
}