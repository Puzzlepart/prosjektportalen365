import { ProjectListModel } from 'prosjektportalen-spfx-shared/lib/models/ProjectListModel';


export interface IProjectListState {
  isLoading: boolean;
  projects?: ProjectListModel[];
  error?: any;
  selectedProject?: ProjectListModel;
  searchTerm?: string;
}
