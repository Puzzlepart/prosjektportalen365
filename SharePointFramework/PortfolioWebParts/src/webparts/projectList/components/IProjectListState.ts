import { ProjectListModel } from "../models/ProjectListModel";

export interface IProjectListState {
  isLoading: boolean;
  projects?: ProjectListModel[];
  error?: any;
  selectedProject?: ProjectListModel;
  searchTerm?: string;
  showAsTiles?: boolean;
}
