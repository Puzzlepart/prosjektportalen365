import { ProjectListModel } from 'prosjektportalen-spfx-shared/lib/models/ProjectListModel';

interface IProjectCardProps {
  project: ProjectListModel;
  onClickHref: string;
  showProjectInfo: (event: React.MouseEvent<any>, project: ProjectListModel) => void;
}

export default IProjectCardProps;
