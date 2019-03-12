import ProjectPropertyModel from "../models/ProjectPropertyModel";

export interface IProjectInformationData {
  properties?: ProjectPropertyModel[];
  editFormUrl?: string;
  itemId?: number;
}