import {IButtonProps} from 'office-ui-fabric-react/lib/Button';
import { ProjectListModel } from "../../models/ProjectListModel";

interface IProjectCardProps {
  project: ProjectListModel;
  shouldTruncateTitle: boolean;
  showProjectOwner?: boolean;
  showProjectManager?: boolean;
  actions: IButtonProps[];
}

export default IProjectCardProps;
