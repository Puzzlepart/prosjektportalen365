import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { ProjectListColumns } from './ProjectListColumns';
import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';
import { IBaseComponentProps } from '../IBaseComponentProps';

export interface IProjectListProps extends IBaseComponentProps {
  loadingText: string;
  searchBoxPlaceholderText: string;
  phaseTermSetId: string;
  entity: ISpEntityPortalServiceParams;
  sortBy?: string;
  showSearchBox?: boolean;
  showViewSelector?: boolean;
  showAsTiles?: boolean;
  showProjectLogo?: boolean;
  showProjectOwner?: boolean;
  showProjectManager?: boolean;
  columns?: IColumn[];
}

export const ProjectListDefaultProps: Partial<IProjectListProps> = {
  columns: ProjectListColumns,
  sortBy: 'Title',
};
