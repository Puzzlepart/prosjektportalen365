import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { ProjectListColumns } from './ProjectListColumns';
import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';

export interface IProjectListProps {
  phaseTermSetId: string;
  entity: ISpEntityPortalServiceParams;
  sortBy?: string;
  showAsTiles?: boolean;
  showProjectLogo?: boolean;
  showProjectOwner?: boolean;
  showProjectManager?: boolean;
  siteAbsoluteUrl: string;
  columns?: IColumn[];
}

export const ProjectListDefaultProps: Partial<IProjectListProps> = {
  columns: ProjectListColumns,
  sortBy: 'Title',
};
