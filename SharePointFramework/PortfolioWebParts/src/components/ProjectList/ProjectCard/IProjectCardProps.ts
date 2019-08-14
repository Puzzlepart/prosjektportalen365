import {IButtonProps} from 'office-ui-fabric-react/lib/Button';
import { ProjectListModel } from 'models';

export interface IProjectCardProps {
  project: ProjectListModel;
  shouldTruncateTitle: boolean;
  showProjectLogo?: boolean;
  showProjectOwner?: boolean;
  showProjectManager?: boolean;
  actions: IButtonProps[];
}
