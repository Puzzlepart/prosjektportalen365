import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { ProjectListModel } from 'models'

export interface IProjectListState {
  /**
   * Whether the component is loading
   */
  isLoading: boolean;

  /**
   * Search term
   */
  searchTerm: string;

  /**
   * Projects
   */
  projects?: ProjectListModel[];

  /**
   * Error
   */
  error?: any;

  /**
   * Show project info
   */
  showProjectInfo?: ProjectListModel;

  /**
   * Show as tiles (shown as list if false)
   */
  showAsTiles?: boolean;

  /**
   * List view properties
   */
  listView?: { projects: ProjectListModel[]; columns: IColumn[] };
}
