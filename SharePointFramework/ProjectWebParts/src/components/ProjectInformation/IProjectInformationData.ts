import { ProjectPropertyModel } from './ProjectProperty';

export interface IProjectInformationData {
  properties?: ProjectPropertyModel[];
  editFormUrl?: string;
  versionHistoryUrl?: string;
  statusReports?: { Id: number, Created: string }[];
}