import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { ProjectListModel } from 'models';

export interface IProjectListState {
  /**
   * @todo describe property
   */
  isLoading: boolean;

  /**
   * @todo describe property
   */
  searchTerm: string;

  /**
   * @todo describe property
   */
  projects?: ProjectListModel[];

  /**
   * @todo describe property
   */
  error?: any;

  /**
   * @todo describe property
   */
  showProjectInfo?: ProjectListModel;

  /**
   * @todo describe property
   */
  showAsTiles?: boolean;

  /**
   * @todo describe property
   */
  listView?: { projects: ProjectListModel[], columns: IColumn[] };
}
