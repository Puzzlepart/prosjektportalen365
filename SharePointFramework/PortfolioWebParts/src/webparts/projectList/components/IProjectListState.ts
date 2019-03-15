import { ProjectListModel } from 'prosjektportalen-spfx-shared/lib/models/ProjectListModel';

export interface IProjectListData {
  projects?: ProjectListModel[];
  fields?: { [key: string]: string };
}
export interface IProjectListState {
  isLoading: boolean;
  data?: IProjectListData;
  selectedProject?: ProjectListModel;
  searchTerm?: string;
  projects: ProjectListModel[];
}
