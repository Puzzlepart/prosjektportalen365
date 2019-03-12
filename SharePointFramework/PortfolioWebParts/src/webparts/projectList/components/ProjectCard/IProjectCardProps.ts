import ProjectListModel from "../../../../common/models/ProjectListModel";

interface IProjectCardProps {
  project: ProjectListModel;
  onClickHref: string;
  showProjectInfo: (event: React.MouseEvent<any>, project: ProjectListModel) => void;
}

export default IProjectCardProps;
