import ProjectListModel from '../../../common/models/ProjectListModel';

export interface IProjectListData {
  projects?: ProjectListModel[];
  fields?: { [key: string]: string };
}
export interface IProjectListState {
  isLoading: boolean;
  data?: IProjectListData;
  showProjectInfo?: ProjectListModel;
  searchTerm?: string;
  projects: ProjectListModel[];
}
