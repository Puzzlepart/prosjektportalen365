import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { ProjectListModel } from "../models/ProjectListModel";

export interface IProjectListState {
  isLoading: boolean;
  searchTerm: string;
  projects?: ProjectListModel[];
  error?: any;
  showProjectInfo?: ProjectListModel;
  showAsTiles?: boolean;
  listView?: { projects: ProjectListModel[], columns: IColumn[] };
}
