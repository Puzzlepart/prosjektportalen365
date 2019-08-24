import { IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { ProjectListModel } from 'models';

export interface IProjectCardProps {
  /**
   * @todo describe property
   */
  project: ProjectListModel;

  /**
   * @todo describe property
   */
  shouldTruncateTitle: boolean;

  /**
   * @todo describe property
   */
  showProjectLogo?: boolean;

  /**
   * @todo describe property
   */
  showProjectOwner?: boolean;

  /**
   * @todo describe property
   */
  showProjectManager?: boolean;

  /**
   * @todo describe property
   */
  actions: IButtonProps[];
}
